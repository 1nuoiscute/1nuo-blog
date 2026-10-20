'use strict';

// Integration checks exercise the real page, scripts and PJAX with an isolated
// Clerk contract stub. They do not create users or prove live email/DNS setup.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { marked } = require('marked');
const { buildConfig } = require('../scripts/clerk-config');
const root = path.resolve(__dirname, '..');
const localBrowsers = path.join(root, 'node_modules/.cache/ms-playwright');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(localBrowsers)) process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowsers;
const { chromium } = require('playwright');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const account = marked.parse(read('source/account/index.md').replace(/^---[\s\S]*?---\s*/, ''));
const key = 'pk_test_' + Buffer.from('fixture.clerk.accounts.dev$').toString('base64');
let checks = 0;
function check(value, message) { assert(value, message); checks++; console.log('PASS', message); }
check(buildConfig({}).data.includes('"publishableKey":""'), 'unconfigured builds are valid');
check(!buildConfig({ CLERK_SECRET_KEY: 'private-fixture' }).data.includes('private-fixture'), 'private environment values never enter public config');
assert.throws(() => buildConfig({ CLERK_PUBLISHABLE_KEY: 'sk_test_fixture' })); checks++;
check(read('themes/butterfly/_config.yml').includes('账号: /account/'), 'account has a theme navigation entry');
const routes = JSON.parse(read('vercel.json')).routes;
check(routes.some(route => route.src === '/account(?:/.*)?' && route.headers['X-Robots-Tag'].includes('noindex')), 'account has a noindex response header');

const mock = `
window.fixture = { mounts: [], unmounts: [], listeners: new Set(), options: null };
window.Clerk = {
  isSignedIn: false,
  async load(options) {
    if (!window.__internal_ClerkUICtor) throw Error('UI bundle must load first');
    fixture.options = options;
  },
  mountSignIn(node, props) { fixture.mounts.push('signin'); fixture.props = props; node.innerHTML = '<button id="fixture-login">模拟注册 / 登录</button>'; },
  unmountSignIn(node) { fixture.unmounts.push('signin'); node.replaceChildren(); },
  mountUserProfile(node) { fixture.mounts.push('profile'); node.innerHTML = '<div id="fixture-profile">个人资料 / 账号安全</div>'; },
  unmountUserProfile(node) { fixture.unmounts.push('profile'); node.replaceChildren(); },
  addListener(fn) { fixture.listeners.add(fn); fn(); return () => fixture.listeners.delete(fn); },
  async signOut() { if (fixture.failSignout) throw Error('offline'); this.isSignedIn = false; fixture.listeners.forEach(fn => fn()); }
};
window.fixtureSetSignedIn = value => { Clerk.isSignedIn = value; fixture.listeners.forEach(fn => fn()); };
`;

function html(isAccount) {
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>账号测试</title><link rel="stylesheet" href="/css/account.css"></head><body>' +
    '<nav><a href="/account/">账号</a> <a href="/">首页</a></nav><main id="main">' + (isAccount ? account : '<h1>博客首页</h1>') + '</main>' +
    '<script src="/pjax.js"></script><script>window.pjax=new Pjax({elements:"a",selectors:["title","#main"],cacheBust:false});</script>' +
    '<script defer src="/js/nuo-account.js"></script></body></html>';
}

async function main() {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const files = { '/js/nuo-account.js': 'source/js/nuo-account.js', '/css/account.css': 'source/css/account.css' };
    if (files[pathname] || pathname === '/pjax.js') {
      res.setHeader('Content-Type', pathname.endsWith('.css') ? 'text/css' : 'application/javascript');
      return res.end(pathname === '/pjax.js' ? fs.readFileSync(require.resolve('pjax/pjax.min.js')) : read(files[pathname]));
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html(pathname === '/account/'));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    let configured = false, failSdk = false, requests = 0;
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/js/clerk-config.js') {
        return route.fulfill({ contentType: 'application/javascript', body: buildConfig(configured ? { CLERK_PUBLISHABLE_KEY: key } : {}).data });
      }
      if (url.hostname === 'fixture.clerk.accounts.dev') {
        requests++;
        if (failSdk) return route.abort();
        return route.fulfill({ contentType: 'application/javascript', body: url.pathname.includes('/@clerk/ui@1/') ? 'window.__internal_ClerkUICtor = function(){};' : mock });
      }
      if (url.origin === base) return route.continue();
      return route.abort();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const status = page.locator('[data-account-status]');
    await page.goto(base);
    check(requests === 0, 'ordinary pages do not load Clerk');
    await page.getByRole('link', { name: '账号', exact: true }).click();
    await page.getByText('账号功能即将开放', { exact: false }).waitFor();
    check(requests === 0, 'missing configuration makes no Clerk requests');
    check(await page.locator('[data-account-widget]').textContent() === '', 'unconfigured page contains no fake login form');

    configured = true; failSdk = true;
    await page.goto(base + '/account/');
    await page.getByRole('button', { name: '重新加载' }).waitFor();
    check((await status.textContent()).includes('连接不上'), 'SDK connection failure has an actionable message');
    failSdk = false;
    await page.getByRole('button', { name: '重新加载' }).click();
    await page.locator('#fixture-login').waitFor();
    check(await page.evaluate(() => fixture.props.routing === 'hash' && fixture.props.withSignUp), 'static routes support combined sign-in/sign-up and hash routing');
    check(await page.evaluate(() => fixture.options.ui.ClerkUI === window.__internal_ClerkUICtor), 'Core 3 UI bundle passed to Clerk.load');
    check(await page.evaluate(() => fixture.listeners.size === 1 && fixture.mounts.length === 1), 'immediate listener notification does not duplicate the component');
    await page.evaluate(() => fixtureSetSignedIn(true));
    await page.locator('#fixture-profile').waitFor();
    check(await page.evaluate(() => fixture.unmounts.includes('signin')), 'sign-in form is cleaned up on authentication');
    await page.evaluate(() => { fixture.failSignout = true; });
    await page.getByRole('button', { name: '退出登录' }).click();
    await page.getByText('退出失败，请重试。', { exact: true }).waitFor();
    check(await page.getByRole('button', { name: '退出登录' }).isEnabled(), 'failed sign-out can be retried');
    await page.evaluate(() => { fixture.failSignout = false; });
    await page.getByRole('button', { name: '退出登录' }).click();
    await page.locator('#fixture-login').waitFor();
    check(await page.getByRole('button', { name: '退出登录' }).isHidden(), 'sign-out returns to login controls');

    await page.getByRole('link', { name: '首页', exact: true }).click();
    await page.getByRole('heading', { name: '博客首页' }).waitFor();
    check(await page.evaluate(() => fixture.listeners.size === 0), 'PJAX departure removes Clerk listener');
    const beforeReturn = requests;
    await page.getByRole('link', { name: '账号', exact: true }).click();
    await page.locator('#fixture-login').waitFor();
    check(requests === beforeReturn, 'PJAX return reuses SDK without downloading again');
    check(await page.evaluate(() => fixture.listeners.size === 1), 'PJAX return restores exactly one listener');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile account shell fits viewport');
    check(errors.length === 0, 'browser has no uncaught script errors');
    console.log(`Account integration: ${checks} checks passed (Clerk simulated; no real accounts created).`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
