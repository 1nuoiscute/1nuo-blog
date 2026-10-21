import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { createWorker } from '../src/index.mjs';
const pair = await generateKeyPair('RS256', { extractable: true });
const jwk = { ...await exportJWK(pair.publicKey), kid: 'account-test', alg: 'RS256', use: 'sig' };
const origin = 'https://www.1nuo.me', issuer = 'https://test.clerk.accounts.dev';
async function token(user = 'user_alice') { return new SignJWT({ sid: 'sess_test', azp: origin }).setProtectedHeader({ alg: 'RS256', kid: 'account-test' }).setSubject(user).setIssuer(issuer).setIssuedAt().setExpirationTime('1h').sign(pair.privateKey); }
function fixture() {
  const sql = new DatabaseSync(':memory:');
  const dir = new URL('../migrations/', import.meta.url);
  for (const file of readdirSync(dir).filter(name => name.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL(file, dir), 'utf8'));
  const DB = { prepare(query) {
    const statement = sql.prepare(query); let values = [];
    return { bind(...params) { values = params; return this; },
      async first() { return statement.get(...values) || null; }, async all() { return { results: statement.all(...values) }; },
      async run() { return { meta: { changes: Number(statement.run(...values).changes) } }; },
      step() { return /^SELECT/.test(query) ? { results: statement.all(...values) } : { meta: { changes: Number(statement.run(...values).changes) } }; }
    };
  }, async batch(statements) { sql.exec('BEGIN'); try { const values = statements.map(value => value.step()); sql.exec('COMMIT'); return values; } catch (error) { sql.exec('ROLLBACK'); throw error; } } };
  const worker = createWorker({ jwksFetch: async () => Response.json({ keys: [jwk] }) });
  const env = { DB, CLERK_ISSUER: issuer, ALLOWED_ORIGINS: origin, ADMIN_USER_IDS: 'user_admin' };
  return { sql, async request(path, { auth, method = 'GET', body } = {}) {
    const response = await worker.fetch(new Request('https://api.test' + path, { method,
      headers: { Origin: origin, ...(auth ? { Authorization: 'Bearer ' + auth } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) }), env);
    return { status: response.status, data: await response.json() };
  } };
}
const change = (slot = 'bookmark', value = { title: '测试文章', kind: '文章' }, time = 1000) => ({ slot, path: '/article/', value, changedAt: time, changeId: 'test-event-' + time });

test('library is private, owner comes from JWT and stored values discard foreign URLs and identity', async () => {
  const f = fixture(), alice = await token(), bob = await token('user_bob');
  assert.equal((await f.request('/v1/library')).status, 401);
  const saved = await f.request('/v1/library', { method: 'POST', auth: alice, body: { user_id: 'user_bob', changes: [change('bookmark', { title: '<b>文字</b>', kind: '文章', url: 'https://evil.test', user_id: 'user_bob' })] } });
  assert.equal(saved.status, 200); assert.equal(saved.data.items[0].path, '/article');
  assert.deepEqual(saved.data.items[0].value, { title: '<b>文字</b>', kind: '文章' });
  assert.equal((await f.request('/v1/library', { auth: alice })).data.items.length, 1);
  assert.deepEqual((await f.request('/v1/library', { auth: bob })).data.items, []);
});
test('bookmark tombstones resist an old device; read state and reading position merge independently', async () => {
  const f = fixture(), auth = await token();
  const send = changes => f.request('/v1/library', { auth, method: 'POST', body: { changes } });
  await send([change()]); await send([change('bookmark', null, 2000)]);
  const stale = await send([change()]); assert.equal(stale.data.items[0].value, null);
  await send([change('read', { title: '文章', read: true }, 3000)]);
  await send([change('progress', { title: '文章', progress: .6 }, 2500)]);
  const rows = (await f.request('/v1/library', { auth })).data.items;
  assert.equal(rows.find(row => row.slot === 'read').value.read, true);
  assert.equal(rows.find(row => row.slot === 'progress').value.progress, .6);
  const repeated = await send([change('progress', { title: '文章', progress: .9 }, 2500)]);
  assert.equal(repeated.data.items[0].value.progress, .6);
});
test('library validates whole batches, rejects unsafe paths and invalid progress', async () => {
  const f = fixture(), auth = await token();
  for (const bad of [{ ...change(), path: '//evil.test' }, { ...change(), path: '/%2e%2e/admin' }, change('progress', { title: '文章', progress: 2 }), change('read', { title: '文章', read: 'true' })]) {
    assert.equal((await f.request('/v1/library', { auth, method: 'POST', body: { changes: [change(), bad] } })).status, 400);
  }
  assert.equal((await f.request('/v1/library', { auth })).data.items.length, 0);
});
test('2048 scores require login and keep one best per authenticated account', async () => {
  const f = fixture(), alice = await token(), bob = await token('user_bob');
  const body = { score: 512, maxTile: 64, name: '<b>昵称</b>', user_id: 'user_bob', avatar: 'https://evil.test/track' };
  assert.equal((await f.request('/v1/leaderboard/2048', { method: 'POST', body })).status, 401);
  const saved = await f.request('/v1/leaderboard/2048', { auth: alice, method: 'POST', body });
  assert.equal(saved.status, 200); assert.equal(saved.data.personalBest.avatar, '');
  const lower = await f.request('/v1/leaderboard/2048', { auth: alice, method: 'POST', body: { ...body, score: 256 } });
  assert.equal(lower.data.improved, false); assert.equal(lower.data.personalBest.score, 512);
  await f.request('/v1/leaderboard/2048', { auth: bob, method: 'POST', body: { ...body, score: 1024 } });
  const publicRows = (await f.request('/v1/leaderboard/2048')).data;
  assert.equal(publicRows.items.length, 2); assert.equal(publicRows.items[0].score, 1024);
  assert(publicRows.items.every(row => !('user_id' in row)));
  assert.equal((await f.request('/v1/leaderboard/2048', { auth: alice })).data.personalBest.score, 512);
});
test('2048 rejects malformed scores and rate limits repeated submissions', async () => {
  const f = fixture(), auth = await token();
  for (const body of [{ score: -4, maxTile: 4 }, { score: '512', maxTile: 64 }, { score: 512, maxTile: 63 }, { score: 4, maxTile: 2048 }]) {
    assert.equal((await f.request('/v1/leaderboard/2048', { auth, method: 'POST', body })).status, 400);
  }
  for (let i = 0; i < 5; i++) assert.equal((await f.request('/v1/leaderboard/2048', { auth, method: 'POST', body: { score: 64, maxTile: 16 } })).status, 200);
  assert.equal((await f.request('/v1/leaderboard/2048', { auth, method: 'POST', body: { score: 64, maxTile: 16 } })).status, 429);
});
