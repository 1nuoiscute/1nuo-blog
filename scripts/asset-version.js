'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Bumping a hand-written "?v=" by hand is easy to forget, and a stale stylesheet
// silently ships an unstyled page. Hash the shipped assets instead, so any edit
// changes the URL and caches are always current.
const TOKEN = '__NUO_ASSET_V__';
const ASSET_DIRS = ['source/css', 'source/js'];

function assetHash(root) {
  const hash = crypto.createHash('sha1');
  for (const dir of ASSET_DIRS) {
    const absolute = path.join(root, dir);
    if (!fs.existsSync(absolute)) continue;
    for (const name of fs.readdirSync(absolute).sort()) {
      const file = path.join(absolute, name);
      if (!fs.statSync(file).isFile()) continue;
      hash.update(name);
      hash.update(fs.readFileSync(file));
    }
  }
  return hash.digest('hex').slice(0, 10);
}

function register(site) {
  const root = site.base_dir || process.cwd();
  let version = null;
  site.extend.filter.register('after_render:html', function (html) {
    if (!html.includes(TOKEN)) return html;
    if (!version) version = assetHash(root);
    return html.split(TOKEN).join(version);
  });
}

if (typeof hexo !== 'undefined') register(hexo);
module.exports = { assetHash, TOKEN };
