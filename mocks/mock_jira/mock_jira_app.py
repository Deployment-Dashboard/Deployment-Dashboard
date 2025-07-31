from flask import Flask, jsonify, render_template, request, redirect, g
import sqlite3
import re

class JiraMockApp:
    def __init__(self):
        self.app = Flask(__name__)
        self.app.config['DATABASE'] = 'jira_mock.db'
        self.init_db()
        self.setup_routes()


        @self.app.teardown_appcontext
        def close_connection(exception):
            db = g.pop('db', None)
            if db is not None:
                db.close()

        @self.app.template_filter('extract_url')
        def extract_url(value):
            return value.split()[-1]


    def get_db(self):
        if 'db' not in g:
            g.db = sqlite3.connect(self.app.config['DATABASE'])
            g.db.row_factory = sqlite3.Row
        return g.db

    def init_db(self):
        with sqlite3.connect(self.app.config['DATABASE']) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE,
                    summary TEXT,
                    description TEXT
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS ticket_counts (
                    pid TEXT PRIMARY KEY,
                    count INTEGER
                )
            ''')
            conn.commit()

    def setup_routes(self):
        app = self.app

        @app.route('/')
        def index():
            db = self.get_db()
            tickets = db.execute('SELECT * FROM tickets ORDER BY id DESC').fetchall()
            return render_template('index.html', tickets=tickets)

        @app.route('/issues/')
        def display_ticket_by_uuid():
            jql_query = request.args.get('jql')
            uuid = jql_query.split('~')[-1] if jql_query else None

            if not jql_query or not uuid:
                return render_template('error.html', error_message='400 - bad request'), 400

            pattern = f"%{uuid}%"
            db = self.get_db()
            try:
                tickets = db.execute('SELECT * FROM tickets WHERE description LIKE ?', (pattern,)).fetchall()
                if len(tickets) == 1:
                    return render_template('ticket.html', tickets=tickets, multiple=False)
                elif len(tickets) > 1:
                    return render_template('ticket.html', tickets=tickets, multiple=True)
                else:
                    return render_template('error.html', error_message='404 - stránka nenalezena'), 404
            except Exception as e:
                return render_template('error.html', error_message=f"500 - {str(e)})"), 500

        @app.route('/issues/<key>')
        def display_ticket_by_key(key):
            db = self.get_db()
            try:
                ticket = db.execute('SELECT * FROM tickets WHERE key = ?', (key,)).fetchone()
                if ticket:
                    return render_template('ticket.html', tickets=ticket, multiple=False)
                else:
                    return render_template('error.html', error_message='404 - stránka nenalezena'), 404
            except Exception as e:
                return render_template('error.html', error_message=f"500 - {str(e)})"), 500

        @app.route('/secure/CreateIssueDetails!init.jspa')
        def add_ticket():
            pid = request.args.get('pid')
            summary = request.args.get('summary')
            description = request.args.get('description')
            print(summary)
            print(description)
            db = self.get_db()
            try:
                result = db.execute('SELECT count FROM ticket_counts WHERE pid = ?', (pid,)).fetchone()
                if result is None:
                    count = 1
                    db.execute('INSERT INTO ticket_counts (pid, count) VALUES (?, ?)', (pid, count))
                else:
                    count = result[0] + 1
                    db.execute('UPDATE ticket_counts SET count = ? WHERE pid = ?', (count, pid))

                db.execute('''
                    INSERT INTO tickets (
                        key, summary, description
                    ) VALUES (?, ?, ?)
                ''', (f"{pid}-{count}", summary, description))
                db.commit()
                return redirect('/')
            except Exception as e:
                return render_template('error.html', error_message=str(e)), 500

        @app.errorhandler(404)
        def not_found(e):
            return render_template('error.html', error_message='404 - stránka nenalezena'), 404

app = JiraMockApp().app

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
