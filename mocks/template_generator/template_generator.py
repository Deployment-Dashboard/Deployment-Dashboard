import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext, Toplevel, Label, Button
import tkinter.font as tkfont
import yaml
from jinja2 import Template

# vygeneruj nasazovací HTML šablonu z base-template.html pomocí dat z YAML
def generate_html(template_data):
    if isinstance(template_data, dict):
        with open("base-template.html", encoding="utf-8") as f:
            template = Template(f.read())
    return template.render(**template_data)

# ulož HTML šablonu
def save_html():
    yaml_text = text_area.get("1.0", tk.END)
    try:
        data = yaml.safe_load(yaml_text)
    except Exception as e:
        messagebox.showerror("YAML Error", f"Invalid YAML format:\n{e}")
        return

    html_output = generate_html(data)

    project = data.get("project")
    default_name = f"{project['key']}-template.html"

    path = filedialog.asksaveasfilename(
        defaultextension=".html",
        initialfile=default_name,
        initialdir="./generated-templates",
        filetypes=[("HTML files", "*.html")]
    )
    if path:
        with open(path, "w", encoding="utf-8") as f:
            f.write(html_output)
        messagebox.showinfo("Uloženo", f"Šablona uložena do:\n {path}")

# zobraz nápovědu
def show_help():
    help_window = Toplevel(root)
    help_window.title("Nápověda")

    help_text = (
        'Aplikace TemplateGenerator slouží k vytváření nasazovacích HTML šablon.\n\n'
        'Do editoru vkládejte data v YAML formátu, například:\n\n'
        '# <- značí komentář, který se vygenerované HTML šabloně neobjeví\n'
        '# definice projektu\n'
        'project:\n'
        '    # klíč\n'
        '    key: "dd"\n'
        '    # název\n'
        '    name: "Deployment Dashboard"\n'
        '# seznam názvů prostředí\n'
        'envs:\n'
        '  - test\n'
        '  - prod\n'
        '  - int\n'
        '# seznamy komponent\n'
        'components:\n'
        '  # seznam databází\n'
        '  db:\n'
        '      # klíč\n'
        '    - key: "dd-h2_db"\n'
        '      # název\n'
        '      name: "H2 Database"\n'
        '    - key: "dd-postgres_db"\n'
        '      name: "PostgreSQL Database"\n'
        '  # seznam backend komponent\n'
        '  be:\n'
        '    - key: "dd_be"\n'
        '      name: "Deployment Dashboard Backend"\n'
        '  # seznam frontend komponent\n'
        '  fe:\n'
        '    - key: "dd_fe"\n'
        '      name: "Deployment Dashboard Frontend"\n\n'
        'Položka "project" je povinná a musí obsahovat klíč i název, další položky jsou nepovinné, ale doporučuje se vyplnit minálně jedno prostředí, aby bylo možné otestovat zaevidování nasazení.\n\n'
        'Po vyplnění YAML dat klikněte na "Uložit HTML šablonu" pro vygenerování HTML souboru. Otevře se dialog pro uložení souboru, kde můžete zvolit název a umístění. Šablonu poté lze otevřít v libovolném webovém prohlížeči.'
    )

    text_widget = tk.Text(help_window, wrap="word", width=65, height=1, font=("Segoe UI", 10))
    text_widget.insert("1.0", help_text)
    text_widget.config(state="disabled")
    text_widget.pack(padx=10, pady=10, fill="both", expand=True)

    last_display_index = text_widget.index("end-1c linestart")
    last_line = int(last_display_index.split('.')[0])

    text_widget.config(height=last_line + 4)

    help_window.update_idletasks()
    help_window.geometry("")
    help_window.resizable(False, False)


# místo tabulátoru vlož 2 mezery (YAML standard)
def insert_tab(event):
    text_area.insert(tk.INSERT, "  ")
    return "break"

# GUI pro generování HTML šablon
root = tk.Tk()
root.title("TemplateGenerator")

text_font = tkfont.Font(family="Consolas", size=12)
text_area = scrolledtext.ScrolledText(root, wrap=tk.WORD, width=80, height=20, font=text_font)
text_area.pack(padx=10, pady=(10, 5), fill=tk.BOTH, expand=True)
text_area.config(tabs=(text_font.measure('  '),))
text_area.bind("<Tab>", insert_tab)

button_frame = tk.Frame(root)
button_frame.pack(pady=(5, 10), fill="x")

save_button = tk.Button(
    button_frame,
    text="Uložit HTML šablonu",
    command=save_html,
    bg="#0052cc",
    fg="white",
    font=("Segoe UI", 12, "bold"),
    activebackground="#003d99",
    activeforeground="white",
    relief="flat",
    padx=15,
    pady=5,
    cursor="hand2"
)
save_button.pack(side="left", expand=True)

help_button = tk.Button(
    button_frame,
    text="?",
    command=show_help,
    bg="#4CAF50",
    fg="white",
    font=("Segoe UI", 10, "bold"),
    activebackground="#388E3C",
    activeforeground="white",
    relief="flat",
    width=3,
    cursor="hand2"
)
help_button.pack(side="right", padx=25)

root.mainloop()
