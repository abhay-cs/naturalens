CREATE TABLE images (
  id TEXT PRIMARY KEY,
  file TEXT NOT NULL UNIQUE,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  split TEXT NOT NULL DEFAULT 'train',
  boxes TEXT NOT NULL DEFAULT '[]',
  reviewed INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

CREATE INDEX images_reviewed_idx ON images (reviewed);
CREATE INDEX images_split_idx ON images (split);

CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  images INTEGER,
  epochs INTEGER,
  map50 REAL,
  precision_ REAL,
  recall REAL,
  error TEXT
);

CREATE INDEX runs_created_idx ON runs (created_at DESC);

CREATE TABLE label_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_id TEXT NOT NULL,
  boxes TEXT NOT NULL,
  version INTEGER NOT NULL,
  at TEXT NOT NULL,
  by TEXT
);

CREATE INDEX label_history_image_idx ON label_history (image_id, version);
