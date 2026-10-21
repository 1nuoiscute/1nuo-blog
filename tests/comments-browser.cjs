'use strict';
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const local = path.join(root, 'node_modules/.cache/ms-playwright');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(local)) process.env.PLAYWRIGHT_BROWSERS_PATH = local;
const { chromium } = require('playwright');
const pug = require('pug');
const { marked } = require('marked');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const publicMarkup = pug.renderFile(path.join(root, 'themes/butterfly/layout/includes/third-party/comments/index.pug'), {
  theme: { nuo_comments: { api: 'https://comments.example.test' }, comments: { use: ['Giscus', 'Twikoo'] } }, _p: () => '评论'
});
const adminMarkup = marked.parse(read('source/comments-admin/index.md').replace(/^---[\s\S]*?---\s*/, '')).replace('https://comments.1nuo.me', 'https://comments.example.test');
const authStub = `
window.listeners=new Set();window.actor=location.search.includes('signedout')?null:'user_alice';
window.testClerk={get isSignedIn(){return !!actor},get user(){return actor?{id:actor,fullName:actor,username:actor,imageUrl:''}:null},session:{getToken:async()=>actor},addListener(fn){listeners.add(fn);fn();return()=>listeners.delete(fn)},openSignIn:async options=>{window.loginOptions=options}};
window.NuoAuth={getClerk:async()=>testClerk};window.switchAccount=id=>{actor=id;listeners.forEach(fn=>fn())};
`;
let checks = 0;
function check(value, message) { assert(value, message); checks++; console.log('PASS', message); }
async function main() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if(url.pathname==='/images/dafeiyu.png') { res.setHeader('Content-Type','image/png'); return res.end(fs.readFileSync(path.join(root,'source/images/dafeiyu.png'))); }
    const files = { '/nuo-comments.js': 'source/js/nuo-comments.js', '/nuo-markdown.js': 'source/js/nuo-markdown.js', '/comments.css': 'source/css/comments.css', '/account.css': 'source/css/account.css' };
    if (files[url.pathname]) {
      res.setHeader('Content-Type', url.pathname.endsWith('.css') ? 'text/css' : 'application/javascript');
      return res.end(read(files[url.pathname]));
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/account.css"><link rel="stylesheet" href="/comments.css"></head><body style="margin:24px;font-family:Arial,\'Microsoft YaHei\',sans-serif;background:var(--account-surface)"><main id="article-container" style="max-width:880px;margin:auto">' +
      (url.pathname === '/comments-admin/' ? adminMarkup : '<article class="post-content" id="article-body">公开的文章正文</article>' + publicMarkup) + '</main><script>' + authStub + '</script><script src="/nuo-markdown.js"></script><script src="/nuo-comments.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    let failPost = true;
    let failDiagnosis = false;
    const submissions = [], summaryRequests = [];
    const comments = [{ id: 1, thread: '/', parentId: null, authorId: 'user_admin',
      author: { name: '<b>普通昵称</b>', avatar: '' }, body: '<img src=x onerror=alert(1)>', state: 'published', createdAt: 1700000000, ipLocation: '四川' }];
    await context.route('https://comments.example.test/**', async route => {
      const req = route.request(), url = new URL(req.url());
      const actor = req.headers().authorization?.replace('Bearer ', '') || '';
      let status = 200, data;
      const map = item => ({ ...item, canDelete: actor === item.authorId || actor === 'user_admin' });
      if (url.pathname === '/v1/me') data = { id: actor, admin: actor === 'user_admin', moderation: { configured: true, dailyLimit: 100 } };
      else if (url.pathname === '/v1/admin/diagnostics') data = { configured: true, model: 'deepseek-flash', keyHasWhitespace: false,
        models: { status: 200, ms: 120, models: failDiagnosis ? [] : ['deepseek-flash'], hasModel: !failDiagnosis, error: failDiagnosis ? '返回的模型列表格式无效，请稍后重试' : '' },
        chat: { ok: true, ms: 800, decision: 'approve', error: '' } };
      else if (url.pathname.endsWith('/moderate') && req.method() === 'POST') {
        comments.find(item => item.id === Number(url.pathname.split('/').at(-2))).moderation = { status: 'queued' };
        data = { ok: true };
      }
      else if (url.pathname === '/v1/article-summary' && req.method() === 'POST') {
        summaryRequests.push(req.postDataJSON());
        if (!comments.some(item => item.author.bot)) comments.push({id:comments.length+1,thread:'/',parentId:null,authorId:'bot:dafeiyu',author:{name:'大肥鱼',avatar:'',bot:true},body:'**本文重点**\n\n- 第一项总结\n- 读者关注的问题',state:'published',createdAt:1700000010});
        data={ok:true};
      }
      else if (req.method() === 'POST') {
        const body = req.postDataJSON(); submissions.push(body);
        if (failPost) { status = 500; data = { error: '暂时提交失败，请重试' }; }
        else {
          const isBotReply=comments.find(item=>item.id===body.replyTo)?.author.bot;
          const item = { id: comments.length + 1, thread: '/', parentId: body.parentId, replyTo:body.replyTo, authorId: actor,
            author: { name: body.name, avatar: '' }, body: body.body, state: 'pending', createdAt: 1700000001,
            moderation: { status: 'review', reason: '需要结合上下文判断' } };
          if(isBotReply) item.state='published';
          comments.push(item); status = 201; data = { item: map(item) };
          if(isBotReply) comments.push({id:comments.length+1,thread:'/',parentId:body.parentId,replyTo:item.id,authorId:'bot:dafeiyu',author:{name:'大肥鱼',avatar:'',bot:true},body:'沿着本文继续解释。',state:'published',createdAt:1700000011});
        }
      } else if (req.method() === 'PATCH') {
        comments.find(item => item.id === Number(url.pathname.split('/').at(-1))).state = req.postDataJSON().state;
        data = { ok: true };
      } else if (url.pathname === '/v1/admin/comments') data = { items: comments.filter(item => item.state === url.searchParams.get('state')).map(map) };
      else data = { items: comments.filter(item => item.state === 'published' || item.authorId === actor).map(map), next: null };
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    const input = page.locator('[data-comments-body]');
    await page.waitForFunction(() => !document.querySelector('[data-comments-body]').disabled);
    check(await page.locator('.nuo-comment-body').textContent() === '<img src=x onerror=alert(1)>', 'comment HTML remains literal text');
    check(await page.locator('.nuo-comment-body img').count() === 0, 'comment body creates no executable elements');
    check(await page.locator('.nuo-comment-header strong').textContent() === '<b>普通昵称</b>', 'nickname HTML remains literal text');
    check(await page.locator('.nuo-comment-location').textContent() === 'IP 属地：四川', 'comment shows its posting-time IP region');
    check(await page.getByText('查看历史评论（Giscus / Twikoo）').count() === 1, 'both historical systems remain available');
    await input.fill('需要保留的草稿');
    check(await page.locator('[data-comments-counter]').textContent() === '7 / 2000', 'character counter follows draft');
    await page.getByRole('button', { name: '发表评论', exact: true }).click();
    await page.getByText('暂时提交失败，请重试', { exact: true }).waitFor();
    check(await input.inputValue() === '需要保留的草稿', 'server failure preserves comment draft');
    check(await page.getByRole('button', { name: '发表评论', exact: true }).isEnabled(), 'server failure permits retry');
    failPost = false;
    await page.getByRole('button', { name: '回复', exact: true }).first().click();
    await page.getByRole('button', { name: '发表评论', exact: true }).click();
    await page.getByText('已提交，正在审核。通过后会自动显示。', { exact: true }).waitFor();
    check(submissions.at(-1).parentId === 1, 'reply submission carries parent ID');
    check(await input.inputValue() === '', 'successful submission clears only submitted draft');
    await input.fill('另一个账号不能看到这个草稿');
    await page.evaluate(() => switchAccount('user_bob'));
    await page.locator('[data-comments-identity]').filter({ hasText: 'user_bob' }).waitFor();
    check(await input.inputValue() === '', 'account switch clears prior account draft');
    await page.evaluate(() => document.dispatchEvent(new Event('pjax:send')));
    check(await page.evaluate(() => listeners.size) === 0, 'PJAX departure removes auth listener');
    await page.evaluate(() => document.dispatchEvent(new Event('pjax:complete')));
    await page.waitForFunction(() => listeners.size === 1);
    check(await page.evaluate(() => listeners.size) === 1, 'PJAX return restores one auth listener');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'comment composer fits mobile viewport');
    await page.goto(base + '/comments-admin/');
    await page.getByText('当前账号没有评论管理权限。', { exact: true }).waitFor();
    check(await page.getByRole('button', { name: '发布', exact: true }).count() === 0, 'non-admin sees no moderation actions');
    check(await page.getByRole('button', { name: '检查 AI 链路', exact: true }).count() === 0, 'non-admin sees no AI chain check');
    await page.evaluate(() => switchAccount('user_admin'));
    await page.getByRole('button', { name: '发布', exact: true }).first().waitFor();
    check(await page.getByText('需要结合上下文判断', { exact: true }).count() === 1, 'administrator sees AI review reason');
    check(await page.getByRole('button', { name: 'AI 复审', exact: true }).count() === 1, 'administrator can request another AI review');
    await page.getByRole('button', { name: '检查 AI 链路', exact: true }).click();
    await page.getByText(/完整调用成功/).waitFor();
    check((await page.locator('[data-comments-diagnosis]').textContent()).includes('deepseek-flash'), 'administrator can trace the Worker moderation chain');
    failDiagnosis = true;
    await page.getByRole('button', { name: '检查 AI 链路', exact: true }).click();
    await page.getByText(/密钥检查失败：返回的模型列表格式无效/).waitFor();
    check(!(await page.locator('[data-comments-diagnosis]').textContent()).includes('密钥可用'), 'invalid model response never claims the key is usable');
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 844 });
      check(await page.locator('.nuo-review-tabs button').evaluateAll(buttons => buttons.every(button => {
        const range = document.createRange(); range.selectNodeContents(button);
        return range.getClientRects().length === 1;
      })), 'review state labels stay on one line at ' + width + 'px');
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'review toolbar fits ' + width + 'px viewport');
    }
    await page.getByRole('button', { name: '已发布', exact: true }).click();
    await page.locator('[data-comment-id="1"]').waitFor();
    check(await page.getByRole('button', { name: '已发布', exact: true }).getAttribute('aria-pressed') === 'true', 'review tabs switch queue state accessibly');
    await page.getByRole('button', { name: '待审核', exact: true }).click();
    await page.locator('[data-comment-id="2"]').waitFor();
    if (process.env.COMMENTS_SCREENSHOTS) {
      fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
      await page.setViewportSize({ width: 1100, height: 800 });
      await page.screenshot({ path: path.join(root, 'test-results/comments-redesign-admin.png'), fullPage: true });
    }
    await page.getByRole('button', { name: '发布', exact: true }).first().click();
    await page.getByText('这个分类暂无评论。', { exact: true }).waitFor();
    check(comments[1].state === 'published', 'administrator publishes pending comment');
    await page.goto(base + '/?signedout=1');
    await page.getByText('登录后加入讨论', { exact: true }).waitFor();
    check(await input.isDisabled(), 'anonymous readers log in before drafting');
    await page.getByRole('button', { name: '登录 / 注册', exact: true }).click();
    check(await page.evaluate(() => loginOptions.forceRedirectUrl === location.origin + location.pathname + location.search), 'login returns to current article and preserves its query');
    await page.getByRole('button',{name:'总结本文与评论',exact:true}).click();
    check(summaryRequests.length===0,'article summary requires login before requesting AI');
    await page.evaluate(()=>switchAccount('user_alice')); await page.locator('[data-comments-identity]').filter({hasText:'user_alice'}).waitFor();
    await page.getByRole('button',{name:'总结本文与评论',exact:true}).click(); await page.locator('.nuo-comment-ai-badge').waitFor();
    check(summaryRequests[0].thread==='/' && Object.keys(summaryRequests[0]).length===1,'summary requests only the article path, never a client-provided article body');
    check(await page.locator('.nuo-comment-body ul li').count()===2 && await page.locator('.nuo-comment-body strong').textContent()==='本文重点','article AI summary renders Markdown');
    const botId=comments.find(item=>item.author.bot).id;
    await page.locator('[data-comment-id="'+botId+'"]').getByRole('button',{name:'继续聊',exact:true}).click(); await input.fill('解释一下第二点'); await page.getByRole('button',{name:'发表评论',exact:true}).click();
    await page.getByText('沿着本文继续解释。',{exact:true}).waitFor();
    check(submissions.at(-1).replyTo===botId && submissions.at(-1).parentId===botId,'article follow-up targets the AI and continues its branch');
    await page.setViewportSize({width:360,height:844});
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'article summary and continued conversation fit mobile');
    if(process.env.COMMENTS_SCREENSHOTS) { fs.mkdirSync(path.join(root,'test-results'),{recursive:true}); await page.locator('[data-nuo-comments]').screenshot({path:path.join(root,'test-results/article-ai-mobile.png')}); }
    if (process.env.COMMENTS_SCREENSHOTS) {
      comments.splice(0); await page.goto(base);
      await page.waitForFunction(() => !document.querySelector('[data-comments-body]').disabled);
      await page.setViewportSize({ width: 1100, height: 800 });
      await page.screenshot({ path: path.join(root, 'test-results/comments-redesign-desktop.png'), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(root, 'test-results/comments-redesign-mobile.png'), fullPage: true });
      await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
      await page.screenshot({ path: path.join(root, 'test-results/comments-redesign-dark.png'), fullPage: true });
    }
    check(errors.length === 0, 'comment UI has no uncaught browser errors');
    console.log(`Comments UI: ${checks} checks passed (local API and auth simulated).`);
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
