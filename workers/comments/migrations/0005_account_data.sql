CREATE TABLE account_library (
  user_id TEXT NOT NULL,
  slot TEXT NOT NULL CHECK(slot IN ('bookmark','progress','read')),
  path TEXT NOT NULL,
  value TEXT NOT NULL,
  changed_at INTEGER NOT NULL,
  change_id TEXT NOT NULL,
  PRIMARY KEY(user_id,slot,path)
);
CREATE TABLE account_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  game TEXT NOT NULL CHECK(game='2048'),
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL,
  max_tile INTEGER NOT NULL,
  achieved_at INTEGER NOT NULL,
  UNIQUE(user_id,game)
);
CREATE INDEX account_scores_ranking ON account_scores(game,score DESC,max_tile DESC,achieved_at ASC);
