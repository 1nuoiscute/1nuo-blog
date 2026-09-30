'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pug = require('pug');
const yaml = require('js-yaml');
const { SaxesParser } = require('saxes');
const { isPublicMetadata, safeJsonLd, register } = require('../scripts/site-metadata');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let checks = 0;
const check = (value, message) => { assert(value, message); checks++; };
const config = yaml.load(read('_config.yml'));
const theme = yaml.load(read('themes/butterfly/_config.yml'));
function parseXml(xml) {
  const parser = new SaxesParser({ xmlns: true });
  parser.on('error', err => { throw err; });
  parser.write(xml).close();
  checks++;
}
function locs(xml) { return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]); }
const protectedFields = [
  { password: 'secret' }, { private: true }, { hidden: true }, { hide: true },
  { noindex: true }, { robots: 'noindex, nofollow' }, { draft: true }, { published: false }, { sitemap: false }
];
for (const flags of protectedFields) check(!isPublicMetadata(flags), `exclude ${Object.keys(flags)}`);
for (const source of ['rate/admin/index.html', 'rate/rate_data.json', 'rate/rateimg/picture.html',
  'explore/app/index.html', 'explore/tarot-app/index.html', 'explore/shared/state.js', 'assets/data.xml']) {
  check(!isPublicMetadata({ source }), `exclude raw ${source}`);
}
check(!isPublicMetadata({ permalink: 'https://www.1nuo.me/rate/%61dmin/' }), 'decode restricted URLs');
for (const source of ['_posts/public.md', 'notes/course/index.md', 'explore/tarot/index.md', 'rate/index.md']) {
  check(isPublicMetadata({ source }), `keep public ${source}`);
}
const injection = '</script><script>alert("x")</script> & \u2028\u2029';
check(!safeJsonLd({ injection }).includes('<'), 'JSON-LD cannot terminate script element');
assert.equal(JSON.parse(safeJsonLd({ injection })).injection, injection); checks++;
const render = pug.compileFile(path.join(root, 'themes/butterfly/layout/includes/head/structured_data.pug'));
const base = {
  theme, config, site_metadata_public: isPublicMetadata, site_metadata_json: safeJsonLd,
  is_home: () => false, url_for: () => '/',
  full_url_for: value => new URL(value, config.url).href
};
const date = new Date('2026-09-10T00:00:00Z');
const post = { layout: 'post', source: '_posts/public.md', title: injection,
  permalink: 'https://www.1nuo.me/2026/09/10/public/', date, updated: date };
const output = render({ ...base, page: post });
const jsonBlock = html => html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
const article = JSON.parse(jsonBlock(output));
check(article['@type'] === 'BlogPosting' && article.headline === injection, 'real article template valid');
check((output.match(/<script\b/g) || []).length === 1, 'hostile title creates no executable script');
for (const flags of protectedFields) check(render({ ...base, page: { ...post, ...flags } }) === '', 'no protected JSON-LD');
check(render({ ...base, theme: { ...theme, structured_data: { enable: false } }, page: post }) === '', 'enable false respected');
check(render({ ...base, page: { layout: 'page', source: 'rate/index.md' } }) === '', 'ordinary page emits no undefined JSON-LD');
const homeTheme = { ...theme, structured_data: { enable: true, alternate_name: ['one'] } };
const homeArgs = { ...base, theme: homeTheme, is_home: () => true, page: { current: 1 } };
const website = JSON.parse(jsonBlock(render(homeArgs)));
check(website['@type'] === 'WebSite' && website.url === 'https://www.1nuo.me/', 'homepage WebSite valid');
check(render(homeArgs) === render(homeArgs) && homeTheme.structured_data.alternate_name.length === 1, 'alternate names never mutated');
check(render({ ...homeArgs, page: { current: 2 } }) === '', 'no paginated homepage schema');
check(render({ ...homeArgs, url_for: () => '/subdirectory/' }) === '', 'no undefined subdirectory schema');

// Exercise actual installed generator code and our registration without Hexo generate.
const collection = entries => ({
  toArray: () => entries,
  first: () => entries[0],
  last: () => entries[entries.length - 1],
  filter: fn => collection(entries.filter(fn)),
  sort: () => collection(entries.slice().sort((a, b) => b.date - a.date)),
  limit: count => collection(entries.slice(0, count)),
  get length() { return entries.length; },
  forEach: fn => entries.forEach(fn),
  [Symbol.iterator]: function* () { yield* entries; }
});
const realSitemap = require('hexo-generator-sitemap/lib/generator');
const realFeed = require('hexo-generator-feed/lib/generator');
const siteConfig = { ...config,
  sitemap: { ...config.sitemap, tags: false, categories: false },
  feed: { type: ['atom', 'rss2'], path: ['atom.xml', 'rss.xml'], content: true, limit: 20, order_by: '-date', template: '' }
};
const generators = { sitemap: realSitemap };
const filters = {};
const site = { config: siteConfig, extend: {
  helper: { register() {} },
  generator: { get: name => generators[name], register: (name, fn) => { generators[name] = fn; } },
  filter: { register: (name, fn) => { filters[name] = fn; } }
}};
for (const [type, file] of [['atom', 'atom.xml'], ['rss2', 'rss.xml']]) {
  generators[type] = function (locals) { return realFeed.call(this, locals, type, file); };
}
register(site); filters.after_init();
const publicPost = { ...post, title: 'PUBLIC ARTICLE', path: '2026/09/10/public/', slug: 'public',
  date: require('moment')(date), updated: require('moment')(date),
  content: '<p>PUBLIC BODY</p>', excerpt: '', categories: collection([]), tags: collection([]) };
