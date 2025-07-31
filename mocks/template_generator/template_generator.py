import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext
import tkinter.font as tkfont
import yaml
from jinja2 import Template

def generate_html(template_data):
    with open("base-template.html", encoding="utf-8") as f:
        template = Template(f.read())
    return template.render(**template_data)

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

def insert_tab(event):
    text_area.insert(tk.INSERT, "  ")  # insert 2 spaces
    return "break"  # prevent default tab behavior

root = tk.Tk()
root.title("Deployment Template Generator")

# --- Text Area with Consolas font and smaller tab width ---
text_font = tkfont.Font(family="Consolas", size=12)
text_area = scrolledtext.ScrolledText(root, wrap=tk.WORD, width=80, height=20, font=text_font)
text_area.pack(padx=10, pady=(10, 5), fill=tk.BOTH, expand=True)
text_area.config(tabs=(text_font.measure('  '),))
text_area.bind("<Tab>", insert_tab)

text_area.insert(tk.END,
"""project:
    key: "dd"
    name: "Deployment Dashboard"
envs:
  - test
  - prod
  - int
components:
  db:
    - key: "dd-h2_db"
      name: "H2 Database"
  be:
    - key: "dd_be"
      name: "Deployment Dashboard Backend"
  fe:
    - key: "dd_fe"
      name: "Deployment Dashboard Frontend"
""")

# --- Save button (modern style) ---
save_button = tk.Button(
    root,
    text="Uložit HTML šablonu",
    command=save_html,
    bg="#0052cc",
    fg="white",
    font=("Segoe UI", 12, "bold"),
    activebackground="#003d99",
    activeforeground="white",
    relief="flat",
    padx=15,
    pady=5
)
save_button.pack(pady=(5, 10))

root.mainloop()
