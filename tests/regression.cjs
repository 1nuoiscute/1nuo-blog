'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let checks = 0;
function check(value, message) { assert(value, message); checks++; }
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
for (const file of walk(path.join(root, 'source'))) {
  if (!/\.(js|html|md)$/.test(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const scripts = file.endsWith('.js') ? [text] : [...text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m => !/\bsrc\s*=|type\s*=\s*["'](?:application|text)\/(?:ld\+)?json/.test(m[1])).map(m => m[2]);
  for (const source of scripts) if (source.trim()) { new vm.Script(source, { filename: file }); checks++; }
  if (file.includes(`${path.sep}explore${path.sep}`)) {
    for (const frame of text.matchAll(/<iframe\b[^>]*>/g)) check(/\btitle="[^"]+"/.test(frame[0]), 'iframe needs a title');
  }
}

// Test actual render functions, using deterministic random values.
let nodes = {};
const node = id => nodes[id] ??= { innerHTML: '', addEventListener() {}, appendChild() {} };
let values = [.1, .9, .1, .9, .1];
let math = Object.create(Math); math.random = () => values.shift();
let context = { document: { getElementById: node, createElement: () => node('button') }, Math: math };
let source = read('source/explore/tarot-app/index.html').match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/\}\)\(\);\s*$/, 'globalThis.renderTest = showMulti; })();');
vm.runInNewContext(source, context);
context.renderTest([{ name: 'The Fool', img: 'm00.jpg', meanings: { upright: ['UPRIGHT'], reversed: ['REVERSED'] } }]);
check(nodes.multiResult.innerHTML.includes('(逆)') && nodes.multiResult.innerHTML.includes('REVERSED'), 'tarot label and explanation agree');
check(values.length === 4, 'orientation sampled exactly once per card');

const game = read('source/explore/game2048-app/index.html');
source = game.slice(game.indexOf('const S=4;'), game.indexOf('let g;')) + 'globalThis.TestG=G;';
context = {}; vm.runInNewContext(source, context);
let g = Object.create(context.TestG.prototype);
g.n = 1;
let merged = g.slide([2, 2, 2, 2].map((v, i) => ({ v, i })));
assert.deepEqual(Array.from(merged.out, x => x ? x.v : 0), [4, 4, 0, 0]); checks++;
check(merged.gained === 8, '2048 merge score');
g.g = Array.from({ length: 4 }, () => Array(4).fill(0)); g.g[0][0] = { v: 2048 };
g.save = () => {}; let wins = 0; g.over = () => wins++;
g.c(); g.c(); check(wins === 1, 'winning overlay shown once');
g.g = [[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]].map(r => r.map(v => ({v})));
g.c(); check(g.o === true, 'game over still detected after winning');

const rate = read('source/rate/index.md');
source = rate.slice(rate.indexOf('  function renderAverageBarChart('), rate.indexOf('  function renderCards('));
let average = { innerText: '9.1' }, cleared = false;
context = { document: { getElementById: () => average }, myChart: { clear() { cleared = true; } } };
vm.runInNewContext(source, context); context.renderAverageBarChart([]);
check(average.innerText === '—' && cleared, 'empty filter clears old average and chart');

const admin = read('source/rate/admin/index.html');
source = admin.slice(admin.indexOf('    function validateRecord()'), admin.indexOf('    function generateJSON('));
nodes = { 'in-lat': { value: '' }, 'in-lng': { value: '' }, 'in-name': { value: 'Test' } };
context = { document: { getElementById: id => nodes[id] } }; vm.runInNewContext(source, context);
// Coordinates are optional now (quick check-in), but must be valid when given.
context.validateRecord(); checks++;
nodes['in-lat'].value = '91'; nodes['in-lng'].value = '110'; assert.throws(() => context.validateRecord()); checks++;
nodes['in-lat'].value = '34.8'; nodes['in-lng'].value = ''; assert.throws(() => context.validateRecord()); checks++;
nodes['in-lat'].value = ''; nodes['in-lng'].value = ''; nodes['in-name'].value = ''; assert.throws(() => context.validateRecord()); checks++;
nodes['in-name'].value = 'Test'; nodes['in-lat'].value = '0'; nodes['in-lng'].value = '0'; context.validateRecord(); checks++;
console.log(`PASS: ${checks} syntax, accessibility and behavior regression checks`);
