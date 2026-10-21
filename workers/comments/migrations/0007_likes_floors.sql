ALTER TABLE comments ADD COLUMN floor INTEGER;
CREATE TABLE comment_floors (thread TEXT PRIMARY KEY, last_floor INTEGER NOT NULL);
UPDATE comments SET floor=(SELECT COUNT(*) FROM comments earlier WHERE earlier.thread=comments.thread AND earlier.id<=comments.id AND (earlier.published_at IS NOT NULL OR earlier.state='published'))
WHERE published_at IS NOT NULL OR state='published';
INSERT INTO comment_floors(thread,last_floor) SELECT thread,MAX(floor) FROM comments WHERE floor IS NOT NULL GROUP BY thread;
CREATE UNIQUE INDEX comments_thread_floor ON comments(thread,floor) WHERE floor IS NOT NULL;
CREATE TRIGGER comments_floor_insert AFTER INSERT ON comments WHEN NEW.state='published' AND NEW.floor IS NULL BEGIN
  INSERT INTO comment_floors(thread,last_floor) VALUES(NEW.thread,1) ON CONFLICT(thread) DO UPDATE SET last_floor=last_floor+1;
  UPDATE comments SET floor=(SELECT last_floor FROM comment_floors WHERE thread=NEW.thread) WHERE id=NEW.id;
END;
CREATE TRIGGER comments_floor_publish AFTER UPDATE OF state ON comments WHEN NEW.state='published' AND NEW.floor IS NULL BEGIN
  INSERT INTO comment_floors(thread,last_floor) VALUES(NEW.thread,1) ON CONFLICT(thread) DO UPDATE SET last_floor=last_floor+1;
  UPDATE comments SET floor=(SELECT last_floor FROM comment_floors WHERE thread=NEW.thread) WHERE id=NEW.id;
END;
CREATE TABLE discussion_likes (
  discussion_id TEXT NOT NULL REFERENCES discussions(id),
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(discussion_id,user_id)
);
CREATE TABLE comment_likes (
  comment_id INTEGER NOT NULL REFERENCES comments(id),
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(comment_id,user_id)
);