const excluded = protectedFields.map((flags, i) => ({ ...publicPost, ...flags,
  title: `PRIVATE MARKER ${i}`, content: `PRIVATE BODY ${i}`, permalink: `https://www.1nuo.me/private-${i}/` }));
const locals = { posts: collection([publicPost, ...excluded]), pages: collection([
  { ...publicPost, source: 'rate/rate_data.json', permalink: 'https://www.1nuo.me/rate/rate_data.json' },
  { ...publicPost, source: 'rate/admin/index.html', permalink: 'https://www.1nuo.me/rate/admin/' },
  { ...publicPost, source: 'explore/app/index.html', permalink: 'https://www.1nuo.me/explore/app/' },
  { ...publicPost, source: 'notes/course.md', permalink: 'https://www.1nuo.me/notes/course/' }
]), tags: collection([]), categories: collection([]) };
const sitemapResult = generators.sitemap.call(site, locals)[0];
parseXml(sitemapResult.data);
check(locs(sitemapResult.data).length === 3, 'sitemap only homepage/public post/public page');
for (const url of locs(sitemapResult.data)) {
  check(new URL(url).origin === 'https://www.1nuo.me' && isPublicMetadata({ permalink: url }), 'sitemap public canonical loc');
  check(!url.includes('private-'), 'protected post absent from sitemap');
}
for (const type of ['atom', 'rss2']) {
  const feed = generators[type].call(site, locals).data;
  parseXml(feed);
  check(feed.includes('PUBLIC ARTICLE') && feed.includes('PUBLIC BODY'), `${type} includes public post`);
  check(!feed.includes('PRIVATE MARKER') && !feed.includes('PRIVATE BODY'), `${type} contains no protected data`);
  check(feed.includes('https://www.1nuo.me/2026/09/10/public/'), `${type} uses canonical host`);
}
check(/<meta name="robots" content="noindex, nofollow, noarchive">/.test(read('source/rate/admin/index.html')), 'admin robots meta present');
check(!config.robotstxt.disallow.some(p => '/rate/admin/'.startsWith(p)), 'robots allows admin noindex to be read');
check(config.sitemap.tags === false && config.sitemap.categories === false, 'no private-only taxonomy advertised');

// Run after the authorized deployment/CI build, not against stale public artifacts.
if (process.argv.includes('--artifacts')) {
  const publicDir = path.join(root, config.public_dir || 'public');
  const homeHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  check(/rel="canonical" href="https:\/\/www\.1nuo\.me\/"/.test(homeHtml), 'artifact homepage canonical uses clean primary URL');
  check(!/rel="canonical" href="[^"]*(?:index|\.html)"/.test(homeHtml), 'artifact homepage canonical has no HTML suffix');
  const sitemap = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
  parseXml(sitemap);
  for (const url of locs(sitemap)) {
    check(new URL(url).origin === config.url && isPublicMetadata({ permalink: url }), `artifact sitemap public loc: ${url}`);
  }
  for (const file of ['atom.xml', 'rss.xml']) parseXml(fs.readFileSync(path.join(publicDir, file), 'utf8'));
  const admin = fs.readFileSync(path.join(publicDir, 'rate/admin/index.html'), 'utf8');
  check(/name="robots" content="noindex, nofollow, noarchive"/.test(admin), 'artifact admin noindex present');
  const allXml = ['sitemap.xml', 'atom.xml', 'rss.xml'].map(file => fs.readFileSync(path.join(publicDir, file), 'utf8')).join('\n');
  function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
  for (const file of walk(path.join(root, 'source'))) {
    if (!file.endsWith('.md')) continue;
    const text = fs.readFileSync(file, 'utf8');
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) continue;
    const data = yaml.load(frontmatter[1]) || {};
    if (isPublicMetadata(data)) continue;
    if (data.title) check(!allXml.includes(data.title), `artifact protected title absent: ${path.basename(file)}`);
    const sourcePath = path.relative(path.join(root, 'source'), file).replace(/\\/g, '/');
    if (!sourcePath.startsWith('_')) {
      // Hexo pages preserve their source basename (foo.md -> foo.html).
      const outputRoute = data.permalink || sourcePath.replace(/\.md$/, '.html');
      const outputPath = path.join(publicDir, outputRoute);
      check(fs.existsSync(outputPath), `protected page artifact exists: ${sourcePath}`);
      check(!jsonBlock(fs.readFileSync(outputPath, 'utf8')), `protected page emits no JSON-LD: ${sourcePath}`);
      const pageRoute = outputRoute.replace(/(?:^|\/)index\.html$/, '/');
      check(!allXml.includes(new URL(pageRoute, `${config.url}/`).href), `protected page absent from XML: ${sourcePath}`);
    }
    if (data.date && file.includes(`${path.sep}_posts${path.sep}`)) {
      const d = new Date(data.date);
      const slug = path.basename(file, '.md');
      const route = data.permalink || `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/${slug}/`;
      check(!allXml.includes(new URL(route, `${config.url}/`).href), `artifact protected URL absent: ${slug}`);
      const outputRoute = new URL(route, `${config.url}/`).pathname.replace(/^\//, '');
      const htmlFile = path.join(publicDir, outputRoute, 'index.html');
      check(fs.existsSync(htmlFile), `protected post artifact exists: ${slug}`);
      check(!jsonBlock(fs.readFileSync(htmlFile, 'utf8')), `protected post emits no JSON-LD: ${slug}`);
    }
  }
}
console.log(`PASS: ${checks} metadata, real-template, real-generator and XML checks${process.argv.includes('--artifacts') ? ' (including built artifacts)' : ' (no site build)'}`);
