CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread TEXT NOT NULL CHECK(length(thread) BETWEEN 1 AND 500),
  parent_id INTEGER REFERENCES comments(id),
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL CHECK(length(author_name) BETWEEN 1 AND 40),
  avatar_url TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL CHECK(length(body) <= 2000),
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','published','hidden','deleted')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER
);
CREATE INDEX IF NOT EXISTS comments_thread_id ON comments(thread, id);
CREATE INDEX IF NOT EXISTS comments_state_id ON comments(state, id);
CREATE INDEX IF NOT EXISTS comments_author ON comments(author_id, id);
CREATE TABLE IF NOT EXISTS comment_limits (
  bucket TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS comment_limits_expiry ON comment_limits(expires_at);
