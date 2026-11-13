// Private, short-lived two-player rooms. Membership secrets never appear in URLs or snapshots.
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const encoder = new TextEncoder();
export const normalizeWord = word => word.normalize('NFKC').replace(/\s/gu, '').toLowerCase();
async function hash(value) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  return Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
}
function text(value, maximum, reject, fallback = '') {
  if (value === undefined && fallback) return fallback;
  if (typeof value !== 'string' || /[\p{Cc}\p{Cf}]/u.test(value)) reject(400, '请使用普通文字');
  const result = value.trim();
  if (!result || Array.from(result).length > maximum) reject(400, '请填写1至' + maximum + '个字');
  return result;
}
function secret(value, reject) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) reject(400, '入场凭证无效，请重新打开游戏');
  return value;
}
async function limit(env, identity, maximum, reject) {
  const now = Math.floor(Date.now() / 1000), slot = Math.floor(now / 60);
  const row = await env.DB.prepare('INSERT INTO comment_limits(bucket,hits,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits')
    .bind('words:' + identity + ':' + slot, (slot + 1) * 60).first();
  if (row.hits > maximum) reject(429, '操作有点快，请稍后再试');
}
async function roomFor(env, code, tokenHash, reject) {
  const row = await env.DB.prepare('SELECT * FROM word_meeting_rooms WHERE code=? AND expires_at>?')
    .bind(code, Math.floor(Date.now() / 1000)).first();
  if (!row) reject(404, '房间不存在或已过期，请重新创建');
  const you = row.a_token === tokenHash ? 'a' : row.b_token === tokenHash ? 'b' : null;
  if (!you) reject(403, '请先用房间码加入这局游戏');
  return { row, you };
}
async function snapshot(env, code, tokenHash, reject) {
  // A single read gives a consistent round/phase/history even if the other player just advanced.
  const all = await env.DB.prepare('SELECT r.*,t.number,t.a_word,t.b_word,t.a_ready,t.b_ready,t.a_normal,t.b_normal FROM word_meeting_rooms r JOIN word_meeting_rounds t ON t.room=r.code WHERE r.code=? AND r.expires_at>? ORDER BY t.number')
    .bind(code, Math.floor(Date.now() / 1000)).all();
  const rows = all.results, room = rows[0];
  if (!room) reject(404, '房间不存在或已过期，请重新创建');
  const you = room.a_token === tokenHash ? 'a' : room.b_token === tokenHash ? 'b' : null;
  if (!you) reject(403, '请先用房间码加入这局游戏');
  const current = rows.find(r => r.number === room.round), revealed = current.a_word !== null && current.b_word !== null;
  return {
    code, you, round: room.round, version: room.version, expiresAt: room.expires_at,
    phase: room.status !== 'playing' ? room.status : revealed ? 'revealed' : 'thinking',
    players: { a: room.a_name, b: room.b_name },
    submitted: { a: current.a_word !== null, b: current.b_word !== null },
    ready: { a: !!current.a_ready, b: !!current.b_ready },
    words: revealed ? { a: current.a_word, b: current.b_word } : null,
    history: rows.filter(r => r.a_word !== null && r.b_word !== null).map(r => ({ round: r.number, a: r.a_word, b: r.b_word, matched: r.a_normal === r.b_normal }))
  };
}
export async function wordMeeting({ request, url, env, input, reject }) {
  const base = '/v1/word-meeting/rooms', now = Math.floor(Date.now() / 1000);
  if (url.pathname === base && request.method === 'POST') {
    const tokenHash = await hash(secret(input.token, reject)), name = text(input.name || '玩家1', 12, reject);
    const address = request.headers.get('CF-Connecting-IP') || 'unknown';
    await limit(env, 'create:' + await hash(address), 6, reject);
    await env.DB.prepare('DELETE FROM word_meeting_rooms WHERE expires_at<=?').bind(now).run();
    let code;
    for (let attempt = 0; attempt < 5; attempt++) {
      code = Array.from(crypto.getRandomValues(new Uint8Array(8)), n => alphabet[n % alphabet.length]).join('');
      const result = await env.DB.prepare('INSERT OR IGNORE INTO word_meeting_rooms(code,a_token,a_name,created_at,expires_at) VALUES(?,?,?,?,?)')
        .bind(code, tokenHash, name, now, now + 86400).run();
      if (result.meta.changes) break;
      code = null;
    }
    if (!code) reject(503, '暂时无法创建房间，请再试一次');
    await env.DB.prepare('INSERT INTO word_meeting_rounds(room,number) VALUES(?,1)').bind(code).run();
    return snapshot(env, code, tokenHash, reject);
  }
  const route = /^\/v1\/word-meeting\/rooms\/([A-HJ-NP-Z2-9]{8})(?:\/(join|submit|next|leave))?$/.exec(url.pathname);
  if (!route) reject(404, '没有这个游戏接口');
  const code = route[1], action = route[2];
  if (action === 'join' && request.method === 'POST') {
    const tokenHash = await hash(secret(input.token, reject)), name = text(input.name || '玩家2', 12, reject);
    await limit(env, 'join:' + await hash(request.headers.get('CF-Connecting-IP') || 'unknown'), 12, reject);
    const room = await env.DB.prepare('SELECT * FROM word_meeting_rooms WHERE code=? AND expires_at>?').bind(code, now).first();
    if (!room) reject(404, '房间不存在或已过期，请检查房间码');
    if (room.a_token === tokenHash || room.b_token === tokenHash) return snapshot(env, code, tokenHash, reject);
    if (room.status !== 'waiting' || room.b_token) reject(409, '这间房已有两位玩家，请另外创建一间');
    const updated = await env.DB.prepare("UPDATE word_meeting_rooms SET b_token=?,b_name=?,status='playing',version=version+1 WHERE code=? AND status='waiting' AND b_token IS NULL AND expires_at>?")
      .bind(tokenHash, name, code, now).run();
    if (!updated.meta.changes) reject(409, '这间房已有两位玩家，请另外创建一间');
    return snapshot(env, code, tokenHash, reject);
  }
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token || !/^[a-f0-9]{64}$/.test(token)) reject(401, '请先用房间码加入游戏');
  const tokenHash = await hash(token), { row: room, you } = await roomFor(env, code, tokenHash, reject);
  if (!action && request.method === 'GET') return snapshot(env, code, tokenHash, reject);
  if (request.method !== 'POST' || !action) reject(405, '不支持的操作');
  await limit(env, tokenHash, 60, reject);
  if (action === 'leave') {
    await env.DB.prepare("UPDATE word_meeting_rooms SET status='closed',version=version+1 WHERE code=? AND status!='closed'").bind(code).run();
    return snapshot(env, code, tokenHash, reject);
  }
  if (!Number.isSafeInteger(input.round) || input.round < 1) reject(400, '轮次无效，请刷新后重试');
  if (room.status !== 'playing' || room.round !== input.round) reject(409, '本轮状态已变化，请刷新后继续');
  const own = you + '_word', normal = you + '_normal', ready = you + '_ready';
  const active = "EXISTS(SELECT 1 FROM word_meeting_rooms r WHERE r.code=room AND r.round=number AND r.status='playing' AND r.expires_at>?)";
  if (action === 'submit') {
    const word = text(input.word, 32, reject), normalized = normalizeWord(word);
    if (!normalized) reject(400, '请输入一个词语');
    const previous = await env.DB.prepare('SELECT ' + own + ' word FROM word_meeting_rounds WHERE room=? AND number=?').bind(code, input.round).first();
    if (previous.word !== null && previous.word !== word) reject(409, '你已提交，本轮不能修改词语');
    const result = await env.DB.batch([
      env.DB.prepare('UPDATE word_meeting_rounds SET ' + own + '=?,' + normal + '=? WHERE room=? AND number=? AND ' + own + ' IS NULL AND ' + active).bind(word, normalized, code, input.round, now),
      env.DB.prepare("UPDATE word_meeting_rooms SET status=CASE WHEN EXISTS(SELECT 1 FROM word_meeting_rounds t WHERE t.room=code AND t.number=round AND t.a_word IS NOT NULL AND t.b_word IS NOT NULL AND t.a_normal=t.b_normal) THEN 'matched' ELSE status END,version=version+1 WHERE code=? AND round=? AND status='playing' AND expires_at>?").bind(code, input.round, now)
    ]);
    if (!result[0].meta.changes) {
      const locked = await env.DB.prepare('SELECT ' + own + ' word FROM word_meeting_rounds WHERE room=? AND number=?').bind(code, input.round).first();
      if (locked?.word !== word) reject(409, '本轮已锁定，请刷新后查看');
    }
  } else if (action === 'next') {
    await env.DB.batch([
      env.DB.prepare('UPDATE word_meeting_rounds SET ' + ready + '=1 WHERE room=? AND number=? AND a_word IS NOT NULL AND b_word IS NOT NULL AND a_normal!=b_normal AND ' + active).bind(code, input.round, now),
      env.DB.prepare("UPDATE word_meeting_rooms SET round=round+1,version=version+1 WHERE code=? AND round=? AND status='playing' AND expires_at>? AND EXISTS(SELECT 1 FROM word_meeting_rounds t WHERE t.room=code AND t.number=round AND t.a_ready=1 AND t.b_ready=1)").bind(code, input.round, now),
      env.DB.prepare('INSERT OR IGNORE INTO word_meeting_rounds(room,number) SELECT code,round FROM word_meeting_rooms WHERE code=? AND status=\'playing\' AND expires_at>?').bind(code, now)
    ]);
  }
  return snapshot(env, code, tokenHash, reject);
}
