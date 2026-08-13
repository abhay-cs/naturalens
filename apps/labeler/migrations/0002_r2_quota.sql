CREATE TABLE r2_storage (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  bytes INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

INSERT INTO r2_storage (id, bytes, updated_at) VALUES (1, 0, datetime('now'));

CREATE TABLE r2_usage_month (
  month TEXT PRIMARY KEY,
  class_a INTEGER NOT NULL DEFAULT 0,
  class_b INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

ALTER TABLE images ADD COLUMN bytes INTEGER NOT NULL DEFAULT 0;
