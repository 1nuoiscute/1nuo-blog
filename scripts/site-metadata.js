'use strict';

// Metadata is discovery, not access control. Never advertise non-public entries.
function isPublicMetadata(entry = {}) {
  if (entry.password || entry.private || entry.hidden || entry.hide || entry.noindex ||
      entry.draft === true || entry.published === false || entry.sitemap === false) return false;
  if (/\bnoindex\b/i.test(String(entry.robots || ''))) return false;
  const paths = [entry.source, entry.path, entry.permalink].filter(Boolean);
  return paths.every(value => {
    let pathname = String(value).replace(/\\/g, '/');
    try { pathname = decodeURIComponent(new URL(pathname, 'https://metadata.invalid/').pathname); }
    catch { return false; }
    pathname = pathname.replace(/^\/+/, '');
    if (/^rate\/(?:admin|rateimg)(?:\/|$)/i.test(pathname) ||
        /^explore\/(?:app|[^/]+-app|shared)(?:\/|$)/i.test(pathname)) return false;
    // Only rendered Markdown/HTML and extensionless routes belong in metadata.
    return !/\.[^/]+$/.test(pathname) || /\.(?:md|html?)$/i.test(pathname);
  });
}

function safeJsonLd(value) {
  return JSON.stringify(value, null, 2)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function register(site) {
  site.extend.helper.register('site_metadata_public', isPublicMetadata);
  site.extend.helper.register('site_metadata_json', safeJsonLd);
  site.extend.filter.register('after_init', function () {
    const original = site.extend.generator.get('sitemap');
    if (!original) throw new Error('site-metadata requires hexo-generator-sitemap');
    site.extend.generator.register('sitemap', function (locals) {
      const filtered = Object.assign({}, locals, {
        posts: locals.posts.filter(isPublicMetadata),
        pages: locals.pages.filter(isPublicMetadata)
      });
      return original.call(this, filtered);
    });
    // Feed's own filter only excludes drafts, not passwords or hidden posts.
    for (const name of ['atom', 'rss2']) {
      const feedGenerator = site.extend.generator.get(name);
      if (!feedGenerator) continue;
      site.extend.generator.register(name, function (locals) {
        return feedGenerator.call(this, Object.assign({}, locals, {
          posts: locals.posts.filter(isPublicMetadata)
        }));
      });
    }
  });
}

if (typeof hexo !== 'undefined') register(hexo);
module.exports = { isPublicMetadata, safeJsonLd, register };
