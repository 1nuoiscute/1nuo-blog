'use strict';
const { createHash } = require('node:crypto');
const { stripHTML, unescapeHTML } = require('hexo-util');
const { isPublicMetadata } = require('./metadata-policy');
const array = value => value?.toArray ? value.toArray() : Array.from(value || []);
function articleRoutes(locals) {
  return [...array(locals.posts), ...array(locals.pages).filter(p => /^notes\//.test(p.source || ''))]
    .filter(entry => isPublicMetadata(entry) && entry.comments !== false && entry.path)
    .map(entry => {
      const thread = new URL('/' + entry.path.replace(/^\/+/, ''), 'https://www.1nuo.me').pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
      const body = unescapeHTML(stripHTML(String(entry.content || '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<\/(p|div|h[1-6]|li|pre|blockquote)>/gi, '\n'))).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      return { path: 'ai/articles/' + createHash('sha256').update(thread).digest('hex') + '.json', data: JSON.stringify({ thread, title: String(entry.title || '').slice(0, 200), body: body.slice(0, 12000), truncated: body.length > 12000 }) };
    });
}
if (typeof hexo !== 'undefined') hexo.extend.generator.register('ai-articles', articleRoutes);
module.exports = { articleRoutes };
