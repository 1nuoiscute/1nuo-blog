'use strict';
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), localBrowsers = path.join(root, 'node_modules/.cache/ms-playwright');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(localBrowsers)) process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowsers;
const { chromium } = require('playwright'), { marked } = require('marked');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const pageHTML = marked.parse(read('source/discuss/index.md').replace(/^---[\s\S]*?---\s*/, ''));
const auth = `window.listeners=new Set();window.actor=localStorage.getItem('test:actor')||'user_alice';
window.Clerk={get isSignedIn(){return actor.startsWith('user_')},get user(){return this.isSignedIn?{id:actor,fullName:actor,imageUrl:''}:null},session:{getToken:async()=>actor},addListener(fn){listeners.add(fn);fn();return()=>listeners.delete(fn)},openSignIn:async options=>{window.loginOptions=options}};
window.NuoAuth={getClerk:async()=>Clerk};window.switchAccount=id=>{actor=id||'guest';localStorage.setItem('test:actor',actor);listeners.forEach(fn=>fn())};`;
let checks = 0; function check(value, label) { assert(value, label); checks++; console.log('PASS', label); }
async function main() {
  fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/js/nuo-account.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(auth); }
    if (url.pathname === '/pjax.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(read('node_modules/pjax/pjax.js')); }
    if (url.pathname === '/images/dafeiyu.png') { res.setHeader('Content-Type', 'image/png'); return res.end(fs.readFileSync(path.join(root, 'source/images/dafeiyu.png'))); }
    if (/^\/(js|css)\//.test(url.pathname)) { res.setHeader('Content-Type', url.pathname.endsWith('.css') ? 'text/css' : 'application/javascript'); return res.end(read('source' + url.pathname)); }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>讨论</title><link rel="stylesheet" href="/css/account.css"><link rel="stylesheet" href="/css/comments.css"><link rel="stylesheet" href="/css/discuss.css"><style>body{font-family:Arial,"Microsoft YaHei",sans-serif;margin:0;background:#f8f9fa}html[data-theme=dark] body{background:#161618}#main{max-width:1120px;margin:auto;padding:30px 24px}button,select,input,textarea{font-size:14px}a{color:#ae4778}button{cursor:pointer}</style></head><body class="type-discuss">' +
      '<nav><a href="/">主页</a> <a href="/discuss/">讨论</a></nav><main id="main"><div id="page"><div id="article-container">' + (url.pathname === '/discuss/' ? pageHTML : '<h1>博客首页</h1><a href="/discuss/">进入讨论</a>') + '</div></div></main>' +
      '<script src="/pjax.js"></script><script>window.pjax=new Pjax({elements:"a",selectors:["title","#main"],cacheBust:false});</script><script src="/js/nuo-account.js"></script><script src="/js/nuo-cloud.js"></script><script src="/js/nuo-comments.js"></script><script src="/js/nuo-discuss.js"></script><script src="/js/nuo-tools.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port, posts = new Map(), replies = [], writes = [], errors = [];
  const id = '22222222-2222-4222-8222-222222222222', now = Math.floor(Date.now() / 1000);
  posts.set(id, { id, title: '最近在做什么有意思的小项目？', body: '分享一下你的发现。\n\n**周末计划**\n- 写点代码\n- 出门走走', category: 'chat', state: 'published', author: { name: 'Nuo Nuo', avatar: '' }, owner: 'user_admin', version: 1, pinned: true, locked: false, createdAt: now, updatedAt: now, activeAt: now, replies: 0 });
  let browser, failPost = false, failLike = false, botWork = []; const likes = new Map();
  const likeSet = key => { if (!likes.has(key)) likes.set(key, new Set()); return likes.get(key); };
  try {
    browser = await chromium.launch({ headless: true }); const context = await browser.newContext();
    await context.route('https://www.1nuo.me/images/dafeiyu.png', route => route.fulfill({ contentType: 'image/png', body: fs.readFileSync(path.join(root, 'source/images/dafeiyu.png')) }));
    await context.route('https://comments.1nuo.me/**', async route => {
      const req = route.request(), url = new URL(req.url()), user = req.headers().authorization?.replace('Bearer ', '') || '', method = req.method();
      let status = 200, data; const input = req.postData() ? req.postDataJSON() : null, isAdmin = user === 'user_admin';
      const output = p => { const { owner, ...item } = p, votes = likeSet('discussions/' + p.id); return { ...item, likes: votes.size, liked: votes.has(user), replies: replies.filter(r => r.thread === '/discuss/' + p.id).length, excerpt: p.body.slice(0, 150), canEdit: owner === user, canDelete: owner === user || isAdmin }; };
      if (url.pathname === '/v1/library') data = { items: [] };
      else if (url.pathname === '/v1/me') data = { id: user, admin: isAdmin };
      else if (url.pathname.startsWith('/v1/bot-jobs/')) { botWork = []; data = { ok: true }; }
      else if (url.pathname.endsWith('/like')) {
        const key = url.pathname.slice(4, -5), votes = likeSet(key);
        if (failLike) { status = 503; data = { error: '点赞暂时失败' }; }
        else { if (method === 'POST') votes.add(user); else votes.delete(user); data = { likes: votes.size, liked: votes.has(user) }; }
      }
      else if (url.pathname === '/v1/discussions' && method === 'POST') {
        writes.push({ user, ...input });
        if (failPost) { status = 503; data = { error: '测试网络中断' }; }
        else { const item = { ...input, id: '33333333-3333-4333-8333-333333333333', owner: user, author: { name: user, avatar: '' }, version: 1, state: 'pending', createdAt: now, updatedAt: now, activeAt: now, replies: 0 }; posts.set(item.id, item); data = { item: output(item) }; }
      } else if (url.pathname === '/v1/discussions' || url.pathname === '/v1/admin/discussions') {
        const all = [...posts.values()].filter(p => (url.pathname.includes('/admin/') ? p.state === (url.searchParams.get('state') || 'pending') : url.searchParams.has('mine') ? p.owner === user : p.state === 'published') && (!url.searchParams.get('category') || p.category === url.searchParams.get('category')));
        data = { items: all.map(output), next: null };
      } else if (url.pathname.startsWith('/v1/discussions/')) {
        const item = posts.get(url.pathname.split('/')[3]);
        if (!item || (item.state !== 'published' && item.owner !== user && !isAdmin)) { status = 404; data = { error: '讨论不存在' }; }
        else if (method === 'PATCH') { Object.assign(item, input, { version: item.version + 1 }); if (input.body) item.state = 'pending'; data = { item: output(item) }; }
        else if (method === 'DELETE') { posts.delete(item.id); data = { ok: true }; }
        else data = { item: output(item), admin: isAdmin };
      } else if (url.pathname === '/v1/comments') {
        if (method === 'POST') {
          writes.push({ user, ...input }); const item = { ...input, id: replies.length + 1, floor: replies.length + 1, state: 'published', author: { name: user, avatar: '' }, createdAt: now, canDelete: true }; replies.push(item); data = { item };
          const target = replies.find(r => r.id === input.replyTo);
          if (target?.author.bot) replies.push({ id: replies.length + 1, floor: replies.length + 1, thread: item.thread, parentId: target.parentId || target.id, replyTo: item.id, body: '接着你刚才的问题聊。', state: 'published', author: { name: '大肥鱼', avatar: 'https://www.1nuo.me/images/dafeiyu.png', bot: true }, createdAt: now });
        }
        else data = { items: replies.filter(r => r.thread === url.searchParams.get('thread')).map(r => ({ ...r, likes: likeSet('comments/' + r.id).size, liked: likeSet('comments/' + r.id).has(user) })), next: null, bot: botWork };
      } else { status = 404; data = { error: 'unexpected route' }; }
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    });
    const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/discuss/'); await p.locator('.nd-row').waitFor();
    check(await p.locator('.nd-title').textContent() === posts.get(id).title, 'public list renders account topics');
    check(await p.locator('.nuo-content-tools').count() === 0, 'discussion omits article reading controls');
    await p.getByRole('button', { name: '问题交流', exact: true }).click(); await p.locator('.nd-empty').waitFor();
    check(await p.locator('.nd-row').count() === 0, 'category filtering updates the topic list');
    await p.getByRole('button', { name: '全部', exact: true }).click(); await p.locator('.nd-title').click(); await p.locator('[data-comments-body]').waitFor();
    check((await p.locator('.nd-prose strong').textContent()) === '周末计划', 'topic body renders Markdown from safe DOM nodes');
    await p.locator('[data-comments-body]').fill('这个想法不错'); await p.getByRole('button', { name: '发表回复', exact: true }).click(); await p.locator('.nuo-comment-body').waitFor();
    check(writes.at(-1).thread === '/discuss/' + id, 'replies belong to the selected discussion rather than the list page');
    await p.locator('[data-comments-body]').fill('再聊一句'); await p.getByRole('button', { name: '发表回复', exact: true }).click();
    await p.waitForFunction(() => document.querySelectorAll('.nuo-comment-floor').length === 2);
    check((await p.locator('.nuo-comment-floor').allTextContents()).join(',') === '1 楼,2 楼', 'published replies display their floor numbers');
    failLike = true; await p.locator('[data-post-like]').click(); await p.locator('[data-discuss-status]').filter({ hasText: '点赞暂时失败' }).waitFor();
    check(await p.locator('[data-post-like]').getAttribute('aria-pressed') === 'false', 'failed like keeps the prior state and can be retried');
    failLike = false; await p.locator('[data-post-like]').click(); await p.waitForFunction(() => document.querySelector('[data-post-like]').getAttribute('aria-pressed') === 'true');
    check((await p.locator('[data-post-like]').textContent()).includes('1'), 'post like updates its count');
    await p.locator('[data-post-like]').click(); await p.waitForFunction(() => document.querySelector('[data-post-like]').getAttribute('aria-pressed') === 'false');
    check((await p.locator('[data-post-like]').textContent()).includes('0'), 'post like can be cancelled');
    await p.locator('[data-post-like]').click(); await p.waitForFunction(() => document.querySelector('[data-post-like]').getAttribute('aria-pressed') === 'true');
    await p.locator('[data-comment-like="1"]').click(); await p.waitForFunction(() => document.querySelector('[data-comment-like="1"]').getAttribute('aria-pressed') === 'true');
    check((await p.locator('[data-comment-like="1"]').textContent()).includes('1'), 'reply has its own account like button');
    await p.reload(); await p.locator('[data-comment-like="1"][aria-pressed=true]').waitFor();
    check(await p.locator('[data-post-like]').getAttribute('aria-pressed') === 'true', 'post and reply like state survives a reload');
    await p.setViewportSize({ width: 390, height: 844 });
    check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'reply floors and like controls fit the mobile viewport');
    await p.screenshot({ path: path.join(root, 'test-results/discuss-replies-mobile.png'), fullPage: true });
    await p.setViewportSize({ width: 1280, height: 900 });
    await p.locator('.nd-back').click(); await p.locator('.nd-row').waitFor();
    check(await p.locator('[data-metric=likes] strong').textContent() === '1' && await p.locator('[data-metric=replies] strong').textContent() === '2', 'topic list shows both like and reply totals');
    replies.push({ id: 3, floor: 3, thread: '/discuss/' + id, body: '大肥鱼也来聊两句。', author: { name: '大肥鱼', avatar: 'https://www.1nuo.me/images/dafeiyu.png', bot: true }, state: 'published', createdAt: now });
    await p.locator('.nd-title').click(); await p.locator('[data-comment-id="3"] .nuo-comment-ai-badge').waitFor();
    await p.locator('[data-comment-id="3"]').scrollIntoViewIfNeeded(); await p.waitForFunction(() => document.querySelector('[data-comment-id="3"] img')?.naturalWidth > 0);
    check(await p.locator('[data-comment-id="3"] strong').textContent() === '大肥鱼', 'AI reply has the chosen name, avatar and AI badge');
    await p.locator('[data-comment-id="3"]').getByRole('button', { name: '继续聊', exact: true }).click();
    await p.locator('[data-comments-body]').fill('你能展开说说吗？'); await p.getByRole('button', { name: '发表回复', exact: true }).click();
    await p.locator('[data-comment-id="5"]').waitFor();
    check(writes.at(-1).replyTo === 3 && await p.locator('[data-comment-id="5"] .nuo-comment-ai-badge').count() === 1, 'continue chatting targets the AI message and renders a new AI reply');
    botWork = [{ id: 'comment:4', status: 'running' }]; await p.reload(); await p.locator('.nuo-bot-status').filter({ hasText: '大肥鱼正在想' }).waitFor();
    botWork = [{ id: 'comment:4', status: 'error', message: '暂时没连上', canRetry: true }]; await p.reload(); await p.locator('.nuo-bot-status').getByRole('button', { name: '重试' }).click(); await p.locator('.nuo-bot-status').waitFor({ state: 'hidden' });
    check(await p.locator('.nuo-bot-status').isHidden(), 'bot generation status and retry fit into the reply flow');
    await p.setViewportSize({ width: 390, height: 844 }); await p.screenshot({ path: path.join(root, 'test-results/dafeiyu-chat-mobile.png'), fullPage: true }); await p.setViewportSize({ width: 1280, height: 900 });
    await p.locator('.nd-back').click(); await p.locator('[data-discuss-new]').click();
    check(await p.locator('[name=inviteBot]').isChecked(), 'new posts invite the AI by default');
    await p.locator('[name=inviteBot]').uncheck(); await p.locator('#nd-title').fill('我的新讨论'); await p.locator('#nd-body').fill('**测试粗体**\n\n[危险链接](javascript:alert(1))\n<script>window.injected=true</script>');
    await p.locator('[data-discuss-preview]').click();
    check(await p.locator('.nd-preview strong').textContent() === '测试粗体' && await p.locator('.nd-preview a').count() === 0 && await p.evaluate(() => !window.injected), 'preview keeps HTML literal and rejects executable links');
    await p.reload(); await p.locator('[data-discuss-new]').click();
    check(await p.locator('#nd-title').inputValue() === '我的新讨论', 'draft survives a page reload');
    check(!(await p.locator('[name=inviteBot]').isChecked()), 'the author can opt out and the draft remembers that choice');
    await p.evaluate(() => switchAccount('user_bob')); await p.waitForFunction(() => NuoCloud.state().user?.id === 'user_bob'); await p.locator('[data-discuss-new]').click();
    check(await p.locator('#nd-title').inputValue() === '', 'account switching isolates local drafts');
    await p.evaluate(() => switchAccount('user_alice')); await p.waitForFunction(() => NuoCloud.state().user?.id === 'user_alice'); await p.locator('[data-discuss-new]').click();
    check(await p.locator('#nd-title').inputValue() === '我的新讨论', 'switching back restores the original account draft');
    failPost = true; await p.locator('[data-discuss-submit]').click(); await p.locator('[data-discuss-form-status]').filter({ hasText: '草稿已保留' }).waitFor();
    check(await p.locator('#nd-title').inputValue() === '我的新讨论', 'failed posting retains input and allows retry');
    failPost = false; await p.locator('[data-discuss-submit]').click(); await p.locator('.nd-post-title').filter({ hasText: '我的新讨论' }).waitFor();
    check(writes.at(-1).user === 'user_alice' && await p.locator('.nd-review').count() === 1, 'posting uses the active account and shows pending status');
    check(await p.locator('[data-nuo-comments]').count() === 0, 'pending topics do not expose a reply composer');
    await p.getByRole('button', { name: '编辑', exact: true }).click(); await p.locator('#nd-title').fill('更新后的讨论'); await p.locator('[data-discuss-submit]').click(); await p.locator('.nd-post-title').filter({ hasText: '更新后的讨论' }).waitFor();
    check(await p.locator('.nd-post-title').textContent() === '更新后的讨论', 'authors can edit their own discussion');
    await p.locator('.nd-back').click(); await p.getByRole('button', { name: '我的帖子', exact: true }).click(); await p.locator('.nd-row').waitFor();
    check(await p.locator('.nd-title').textContent() === '更新后的讨论', 'my topics includes the author pending post');
    await p.evaluate(() => switchAccount('user_admin')); await p.locator('[data-discuss-admin]:visible').waitFor();
    await p.locator('[data-discuss-admin]').click(); await p.locator('.nd-title').click(); await p.getByRole('button', { name: '发布', exact: true }).click(); await p.locator('[data-nuo-comments]').waitFor();
    check(await p.locator('.nd-review').count() === 0, 'administrator publishes a topic from the review list');
    await p.getByRole('button', { name: '关闭回复', exact: true }).click(); await p.getByRole('button', { name: '开放回复', exact: true }).waitFor();
    check(!(await p.locator('[data-comments-form]').isVisible()), 'closed discussions keep replies readable and hide the composer');
    await p.getByRole('button', { name: '置顶', exact: true }).click(); await p.getByRole('button', { name: '取消置顶', exact: true }).waitFor();
    check(posts.get('33333333-3333-4333-8333-333333333333').pinned, 'administrator can pin a discussion');
    await p.evaluate(() => switchAccount('guest')); await p.waitForFunction(() => !NuoCloud.state().user); await p.locator('[data-discuss-new]').click(); await p.waitForFunction(() => !!window.loginOptions);
    check((await p.evaluate(() => loginOptions.forceRedirectUrl)).includes('?id='), 'login returns to the same topic');
    await p.goto(base + '/'); await p.getByRole('link', { name: '进入讨论', exact: true }).click(); await p.locator('.nd-row').first().waitFor();
    check(await p.locator('[data-nuo-discuss]').count() === 1, 'discussion client remounts through PJAX');
    await p.setViewportSize({ width: 390, height: 844 }); await p.screenshot({ path: path.join(root, 'test-results/discuss-mobile.png'), fullPage: true });
    check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile topic list fits the viewport');
    await p.evaluate(() => document.documentElement.dataset.theme = 'dark'); await p.screenshot({ path: path.join(root, 'test-results/discuss-dark.png'), fullPage: true });
    check(await p.locator('.nuo-discuss').evaluate(n => getComputedStyle(n).color) === 'rgb(241, 234, 240)', 'discussion uses the shared dark-theme palette');
    check(errors.length === 0, 'discussion interactions have no uncaught browser errors: ' + errors.join(', '));
    console.log('Discussion UI: ' + checks + ' checks passed (isolated auth/API).');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
