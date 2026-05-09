---
title: 笔记
date: 2026-05-09
top_img: https://img.1nuo.me/img/categoriesbanner.webp
---

<div id="notes-app">
  <!-- 搜索栏 -->
  <div class="notes-toolbar">
    <div class="notes-search">
      <input type="text" id="search-input" placeholder="搜索笔记标题或描述…">
    </div>
    <div class="notes-sort">
      <button class="sort-btn active" data-sort="newest">🕐 最新</button>
      <button class="sort-btn" data-sort="oldest">🕐 最早</button>
    </div>
  </div>

  <!-- 分类筛选 -->
  <div class="notes-tags">
    <button class="tag-btn active" data-tag="all">全部</button>
    <button class="tag-btn" data-tag="本科课程">本科课程</button>
    <button class="tag-btn" data-tag="备考经历">备考经历</button>
    <button class="tag-btn" data-tag="课外学习">课外学习</button>
  </div>

  <!-- 笔记合集列表 -->
  <div class="note-collections" id="note-list">
    <!-- NCRE 备考 -->
    <div class="note-card" data-tags="备考经历" data-date="2026-05-09" data-title="计算机二级 NCRE 备考" data-desc="C 语言程序设计 · 数据结构与算法 · 上机实操 · 理论背诵">
      <a href="/笔记/计算机二级/" class="note-card-inner">
        <div class="note-card-icon">🏅</div>
        <div class="note-card-info">
          <h2>计算机二级 NCRE 备考</h2>
          <p>C 语言程序设计 · 数据结构与算法 · 上机实操 · 理论背诵</p>
        </div>
        <div class="note-card-arrow">→</div>
      </a>
    </div>
  </div>

  <!-- 空状态 -->
  <div class="notes-empty" style="display:none">
    <p>📭 暂无匹配的笔记</p>
  </div>
</div>

<link rel="stylesheet" href="/css/notes.css">
<script src="/js/notes.js"></script>
