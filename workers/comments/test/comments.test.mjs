import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { createWorker } from '../src/index.mjs';

const pair = await generateKeyPair('RS256', { extractable: true });
const jwk = { ...await exportJWK(pair.publicKey), kid: 'test-key', alg: 'RS256', use: 'sig' };
const issuer = 'https://test.clerk.accounts.dev', origin = 'https://www.1nuo.me';
async function token(user = 'user_alice', options = {}) {
  return new SignJWT({ sid: 'sess_test', azp: origin, ...options.claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setSubject(user).setIssuer(options.issuer || issuer)
    .setIssuedAt().setNotBefore('0s').setExpirationTime(options.exp || '1m').sign(pair.privateKey);
}
function fixture() {
  const sql = new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON');
  sql.exec(readFileSync(new URL('../migrations/0001_comments.sql', import.meta.url), 'utf8'));
  const DB = { prepare(query) {
    const statement = sql.prepare(query); let values = [];
    return { bind(...params) { values = params; return this; },
      async first() { return statement.get(...values) || null; },
      async all() { return { results: statement.all(...values) }; },
      async run() { const result = statement.run(...values); return { meta: { changes: Number(result.changes) } }; }
    };
  } };
  const worker = createWorker({ jwksFetch: async () => Response.json({ keys: [jwk] }) });
  const env = { DB, CLERK_ISSUER: issuer, ALLOWED_ORIGINS: origin, ADMIN_USER_IDS: 'user_admin' };
  return { sql, env, async request(path, { auth, method = 'GET', body, source = origin, raw, headers = {} } = {}) {
    const requestHeaders = { ...(source ? { Origin: source } : {}), ...(auth ? { Authorization: 'Bearer ' + auth } : {}), ...headers };
    if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
    const response = await worker.fetch(new Request('https://comments.example.test' + path, {
      method, headers: requestHeaders, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined)
    }), env);
    return { status: response.status, headers: response.headers, data: response.status === 204 ? null : await response.json() };
  } };
}
const thread = '/2026/10/20/example/', endpoint = '/v1/comments?thread=' + encodeURIComponent(thread);

test('public reads, CORS and anonymous write rejection', async () => {
  const f = fixture();
  assert.equal((await f.request('/health')).data.ok, true);
  assert.deepEqual((await f.request(endpoint)).data.items, []);
  assert.equal((await f.request(endpoint, { source: 'https://evil.test' })).status, 403);
  assert.equal((await f.request(endpoint, { method: 'OPTIONS' })).status, 204);
  assert.equal((await f.request('/v1/comments', { method: 'POST', body: {} })).status, 401);
});
test('signature, issuer, expiry, pending sessions and authorized party are checked', async () => {
  const f = fixture();
  for (const jwt of ['forged', await token('user_alice', { issuer: 'https://evil.test' }),
    await token('user_alice', { exp: '-1m' }), await token('user_alice', { claims: { azp: 'https://evil.test' } }),
    await token('user_alice', { claims: { sts: 'pending' } })]) {
    assert.equal((await f.request('/v1/me', { auth: jwt })).status, 401);
  }
  const changed = (await token()).split('.');
  changed[2] = (changed[2][0] === 'A' ? 'B' : 'A') + changed[2].slice(1);
  assert.equal((await f.request('/v1/me', { auth: changed.join('.') })).status, 401);
  assert.deepEqual((await f.request('/v1/me', { auth: await token() })).data, { id: 'user_alice', admin: false });
});
test('pending visibility, moderation, identity forgery and cross-user deletion', async () => {
  const f = fixture(), alice = await token(), admin = await token('user_admin');
  const posted = await f.request('/v1/comments', { method: 'POST', auth: alice,
    body: { thread, body: '<script>alert(1)</script>', name: '测试读者', author_id: 'user_admin', admin: true, state: 'published', avatar: 'https://evil.test/track' } });
  assert.equal(posted.status, 201); assert.equal(posted.data.item.state, 'pending');
  assert.equal(posted.data.item.author.avatar, '');
  assert.equal(f.sql.prepare('SELECT author_id FROM comments').get().author_id, 'user_alice');
  assert.equal((await f.request(endpoint)).data.items.length, 0);
  assert.equal((await f.request(endpoint, { auth: await token('user_bob') })).data.items.length, 0);
  assert.equal((await f.request(endpoint, { auth: alice })).data.items.length, 1);
  const path = '/v1/comments/' + posted.data.item.id;
  assert.equal((await f.request(path, { method: 'PATCH', auth: alice, body: { state: 'published' } })).status, 403);
  assert.equal((await f.request(path, { method: 'DELETE', auth: await token('user_bob') })).status, 403);
  assert.equal((await f.request(path, { method: 'PATCH', auth: admin, body: { state: 'published' } })).status, 200);
  const publicRow = (await f.request(endpoint)).data.items[0];
  assert.equal(publicRow.body, '<script>alert(1)</script>');
  assert.equal(publicRow.canDelete, false); assert.equal('author_id' in publicRow, false);
  assert.equal((await f.request(path, { method: 'DELETE', auth: alice })).status, 200);
  assert.equal((await f.request(endpoint)).data.items[0].body, '');
});
test('deleting an unapproved comment never publishes a tombstone', async () => {
  const f = fixture(), auth = await token();
  const post = await f.request('/v1/comments', { method: 'POST', auth, body: { thread, body: '待审核内容' } });
  await f.request('/v1/comments/' + post.data.item.id, { method: 'DELETE', auth });
  assert.deepEqual((await f.request(endpoint)).data.items, []);
});
test('replies stay in their article and hidden roots hide replies', async () => {
  const f = fixture(), auth = await token('user_admin');
  const post = body => f.request('/v1/comments', { method: 'POST', auth, body });
  const root = (await post({ thread, body: '主评论' })).data.item;
  assert.equal((await post({ thread: '/other', parentId: root.id, body: '跨文章' })).status, 400);
  const reply = (await post({ thread, parentId: root.id, body: '回复' })).data.item;
  assert.equal((await post({ thread, parentId: reply.id, body: '过深' })).status, 400);
  assert.equal((await f.request(endpoint)).data.items.length, 2);
  await f.request('/v1/comments/' + root.id, { method: 'PATCH', auth, body: { state: 'hidden' } });
  assert.equal((await f.request(endpoint)).data.items.length, 0);
});
test('validation, body size and persistent rate limits', async () => {
  const f = fixture(), auth = await token();
  for (const body of [{ thread, body: '' }, { thread: '//evil.test', body: 'x' },
    { thread: '/%2e%2e/admin', body: 'x' }, { thread, body: 'x'.repeat(2001) }]) {
    assert.equal((await f.request('/v1/comments', { method: 'POST', auth, body })).status, 400);
  }
  assert.equal((await f.request('/v1/comments', { method: 'POST', auth, raw: 'x'.repeat(10001), headers: { 'Content-Type': 'application/json' } })).status, 413);
  for (let i = 0; i < 3; i++) assert.equal((await f.request('/v1/comments', { method: 'POST', auth, body: { thread, body: 'x' } })).status, 201);
  assert.equal((await f.request('/v1/comments', { method: 'POST', auth, body: { thread, body: 'x' } })).status, 429);
  assert.equal((await f.request('/v1/admin/comments', { auth })).status, 403);
});
