'use strict';

// Ship only the official Simplified Chinese locale, without a browser bundler.
const { zhCN } = require('@clerk/localizations');

function buildLocale() {
  return {
    path: 'js/clerk-zh-cn.js',
    data: `window.__NUO_CLERK_ZH_CN__ = ${JSON.stringify(zhCN)};\n`
  };
}

if (typeof hexo !== 'undefined') hexo.extend.generator.register('clerk-localization', buildLocale);
module.exports = { buildLocale };
