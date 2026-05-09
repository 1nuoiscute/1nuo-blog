const fs = require('fs');
const path = require('path');

const categories = {
  'C-SPECIAL': { title: 'C 语言专项', icon: '💻', dir: 'C SPECIAL', tags: 'C语言, 标识符, 指针, 函数, 运算符' },
  '数据结构与算法': { title: '数据结构与算法', icon: '📊', dir: '数据结构与算法', tags: '数据结构, 算法, 二叉树, 排序, 栈, 队列' },
  '实操': { title: '实操', icon: '🔧', dir: '实操', tags: '上机, 编程, 改错, VC++' },
  '纯背': { title: '纯背', icon: '📝', dir: '纯背', tags: '理论, 概念, 结构化, 软件工程' }
};

for (const [slug, cat] of Object.entries(categories)) {
  const srcPath = path.join('D:\\codes\\GitHub\\1nuo-ncre-level-2-c-records', cat.dir, 'README.md');
  const content = fs.readFileSync(srcPath, 'utf-8');

  let bodyContent = content;
  // 如果内容以 <table> 包裹，去掉最外层 table
  if (content.trim().startsWith('<table>')) {
    bodyContent = content.replace(/^<table>\s*/i, '').replace(/\s*<\/table>\s*$/i, '');
  }

  const pageContent = `---
title: ${cat.title}
date: 2026-05-09
tags: [${cat.tags}]
---

<link rel="stylesheet" href="/css/notes.css">

<div class="ncre-header">
  <span class="ncre-icon">${cat.icon}</span>
  <h1>${cat.title}</h1>
</div>

<div class="ncre-content">
{% raw %}
${bodyContent}
{% endraw %}
</div>
`;

  const outPath = path.join('D:\\codes\\GitHub\\1nuo-blog\\source\\笔记\\计算机二级', slug + '.md');
  fs.writeFileSync(outPath, pageContent, 'utf-8');
  console.log('[OK] ' + slug + '.md (' + bodyContent.length + ' chars)');
}
