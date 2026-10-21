PRAGMA defer_foreign_keys=ON;
CREATE TABLE article_contexts (thread TEXT PRIMARY KEY,title TEXT NOT NULL,body TEXT NOT NULL,hash TEXT NOT NULL,updated_at INTEGER NOT NULL);
CREATE TABLE bot_jobs_next (
  id TEXT PRIMARY KEY,discussion_id TEXT REFERENCES discussions(id),thread TEXT NOT NULL,
  trigger_comment_id INTEGER REFERENCES comments(id),requester_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','done','error','limited','cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,run_id TEXT,available_at INTEGER NOT NULL,lease_until INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,result_comment_id INTEGER REFERENCES comments(id),
  last_error TEXT NOT NULL DEFAULT '',input_tokens INTEGER NOT NULL DEFAULT 0,output_tokens INTEGER NOT NULL DEFAULT 0
);
INSERT INTO bot_jobs_next SELECT id,discussion_id,'/discuss/'||discussion_id,trigger_comment_id,requester_id,status,attempts,run_id,available_at,lease_until,created_at,updated_at,result_comment_id,last_error,input_tokens,output_tokens FROM bot_jobs;
CREATE TABLE bot_calls_next (run_id TEXT PRIMARY KEY,job_id TEXT NOT NULL REFERENCES bot_jobs_next(id),user_id TEXT NOT NULL,day INTEGER NOT NULL,created_at INTEGER NOT NULL);
INSERT INTO bot_calls_next SELECT * FROM bot_calls;
DROP TRIGGER bot_post_insert;
DROP TRIGGER bot_post_publish;
DROP TRIGGER bot_comment_insert;
DROP TRIGGER bot_comment_publish;
DROP TABLE bot_calls;
DROP TABLE bot_jobs;
ALTER TABLE bot_jobs_next RENAME TO bot_jobs;
ALTER TABLE bot_calls_next RENAME TO bot_calls;
CREATE INDEX bot_jobs_due ON bot_jobs(status,available_at,lease_until);
CREATE INDEX bot_jobs_thread ON bot_jobs(thread,created_at DESC);
CREATE INDEX bot_calls_day_user ON bot_calls(day,user_id);
CREATE TRIGGER bot_post_insert AFTER INSERT ON discussions WHEN NEW.state='published' AND NEW.bot_enabled=1 BEGIN
  INSERT OR IGNORE INTO bot_jobs(id,discussion_id,thread,requester_id,available_at,created_at,updated_at)
    VALUES('post:'||NEW.id,NEW.id,'/discuss/'||NEW.id,NEW.author_id,unixepoch(),unixepoch(),unixepoch());
END;
CREATE TRIGGER bot_post_publish AFTER UPDATE OF state,bot_enabled ON discussions WHEN NEW.state='published' AND NEW.bot_enabled=1 BEGIN
  INSERT OR IGNORE INTO bot_jobs(id,discussion_id,thread,requester_id,available_at,created_at,updated_at)
    VALUES('post:'||NEW.id,NEW.id,'/discuss/'||NEW.id,NEW.author_id,unixepoch(),unixepoch(),unixepoch());
END;
CREATE TRIGGER bot_comment_insert AFTER INSERT ON comments WHEN NEW.state='published' AND NEW.author_kind='human' AND NEW.bot_requested=1 BEGIN
  INSERT OR IGNORE INTO bot_jobs(id,discussion_id,thread,trigger_comment_id,requester_id,available_at,created_at,updated_at)
    SELECT 'comment:'||NEW.id,d.id,NEW.thread,NEW.id,NEW.author_id,unixepoch(),unixepoch(),unixepoch() FROM discussions d WHERE NEW.thread='/discuss/'||d.id AND d.state='published' AND d.locked=0;
  INSERT OR IGNORE INTO bot_jobs(id,thread,trigger_comment_id,requester_id,available_at,created_at,updated_at)
    SELECT 'comment:'||NEW.id,NEW.thread,NEW.id,NEW.author_id,unixepoch(),unixepoch(),unixepoch() FROM article_contexts a WHERE a.thread=NEW.thread;
END;
CREATE TRIGGER bot_comment_publish AFTER UPDATE OF state ON comments WHEN NEW.state='published' AND NEW.author_kind='human' AND NEW.bot_requested=1 BEGIN
  INSERT OR IGNORE INTO bot_jobs(id,discussion_id,thread,trigger_comment_id,requester_id,available_at,created_at,updated_at)
    SELECT 'comment:'||NEW.id,d.id,NEW.thread,NEW.id,NEW.author_id,unixepoch(),unixepoch(),unixepoch() FROM discussions d WHERE NEW.thread='/discuss/'||d.id AND d.state='published' AND d.locked=0;
  INSERT OR IGNORE INTO bot_jobs(id,thread,trigger_comment_id,requester_id,available_at,created_at,updated_at)
    SELECT 'comment:'||NEW.id,NEW.thread,NEW.id,NEW.author_id,unixepoch(),unixepoch(),unixepoch() FROM article_contexts a WHERE a.thread=NEW.thread;
END;
