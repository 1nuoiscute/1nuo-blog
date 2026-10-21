ALTER TABLE discussions ADD COLUMN bot_enabled INTEGER NOT NULL DEFAULT 0 CHECK(bot_enabled IN (0,1));
ALTER TABLE comments ADD COLUMN author_kind TEXT NOT NULL DEFAULT 'human' CHECK(author_kind IN ('human','bot'));
ALTER TABLE comments ADD COLUMN reply_to INTEGER REFERENCES comments(id);
ALTER TABLE comments ADD COLUMN bot_requested INTEGER NOT NULL DEFAULT 0 CHECK(bot_requested IN (0,1));
ALTER TABLE comments ADD COLUMN bot_job_id TEXT;
CREATE UNIQUE INDEX comments_bot_job ON comments(bot_job_id) WHERE bot_job_id IS NOT NULL;
CREATE TABLE bot_jobs (
  id TEXT PRIMARY KEY,
  discussion_id TEXT NOT NULL REFERENCES discussions(id),
  trigger_comment_id INTEGER REFERENCES comments(id),
  requester_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','done','error','limited','cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  run_id TEXT,
  available_at INTEGER NOT NULL,
  lease_until INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  result_comment_id INTEGER REFERENCES comments(id),
  last_error TEXT NOT NULL DEFAULT '',
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX bot_jobs_due ON bot_jobs(status,available_at,lease_until);
CREATE INDEX bot_jobs_thread ON bot_jobs(discussion_id,created_at DESC);
CREATE TABLE bot_calls (
  run_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES bot_jobs(id),
  user_id TEXT NOT NULL,
  day INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX bot_calls_day_user ON bot_calls(day,user_id);
CREATE TRIGGER bot_post_insert AFTER INSERT ON discussions WHEN NEW.state='published' AND NEW.bot_enabled=1 BEGIN
  INSERT OR IGNORE INTO bot_jobs(id,discussion_id,requester_id,available_at,created_at,updated_at)
    VALUES('post:'||NEW.id,NEW.id,NEW.author_id,unixepoch(),unixepoch(),unixepoch());
END;
CREATE TRIGGER bot_post_publish AFTER UPDATE OF state,bot_enabled ON discussions WHEN NEW.state='published' AND NEW.bot_enabled=1 BEGIN
  INSERT OR IGNORE INTO bot_jobs(id,discussion_id,requester_id,available_at,created_at,updated_at)
    VALUES('post:'||NEW.id,NEW.id,NEW.author_id,unixepoch(),unixepoch(),unixepoch());
END;
CREATE TRIGGER bot_comment_insert AFTER INSERT ON comments WHEN NEW.state='published' AND NEW.author_kind='human' AND NEW.bot_requested=1 BEGIN
  INSERT OR IGNORE INTO bot_jobs(id,discussion_id,trigger_comment_id,requester_id,available_at,created_at,updated_at)
    SELECT 'comment:'||NEW.id,d.id,NEW.id,NEW.author_id,unixepoch(),unixepoch(),unixepoch() FROM discussions d WHERE NEW.thread='/discuss/'||d.id AND d.state='published' AND d.bot_enabled=1;
END;
CREATE TRIGGER bot_comment_publish AFTER UPDATE OF state ON comments WHEN NEW.state='published' AND NEW.author_kind='human' AND NEW.bot_requested=1 BEGIN
  INSERT OR IGNORE INTO bot_jobs(id,discussion_id,trigger_comment_id,requester_id,available_at,created_at,updated_at)
    SELECT 'comment:'||NEW.id,d.id,NEW.id,NEW.author_id,unixepoch(),unixepoch(),unixepoch() FROM discussions d WHERE NEW.thread='/discuss/'||d.id AND d.state='published' AND d.bot_enabled=1;
END;
