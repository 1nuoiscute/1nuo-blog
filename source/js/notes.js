// 笔记页面交互逻辑
(function () {
  'use strict';

  var tagBtns = document.querySelectorAll('.tag-btn');
  var sortBtns = document.querySelectorAll('.sort-btn');
  var searchInput = document.getElementById('search-input');
  var list = document.getElementById('note-list');
  var cards = list ? list.querySelectorAll('.note-card') : [];
  var empty = document.querySelector('.notes-empty');
  var currentTag = 'all';
  var currentSort = 'newest';
  var searchText = '';

  function filterAndSort() {
    var visible = [];

    cards.forEach(function (card) {
      var tags = (card.dataset.tags || '').split(',');
      var tagMatch = currentTag === 'all' || tags.indexOf(currentTag) !== -1;

      var title = (card.dataset.title || '').toLowerCase();
      var desc = (card.dataset.desc || '').toLowerCase();
      var searchMatch = !searchText ||
        title.indexOf(searchText) !== -1 ||
        desc.indexOf(searchText) !== -1;

      if (tagMatch && searchMatch) {
        visible.push({ el: card, date: card.dataset.date || '0000-00-00' });
      }
      card.style.display = (tagMatch && searchMatch) ? '' : 'none';
    });

    visible.sort(function (a, b) {
      if (currentSort === 'newest') {
        return b.date.localeCompare(a.date);
      }
      return a.date.localeCompare(b.date);
    });

    visible.forEach(function (item) {
      list.appendChild(item.el);
    });

    if (empty) {
      empty.style.display = visible.length === 0 ? '' : 'none';
    }
  }

  // 分类按钮
  tagBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tagBtns.forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentTag = this.dataset.tag;
      filterAndSort();
    });
  });

  // 排序按钮
  sortBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      sortBtns.forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentSort = this.dataset.sort;
      filterAndSort();
    });
  });

  // 搜索（防抖）
  if (searchInput) {
    var timer;
    searchInput.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        searchText = searchInput.value.trim().toLowerCase();
        filterAndSort();
      }, 200);
    });
  }
})();
