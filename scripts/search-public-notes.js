'use strict'

// Keep the existing post index, adding only public Markdown notes as pages.
hexo.extend.filter.register('after_init', function () {
  const original = hexo.extend.generator.get('json')
  if (!original) return
  hexo.extend.generator.register('json', function (locals) {
    const pages = locals.pages.filter(page =>
      /^notes\/.+\.md$/i.test(page.source || '') &&
      !page.password && !page.hidden && !page.hide && !page.noindex && page.search !== false)
    return original.call(this, Object.assign({}, locals, { pages }))
  })
})
