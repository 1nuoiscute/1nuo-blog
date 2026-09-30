// Run against a local preview or the deployed site. Leaderboard traffic is mocked;
// no scores or admin records are written to production.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_URL || 'http://127.0.0.1:4000';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Browser tests only run on loopback, never production');
let checks = 0;
function check(value, message) { assert(value, message); checks++; console.log('PASS', message); }
async function main() {
  const browser = await chromium.launch({ ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}), headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === new URL(base).origin) return route.continue();
      if (url.pathname.endsWith('/pjax.min.js')) return route.fulfill({ contentType:'application/javascript', path:require.resolve('pjax/pjax.min.js') });
      // The theme's subtitle effect needs the real Typed library; stub only its API.
      if (/typed/i.test(url.pathname)) return route.fulfill({ contentType:'application/javascript', body:'window.Typed=function Typed(el,opts){this.el=el;this.opts=opts||{};};window.Typed.prototype.start=function(){};window.Typed.prototype.stop=function(){};window.Typed.prototype.destroy=function(){};' });
      // All other remote requests are isolated. Specific mocks below override this route.
      if (route.request().resourceType() === 'script') return route.fulfill({ contentType:'application/javascript', body:'' });
      if (route.request().resourceType() === 'stylesheet') return route.fulfill({ contentType:'text/css', body:'' });
      return route.abort();
    });
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

    await go('/explore/scl90-app/');
    await page.locator('#startBtn').click();
    const answer = page.locator('.option-btn').nth(1);
    await answer.focus(); await page.keyboard.press('Space');
    check(await answer.getAttribute('aria-pressed') === 'true', 'SCL90 selects by keyboard');
    await page.locator('#nextBtn').click(); await page.locator('#prevBtn').click();
    check(await page.locator('.option-btn').nth(1).getAttribute('aria-pressed') === 'true', 'SCL90 restores answer after navigation');
    for (const app of ['bingo', 'bingo2', 'bingo3', 'bingo4', 'bingo5']) {
      await go(`/explore/${app}-app/`);
      await page.locator('.cell').first().focus(); await page.keyboard.press('Space');
      check(await page.locator('.cell').first().getAttribute('aria-pressed') === 'true' && await page.evaluate(() => document.activeElement.dataset.i === '0'), `${app} keyboard toggle preserves focus`);
      await page.locator('#shareBtn').click();
      check(await page.evaluate(() => document.activeElement.id === 'closeModalBtn'), `${app} dialog receives initial focus`);
      await page.keyboard.press('Shift+Tab');
      check(await page.evaluate(() => document.activeElement.id === 'downloadBtn'), `${app} dialog reverse Tab wraps`);
      await page.keyboard.press('Tab');
      check(await page.evaluate(() => document.activeElement.id === 'closeModalBtn'), `${app} dialog forward Tab wraps`);
      await page.keyboard.press('Escape');
      check(await page.evaluate(() => document.activeElement.id === 'shareBtn') && !await page.locator('#shareModal').evaluate(el => el.classList.contains('active')), `${app} Escape closes and restores focus`);
    }
    await go('/explore/draw-app/');
    await page.locator('#jar').focus(); await page.keyboard.press('Enter');
    await page.evaluate(() => { draw(); draw(); });
    await page.waitForFunction(() => !drawing);
    check(await page.evaluate(() => usedIndices.length === 1), 'fortune keyboard and repeated calls consume one draw');

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
    await page.locator('#in-name').fill('打卡记录');
    check(await page.evaluate(() => { validateRecord(); return true; }), 'quick check-in saves without coordinates or scores');
    await page.locator('#in-overall').selectOption('4');
    await page.locator('#in-quick-note').fill('一句话感受');
    const quick = await page.evaluate(() => JSON.parse(generateJSON(true)));
    check(quick.quick_checkin.overall === 4 && quick.quick_checkin.note === '一句话感受', 'quick check-in keeps optional overall score and note');
    check(!('final_score' in quick) && Object.keys(quick.scores).length === 0, 'quick check-in defers detailed scores');
    check(!('coordinates' in quick), 'quick check-in omits coordinates it does not have');
    await page.locator('.score-item .in-base').first().fill('8');
    await page.locator('#in-name').fill('验证记录');
    await page.locator('#in-lat').fill('34.8');
    check(await page.evaluate(() => { try {validateRecord(); return false;} catch {return true;} }), 'admin rejects partial coordinates before saving');
    await page.locator('#in-lng').fill('110');
    check(await page.evaluate(() => { validateRecord(); return true; }), 'admin accepts a complete coordinate pair');
    await page.locator('#in-lat').fill('91');
    check(await page.evaluate(() => { try {validateRecord(); return false;} catch {return true;} }), 'admin rejects out-of-range coordinates before saving');
    await page.locator('#in-lat').fill('0'); await page.locator('#in-lng').fill('0');
    check(await page.evaluate(() => { validateRecord(); return true; }), 'admin accepts valid zero coordinates');

    await go('/graph/');
    await page.locator('[data-graph-canvas] > svg').waitFor();
    const nodeCount = await page.locator('.nuo-graph-node').count();
    check(nodeCount > 10, 'content graph renders content nodes');
    check(await page.locator('.nuo-graph-edges path').count() > 0, 'content graph renders topic links');
    check(await page.locator('[data-graph-stats] .nuo-graph-stat').count() === 3, 'content graph shows data overview');
    check(await page.locator('[data-graph-skeleton]').isHidden(), 'loading skeleton is replaced by the graph');
    fs.mkdirSync('test-results', {recursive:true});
    await page.screenshot({path:'test-results/content-graph.png'});
    await page.locator('[data-graph-canvas]').screenshot({path:'test-results/content-graph-canvas.png'});
    await page.locator('.nuo-graph-kind').first().click();
    check(await page.locator('.nuo-graph-node').count() < nodeCount, 'content graph filters by content type');
    check((await page.locator('[data-graph-status]').textContent()).includes('节点'), 'content graph reports the filtered scope');
    await page.locator('.nuo-graph-kind').first().click();
    await page.locator('[data-graph-action=in]').click();
    await page.locator('[data-graph-action=reset]').click();
    check(await page.locator('.nuo-graph-node').count() === nodeCount, 'view controls do not drop nodes');
    check(await page.locator('.nuo-graph-controls .nuo-graph-icon').count() === 4, 'view controls use vector icons');
    await page.locator('[data-graph-action=labels]').click();
    check(await page.locator('.nuo-graph-node.is-labeled').count() === nodeCount, 'label toggle reveals every node label');
    await page.locator('[data-graph-action=labels]').click();
    await page.locator('.nuo-graph-node').first().locator('circle.nuo-graph-dot').hover();
    check(await page.locator('[data-graph-card]').isVisible(), 'hovering a node shows its detail card');
    check(await page.locator('.nuo-graph-node.is-dim').count() > 0, 'hovering dims unrelated nodes');
    // Both themes are checked on their own; dark mode is not inferred from light.
    const lightSurface = await page.evaluate(() => getComputedStyle(document.querySelector('.nuo-graph-page')).getPropertyValue('--graph-surface').trim());
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(200);
    const darkSurface = await page.evaluate(() => getComputedStyle(document.querySelector('.nuo-graph-page')).getPropertyValue('--graph-surface').trim());
    check(lightSurface !== darkSurface && darkSurface.length > 0, 'graph tokens switch with the colour theme');
    await page.locator('[data-graph-canvas]').screenshot({path:'test-results/content-graph-dark.png'});
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForTimeout(150);
    await page.locator('.nuo-graph-node').first().focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(url => !url.pathname.startsWith('/graph/'));
    check(!new URL(page.url()).pathname.startsWith('/graph/'), 'content graph node opens a page by keyboard');
    await go('/graph/');
    await page.locator('.nuo-graph-topic').nth(1).click();
    const filtered = await page.locator('.nuo-graph-node').count();
    check(filtered > 0 && filtered < nodeCount, 'content graph filters by topic');
    check((await page.locator('[data-graph-status]').textContent()).includes('主题'), 'content graph reports the active topic');

    // Site navigation is PJAX-based, so the graph must render after an in-page switch too.
    await go('/');
    const graphMenuItem = page.locator('#nav a.site-page[href="/graph/"]').first();
    if (!(await graphMenuItem.isVisible())) await page.locator('#nav .site-page.group', { hasText: '更多' }).first().hover();
    await graphMenuItem.click();
    await page.locator('[data-graph-canvas] > svg').waitFor();
    check(await page.locator('.nuo-graph-node').count() > 10, 'content graph renders after a PJAX navigation');
    check(await page.evaluate(() => !!window.pjax), 'PJAX stayed active across the graph navigation');

    await go('/2026/09/30/site-update-2026-09-30/');
    await page.locator('.nuo-content-tools [data-action=reading-mode]').click();
    check(await page.evaluate(() => document.body.classList.contains('nuo-reading-mode')), 'reading mode hides the sidebar chrome');
    check(await page.evaluate(() => document.getElementById('sidebar').offsetParent === null), 'reading mode actually hides the sidebar element');
    await page.locator('[data-action=font-larger]').click();
    const scaled = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('article-container')).fontSize));
    check(scaled > 17, 'reading mode increases the article font size');
    await page.screenshot({path:'test-results/reading-mode.png'});
    await page.keyboard.press('Escape');
    check(!await page.evaluate(() => document.body.classList.contains('nuo-reading-mode')), 'Escape leaves reading mode');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('.nuo-content-tools [data-action=reading-mode]').click();
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('.nuo-content-tools [data-action=reading-mode]').waitFor();
    check(await page.evaluate(() => document.body.classList.contains('nuo-reading-mode')), 'reading mode preference survives a reload');
    await page.keyboard.press('Escape');
    await go('/rate/');
    check(!await page.evaluate(() => document.body.classList.contains('nuo-reading-mode')), 'reading mode does not apply to non-article pages');

    await page.setViewportSize({width:390,height:844});
    await go('/graph/');
    await page.locator('[data-graph-canvas] > svg').waitFor();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'content graph has no horizontal overflow on mobile');
    const touch = await page.locator('.nuo-graph-btn').first().boundingBox();
    check(touch && touch.height >= 44, 'graph controls meet the 44px touch target on mobile');
    await go('/notes/');
    await page.locator('.nuo-content-tools').waitFor();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'mobile notes page has no horizontal overflow');
    fs.mkdirSync('test-results', {recursive:true});
    await page.waitForTimeout(1200);
    await page.screenshot({path:'test-results/mobile-notes.png'});
    console.log('PAGE_ERRORS', JSON.stringify(errors));
    check(errors.length === 0, 'no uncaught browser errors');
    console.log(`PASS: ${checks} browser checks against ${base}`);
  } catch (error) {
    fs.mkdirSync('test-results', {recursive:true});
    fs.writeFileSync('test-results/failure.txt', String(error.stack || error));
    for (const [i, page] of browser.contexts().flatMap(context => context.pages()).entries()) {
      await page.screenshot({ path:path.join('test-results', `failure-${i}.png`), fullPage:true }).catch(() => {});
    }
    throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
