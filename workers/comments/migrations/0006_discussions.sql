CREATE TABLE discussions (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  avatar_url TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 100),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 0 AND 6000),
  category TEXT NOT NULL CHECK(category IN ('chat','question','feedback')),
  state TEXT NOT NULL CHECK(state IN ('pending','published','hidden','deleted')),
  pinned INTEGER NOT NULL DEFAULT 0 CHECK(pinned IN (0,1)),
  locked INTEGER NOT NULL DEFAULT 0 CHECK(locked IN (0,1)),
  version INTEGER NOT NULL DEFAULT 1,
  request_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER,
  ip_location TEXT NOT NULL DEFAULT '',
  ai_status TEXT NOT NULL DEFAULT 'disabled',
  ai_reason TEXT NOT NULL DEFAULT '',
  ai_model TEXT NOT NULL DEFAULT '',
  ai_confidence REAL,
  ai_checked_at INTEGER,
  ai_run TEXT,
  UNIQUE(author_id, request_id)
);
CREATE INDEX discussions_state_created ON discussions(state, pinned DESC, created_at DESC, id);
CREATE INDEX discussions_category ON discussions(state, category, created_at DESC);
CREATE INDEX discussions_author ON discussions(author_id, created_at DESC);
CREATE INDEX comments_thread_state ON comments(thread, state, created_at);
