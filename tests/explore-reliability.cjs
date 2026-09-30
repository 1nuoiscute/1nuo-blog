'use strict';
// Scoped, dependency-free behavior checks: node tests/explore-reliability.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
let checks = 0;
function check(value, message) { assert(value, message); checks++; }
function boot(app, data) {
  const html = fs.readFileSync(path.join(root, 'source/explore', app + '-app/index.html'), 'utf8');
  const nodes = {}, timers = new Map(); let nextTimer = 0;
  const document = { activeElement: null, events: {}, addEventListener(type, fn) { this.events[type] = fn; } };
  class Element {
    constructor(tag = 'div') { this.tagName = tag.toUpperCase(); this.children = []; this.events = {}; this.dataset = {}; this.attrs = {}; this.style = {}; this.disabled = false; this.isConnected = true; this.textContent = ''; this.className = ''; }
    get classList() { const self = this; return { add(c) { if (!self.className.split(' ').includes(c)) self.className += ' ' + c; }, remove(c) { self.className = self.className.split(' ').filter(x => x !== c).join(' '); }, contains(c) { return self.className.split(' ').includes(c); }, toggle(c, yes) { if (yes) this.add(c); else this.remove(c); } }; }
    set innerHTML(value) {
      this._html = value; this.children = [];
      for (const m of value.matchAll(/<(button|div)\b([^>]*)>/g)) {
        if (!/class="(?:cell|option-btn)/.test(m[2])) continue;
        const child = new Element(m[1]);
        for (const attr of m[2].matchAll(/([\w-]+)="([^"]*)"/g)) child.setAttribute(attr[1], attr[2]);
        this.children.push(child);
      }
    }
    get innerHTML() { return this._html || ''; }
    setAttribute(key, value) { this.attrs[key] = String(value); if (key === 'class') this.className = value; if (key.startsWith('data-')) this.dataset[key.slice(5)] = value; }
    getAttribute(key) { return this.attrs[key]; }
    appendChild(child) { this.children.push(child); }
    addEventListener(type, fn) { this.events[type] = fn; }
    click() { if (!this.disabled && this.events.click) this.events.click.call(this, { target: this }); }
    focus() { document.activeElement = this; }
    remove() { this.isConnected = false; }
    querySelectorAll(selector) { return this.children.filter(x => x.className.split(' ').includes(selector.slice(1))); }
  }
  document.getElementById = id => nodes[id] ||= Object.assign(new Element(), { id });
  document.createElement = tag => {
    const el = new Element(tag);
    if (tag === 'canvas') {
      el.getContext = () => new Proxy({ measureText: t => ({ width: t.length * 8 }) }, { get: (o, k) => k in o ? o[k] : () => {} });
      el.toDataURL = () => 'data:image/png;base64,test';
    }
    return el;
  };
  document.querySelectorAll = selector => Object.values(nodes).flatMap(n => n.querySelectorAll(selector));
  document.querySelector = selector => document.querySelectorAll('.cell').find(n => n.dataset.i === selector.match(/data-i="(\d+)"/)[1]);
  document.body = new Element('body');
  const context = { document, window: { matchMedia: () => ({ matches: false }) }, alert() {}, setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; }, clearTimeout(id) { timers.delete(id); } };
  if (data !== undefined) context.CARDS = data;
  vm.createContext(context);
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) if (!/src=/.test(m[1])) vm.runInContext(m[2], context);
  return { html, nodes, document, context, timers, flush(delay) { for (const [id, timer] of [...timers]) if (delay === undefined || timer.delay === delay) { timers.delete(id); timer.fn(); } } };
}
const draw = boot('draw');
check(/<button[^>]*id="jar"[^>]*aria-label="摇一签"/.test(draw.html), 'fortune jar is a named native keyboard button');
draw.context.draw(); draw.context.draw(); draw.context.draw();
check(draw.timers.size === 1 && draw.nodes.jar.disabled && draw.nodes.drawBtn.disabled, 'repeated fortune invocations enqueue only one timer and disable both triggers');
draw.flush();
check(draw.context.usedIndices.length === 1 && !draw.nodes.jar.disabled && !draw.nodes.drawBtn.disabled, 'one fortune consumed and busy lock released');
draw.context.draw(); draw.flush();
check(draw.context.usedIndices.length === 2, 'fortune can be drawn again after completion');
for (const data of [undefined, { cards: [] }, { cards: {} }]) {
  const tarot = boot('tarot', data);
  check(tarot.nodes.drawBtn.disabled && !tarot.nodes.retryBtn.hidden && /重试/.test(tarot.nodes.dataStatus.textContent), 'missing, empty or invalid tarot data has recoverable visible state');
  tarot.nodes.deck.click(); tarot.nodes.drawBtn.click();
  check(tarot.timers.size === 0, 'empty tarot deck never schedules crashing render');
  tarot.nodes.retryBtn.click(); tarot.nodes.retryBtn.click();
  check(tarot.document.body.children.length === 1 && tarot.nodes.retryBtn.disabled, 'retry has one in-flight script');
  tarot.document.body.children[0].onerror();
  check(!tarot.nodes.retryBtn.disabled && tarot.nodes.drawBtn.disabled, 'failed script restores retry');
  tarot.nodes.retryBtn.click(); tarot.flush(10000);
  check(!tarot.nodes.retryBtn.disabled && tarot.nodes.drawBtn.disabled, 'hung script times out and restores retry');
  tarot.nodes.retryBtn.click();
  tarot.context.CARDS = { cards: [] };
  tarot.document.body.children.at(-1).onload();
  check(!tarot.nodes.retryBtn.disabled && tarot.nodes.drawBtn.disabled, 'successful but empty script remains recoverable');
  tarot.nodes.retryBtn.click();
  tarot.context.CARDS = { cards: [{ name: 'The Fool', img: 'm00.jpg', meanings: { upright: ['UP'], reversed: ['DOWN'] } }] };
  tarot.document.body.children.at(-1).onload();
  check(!tarot.nodes.drawBtn.disabled && tarot.nodes.retryBtn.hidden, 'compatible JS cards data recovers without reload');
  tarot.nodes.deck.click(); tarot.nodes.deck.click();
  check(tarot.timers.size === 1, 'tarot repeated clicks share busy guard');
  tarot.flush(600);
  check(tarot.nodes.singleResult.innerHTML.includes('m00.jpg') && !tarot.nodes.drawBtn.disabled, 'recovered tarot draws real card');
}
const scl = boot('scl90');
scl.nodes.startBtn.click();
let options = scl.nodes.questionArea.children;
check(options.length === 5 && options.every(x => x.tagName === 'BUTTON' && x.getAttribute('aria-pressed') === 'false'), 'SCL90 choices are native named buttons with initial state');
options[1].click(); options[3].click();
check(options.filter(x => x.getAttribute('aria-pressed') === 'true').length === 1 && options[3].getAttribute('aria-pressed') === 'true', 'SCL90 selection is mutually exclusive');
scl.nodes.nextBtn.click(); scl.nodes.prevBtn.click();
check(scl.nodes.questionArea.children[3].getAttribute('aria-pressed') === 'true', 'SCL90 answer state survives question navigation');
for (const app of ['bingo', 'bingo2', 'bingo3', 'bingo4', 'bingo5']) {
  const bingo = boot(app), cells = () => bingo.nodes.board.children;
  check(cells().length === 25 && cells().every(x => x.tagName === 'BUTTON' && x.getAttribute('aria-pressed') === 'false'), app + ' renders 25 semantic toggle buttons');
  cells()[0].click();
  check(cells()[0].getAttribute('aria-pressed') === 'true' && bingo.document.activeElement === cells()[0], app + ' toggle restores focus after rerender');
  for (let i = 1; i < 5; i++) cells()[i].click();
  check(cells().slice(0, 5).every(x => x.classList.contains('bingo-line')), app + ' bingo winning line unchanged');
  bingo.nodes.shareBtn.focus(); bingo.nodes.shareBtn.click();
  check(bingo.nodes.downloadBtn.href.startsWith('data:image/png') && bingo.document.activeElement === bingo.nodes.closeModalBtn, app + ' canvas export opens focused dialog');
  const key = (name, shiftKey = false) => bingo.document.events.keydown({ key: name, shiftKey, preventDefault() {} });
  key('Tab', true);
  check(bingo.document.activeElement === bingo.nodes.downloadBtn, app + ' reverse Tab wraps');
  key('Tab');
  check(bingo.document.activeElement === bingo.nodes.closeModalBtn, app + ' forward Tab wraps');
  key('Escape');
  check(!bingo.nodes.shareModal.classList.contains('active') && bingo.document.activeElement === bingo.nodes.shareBtn, app + ' Escape closes and returns focus');
  bingo.nodes.resetBtn.click();
  check(cells().every(x => x.getAttribute('aria-pressed') === 'false'), app + ' reset clears semantic state');
  check(bingo.html.includes('prefers-reduced-motion'), app + ' honors reduced motion');
}
console.log(`PASS: ${checks} scoped explore reliability behavior checks`);
