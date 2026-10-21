-- The post checkbox controls automatic first replies; explicit invitations work on every open post.
DROP TRIGGER bot_comment_insert;
DROP TRIGGER bot_comment_publish;
CREATE TRIGGER bot_comment_insert AFTER INSERT ON comments WHEN NEW.state='published' AND NEW.author_kind='human' AND NEW.bot_requested=1 BEGIN
  INSERT OR IGNORE INTO bot_jobs(id,discussion_id,trigger_comment_id,requester_id,available_at,created_at,updated_at)
    SELECT 'comment:'||NEW.id,d.id,NEW.id,NEW.author_id,unixepoch(),unixepoch(),unixepoch() FROM discussions d WHERE NEW.thread='/discuss/'||d.id AND d.state='published' AND d.locked=0;
END;
CREATE TRIGGER bot_comment_publish AFTER UPDATE OF state ON comments WHEN NEW.state='published' AND NEW.author_kind='human' AND NEW.bot_requested=1 BEGIN
  INSERT OR IGNORE INTO bot_jobs(id,discussion_id,trigger_comment_id,requester_id,available_at,created_at,updated_at)
    SELECT 'comment:'||NEW.id,d.id,NEW.id,NEW.author_id,unixepoch(),unixepoch(),unixepoch() FROM discussions d WHERE NEW.thread='/discuss/'||d.id AND d.state='published' AND d.locked=0;
END;
-- Recover invitations that were accepted but never queued under the previous trigger.
INSERT OR IGNORE INTO bot_jobs(id,discussion_id,trigger_comment_id,requester_id,available_at,created_at,updated_at)
  SELECT 'comment:'||c.id,d.id,c.id,c.author_id,unixepoch(),unixepoch(),unixepoch()
  FROM comments c JOIN discussions d ON c.thread='/discuss/'||d.id
  WHERE c.state='published' AND c.author_kind='human' AND c.bot_requested=1 AND d.state='published' AND d.locked=0;
