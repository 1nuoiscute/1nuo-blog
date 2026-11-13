CREATE TABLE word_meeting_rooms (
  code TEXT PRIMARY KEY,
  a_token TEXT NOT NULL,
  b_token TEXT,
  a_name TEXT NOT NULL,
  b_name TEXT NOT NULL DEFAULT '玩家2',
  status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting','playing','matched','closed')),
  round INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX word_meeting_expiry ON word_meeting_rooms(expires_at);
CREATE TABLE word_meeting_rounds (
  room TEXT NOT NULL REFERENCES word_meeting_rooms(code) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  a_word TEXT,
  b_word TEXT,
  a_normal TEXT,
  b_normal TEXT,
  a_ready INTEGER NOT NULL DEFAULT 0,
  b_ready INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(room,number)
);
