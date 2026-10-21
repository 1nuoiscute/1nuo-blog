import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { createWorker } from '../src/index.mjs';
const pair = await generateKeyPair('RS256', { extractable: true });
const jwk = { ...await exportJWK(pair.publicKey), kid: 'discuss-test', alg: 'RS256', use: 'sig' };
const origin = 'https://www.1nuo.me', issuer = 'https://test.clerk.accounts.dev';
async function token(user = 'user_alice') { return new SignJWT({ sid: 'sess_test', azp: origin }).setProtectedHeader({ alg: 'RS256', kid: 'discuss-test' }).setSubject(user).setIssuer(issuer).setIssuedAt().setExpirationTime('1h').sign(pair.privateKey); }
function fixture(settings = {}, moderationFetch = async () => { throw Error('unexpected model request'); }) {
  const sql = new DatabaseSync(':memory:'), tasks = [];
  const dir = new URL('../migrations/', import.meta.url);
  for (const file of readdirSync(dir).filter(name => name.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL(file, dir), 'utf8'));
  const DB = { prepare(query) { const stmt = sql.prepare(query); let args = []; return { bind(...values) { args = values; return this; }, async first() { return stmt.get(...args) || null; }, async all() { return { results: stmt.all(...args) }; }, async run() { return { meta: { changes: Number(stmt.run(...args).changes) } }; } }; } };
  const env = { DB, CLERK_ISSUER: issuer, ALLOWED_ORIGINS: origin, ADMIN_USER_IDS: 'user_admin', ...settings };
  const worker = createWorker({ jwksFetch: async () => Response.json({ keys: [jwk] }), moderationFetch });
  return { sql, env, async flush() { await Promise.all(tasks.splice(0)); }, async request(path, { auth, method = 'GET', body } = {}) {
    const response = await worker.fetch(new Request('https://api.test' + path, { method, headers: { Origin: origin, ...(auth ? { Authorization: 'Bearer ' + auth } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }), env, { waitUntil(task) { tasks.push(task); } });
    return { status: response.status, data: await response.json() };
  } };
}
const post = (overrides = {}) => ({ title: '有个问题想交流', body: '正文 **内容**', category: 'question', name: '<b>读者</b>', requestId: crypto.randomUUID(), ...overrides });
const create = (f, auth, body = post()) => f.request('/v1/discussions', { auth, method: 'POST', body });
const patch = (f, auth, id, body) => f.request('/v1/discussions/' + id, { auth, method: 'PATCH', body });

test('discussions require verified identity; pending posts and their author IDs stay private', async () => {
  const f = fixture(), alice = await token(), bob = await token('user_bob');
  assert.equal((await create(f, null)).status, 401);
  const saved = await create(f, alice, post({ author_id: 'user_bob', state: 'published', avatar: 'https://bad.test/a' }));
  assert.equal(saved.status, 200); const id = saved.data.item.id;
  assert.equal(saved.data.item.state, 'pending'); assert.equal(saved.data.item.canEdit, true); assert.equal(saved.data.item.author.avatar, '');
  assert(!('author_id' in saved.data.item));
  assert.equal((await f.request('/v1/discussions')).data.items.length, 0);
  assert.equal((await f.request('/v1/discussions/' + id, { auth: bob })).status, 404);
  assert.equal((await f.request('/v1/discussions?mine=1')).status, 401);
  assert.equal((await f.request('/v1/discussions?mine=1', { auth: alice })).data.items.length, 1);
  assert.equal((await f.request('/v1/discussions?mine=1', { auth: bob })).data.items.length, 0);
});
test('publishing, category filters and admin permissions work with stable pagination', async () => {
  const f = fixture(), admin = await token('user_admin'), alice = await token();
  const id = (await create(f, alice)).data.item.id;
  assert.equal((await f.request('/v1/admin/discussions', { auth: alice })).status, 403);
  assert.equal((await f.request('/v1/admin/discussions', { auth: admin })).data.items.length, 1);
  assert.equal((await patch(f, alice, id, { state: 'published' })).status, 403);
  await patch(f, admin, id, { state: 'published', pinned: true });
  assert.equal((await f.request('/v1/discussions?category=question')).data.items[0].id, id);
  assert.equal((await f.request('/v1/discussions?category=chat')).data.items.length, 0);
  for (let i = 0; i < 22; i++) f.sql.prepare("INSERT INTO discussions SELECT ?,author_id,author_name,avatar_url,?,body,category,'published',0,0,1,?,created_at,updated_at,published_at,ip_location,ai_status,ai_reason,ai_model,ai_confidence,ai_checked_at,ai_run FROM discussions WHERE id=?").run(crypto.randomUUID(), '额外讨论' + i, crypto.randomUUID(), id);
  const first = (await f.request('/v1/discussions?sort=new')).data;
  assert.equal(first.items.length, 20); assert.equal(first.items[0].id, id); assert.equal(first.next, 20);
  const second = (await f.request('/v1/discussions?sort=new&offset=20')).data;
  assert.equal(second.items.length, 3); assert.equal(second.next, null);
  assert.equal(new Set([...first.items, ...second.items].map(item => item.id)).size, 23);
});
test('replies require an open published post; hiding or deleting the post hides the whole thread', async () => {
  const f = fixture(), admin = await token('user_admin'), alice = await token();
  const id = (await create(f, alice)).data.item.id, thread = '/discuss/' + id;
  const reply = () => f.request('/v1/comments', { auth: admin, method: 'POST', body: { thread, body: '回复' } });
  assert.equal((await reply()).status, 409);
  await patch(f, admin, id, { state: 'published' });
  assert.equal((await reply()).status, 201);
  assert.equal((await f.request('/v1/discussions')).data.items[0].replies, 1);
  await patch(f, admin, id, { locked: true }); assert.equal((await reply()).status, 409);
  assert.equal((await f.request('/v1/comments?thread=' + thread)).data.items.length, 1);
  await patch(f, admin, id, { state: 'hidden' });
  assert.equal((await f.request('/v1/comments?thread=' + thread)).status, 404);
  assert.equal((await f.request('/v1/discussions/' + id)).status, 404);
  await f.request('/v1/discussions/' + id, { auth: alice, method: 'DELETE' });
  assert.equal((await f.request('/v1/comments?thread=' + thread, { auth: admin })).status, 404);
  assert.equal((await f.request('/v1/discussions?mine=1', { auth: alice })).data.items.length, 0);
  assert.equal((await f.request('/v1/comments', { auth: admin, method: 'POST', body: { thread: '/discuss/' + crypto.randomUUID(), body: '孤立回复' } })).status, 404);
});
test('author edits re-enter moderation and optimistic versions prevent silent overwrite', async () => {
  const f = fixture(), alice = await token(), bob = await token('user_bob'), admin = await token('user_admin');
  const item = (await create(f, alice)).data.item;
  await patch(f, admin, item.id, { state: 'published' });
  const published = (await f.request('/v1/discussions/' + item.id)).data.item;
  assert.equal((await patch(f, bob, item.id, post({ version: published.version }))).status, 403);
  const edited = await patch(f, alice, item.id, post({ title: '修改后的标题', version: published.version }));
  assert.equal(edited.data.item.state, 'pending');
  assert.equal((await patch(f, alice, item.id, post({ version: published.version }))).status, 409);
  assert.equal((await f.request('/v1/discussions/' + item.id)).status, 404);
  assert.equal((await f.request('/v1/discussions/' + item.id, { auth: alice })).data.item.title, '修改后的标题');
  assert.equal((await f.request('/v1/discussions/' + item.id, { auth: bob, method: 'DELETE' })).status, 404);
});
test('new post retries are idempotent and a reused ID cannot publish another body', async () => {
  const f = fixture(), alice = await token(), body = post();
  const first = await create(f, alice, body), retry = await create(f, alice, body);
  assert.equal(first.data.item.id, retry.data.item.id);
  assert.equal((await create(f, alice, { ...body, body: '另一个正文' })).status, 409);
  assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM discussions').get().n, 1);
});
test('AI re-review accepts an empty POST and only the administrator can queue it', async () => {
  let calls = 0;
  const f = fixture({ DEEPSEEK_API_KEY: 'test-fixture' }, async () => { calls++; return Response.json({ choices: [{ finish_reason: 'stop', message: { content: '{"decision":"review","confidence":0.8,"reason":"人工判断"}' } }] }); });
  const alice = await token(), admin = await token('user_admin'), id = (await create(f, alice)).data.item.id;
  await f.flush(); assert.equal(calls, 1);
  assert.equal((await f.request('/v1/discussions/' + id + '/moderate', { auth: alice, method: 'POST' })).status, 403);
  assert.equal((await f.request('/v1/discussions/' + id + '/moderate', { auth: admin, method: 'POST' })).status, 200);
  await f.flush(); assert.equal(calls, 2);
});
test('post validation, UTF-8 size, sort inputs and the persistent posting limit are enforced', async () => {
  const f = fixture(), alice = await token();
  for (const bad of [{ title: '' }, { title: 'a'.repeat(101) }, { body: '' }, { body: 'a'.repeat(6001) }, { category: 'admin' }, { requestId: 'wrong' }]) assert.equal((await create(f, alice, post(bad))).status, 400);
  assert.equal((await create(f, alice, post({ body: '中'.repeat(6000) }))).status, 200);
  for (let i = 0; i < 2; i++) assert.equal((await create(f, alice)).status, 200);
  assert.equal((await create(f, alice)).status, 429);
  assert.equal((await f.request('/v1/discussions?offset=-1')).status, 400);
  assert.equal((await f.request('/v1/discussions?sort=arbitrary')).status, 400);
});
test('DeepSeek sees both title and body; approval publishes and a late result respects manual decisions', async () => {
  let release, observed;
  const f = fixture({ DEEPSEEK_API_KEY: 'test-fixture' }, async (url, options) => { observed = JSON.parse(options.body); await new Promise(resolve => { release = resolve; }); return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ decision: 'approve', confidence: .99, reason: '正常交流' }) } }] }); });
  const alice = await token(), admin = await token('user_admin'), item = (await create(f, alice)).data.item;
  while (!release) await new Promise(resolve => setTimeout(resolve, 1));
  const prompt = JSON.stringify(observed); assert(prompt.includes(item.title)); assert(prompt.includes(item.body)); assert(!prompt.includes('user_alice'));
  await patch(f, admin, item.id, { state: 'hidden' }); release(); await f.flush();
  assert.equal((await f.request('/v1/discussions/' + item.id, { auth: admin })).data.item.state, 'hidden');
  let seen = false;
  const approved = fixture({ DEEPSEEK_API_KEY: 'test-fixture' }, async () => { seen = true; return Response.json({ choices: [{ finish_reason: 'stop', message: { content: '{"decision":"approve","confidence":0.99,"reason":"正常交流"}' } }] }); });
  const published = (await create(approved, alice)).data.item; await approved.flush();
  assert(seen); assert.equal((await approved.request('/v1/discussions/' + published.id)).status, 200);
});
