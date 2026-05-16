CREATE TABLE IF NOT EXISTS Collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    season TEXT,
    series TEXT,
    edition TEXT,
    release_year INTEGER,
    themes TEXT,
    colours TEXT,
    "name_friendly" TEXT,
    "type" TEXT,
    "image_urls" TEXT,
    releaseDate TEXT,
    exclusive TEXT
);

CREATE TABLE IF NOT EXISTS Shapes (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    measurements TEXT,
    category TEXT,
    name_friendly TEXT,
    size TEXT,
    description TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS Shapes_name_unique
ON Shapes (name);

CREATE TABLE IF NOT EXISTS Designs (
    id INTEGER PRIMARY KEY NOT NULL,
    collection_id INTEGER NOT NULL,
    shape_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    image_urls TEXT,
    price REAL,
    release_year INTEGER,
    categories TEXT,
    FOREIGN KEY (collection_id) REFERENCES Collections(id) ON DELETE CASCADE,
    FOREIGN KEY (shape_id) REFERENCES Shapes(id) ON DELETE SET NULL
);