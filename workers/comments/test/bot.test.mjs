import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { createWorker } from '../src/index.mjs';
import { BOT, processBotJobs } from '../src/bot.mjs';
import { hasBlockedTerm } from '../src/content-policy.mjs';
import { digest } from '../src/articles.mjs';
const keys = await generateKeyPair('RS256', { extractable: true });
const jwk = { ...await exportJWK(keys.publicKey), kid: 'bot-test', alg: 'RS256' }, origin = 'https://www.1nuo.me', issuer = 'https://test.clerk.accounts.dev';
const token = user => new SignJWT({ sid: 'session', azp: origin }).setProtectedHeader({ alg: 'RS256', kid: 'bot-test' }).setSubject(user).setIssuer(issuer).setIssuedAt().setExpirationTime('1h').sign(keys.privateKey);
const verdict = (decision = 'approve') => Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ decision, confidence: .99, reason: '正常交流' }) } }] });
function fixture({ enabled = true, generate, review, through = '9999' } = {}) {
  const sql = new DatabaseSync(':memory:'); sql.exec('PRAGMA foreign_keys=ON');
  const dir = new URL('../migrations/', import.meta.url);
  for (const file of readdirSync(dir).filter(n => n.endsWith('.sql') && n.slice(0,4) <= through).sort()) sql.exec(readFileSync(new URL(file, dir), 'utf8'));
  const DB = { prepare(query) { const stmt = sql.prepare(query); let args = []; return { bind(...values) { args = values; return this; }, async first() { return stmt.get(...args) || null; }, async all() { return { results: stmt.all(...args) }; }, async run() { return { meta: { changes: Number(stmt.run(...args).changes) } }; }, step() { return { meta: { changes: Number(stmt.run(...args).changes) } }; } }; }, async batch(stmts) { sql.exec('BEGIN'); try { const result = stmts.map(s => s.step()); sql.exec('COMMIT'); return result; } catch (e) { sql.exec('ROLLBACK'); throw e; } } };
  const env = { DB, CLERK_ISSUER: issuer, ALLOWED_ORIGINS: origin, ADMIN_USER_IDS: 'user_admin', BOT_ENABLED: String(enabled), DEEPSEEK_API_KEY: 'fixture-only', BOT_DAILY_LIMIT: '100', BOT_USER_DAILY_LIMIT: '20' };
  const calls = [], tasks = [], botFetch = generate || (async (url, options) => { calls.push(JSON.parse(options.body)); return Response.json({ choices: [{ finish_reason: 'stop', message: { content: '这是第' + calls.length + '次接话，围绕你的问题继续聊。' } }], usage: { prompt_tokens: 100, completion_tokens: 30 } }); });
  const reviewFetch = review || (async () => verdict());
  const articles = new Map([['/article', { thread: '/article', title: '公开的实验记录', body: '使用电磁感应测量磁场，记录误差和拟合结果。' }]]), articleReads = [];
  const articleFetch = async url => { articleReads.push(url); for (const [thread, value] of articles) if (url === 'https://www.1nuo.me/ai/articles/' + await digest(thread) + '.json') return Response.json(value); return new Response('', {status:404}); };
  const worker = createWorker({ jwksFetch: async () => Response.json({ keys: [jwk] }), moderationFetch: reviewFetch, botFetch, articleFetch });
  return { sql, env, calls, worker, articles, articleReads, async flush() { while (tasks.length) await Promise.all(tasks.splice(0)); },
    drain: () => processBotJobs(env, botFetch, reviewFetch, 3, null, articleFetch),
    async cron() { await worker.scheduled({}, env, { waitUntil(p) { tasks.push(p); } }); },
    async request(path, user = 'user_admin', method = 'GET', body) { const response = await worker.fetch(new Request('https://api.test' + path, { method, headers: { Origin: origin, ...(user ? { Authorization: 'Bearer ' + await token(user) } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }), env, { waitUntil(p) { tasks.push(p); } }); return { status: response.status, data: await response.json() }; }
  };
}
const post = (f, input = {}, user) => f.request('/v1/discussions', user, 'POST', { title: '聊聊今天的项目', body: '我做了一个小工具', category: 'chat', requestId: crypto.randomUUID(), ...input });
const replies = async (f, id, user = null) => (await f.request('/v1/comments?thread=/discuss/' + id, user)).data;
const comment = (f, id, user, body, input = {}) => f.request('/v1/comments', user, 'POST', { thread: '/discuss/' + id, body, ...input });
function legacyPost(f, enabled=0) { const id=crypto.randomUUID(); f.sql.prepare("INSERT INTO discussions(id,author_id,author_name,title,body,category,state,request_id,created_at,updated_at,published_at,bot_enabled) VALUES(?,'user_admin','站主','旧帖子','正文','chat','published',?,1,1,1,?)").run(id,id,enabled); return id; }

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

test('explicit invitations work with automatic first replies disabled, including recovered invitations', async () => {
  const f = fixture(), id = (await post(f, { inviteBot: false })).data.item.id; await f.flush();
  assert.equal(f.calls.length, 0);
  await comment(f, id, 'user_admin', '@DeepSeek 来说两句吧'); await f.flush();
  assert.equal(f.calls.length, 1);
  const first = (await replies(f, id)).items.find(c => c.author.bot);
  await comment(f, id, 'user_alice', '继续聊聊', { replyTo: first.id }); await f.flush();
  assert.equal(f.calls.length, 2);
  await comment(f, id, 'user_bob', '@大肥鱼 你觉得呢'); await f.flush(); assert.equal(f.calls.length, 3);
  assert.equal(f.sql.prepare('SELECT bot_enabled FROM discussions WHERE id=?').get(id).bot_enabled, 0);
  assert.equal(f.sql.prepare("SELECT COUNT(*) n FROM bot_jobs WHERE id LIKE 'post:%'").get().n, 0);
  const g = fixture({ enabled: false, through: '0009' }), oldId = legacyPost(g);
  g.sql.exec('DROP TRIGGER bot_comment_insert');
  const old = g.sql.prepare("INSERT INTO comments(thread,author_id,author_name,body,state,created_at,updated_at,published_at,bot_requested) VALUES(?,'user_admin','站主','@DeepSeek 这条先前没有排队','published',1,1,1,1)").run('/discuss/'+oldId);
  g.sql.exec('CREATE TRIGGER bot_comment_insert AFTER INSERT ON comments BEGIN SELECT 1; END');
  const migration = readFileSync(new URL('../migrations/0009_explicit_bot_invites.sql', import.meta.url), 'utf8');
  g.sql.exec(migration); g.sql.exec(migration);
  assert.equal(g.sql.prepare('SELECT COUNT(*) n FROM bot_jobs').get().n, 1);
  g.sql.exec(readFileSync(new URL('../migrations/0010_article_bot.sql', import.meta.url), 'utf8'));
  g.sql.exec(readFileSync(new URL('../migrations/0011_community.sql', import.meta.url), 'utf8'));
  g.env.BOT_ENABLED = 'true'; await g.cron(); await g.flush();
  const recovered = (await replies(g, oldId)).items.find(c => c.author.bot);
  assert.equal(recovered.replyTo, Number(old.lastInsertRowid)); assert.equal(g.calls.length, 1);
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

test('a newly submitted invitation wakes its own job ahead of unrelated backlog', async () => {
  const f = fixture({ enabled: false });
  const older = (await post(f)).data.item.id; await f.flush();
  const current = (await post(f, { inviteBot: false })).data.item.id; await f.flush();
  f.env.BOT_ENABLED = 'true';
  const sent = await comment(f, current, 'user_admin', '@DeepSeek 有没有其他类似的理论'); await f.flush();
  assert.equal(f.calls.length, 1);
  assert.equal(f.sql.prepare('SELECT status FROM bot_jobs WHERE id=?').get('comment:' + sent.data.item.id).status, 'done');
  assert.equal(f.sql.prepare('SELECT status FROM bot_jobs WHERE id=?').get('post:' + older).status, 'queued');
  await f.cron(); await f.flush(); assert.equal(f.calls.length, 2);
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

test('article summary uses server-published text and visible human comments, deduplicates, and supports AI follow-ups', async () => {
  const f = fixture();
  const insert = f.sql.prepare("INSERT INTO comments(thread,author_id,author_name,body,state,created_at,updated_at,published_at,parent_id,author_kind) VALUES('/article','user_bob','读者',?,?,1,1,?,?,?)");
  insert.run('这个实验的误差主要来自哪里？', 'published', 1, null, 'human');
  insert.run('待审核的秘密', 'pending', null, null, 'human');
  const hidden = Number(insert.run('隐藏的秘密', 'hidden', null, null, 'human').lastInsertRowid);
  insert.run('隐藏分支中的公开回复', 'published', 1, hidden, 'human');
  insert.run('旧机器人的输出', 'published', 1, null, 'bot');
  const summary = await f.request('/v1/article-summary', 'user_alice', 'POST', { thread: '/article', body: '客户端伪造文章' }); await f.flush();
  assert.equal(summary.status, 202); assert.equal(f.calls.length, 1);
  const context = JSON.stringify(f.calls[0].messages);
  for (const text of ['电磁感应', '误差主要来自哪里']) assert(context.includes(text));
  for (const text of ['待审核的秘密', '隐藏的秘密', '隐藏分支', '旧机器人的输出', '客户端伪造文章', 'user_bob']) assert(!context.includes(text));
  const bot = (await f.request('/v1/comments?thread=/article', null)).data.items.find(item => item.author.bot && item.body !== '旧机器人的输出');
  assert.equal(bot.parentId, null); assert.equal(bot.author.name, '大肥鱼');
  await f.request('/v1/article-summary', 'user_admin', 'POST', {thread:'/article'}); await f.flush(); assert.equal(f.calls.length, 1);
  const follow = await f.request('/v1/comments', 'user_alice', 'POST', { thread:'/article', body:'误差怎么减小？', replyTo:bot.id }); await f.flush();
  assert.equal(follow.status, 201); assert.equal(f.calls.length, 2);
  const items = (await f.request('/v1/comments?thread=/article', null)).data.items;
  assert.equal(items.at(-1).replyTo, follow.data.item.id); assert.equal(items.at(-1).parentId, bot.id);
  const branch = JSON.stringify(f.calls[1].messages); assert(branch.includes('误差怎么减小')); assert(branch.includes('这是第1次接话')); assert(branch.includes('电磁感应'));
  await f.request('/v1/comments', 'user_bob', 'POST', {thread:'/article',body:'@DeepSeek 这个公式怎么理解'}); await f.flush(); assert.equal(f.calls.length,3);
  assert(f.articleReads.every(url => /^https:\/\/www\.1nuo\.me\/ai\/articles\/[a-f0-9]{64}\.json$/.test(url)));
});

test('article AI requires login and public source and retains input/output moderation', async () => {
  const f = fixture({ enabled:false });
  assert.equal((await f.request('/v1/article-summary', null, 'POST', {thread:'/article'})).status,401);
  f.env.BOT_ENABLED='true';
  assert.equal((await f.request('/v1/article-summary', 'user_alice', 'POST', {thread:'https://attacker.invalid'})).status,400);
  assert.equal((await f.request('/v1/article-summary', 'user_alice', 'POST', {thread:'/rate/admin'})).status,404);
  const pending = fixture({ review:async()=>verdict('review') });
  await pending.request('/v1/comments','user_alice','POST',{thread:'/article',body:'@大肥鱼 帮忙总结'}); await pending.flush();
  assert.equal(pending.calls.length,0);
  const row=pending.sql.prepare('SELECT id FROM comments').get();
  await pending.request('/v1/comments/'+row.id,'user_admin','PATCH',{state:'published'}); await pending.flush();
  assert.equal(pending.calls.length,1); assert.equal((await pending.request('/v1/comments?thread=/article',null)).data.bot[0].status,'review');
  assert.equal((await pending.request('/v1/comments','user_admin','POST',{thread:'/article',body:'shc'})).status,400);
});

test('article migration preserves prior jobs, usage and foreign keys', async () => {
  const f=fixture({enabled:false,through:'0009'}), id=legacyPost(f,1);
  f.sql.prepare("INSERT INTO bot_calls VALUES('used',?,'user_admin',1,1)").run('post:'+id);
  f.sql.exec(readFileSync(new URL('../migrations/0010_article_bot.sql',import.meta.url),'utf8'));
  f.sql.exec(readFileSync(new URL('../migrations/0011_community.sql',import.meta.url),'utf8'));
  assert.equal(f.sql.prepare('SELECT thread FROM bot_jobs').get().thread,'/discuss/'+id);
  assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM bot_calls').get().n,1);
  assert.equal(f.sql.prepare('PRAGMA foreign_key_check').all().length,0);
  f.env.BOT_ENABLED='true'; await f.cron(); await f.flush(); assert.equal(f.calls.length,1);
});
