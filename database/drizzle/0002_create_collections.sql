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
