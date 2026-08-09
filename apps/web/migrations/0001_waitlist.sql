-- Waitlist signups for Naturalens early access
CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_agent TEXT,
  ip TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_unique ON waitlist (email);
