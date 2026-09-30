'use strict';

// The public/private predicate lives in metadata-policy so the sitemap, feed,
// structured data and content graph cannot drift apart.
const { isPublicMetadata, safeJsonLd } = require('./metadata-policy');

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
