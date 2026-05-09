---
title: 笔记
date: 2026-05-09
---

<div id="notes-app">
  <!-- 筛选栏 -->
  <div class="notes-toolbar">
    <div class="notes-tags">
      <button class="tag-btn active" data-tag="all">全部</button>
      <button class="tag-btn" data-tag="NCRE">NCRE</button>
      <button class="tag-btn" data-tag="C语言">C语言</button>
      <button class="tag-btn" data-tag="考试">考试</button>
    </div>
    <div class="notes-sort">
      <button class="sort-btn active" data-sort="newest">🕐 最新</button>
      <button class="sort-btn" data-sort="oldest">🕐 最早</button>
    </div>
  </div>

  <!-- 笔记合集列表 -->
  <div class="note-collections" id="note-list">
    <!-- NCRE 备考 -->
    <div class="note-card" data-tags="NCRE,C语言,考试" data-date="2026-05-09">
      <a href="/笔记/计算机二级/" class="note-card-inner">
        <div class="note-card-icon">🏅</div>
        <div class="note-card-info">
          <h2>计算机二级 NCRE 备考</h2>
          <p>C 语言程序设计 · 数据结构与算法 · 上机实操 · 理论背诵</p>
          <div class="note-card-meta">
            <span class="tag">NCRE</span>
            <span class="tag">C语言</span>
            <span class="tag">考试</span>
            <span class="date">2026-05-09</span>
          </div>
        </div>
        <div class="note-card-arrow">→</div>
      </a>
    </div>

    <!-- 将来更多笔记可以加在这里 -->
  </div>

  <!-- 空状态 -->
  <div class="notes-empty" style="display:none">
    <p>暂无匹配的笔记</p>
  </div>
</div>

<link rel="stylesheet" href="/css/notes.css">
<script>
(function() {
  const tagBtns = document.querySelectorAll('.tag-btn');
  const sortBtns = document.querySelectorAll('.sort-btn');
  const list = document.getElementById('note-list');
  const cards = list.querySelectorAll('.note-card');
  const empty = document.querySelector('.notes-empty');
  let currentTag = 'all';
  let currentSort = 'newest';

  function filterAndSort() {
    let visible = [];

    cards.forEach(card => {
      const tags = (card.dataset.tags || '').split(',');
      const match = currentTag === 'all' || tags.includes(currentTag);
      if (match) {
        visible.push({
          el: card,
          date: card.dataset.date || '0000-00-00'
        });
      }
      card.style.display = match ? '' : 'none';
    });

    // 排序
    visible.sort((a, b) => {
      if (currentSort === 'newest') return b.date.localeCompare(a.date);
      else return a.date.localeCompare(b.date);
    });

    // 重排 DOM
    visible.forEach(item => list.appendChild(item.el));

    empty.style.display = visible.length === 0 ? '' : 'none';
  }

  tagBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      tagBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentTag = this.dataset.tag;
      filterAndSort();
    });
  });

  sortBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      sortBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentSort = this.dataset.sort;
      filterAndSort();
    });
  });
})();
</script>
