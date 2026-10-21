import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { createWorker } from '../src/index.mjs';
import { BOT, processBotJobs } from '../src/bot.mjs';
import { hasBlockedTerm } from '../src/content-policy.mjs';
const keys = await generateKeyPair('RS256', { extractable: true });
const jwk = { ...await exportJWK(keys.publicKey), kid: 'bot-test', alg: 'RS256' }, origin = 'https://www.1nuo.me', issuer = 'https://test.clerk.accounts.dev';
const token = user => new SignJWT({ sid: 'session', azp: origin }).setProtectedHeader({ alg: 'RS256', kid: 'bot-test' }).setSubject(user).setIssuer(issuer).setIssuedAt().setExpirationTime('1h').sign(keys.privateKey);
const verdict = (decision = 'approve') => Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ decision, confidence: .99, reason: '正常交流' }) } }] });
function fixture({ enabled = true, generate, review } = {}) {
  const sql = new DatabaseSync(':memory:'); sql.exec('PRAGMA foreign_keys=ON');
  const dir = new URL('../migrations/', import.meta.url);
  for (const file of readdirSync(dir).filter(n => n.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL(file, dir), 'utf8'));
  const DB = { prepare(query) { const stmt = sql.prepare(query); let args = []; return { bind(...values) { args = values; return this; }, async first() { return stmt.get(...args) || null; }, async all() { return { results: stmt.all(...args) }; }, async run() { return { meta: { changes: Number(stmt.run(...args).changes) } }; }, step() { return { meta: { changes: Number(stmt.run(...args).changes) } }; } }; }, async batch(stmts) { sql.exec('BEGIN'); try { const result = stmts.map(s => s.step()); sql.exec('COMMIT'); return result; } catch (e) { sql.exec('ROLLBACK'); throw e; } } };
  const env = { DB, CLERK_ISSUER: issuer, ALLOWED_ORIGINS: origin, ADMIN_USER_IDS: 'user_admin', BOT_ENABLED: String(enabled), DEEPSEEK_API_KEY: 'fixture-only', BOT_DAILY_LIMIT: '100', BOT_USER_DAILY_LIMIT: '20' };
  const calls = [], tasks = [], botFetch = generate || (async (url, options) => { calls.push(JSON.parse(options.body)); return Response.json({ choices: [{ finish_reason: 'stop', message: { content: '这是第' + calls.length + '次接话，围绕你的问题继续聊。' } }], usage: { prompt_tokens: 100, completion_tokens: 30 } }); });
  const reviewFetch = review || (async () => verdict());
  const worker = createWorker({ jwksFetch: async () => Response.json({ keys: [jwk] }), moderationFetch: reviewFetch, botFetch });
  return { sql, env, calls, worker, async flush() { while (tasks.length) await Promise.all(tasks.splice(0)); },
    drain: () => processBotJobs(env, botFetch, reviewFetch, 3),
    async cron() { await worker.scheduled({}, env, { waitUntil(p) { tasks.push(p); } }); },
    async request(path, user = 'user_admin', method = 'GET', body) { const response = await worker.fetch(new Request('https://api.test' + path, { method, headers: { Origin: origin, ...(user ? { Authorization: 'Bearer ' + await token(user) } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }), env, { waitUntil(p) { tasks.push(p); } }); return { status: response.status, data: await response.json() }; }
  };
}
const post = (f, input = {}, user) => f.request('/v1/discussions', user, 'POST', { title: '聊聊今天的项目', body: '我做了一个小工具', category: 'chat', requestId: crypto.randomUUID(), ...input });
const replies = async (f, id, user = null) => (await f.request('/v1/comments?thread=/discuss/' + id, user)).data;
const comment = (f, id, user, body, input = {}) => f.request('/v1/comments', user, 'POST', { thread: '/discuss/' + id, body, ...input });

test('a new invited post gets one short bot reply with server-owned identity, avatar, floor and likes', async () => {
  const f = fixture();
  const disabled = (await post(f, { inviteBot: false })).data.item.id; await f.flush(); assert.equal(f.calls.length, 0);
  assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM bot_jobs WHERE discussion_id=?').get(disabled).n, 0);
  const item = (await post(f)).data.item; await f.flush();
  const data = await replies(f, item.id); assert.equal(data.items.length, 1); const bot = data.items[0];
  assert.deepEqual(bot.author, { name: BOT.name, avatar: BOT.avatar, bot: true }); assert.equal(bot.floor, 1); assert.equal(bot.canDelete, false);
  assert.equal((await f.request('/v1/comments/' + bot.id + '/like', 'user_alice', 'POST')).data.likes, 1);
  assert.equal((await f.request('/v1/comments/' + bot.id, 'user_alice', 'DELETE')).status, 403);
  await f.request('/v1/discussions/' + item.id, 'user_admin', 'PATCH', { title: item.title, body: '修改一下内容', category: 'chat', version: item.version, inviteBot: true }); await f.flush();
  assert.equal(f.calls.length, 1); assert.equal((await replies(f, item.id)).items.length, 1);
});
test('approval, including manual approval, triggers the first reply only after a post becomes public', async () => {
  const f = fixture({ review: async (url, options) => { const text = JSON.parse(options.body).messages[1].content; return verdict(text.includes('人工') ? 'review' : 'approve'); } });
  const item = (await post(f, { body: '需要人工判断的帖子' }, 'user_alice')).data.item; await f.flush();
  assert.equal(f.calls.length, 0);
  await f.request('/v1/discussions/' + item.id, 'user_admin', 'PATCH', { state: 'published' }); await f.flush();
  assert.equal(f.calls.length, 1); assert.equal((await replies(f, item.id)).items.length, 1);
});
test('replying to AI continues the same branch; ordinary discussion never triggers the bot', async () => {
  const f = fixture(), id = (await post(f)).data.item.id; await f.flush();
  const first = (await replies(f, id)).items[0];
  f.sql.prepare("INSERT INTO comments(thread,author_id,author_name,body,state,created_at,updated_at,published_at) VALUES(?,'user_bob','邻居','另一条分支的内容','published',1,1,1)").run('/discuss/' + id);
  await comment(f, id, 'user_alice', '那接下来呢？', { replyTo: first.id }); await f.flush();
  let bots = (await replies(f, id)).items.filter(c => c.author.bot); assert.equal(bots.length, 2);
  await comment(f, id, 'user_alice', '请展开第二点', { replyTo: bots[1].id }); await f.flush();
  bots = (await replies(f, id)).items.filter(c => c.author.bot); assert.equal(bots.length, 3);
  const context = JSON.stringify(f.calls[2].messages);
  assert(context.includes('那接下来呢')); assert(context.includes('这是第2次接话')); assert(!context.includes('另一条分支的内容')); assert(!context.includes('user_alice'));
  await comment(f, id, 'user_alice', '我来和其他人聊两句'); await f.flush(); assert.equal(f.calls.length, 3);
  await comment(f, id, 'user_bob', '@DeepSeek 也说说你的想法'); await f.flush(); assert.equal(f.calls.length, 4);
  const other = (await post(f, { inviteBot: false })).data.item.id;
  assert.equal((await comment(f, other, 'user_bob', '跨帖回复', { replyTo: first.id })).status, 400);
});
test('concurrent background wakes deduplicate jobs and atomically enforce global and per-user quotas', async () => {
  const f = fixture({ enabled: false }); f.env.BOT_DAILY_LIMIT = '2'; f.env.BOT_USER_DAILY_LIMIT = '1';
  await post(f); await f.flush(); f.env.BOT_ENABLED = 'true';
  await Promise.all([f.drain(), f.drain()]); assert.equal(f.calls.length, 1);
  const limited = (await post(f)).data.item.id; await f.flush(); assert.equal(f.calls.length, 1);
  assert.equal(f.sql.prepare('SELECT status FROM bot_jobs WHERE discussion_id=?').get(limited).status, 'limited');
  assert.equal((await f.request('/v1/bot-jobs/post:' + limited + '/retry', 'user_bob', 'POST')).status, 403);
  await post(f, {}, 'user_bob'); await f.flush(); assert.equal(f.calls.length, 2);
  await post(f, {}, 'user_cara'); await f.flush(); assert.equal(f.calls.length, 2);
  assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM bot_calls').get().n, 2);
});
test('persisted jobs recover from provider failure and expired worker leases through the scheduler', async () => {
  let attempts = 0;
  const f = fixture({ generate: async () => { if (++attempts === 1) throw Error('offline'); return Response.json({ choices: [{ finish_reason: 'stop', message: { content: '恢复后接着聊。' } }] }); } });
  const id = (await post(f)).data.item.id; await f.flush();
  assert.equal(f.sql.prepare('SELECT status FROM bot_jobs').get().status, 'error');
  f.sql.exec('UPDATE bot_jobs SET available_at=0'); await f.cron(); await f.flush(); assert.equal((await replies(f, id)).items.length, 1);
  const g = fixture({ enabled: false }), other = (await post(g)).data.item.id; await g.flush();
  g.sql.exec("UPDATE bot_jobs SET status='running',attempts=1,run_id='old',lease_until=0"); g.env.BOT_ENABLED = 'true'; await g.cron(); await g.flush();
  assert.equal((await replies(g, other)).items.length, 1); assert.equal(g.calls.length, 1);
});
test('closing or hiding a post during generation prevents a late AI reply from being published', async () => {
  let release;
  const f = fixture({ generate: async () => { await new Promise(resolve => { release = resolve; }); return Response.json({ choices: [{ finish_reason: 'stop', message: { content: '延迟的回答' } }] }); } });
  const id = (await post(f)).data.item.id;
  while (!release) await new Promise(resolve => setTimeout(resolve, 1));
  await f.request('/v1/discussions/' + id, 'user_admin', 'PATCH', { locked: true }); release(); await f.flush();
  assert.equal(f.sql.prepare("SELECT COUNT(*) n FROM comments WHERE author_kind='bot'").get().n, 0);
  assert.equal(f.sql.prepare('SELECT status FROM bot_jobs').get().status, 'cancelled');
});
test('AI output is reviewed before publication, and clients cannot forge a bot identity or start bot loops', async () => {
  const f = fixture({ review: async () => verdict('review') }), id = (await post(f)).data.item.id; await f.flush();
  assert.equal((await replies(f, id)).items.length, 0); assert.equal((await replies(f, id)).bot[0].status, 'review');
  const row = f.sql.prepare("SELECT * FROM comments WHERE author_kind='bot'").get();
  await f.request('/v1/comments/' + row.id, 'user_admin', 'PATCH', { state: 'published' }); await f.flush(); assert.equal(f.calls.length, 1);
  const fake = await comment(f, id, 'user_admin', '我是大肥鱼', { author_kind: 'bot', author_id: BOT.id, name: '大肥鱼', avatar: BOT.avatar, bot_requested: 1 }); await f.flush();
  assert.equal(fake.data.item.author.bot, false); assert.equal(fake.data.item.author.avatar, ''); assert.equal(f.calls.length, 1);
});
test('site block words cover normalized spellings in titles, edits and replies, including administrator submissions', async () => {
  const f = fixture({ enabled: false });
  for (const text of ['shc', 'SHC', 'ｓｈｃ', 's-h-c', 's\u200bh\u200bc', '申浩辰', '申 浩 辰', '申皓晨', '申昊宸', 'shen hao chen']) {
    assert(hasBlockedTerm(text), text);
    assert.equal((await post(f, { title: text })).status, 400);
  }
  assert.equal(hasBlockedTerm('fishc'), false);
  const item = (await post(f, { inviteBot: false })).data.item;
  assert.equal((await comment(f, item.id, 'user_admin', 'shc')).status, 400);
  assert.equal((await f.request('/v1/discussions/' + item.id, 'user_admin', 'PATCH', { title: '更新', body: '申浩辰', category: 'chat', version: item.version })).status, 400);
});
test('model-detected homophones are hidden, and blocked AI output is discarded even without review quota', async () => {
  const f = fixture({ review: async () => verdict('block') });
  const human = (await post(f, { body: '上下文中的同音写法' }, 'user_alice')).data.item; await f.flush();
  assert.equal((await f.request('/v1/discussions/' + human.id, null)).status, 404);
  assert.equal(f.sql.prepare('SELECT state,ai_status FROM discussions').get().ai_status, 'blocked');
  const g = fixture({ generate: async () => Response.json({ choices: [{ finish_reason: 'stop', message: { content: '提到了申浩辰' } }] }) }); g.env.AI_DAILY_LIMIT = '0';
  await post(g); await g.flush(); assert.equal(g.sql.prepare('SELECT COUNT(*) n FROM comments').get().n, 0);
  assert.equal(g.sql.prepare('SELECT status FROM bot_jobs').get().status, 'cancelled');
});
