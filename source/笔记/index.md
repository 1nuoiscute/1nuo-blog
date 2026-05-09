---
title: 笔记
date: 2026-05-09
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

    <!-- 将来更多笔记可以加在这里 -->
  </div>

  <!-- 空状态 -->
  <div class="notes-empty" style="display:none">
    <p>📭 暂无匹配的笔记</p>
  </div>
</div>

<link rel="stylesheet" href="/css/notes.css">
<script>
(function() {
  const tagBtns = document.querySelectorAll('.tag-btn');
  const sortBtns = document.querySelectorAll('.sort-btn');
  const searchInput = document.getElementById('search-input');
  const list = document.getElementById('note-list');
  const cards = list.querySelectorAll('.note-card');
  const empty = document.querySelector('.notes-empty');
  let currentTag = 'all';
  let currentSort = 'newest';
  let searchText = '';

  function filterAndSort() {
    let visible = [];

    cards.forEach(card => {
      // 标签筛选
      const tags = (card.dataset.tags || '').split(',');
      const tagMatch = currentTag === 'all' || tags.includes(currentTag);

      // 搜索筛选
      const title = (card.dataset.title || '').toLowerCase();
      const desc = (card.dataset.desc || '').toLowerCase();
      const searchMatch = !searchText || title.includes(searchText) || desc.includes(searchText);

      const match = tagMatch && searchMatch;
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

  // 分类按钮
  tagBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      tagBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentTag = this.dataset.tag;
      filterAndSort();
    });
  });

  // 排序按钮
  sortBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      sortBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentSort = this.dataset.sort;
      filterAndSort();
    });
  });

  // 搜索输入（实时搜索）
  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', function() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        searchText = this.value.trim().toLowerCase();
        filterAndSort();
      }, 200);
    });
  }
})();
</script>
