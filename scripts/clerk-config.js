'use strict';

// Only the browser's public configuration may enter the generated static site.
function buildConfig(env = process.env) {
  const publishableKey = (env.CLERK_PUBLISHABLE_KEY || '').trim();
  if (publishableKey && !/^pk_(test|live)_[A-Za-z0-9+/=-]+$/.test(publishableKey)) {
    throw new Error('CLERK_PUBLISHABLE_KEY must be a Clerk Publishable Key');
  }
  return {
    path: 'js/clerk-config.js',
    data: `window.__NUO_CLERK__ = ${JSON.stringify({ publishableKey })};\n`
  };
}

if (typeof hexo !== 'undefined') {
  hexo.extend.generator.register('clerk-config', () => buildConfig());
}
module.exports = { buildConfig };
