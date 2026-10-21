CREATE TABLE community_profiles (
  user_id TEXT PRIMARY KEY,public_id TEXT NOT NULL UNIQUE,name TEXT NOT NULL,avatar TEXT NOT NULL DEFAULT '',bio TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),share_badges INTEGER NOT NULL DEFAULT 1 CHECK(share_badges IN (0,1)),
  version INTEGER NOT NULL DEFAULT 1,edit_token TEXT NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
);
CREATE TABLE profile_bookmarks (user_id TEXT NOT NULL REFERENCES community_profiles(user_id),path TEXT NOT NULL,position INTEGER NOT NULL,PRIMARY KEY(user_id,path));
CREATE TABLE thread_follows (
  user_id TEXT NOT NULL,thread TEXT NOT NULL,title TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('article','note','discussion')),
  followed_at INTEGER NOT NULL,seen_floor INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,thread)
);
CREATE INDEX thread_follows_owner ON thread_follows(user_id,followed_at DESC);
CREATE TABLE account_ai_threads (user_id TEXT NOT NULL,thread TEXT NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(user_id,thread));
INSERT INTO account_ai_threads SELECT requester_id,thread,MAX(created_at) FROM bot_jobs GROUP BY requester_id,thread;
CREATE INDEX account_ai_threads_owner ON account_ai_threads(user_id,updated_at DESC);
CREATE TRIGGER community_ai_job AFTER INSERT ON bot_jobs BEGIN
  INSERT INTO account_ai_threads(user_id,thread,updated_at) VALUES(NEW.requester_id,NEW.thread,NEW.created_at)
    ON CONFLICT(user_id,thread) DO UPDATE SET updated_at=MAX(updated_at,excluded.updated_at);
END;
