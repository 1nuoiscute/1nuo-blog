'use strict';
// Behavior checks for the quick check-in, content graph and reading mode.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let checks = 0;
function check(value, message) { assert(value, message); checks++; }

// --- quick check-in: both fields optional, scores deferred ---
const admin = read('source/rate/admin/index.html');
check(/id="in-overall"/.test(admin) && /暂不评分/.test(admin), 'quick check-in overall score is optional');
check(/id="in-quick-note"/.test(admin), 'quick check-in note field exists');
check(/quick_checkin:\s*\{/.test(admin), 'quick check-in data is written to records');

let values = {};
const fields = id => values[id] ??= { value: '', innerText: '0.00', trim() { return this.value.trim(); } };
let dims = [];
const context = {
  document: {
    getElementById: id => fields(id),
    querySelectorAll: selector => (selector === '.score-item' ? dims : [])
  },
  Date,
  alert() {}
};
let source = admin.slice(admin.indexOf('    function validateRecord()'), admin.indexOf('    function generateJSON('));
vm.runInNewContext(source, context);
fields('in-name').value = '测试点';
fields('in-lat').value = '';
fields('in-lng').value = '';
context.validateRecord(); checks += 1; // no coordinates is fine for a quick check-in
fields('in-lat').value = '91'; fields('in-lng').value = '110';
assert.throws(() => context.validateRecord()); checks += 1;
fields('in-lat').value = ''; fields('in-lng').value = '';

// CONFIG/TAG_MAP are module-level in the admin page, so load them with the function.
const adminConfig = admin.slice(admin.indexOf('    const CONFIG ='), admin.indexOf('    let fileHandle = null;'));
const generateSource = admin.slice(admin.indexOf('    function generateJSON('), admin.indexOf('    const now = new Date();'));
dims = [];
context.document.querySelectorAll = selector => {
  if (selector === '.score-item') return dims;
  if (selector === '.tag-item') return [];
  return [];
};
fields('v-final').innerText = '7.75';
fields('v-level').innerText = 'B';
vm.runInNewContext(adminConfig + '\n' + generateSource, context);
let json = JSON.parse(context.generateJSON(true));
check(json.quick_checkin && json.quick_checkin.overall === null && json.quick_checkin.note === '', 'quick check-in defaults to empty, not zero');
check(!('final_score' in json) && !('rating' in json), 'quick check-in omits scores until they are filled in');
check(Object.keys(json.scores).length === 0, 'quick check-in stores no dimension scores');
check(!('coordinates' in json), 'quick check-in omits missing coordinates instead of writing undefined');

fields('in-overall').value = '4';
fields('in-quick-note').value = '还不错';
json = JSON.parse(context.generateJSON(true));
check(json.quick_checkin.overall === 4 && json.quick_checkin.note === '还不错', 'quick check-in keeps optional values when provided');

const dimension = score => ({
  querySelector: selector => selector === '.in-adj'
    ? { value: '0' }
    : selector === '.in-base' ? { value: score } : { innerText: Number(score).toFixed(1) }
});
dims = [dimension('8'), dimension('8'), dimension('8'), dimension('8')];
fields('in-overall').value = '';
fields('in-quick-note').value = '';
json = JSON.parse(context.generateJSON(true));
check(Object.keys(json.scores).length === 4, 'full evaluation still writes every dimension');
check(Number.isFinite(json.final_score) && json.rating === 'B', 'full evaluation still writes score and rating');

// --- display side tolerates records without scores ---
const rate = read('source/rate/index.md');
check(/待补评分/.test(rate) && /快速打卡/.test(rate), 'rate cards label unscored check-ins');
check(/const rated = data.filter/.test(rate), 'averages ignore records without dimension scores');
check(/item\.scores\?\.architecture|item\.scores && item\.scores\.architecture/.test(rate), 'sorting tolerates missing dimension scores');
check(/\(item\.tags \|\| \[\]\)/.test(rate), 'cards tolerate records without tags');
const map = read('source/js/rate-map.js');
check(/function scoreLabel/.test(map), 'map has a safe score label');
check(!/escapeHtml\(item\.final_score\)/.test(map), 'map never prints a raw undefined score');

// --- content graph ---
const { buildGraph } = require('../scripts/content-graph.js');
const date = new Date('2026-02-20T00:00:00Z');
const tag = (name, tagPath) => ({ name, path: tagPath });
const posts = [
  { title: '公开文章 A', path: '2026/02/20/a/', date, tags: [tag('电路', 'tags/circuit/')], categories: [tag('学习', 'categories/study/')] },
  { title: '公开文章 B', path: '2026/02/21/b/', date, tags: [tag('电路', 'tags/circuit/')], categories: [] },
  { title: '隐藏文章', path: '2026/02/22/secret/', date, hidden: true, tags: [tag('电路', 'tags/circuit/')], categories: [] },
  { title: '密码文章', path: '2026/02/23/locked/', date, password: 'x', tags: [tag('电路', 'tags/circuit/')], categories: [] }
];
const pages = [
  { title: '电路分析', path: 'notes/circuit-analysis/', date, tags: [tag('电路', 'tags/circuit/')], categories: [] },
  { title: '分类', path: 'categories/', date, tags: [], categories: [] },
  { title: '后台', path: 'rate/admin/', date, tags: [], categories: [] }
];
const graph = buildGraph({ posts, pages }, '/');
const ids = graph.nodes.map(node => node.id);
check(ids.includes('notes/circuit-analysis/'), 'graph includes content pages');
check(!ids.some(id => /secret|locked/.test(id)), 'graph never exposes hidden or password posts');
check(!ids.includes('categories/') && !ids.includes('rate/admin/'), 'graph excludes taxonomy and admin pages');
check(graph.edges.some(edge => edge.shared.includes('电路')), 'graph links entries sharing a topic');
check(graph.topics.some(topic => topic.name === '电路' && topic.count === 3), 'graph counts public topic members only');
check(graph.nodes.every(node => node.url.startsWith('/')), 'graph node urls are root-relative');
check(graph.nodes.find(node => node.id === 'notes/circuit-analysis/').kind === '笔记', 'graph labels notes');

const page = read('source/graph/index.md');
check(/data-content-graph/.test(page), 'graph page mounts the graph');
const client = read('source/js/content-graph.js');
check(/content-graph\.json/.test(client), 'graph client reads the generated data');
check(/search\.json/.test(client), 'graph client falls back to search data');
check(/'keydown'/.test(client) && /'Enter'/.test(client), 'graph nodes are keyboard operable');
new vm.Script(client); checks += 1;

// --- reading mode ---
const tools = read('source/js/nuo-tools.js');
check(/nuo-reading-mode/.test(tools), 'reading mode toggles a body class');
check(/READING_MODE_KEY/.test(tools), 'reading mode preference is stored locally');
check(/data-action="reading-mode"|'reading-mode'/.test(tools), 'toolbar exposes the reading mode button');
check(/font-smaller/.test(tools) && /font-larger/.test(tools), 'reading mode has font size controls');
check(/document\.addEventListener\('keydown'/.test(tools) && /nuo-share-modal/.test(tools), 'Escape exits reading mode without stealing it from the share dialog');
check(/applyReadingMode\(canRead\)/.test(tools) && /applyReadingMode\(false\)/.test(tools), 'reading mode is not applied to non-article pages');
const css = read('source/css/custom.css');
check(/body\.nuo-reading-mode #sidebar/.test(css), 'reading mode styles hide the sidebar');

console.log(`PASS: ${checks} quick check-in, content graph and reading mode checks`);
