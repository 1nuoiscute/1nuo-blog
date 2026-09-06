// Run against a local preview or the deployed site. Leaderboard traffic is mocked;
// no scores or admin records are written to production.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TEST_URL || 'http://127.0.0.1:4000';
let checks = 0;
function check(value, message) { assert(value, message); checks++; console.log('PASS', message); }
async function main() {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    let submissions = [], failSubmit = true;
    await context.route('https://status.1nuo.me/leaderboard', route => {
      if (route.request().method() === 'POST') {
        submissions.push(route.request().postDataJSON());
        return route.fulfill({ status: failSubmit ? 500 : 200, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify([
        { name: '<b>literal</b>', score: 123, date: '2026-09-06' }
      ]) });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    async function go(path) { await page.goto(base + path, { waitUntil: 'domcontentloaded' }); }
    await go('/notes/');
    await page.locator('.nuo-content-tools').waitFor();
    check(await page.evaluate(() => !!window.pjax), 'real PJAX dependency loaded');
    check(await page.locator('.nuo-content-tools [data-action=bookmark]').count() === 1, 'banner notes page has toolbar');
    await page.locator('[data-action=bookmark]').click();
    check(await page.evaluate(() => JSON.parse(localStorage.getItem('nuo:bookmarks:v1'))['/notes'].title) === '笔记', 'bookmark uses actual page title');
    await page.locator('[data-action=share]').click();
    await page.keyboard.press('Tab');
    check(await page.evaluate(() => document.activeElement.dataset.shareAction) === 'download', 'share modal wraps keyboard focus');
    await page.keyboard.press('Shift+Tab');
    check(await page.evaluate(() => document.activeElement.dataset.shareAction) === 'close', 'reverse focus wraps inside modal');
    await page.keyboard.press('Escape');
    check(await page.locator('.nuo-share-modal').count() === 0, 'share modal closes');

    await go('/notes/circuit-analysis/ch1/l1-intro.html');
    await page.locator('.nuo-reading-progress').waitFor({state:'attached'});
    const notePath = await page.evaluate(() => location.pathname.replace(/\/$/, ''));
    await page.evaluate(() => {
      const el = document.getElementById('article-container');
      scrollTo(0, scrollY + el.getBoundingClientRect().top + (el.offsetHeight - innerHeight * .55) * .4 - innerHeight * .25);
    });
    await page.waitForTimeout(350);
    const before = await page.evaluate(path => JSON.parse(localStorage.getItem('nuo:reading:v1'))[path], notePath);
    check(before && before.progress > .3 && before.progress < .5, 'note reading progress is saved');
    await page.locator('.nuo-content-tools a[href="/favorites/"]').click();
    await page.locator('.nuo-library-page').waitFor();
    check(await page.locator('.nuo-reading-progress').count() === 0, 'PJAX departure clears progress indicator');
    check(await page.evaluate(path => JSON.parse(localStorage.getItem('nuo:reading:v1'))[path].title, notePath) === before.title, 'PJAX does not overwrite old note metadata');
    const continuing = page.locator('[data-library-section=continuing] .nuo-library-item-title');
    check((await continuing.first().getAttribute('href')).includes('resume=1'), 'continue link requests restoration');
    await continuing.first().click();
    await page.locator('.nuo-reading-progress').waitFor({state:'attached'});
    await page.waitForTimeout(3300);
    check(await page.evaluate(() => scrollY > 100), 'continue reading restores scroll position');
    await go('/notes/');
    check(await page.locator('.nuo-reading-progress').count() === 0, 'note directory has no reading progress');

    const index = await (await context.request.get(base + '/search.json')).json();
    check(index.some(item => item.url.includes('/notes/') && item.content.includes('戴维南')), 'search includes note body text');
    check(!index.some(item => /^\/(rate|explore)\//.test(item.url)), 'search excludes admin and app resources');

    await go('/explore/game2048-app/');
    await page.locator('.lb-h').click();
    await page.locator('.lb-name').waitFor();
    check(await page.locator('.lb-name').textContent() === '<b>literal</b>' && await page.locator('.lb-name b').count() === 0, 'leaderboard renders remote HTML as literal text');
    await page.evaluate(() => { g.s = 5000; g.g[0][0] = {v:2048,i:100}; g.c(); });
    await page.locator('#continue-game').click();
    check(!await page.locator('#go').evaluate(el => el.classList.contains('show')), '2048 continues without repeating win dialog');
    await page.evaluate(() => { g.o = true; g.over('结束', '测试'); });
    await page.locator('#lb-input').fill('test');
    await page.locator('#lb-form button').click();
    await page.getByText('提交失败，请重试。', { exact: true }).waitFor();
    check(await page.locator('#lb-input').inputValue() === 'test', 'HTTP 500 preserves nickname and permits retry');
    check(submissions[0].maxTile === 2048 && submissions[0].score === 5000, 'maxTile and score are distinct values');
    failSubmit = false;
    await page.locator('#lb-form button').click();
    await page.getByText('已提交', { exact: true }).waitFor();
    check(await page.locator('#lb-form button').isDisabled(), 'successful score cannot be submitted twice');
    await page.evaluate(() => { g.restart(); g.s = 8; g.o = true; g.over('结束', '第二局'); });
    check(await page.locator('#lb-input').count() === 1, 'second game has exactly one nickname input');

    await go('/explore/tarot-app/');
    await page.getByRole('button', { name: '三张', exact: true }).click();
    await page.locator('#drawBtn').click();
    await page.locator('.position-card').first().waitFor();
    check(await page.locator('.position-card').count() === 3, 'tarot three-card spread renders');
    check(await page.evaluate(() => {
      const labels = [...document.querySelectorAll('.position-name')].map(el => el.textContent.includes('(逆)'));
      const meanings = [...document.querySelectorAll('#multiResult .result > div')].map(el => el.textContent.includes('（逆位）'));
      return labels.every((value, i) => value === meanings[i]);
    }), 'tarot orientation matches each explanation');

    let failData = true;
    await page.route('**/rate/rate_data.json', route => failData ? route.fulfill({ status: 500, body: '{}' }) : route.continue());
    await go('/rate/');
    await page.locator('#rate-load-retry').waitFor({ state: 'visible' });
    failData = false;
    await page.locator('#rate-load-retry').click();
    await page.locator('.nuo-card').first().waitFor();
    check(await page.locator('.nuo-card').count() === 11, 'rate data retries after HTTP failure');
    await page.locator('#filter-search').fill('NO_MATCH_123');
    check(await page.locator('#global-avg-score').innerText() === '—', 'empty filter clears average');
    check(await page.locator('#cards-container').innerText() === '没有符合条件的景点。', 'empty filter has explicit message');
    await page.locator('#filter-search').fill('');
    await page.locator('#btn-map').click();
    await page.waitForTimeout(600);
    // Key-free preview must recover after config is supplied. No actual map writes.
    if (base.includes('127.0.0.1')) {
      await page.locator('#travel-map-retry').waitFor({ state: 'visible' });
      check(await page.locator('#travel-map-list li').count() === 11, 'map failure preserves place list');
      let failSdk = true;
      await page.route('https://map.qq.com/api/gljs*', route => failSdk ? route.abort() : route.fulfill({
        contentType: 'application/javascript', body: `window.TMap={
          LatLng:class{constructor(lat,lng){this.lat=lat;this.lng=lng}},
          Map:class{constructor(){window.testMapCount=(window.testMapCount||0)+1}fitBounds(){}setCenter(){}setZoom(){}resize(){}destroy(){}getCenter(){return {}}},
          MultiMarker:class{constructor(o){window.testMarkerCount=o.geometries.length}on(){}},
          MarkerStyle:class{},LatLngBounds:class{extend(){}},
          InfoWindow:class{close(){}open(){}setPosition(){}setContent(){}}
        };`
      }));
      await page.evaluate(() => { window.__NUO_TENCENT_LBS__ = {key:'isolated-test'}; });
      await page.locator('#travel-map-retry').click();
      await page.getByText(/地图暂时无法加载：地图 SDK 加载失败/).waitFor();
      failSdk = false;
      await page.locator('#travel-map-retry').click();
      await page.getByText(/已在腾讯地图标记 11 \/ 11/).waitFor();
      check(await page.evaluate(() => testMarkerCount === 11 && testMapCount === 1), 'map SDK retries successfully after network failure');
    } else {
      await page.getByText(/已在腾讯地图标记 11 \/ 11/).waitFor({timeout:25000});
      check(true, 'deployed map initializes with real SDK and all places');
    }

    await page.locator('.nuo-content-tools a[href="/favorites/"]').click();
    await page.locator('.nuo-library-page').waitFor();
    await page.locator('.nuo-library-item-title').filter({hasText:'1nuo 评测'}).first().click();
    await page.locator('.nuo-card').first().waitFor();
    check(await page.locator('.nuo-card').count() === 11, 'rate page can be revisited after PJAX departure');

    await go('/rate/admin/');
    await page.locator('#in-id').waitFor();
    const id = await page.locator('#in-id').inputValue();
    await page.evaluate(() => { generateJSON(true); generateJSON(true); });
    check(await page.locator('#in-id').inputValue() === id && !!id, 'admin record id stays stable across previews');
    check(await page.evaluate(() => { try {validateRecord(); return false;} catch {return true;} }), 'admin rejects missing coordinates before saving');
    await page.locator('#in-name').fill('验证记录');
    await page.locator('#in-lat').fill('0'); await page.locator('#in-lng').fill('0');
    check(await page.evaluate(() => { validateRecord(); return true; }), 'admin accepts valid zero coordinates');

    await page.setViewportSize({width:390,height:844});
    await go('/notes/');
    await page.locator('.nuo-content-tools').waitFor();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'mobile notes page has no horizontal overflow');
    fs.mkdirSync('docs/reviews/validation', {recursive:true});
    await page.waitForTimeout(1200);
    await page.screenshot({path:'docs/reviews/validation/mobile-notes.png'});
    console.log('PAGE_ERRORS', JSON.stringify(errors));
    check(errors.length === 0, 'no uncaught browser errors');
    console.log(`PASS: ${checks} browser checks against ${base}`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
