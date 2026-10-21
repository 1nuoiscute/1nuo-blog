'use strict';
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const localBrowsers = path.join(root, 'node_modules/.cache/ms-playwright');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(localBrowsers)) process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowsers;
const { chromium } = require('playwright');
const { marked } = require('marked');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let checks = 0;
const check = (value, label) => { assert(value, label); checks++; console.log('PASS', label); };
const auth = `window.listeners=new Set();window.actor=localStorage.getItem('test:actor')||'user_alice';
const testClerk={get user(){return actor.startsWith('user_')?{id:actor,fullName:actor,imageUrl:''}:null},session:{getToken:async()=>actor},addListener(fn){listeners.add(fn);fn();return()=>listeners.delete(fn)},openSignIn:async()=>{window.loginOpened=true}};
window.NuoAuth={getClerk:async()=>testClerk};window.switchAccount=id=>{actor=id||'guest';localStorage.setItem('test:actor',actor);listeners.forEach(fn=>fn())};`;

async function main() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (url.pathname === '/js/nuo-account.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(auth); }
    if (url.pathname === '/css/account.css') { res.setHeader('Content-Type', 'text/css'); return res.end(read('source/css/account.css')); }
    if (url.pathname.startsWith('/js/')) { res.setHeader('Content-Type', 'application/javascript'); return res.end(read('source' + url.pathname)); }
    if (url.pathname === '/game/') return res.end(read('source/explore/game2048-app/index.html'));
    const library = marked.parse(read('source/favorites/index.md').replace(/^---[\s\S]*?---\s*/, ''));
    const article = '<div id="post-info"><h1 class="post-title">测试文章</h1></div><div id="post"><div id="article-container"><p>' + '阅读正文。'.repeat(500) + '</p></div></div>';
    res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/js/nuo-account.js"></script><script src="/js/nuo-cloud.js"></script></head><body>' +
      (url.pathname === '/favorites/' ? '<div id="page"><h1>我的书架</h1><div id="article-container">' + library + '</div></div>' : article) +
      (url.pathname === '/embedded/' ? '<iframe id="game-frame" title="2048" src="/game/"></iframe>' : '') + '<script src="/js/nuo-tools.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const records = new Map(), scores = new Map(), writes = [], scorePosts = [];
  let failSync = false, failScore = true, delayAlice = false, browser;
  function bucket(id) { if (!records.has(id)) records.set(id, new Map()); return records.get(id); }
  async function routes(context) {
    await context.route('https://comments.1nuo.me/**', async route => {
      const req = route.request(), endpoint = new URL(req.url()).pathname, user = req.headers().authorization?.replace('Bearer ', '') || '';
      let data, status = 200;
      if (endpoint === '/v1/library') {
        if (req.method() === 'POST') {
          if (failSync) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"测试网络中断"}' });
          const changes = req.postDataJSON().changes; writes.push({ user, changes });
          changes.forEach(item => { const key = item.slot + '\t' + item.path, old = bucket(user).get(key);
            if (!old || item.changedAt > old.changedAt || (item.changedAt === old.changedAt && item.changeId > old.changeId)) bucket(user).set(key, item); });
          data = { items: changes.map(item => bucket(user).get(item.slot + '\t' + item.path)) };
        } else {
          const items = [...bucket(user).values()];
          if (delayAlice && user === 'user_alice') await new Promise(resolve => setTimeout(resolve, 150));
          data = { items };
        }
      } else if (endpoint === '/v1/leaderboard/2048') {
        if (req.method() === 'POST') {
          const body = req.postDataJSON(); scorePosts.push({ user, ...body });
          if (failScore) { status = 500; data = { error: '测试提交失败' }; }
          else { const value = { ...body, score: Math.max(body.score, scores.get(user)?.score || 0), mine: true }; scores.set(user, value); data = { personalBest: value, improved: true }; }
        } else data = { items: [{ name: '<b>榜单昵称</b>', score: 128 }, ...scores.values()], personalBest: scores.get(user) || null };
      } else { status = 404; data = { error: 'unexpected route' }; }
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    });
  }
  try {
    browser = await chromium.launch({ headless: true });
    const first = await browser.newContext(), second = await browser.newContext(); await routes(first); await routes(second);
    const a = await first.newPage(), b = await second.newPage(), errors = [];
    a.on('pageerror', error => errors.push(error.message)); b.on('pageerror', error => errors.push(error.message));
    await a.goto(base + '/article/'); await a.locator('[data-action="bookmark"]').waitFor();
    await a.locator('[data-action="bookmark"]').click(); await a.evaluate(() => NuoCloud.sync());
    check(writes.every(row => row.user === 'user_alice'), 'library writes carry the current authenticated account');
    await b.goto(base + '/favorites/'); await b.evaluate(() => NuoCloud.ready());
    await b.locator('[data-library-section="saved"] a').waitFor();
    check(await b.locator('[data-library-section="saved"] a').textContent() === '测试文章', 'second device loads the account bookmark');
    await b.getByRole('button', { name: '移除', exact: true }).click(); await b.evaluate(() => NuoCloud.sync()); await a.evaluate(() => NuoCloud.sync());
    check(await a.locator('[data-action="bookmark"]').textContent() === '♡ 收藏', 'bookmark removal reaches another device');
    // Finish the live article's progress recorder before injecting a test position.
    await a.goto(base + '/favorites/'); await a.evaluate(() => NuoCloud.ready());
    await a.evaluate(() => { NuoCloud.write('nuo:reading:v1', { '/article': { title: '测试文章', kind: '文章', progress: .6, read: true } }); return NuoCloud.sync(); });
    await b.evaluate(() => NuoCloud.sync());
    check(await b.evaluate(() => NuoCloud.read('nuo:reading:v1', {})['/article'].progress) === .6, 'second device loads reading position');
    // A previously observed remote clock may be slightly ahead of this device.
    bucket('user_alice').get('read\t/article').changedAt = Date.now() + 1000;
    await b.evaluate(() => NuoCloud.sync());
    await b.evaluate(() => { const state = NuoCloud.read('nuo:reading:v1', {}); state['/article'].read = false; NuoCloud.write('nuo:reading:v1', state); return NuoCloud.sync(); });
    await a.evaluate(() => { const state = NuoCloud.read('nuo:reading:v1', {}); state['/article'].progress = .8; NuoCloud.write('nuo:reading:v1', state); return NuoCloud.sync(); });
    check(await a.evaluate(() => NuoCloud.read('nuo:reading:v1', {})['/article'].read) === false, 'progress updates do not overwrite a remote unread change');
    await b.setViewportSize({ width: 390, height: 844 }); await b.evaluate(() => NuoCloud.sync());
    await b.locator('[data-library-section="continuing"] a').first().click();
    await b.waitForFunction(() => scrollY > 400);
    check(await b.evaluate(() => NuoCloud.read('nuo:reading:v1', {})['/article'].progress) > .7, 'continue reading restores a position synchronized from another device');
    await b.goto(base + '/favorites/'); await b.evaluate(() => NuoCloud.ready());
    failSync = true;
    await a.evaluate(() => { NuoCloud.write('nuo:bookmarks:v1', { '/offline': { title: '离线收藏', kind: '文章' } }); return NuoCloud.sync(); });
    check(await a.evaluate(() => NuoCloud.state().status) === 'offline', 'failed sync is visible and retains pending changes');
    await a.goto(base + '/favorites/'); await a.evaluate(() => NuoCloud.ready());
    check(await a.evaluate(() => !!NuoCloud.read('nuo:bookmarks:v1', {})['/offline']) === true, 'offline bookmark survives a reload');
    failSync = false; await a.evaluate(() => NuoCloud.sync()); await b.evaluate(() => NuoCloud.sync());
    check(await b.evaluate(() => !!NuoCloud.read('nuo:bookmarks:v1', {})['/offline']) === true, 'recovered network uploads the saved outbox');
    await a.evaluate(() => localStorage.setItem('nuo:bookmarks:v1', JSON.stringify({ '/legacy': { title: '原有本地收藏', savedAt: 100 } })));
    await a.evaluate(() => document.dispatchEvent(new Event('pjax:complete')));
    check(!bucket('user_alice').has('bookmark\t/legacy'), 'guest records are not silently assigned to an account');
    await a.getByRole('button', { name: '导入此设备原有记录', exact: true }).click();
    await a.waitForFunction(() => !!NuoCloud.read('nuo:bookmarks:v1', {})['/legacy'] && NuoCloud.state().pending === 0);
    check(bucket('user_alice').has('bookmark\t/legacy'), 'explicit import uploads guest records into the selected account');
    check(await a.evaluate(() => !!JSON.parse(localStorage.getItem('nuo:bookmarks:v1'))['/legacy']), 'import retains the original local records');
    delayAlice = true;
    await a.evaluate(() => { window.inFlightSync = NuoCloud.sync(); switchAccount('user_bob'); });
    await a.waitForFunction(() => NuoCloud.state().user?.id === 'user_bob' && NuoCloud.state().status === 'synced');
    await a.evaluate(() => window.inFlightSync);
    check(await a.evaluate(() => Object.keys(NuoCloud.read('nuo:bookmarks:v1', {})).length) === 0, 'account switch ignores a late response from the prior user');
    await a.evaluate(() => switchAccount(null));
    await a.waitForFunction(() => !NuoCloud.state().user);
    check(await a.evaluate(() => !NuoCloud.read('nuo:bookmarks:v1', {})['/offline']), 'signed-out view does not expose account-only records');
    await a.evaluate(() => switchAccount('user_alice'));
    await a.waitForFunction(() => NuoCloud.state().status === 'synced');
    await a.goto(base + '/game/'); await a.evaluate(() => NuoCloud.ready());
    await a.locator('.lb-h').click(); await a.locator('.lb-name').first().waitFor();
    check(await a.locator('.lb-name').first().textContent() === '<b>榜单昵称</b>' && await a.locator('.lb-name b').count() === 0, 'account leaderboard renders names as plain text');
    await a.evaluate(() => { g.s = 512; g.g[0][0] = { v: 64, i: 100 }; g.o = true; g.over('结束', '测试'); });
    await a.locator('#lb-form button').click(); await a.getByText('提交失败，请重试。', { exact: true }).waitFor();
    check(await a.locator('#lb-form button').isEnabled(), 'score submission failure permits retry');
    check(scorePosts.at(-1).score === 512 && scorePosts.at(-1).maxTile === 64 && scorePosts.at(-1).user === 'user_alice', 'score and max tile are distinct and bound to the authenticated user');
    failScore = false;
    await a.locator('#lb-form button').click(); await a.getByText('已保存，个人最佳 512', { exact: true }).waitFor();
    check(await a.locator('#lb-form button').isDisabled(), 'successful submission cannot be clicked twice');
    await a.evaluate(() => switchAccount('user_bob'));
    await a.getByText('账号已切换，请开始新一局再参加排行。', { exact: true }).waitFor();
    check(await a.locator('#lb-form button').isDisabled(), 'a completed round cannot be reassigned after account switching');
    await a.evaluate(() => { g.restart(); g.s = 64; g.g[0][0] = { v: 16, i: 100 }; g.o = true; g.over('结束', '新局'); });
    await a.locator('#lb-form button').click(); await a.getByText('已保存，个人最佳 64', { exact: true }).waitFor();
    check(scorePosts.at(-1).user === 'user_bob', 'new round belongs to the new signed-in account');
    await a.goto(base + '/embedded/'); await a.evaluate(() => NuoCloud.ready());
    const frame = a.frames().find(value => value.url().includes('/game/'));
    await frame.waitForFunction(() => typeof g !== 'undefined' && window.NuoCloud.state().user?.id === 'user_bob');
    check(await frame.evaluate(() => window.NuoCloud === parent.NuoCloud), 'embedded game reuses the parent account session and sync client');
    await frame.waitForFunction(() => Number(document.getElementById('best').textContent) >= 64);
    check(await frame.locator('#best').textContent() === '64', 'account personal best also populates the game score display');
    await a.goto(base + '/game/'); await a.evaluate(() => NuoCloud.ready());
    await a.evaluate(() => switchAccount(null)); await a.waitForFunction(() => !NuoCloud.state().user);
    await a.evaluate(() => { g.restart(); g.s = 256; g.g[0][0] = { v: 32, i: 100 }; g.o = true; g.over('结束', '访客一局'); });
    await a.locator('#lb-form button').click(); await a.waitForFunction(() => window.loginOpened);
    await a.evaluate(() => localStorage.setItem('test:actor', 'user_bob'));
    await a.reload(); await a.evaluate(() => NuoCloud.ready()); await a.locator('#lb-form').waitFor();
    check(await a.evaluate(() => g.s === 256 && g.g[0][0].v === 32), 'login redirect preserves the guest round and score');
    await a.locator('#lb-form button').click(); await a.getByText('已保存，个人最佳 256', { exact: true }).waitFor();
    check(scorePosts.at(-1).score === 256 && scorePosts.at(-1).user === 'user_bob', 'guest round can be explicitly submitted after login');
    check(errors.length === 0, 'account data features have no uncaught browser errors');
    console.log(`Account data: ${checks} checks passed (two devices, simulated auth/API).`);
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
