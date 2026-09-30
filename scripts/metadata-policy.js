'use strict';

// Single source of truth for "may this entry be advertised publicly?".
// Used by sitemap/feed filtering, structured data and the content graph.
// Metadata is discovery, not access control: never advertise non-public entries.
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

module.exports = { isPublicMetadata, safeJsonLd };
