'use strict';
const { isPublicMetadata } = require('./metadata-policy');
const array = value => value?.toArray ? value.toArray() : Array.from(value || []);
function communityCatalog(locals) {
  const items = new Map();
  for (const [entries, post] of [[array(locals.posts), true], [array(locals.pages), false]]) {
    for (const entry of entries.filter(isPublicMetadata)) {
      if (!entry.path || !entry.title) continue;
      const path = new URL('/' + entry.path.replace(/^\/+/, ''), 'https://www.1nuo.me').pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
      if (/^\/(?:account|activity|people|comments-admin|discuss|404)(?:\/|$)/.test(path)) continue;
      items.set(path, { path, title: String(entry.title).slice(0, 200), kind: post ? 'article' : path.startsWith('/notes/') ? 'note' : 'page' });
    }
  }
  return { path: 'community/catalog.json', data: JSON.stringify({ items: [...items.values()] }) };
}
if (typeof hexo !== 'undefined') hexo.extend.generator.register('community-catalog', communityCatalog);
module.exports = { communityCatalog };
