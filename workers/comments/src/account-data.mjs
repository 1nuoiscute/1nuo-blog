function entry(row) {
  return { slot: row.slot, path: row.path, value: JSON.parse(row.value), changedAt: row.changed_at, changeId: row.change_id };
}
function score(row, actor) {
  return row && { id: row.id, name: row.name, avatar: row.avatar, score: row.score, maxTile: row.max_tile,
    achievedAt: row.achieved_at, mine: row.user_id === actor?.id };
}
async function limit(env, actor, group, maximum, seconds, reject) {
  const now = Math.floor(Date.now() / 1000), slot = Math.floor(now / seconds);
  const row = await env.DB.prepare(`INSERT INTO comment_limits(bucket,hits,expires_at) VALUES(?,1,?)
    ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits`)
    .bind(`account:${group}:${slot}:${actor.id}`, (slot + 1) * seconds).first();
  if (row.hits > maximum) reject(429, '同步或提交过于频繁，请稍后重试');
  await env.DB.prepare('DELETE FROM comment_limits WHERE bucket IN (SELECT bucket FROM comment_limits WHERE expires_at<? LIMIT 100)').bind(now - 86400).run();
}

export async function accountData({ request, url, env, actor, input, normalizePath, safeAvatar, reject }) {
  if (url.pathname === '/v1/library' && request.method === 'GET') {
    const rows = await env.DB.prepare('SELECT * FROM account_library WHERE user_id=? ORDER BY slot,path').bind(actor.id).all();
    return { items: rows.results.map(entry) };
  }
  if (url.pathname === '/v1/library' && request.method === 'POST') {
    if (!Array.isArray(input.changes) || !input.changes.length || input.changes.length > 10) reject(400, '每次可同步 1–10 条记录');
    const now = Date.now();
    const changes = input.changes.map(change => {
      if (!change || !['bookmark', 'progress', 'read'].includes(change.slot) ||
        !Number.isSafeInteger(change.changedAt) || change.changedAt < 0 ||
        typeof change.changeId !== 'string' || !/^[A-Za-z0-9_-]{8,80}$/.test(change.changeId)) reject(400, '同步记录无效');
      const path = normalizePath(change.path);
      let value = null;
      if (change.value !== null) {
        const data = change.value;
        if (!data || typeof data.title !== 'string' || !data.title.trim() || data.title.length > 200) reject(400, '记录标题无效');
        value = { title: data.title.trim(), kind: ['文章', '笔记', '页面'].includes(data.kind) ? data.kind : '页面' };
        if (change.slot === 'progress') {
          if (typeof data.progress !== 'number' || !Number.isFinite(data.progress) || data.progress < 0 || data.progress > 1) reject(400, '阅读进度无效');
          value.progress = data.progress;
        }
        if (change.slot === 'read') {
          if (typeof data.read !== 'boolean') reject(400, '已读状态无效');
          value.read = data.read;
        }
      } else if (change.slot !== 'bookmark') reject(400, '记录内容无效');
      return { ...change, path, value, changedAt: Math.min(change.changedAt, now + 300000) };
    });
    await limit(env, actor, 'library', 60, 60, reject);
    const writes = changes.map(change => env.DB.prepare(`INSERT INTO account_library(user_id,slot,path,value,changed_at,change_id)
      SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM account_library WHERE user_id=? AND slot=? AND path=?)
        OR (SELECT COUNT(*) FROM account_library WHERE user_id=?)<5000
      ON CONFLICT(user_id,slot,path) DO UPDATE SET value=excluded.value,changed_at=excluded.changed_at,change_id=excluded.change_id
      WHERE excluded.changed_at>account_library.changed_at OR
        (excluded.changed_at=account_library.changed_at AND excluded.change_id>account_library.change_id)`)
      .bind(actor.id, change.slot, change.path, JSON.stringify(change.value), change.changedAt, change.changeId, actor.id, change.slot, change.path, actor.id));
    const reads = changes.map(change => env.DB.prepare('SELECT * FROM account_library WHERE user_id=? AND slot=? AND path=?').bind(actor.id, change.slot, change.path));
    const results = await env.DB.batch([...writes, ...reads]);
    const rows = results.slice(writes.length).map(result => result.results[0]).filter(Boolean);
    if (rows.length !== changes.length) reject(409, '账号阅读记录已达到存储上限');
    return { items: rows.map(entry) };
  }
  if (url.pathname === '/v1/leaderboard/2048' && request.method === 'GET') {
    const rows = await env.DB.prepare("SELECT * FROM account_scores WHERE game='2048' ORDER BY score DESC,max_tile DESC,achieved_at ASC,id ASC LIMIT 50").all();
    const mine = actor ? await env.DB.prepare("SELECT * FROM account_scores WHERE game='2048' AND user_id=?").bind(actor.id).first() : null;
    return { items: rows.results.map(row => score(row, actor)), personalBest: score(mine, actor) };
  }
  if (url.pathname === '/v1/leaderboard/2048' && request.method === 'POST') {
    if (!Number.isSafeInteger(input.score) || input.score <= 0 || input.score > 10000000 || input.score % 4 !== 0 ||
      !Number.isSafeInteger(input.maxTile) || input.maxTile < 4 || input.maxTile > 131072 || (input.maxTile & (input.maxTile - 1)) !== 0 || input.maxTile > input.score) reject(400, '成绩数值无效');
    await limit(env, actor, 'score', 5, 60, reject);
    const name = typeof input.name === 'string' ? input.name.trim().slice(0, 40) : '';
    const result = await env.DB.prepare(`INSERT INTO account_scores(user_id,game,name,avatar,score,max_tile,achieved_at) VALUES(?,'2048',?,?,?,?,?)
      ON CONFLICT(user_id,game) DO UPDATE SET name=excluded.name,avatar=excluded.avatar,score=excluded.score,max_tile=excluded.max_tile,achieved_at=excluded.achieved_at
      WHERE excluded.score>account_scores.score OR (excluded.score=account_scores.score AND excluded.max_tile>account_scores.max_tile)`)
      .bind(actor.id, name || '读者', safeAvatar(input.avatar), input.score, input.maxTile, Date.now()).run();
    const best = await env.DB.prepare("SELECT * FROM account_scores WHERE user_id=? AND game='2048'").bind(actor.id).first();
    return { improved: result.meta.changes > 0, personalBest: score(best, actor) };
  }
  reject(404, '接口不存在');
}
