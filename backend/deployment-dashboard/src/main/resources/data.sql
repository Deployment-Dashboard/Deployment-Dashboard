-- pro demonstraci zatím v PSQL --

-- Create AppsJmena table
CREATE TABLE AppsJmena (
  app_id    SERIAL PRIMARY KEY,
  app_nazev TEXT   NOT NULL UNIQUE
);

-- Insert values into AppsJmena
INSERT INTO AppsJmena (app_nazev)
VALUES
  ('Jenda'),
  ('Kontrolní linka'),
  ('Maruška');
