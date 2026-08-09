'use strict'

hexo.extend.generator.register('tencent-lbs-config', function () {
  const key = process.env.TENCENT_LBS_KEY || ''

  return {
    path: 'js/tencent-lbs-config.js',
    data: `window.__NUO_TENCENT_LBS__ = ${JSON.stringify({ key })};\n`
  }
})
