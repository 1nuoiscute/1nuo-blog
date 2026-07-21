(function () {
  'use strict';

  var BOOKMARKS_KEY = 'nuo:bookmarks:v1';
  var READING_KEY = 'nuo:reading:v1';
  var HISTORY_KEY = 'nuo:history:v1';
  var currentInfo = null;
  var scrollTimer = null;
  var wanderPromise = null;
  var removeReadingListener = null;

  var FALLBACK_DESTINATIONS = [
    { title: '探索', url: '/explore/', kind: '探索' },
    { title: '笔记', url: '/notes/', kind: '笔记' },
    { title: '关于 1nuo', url: '/about/', kind: '页面' },
    { title: '碎碎念', url: '/shuoshuo/', kind: '碎碎念' },
    { title: '学术', url: '/academic/', kind: '页面' },
    { title: '分类', url: '/categories/', kind: '页面' },
    { title: '标签', url: '/tags/', kind: '页面' },
    { title: '1nuo 评测', url: '/rate/', kind: '评测' }
  ];

  function readStorage(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && typeof value === 'object' ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* private mode */ }
  }

  function normalizePath(url) {
    try { return new URL(url, location.origin).pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/'; }
    catch (error) { return url || '/'; }
  }

  function internalUrl(url) {
    try {
      var parsed = new URL(url, location.origin);
      if (parsed.origin !== location.origin) return '';
      return parsed.href;
    } catch (error) {
      return '';
    }
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }

  function getMeta(name, attribute) {
    var selector = attribute ? 'meta[' + attribute + '="' + name + '"]' : 'meta[name="' + name + '"]';
    var element = document.querySelector(selector);
    return element ? element.getAttribute('content') || '' : '';
  }

  function getPageInfo() {
    var post = document.getElementById('post');
    var page = document.getElementById('page');
    if (!post && !page) return null;

    var titleElement = post
      ? document.querySelector('#post-info .post-title')
      : page.querySelector('.page-title, h1');
    if (!titleElement || !titleElement.textContent.trim()) return null;

    var canonical = document.querySelector('link[rel="canonical"]');
    var url = internalUrl(canonical ? canonical.href : location.href) || location.href.split('#')[0];
    return {
      title: titleElement.textContent.trim(),
      url: url,
      path: normalizePath(url),
      image: getMeta('og:image', 'property'),
      description: getMeta('description'),
      kind: post ? '文章' : '页面'
    };
  }

  function bookmarks() { return readStorage(BOOKMARKS_KEY, {}); }
  function reading() { return readStorage(READING_KEY, {}); }
  function history() {
    var value = readStorage(HISTORY_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  function isBookmarked(path) { var state = bookmarks(); return Boolean(state[path]); }
  function isRead(path) { var state = reading(); return Boolean(state[path] && state[path].read); }

  function recordVisit() {
    if (!currentInfo) return;
    var visitedAt = Date.now();
    var entry = Object.assign({}, currentInfo, { visitedAt: visitedAt });
    var items = history().filter(function (item) { return item && item.path !== entry.path; });
    items.unshift(entry);
    writeStorage(HISTORY_KEY, items.slice(0, 18));
  }

  function makeButton(label, action, extraClass) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'nuo-tool-btn' + (extraClass ? ' ' + extraClass : '');
    button.dataset.action = action;
    button.textContent = label;
    return button;
  }

  function updateButtonState() {
    if (!currentInfo) return;
    var bookmarkButton = document.querySelector('.nuo-content-tools [data-action="bookmark"]');
    var readButton = document.querySelector('.nuo-content-tools [data-action="read"]');
    if (bookmarkButton) {
      var saved = isBookmarked(currentInfo.path);
      bookmarkButton.textContent = saved ? '♥ 已收藏' : '♡ 收藏';
      bookmarkButton.classList.toggle('is-active', saved);
      bookmarkButton.setAttribute('aria-pressed', saved ? 'true' : 'false');
    }
    if (readButton) {
      var done = isRead(currentInfo.path);
      readButton.textContent = done ? '✓ 已读' : '○ 标记已读';
      readButton.classList.toggle('is-active', done);
      readButton.setAttribute('aria-pressed', done ? 'true' : 'false');
    }
  }

  function initReadingProgress() {
    if (removeReadingListener) removeReadingListener();
    var oldProgress = document.querySelector('.nuo-reading-progress');
    if (oldProgress) oldProgress.remove();
    if (!document.getElementById('post')) return;

    var progress = document.createElement('div');
    progress.className = 'nuo-reading-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);

    function update() {
      var article = document.getElementById('article-container');
      if (!article) return;
      var rect = article.getBoundingClientRect();
      var total = Math.max(article.offsetHeight - window.innerHeight * .55, 1);
      var percent = Math.max(0, Math.min(1, (window.innerHeight * .25 - rect.top) / total));
      progress.style.width = (percent * 100).toFixed(1) + '%';
      if (currentInfo && percent > 0) {
        var path = currentInfo.path;
        var progressValue = percent;
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
          var state = reading();
          state[path] = Object.assign({}, state[path], currentInfo, { progress: progressValue, updatedAt: Date.now() });
          writeStorage(READING_KEY, state);
        }, 250);
      }
    }
    window.addEventListener('scroll', update, { passive: true });
    removeReadingListener = function () { window.removeEventListener('scroll', update); };
    update();
  }

  function toggleBookmark() {
    if (!currentInfo) return;
    var state = bookmarks();
    if (state[currentInfo.path]) delete state[currentInfo.path];
    else state[currentInfo.path] = Object.assign({}, currentInfo, { savedAt: Date.now() });
    writeStorage(BOOKMARKS_KEY, state);
    updateButtonState();
  }

  function toggleRead() {
    if (!currentInfo) return;
    var state = reading();
    var previous = state[currentInfo.path] || {};
    state[currentInfo.path] = Object.assign({}, previous, currentInfo, { read: !previous.read, updatedAt: Date.now() });
    writeStorage(READING_KEY, state);
    updateButtonState();
  }

  function roundedRect(context, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines) {
    var words = String(text || '').split('');
    var line = '';
    var lines = [];
    words.forEach(function (character) {
      var test = line + character;
      if (context.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = character;
      } else line = test;
    });
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach(function (item, index) { context.fillText(item, x, y + index * lineHeight); });
    return lines.length;
  }

  function generateShareImage(info) {
    var canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    var context = canvas.getContext('2d');
    if (!context) throw new Error('当前浏览器不支持 Canvas');
    var width = canvas.width;
    var height = canvas.height;
    var gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#fff4f8');
    gradient.addColorStop(1, '#f8e5ee');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#f2a2c8';
    context.globalAlpha = .22;
    context.beginPath(); context.arc(1050, 40, 230, 0, Math.PI * 2); context.fill();
    context.globalAlpha = 1;

    // Keep the card self-contained: external cover images can taint a canvas
    // and make both the preview and PNG download fail in some browsers.
    context.fillStyle = 'rgba(255, 255, 255, .72)';
    roundedRect(context, 770, 70, 350, 490, 24); context.fill();
    // Use a quiet abstract motif instead of a large logo competing with the title.
    context.strokeStyle = 'rgba(207, 95, 145, .28)';
    context.lineWidth = 2;
    [145, 205, 265].forEach(function (offset) {
      context.beginPath();
      context.arc(945, 315, offset, Math.PI * .12, Math.PI * .88);
      context.stroke();
    });
    context.fillStyle = '#cf5f91';
    context.globalAlpha = .7;
    context.beginPath(); context.arc(945, 315, 8, 0, Math.PI * 2); context.fill();
    context.globalAlpha = 1;
    context.fillStyle = '#a58b96';
    context.font = '600 18px "DM Sans", "Microsoft YaHei", sans-serif';
    context.fillText('DIGITAL GARDEN', 852, 505);

    context.fillStyle = '#7a5264';
    context.font = '600 28px "DM Sans", "Microsoft YaHei", sans-serif';
    context.fillText('1nuo.me', 82, 92);
    context.fillStyle = '#3d2934';
    context.font = '700 54px "DM Sans", "Microsoft YaHei", sans-serif';
    wrapText(context, info.title, 82, 205, 610, 72, 3);
    context.fillStyle = '#856b77';
    context.font = '400 25px "DM Sans", "Microsoft YaHei", sans-serif';
    wrapText(context, info.description || '在 1nuo 的数字花园里留下一个坐标。', 82, 430, 610, 38, 3);
    context.fillStyle = '#a58b96';
    context.font = '400 22px "DM Sans", "Microsoft YaHei", sans-serif';
    context.fillText(info.kind + '  ·  ' + info.path, 82, 550);
    return canvas.toDataURL('image/png');
  }

  function showShareModal() {
    if (!currentInfo) return;
    var old = document.querySelector('.nuo-share-modal');
    if (old) old.remove();
    var modal = document.createElement('div');
    modal.className = 'nuo-share-modal';
    modal.innerHTML = '<div class="nuo-share-dialog" role="dialog" aria-modal="true" aria-label="生成分享卡片">' +
      '<h3>生成分享卡片</h3><img class="nuo-share-preview" alt="分享卡片预览">' +
      '<div class="nuo-share-actions"><a class="nuo-tool-btn" data-share-action="download" download="1nuo-share-card.png">下载 PNG</a>' +
      '<button class="nuo-tool-btn" data-share-action="copy">复制链接</button>' +
      '<button class="nuo-tool-btn" data-share-action="close">关闭</button></div></div>';
    document.body.appendChild(modal);
    try {
      var dataUrl = generateShareImage(currentInfo);
      modal.querySelector('.nuo-share-preview').src = dataUrl;
      modal.querySelector('[data-share-action="download"]').href = dataUrl;
    } catch (error) {
      modal.querySelector('.nuo-share-preview').alt = '分享卡片生成失败';
    }
    var closeButton = modal.querySelector('[data-share-action="close"]');
    if (closeButton && typeof closeButton.focus === 'function') closeButton.focus();
    modal.addEventListener('keydown', function (event) { if (event.key === 'Escape') modal.remove(); });
    modal.addEventListener('click', function (event) {
      if (event.target === modal || event.target.dataset.shareAction === 'close') modal.remove();
      if (event.target.dataset.shareAction === 'copy') {
        var copy = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(currentInfo.url) : Promise.reject();
        copy.then(function () { event.target.textContent = '已复制'; }).catch(function () { window.prompt('复制这个链接', currentInfo.url); });
      }
    });
  }

  function loadWanderItems() {
    if (wanderPromise) return wanderPromise;
    wanderPromise = fetch('/search.json', { credentials: 'same-origin' }).then(function (response) {
      if (!response.ok) throw new Error('search unavailable');
      return response.json();
    }).then(function (data) {
      var posts = Array.isArray(data) ? data : (data.posts || data.data || []);
      var normalized = posts.map(function (post) {
        return { title: post.title || '未命名文章', url: internalUrl(post.url || post.path), kind: '文章', description: post.content || post.text || '' };
      }).filter(function (item) { return item.url; });
      return normalized.concat(FALLBACK_DESTINATIONS);
    }).catch(function () { return FALLBACK_DESTINATIONS.slice(); });
    return wanderPromise;
  }

  function wander() {
    loadWanderItems().then(function (items) {
      var current = normalizePath(location.pathname);
      var candidates = items.filter(function (item) { return normalizePath(item.url) !== current && normalizePath(item.url) !== '/wander'; });
      if (!candidates.length) return;
      var previous = null;
      try { previous = sessionStorage.getItem('nuo:last-wander'); } catch (error) { /* private mode */ }
      var fresh = candidates.filter(function (item) { return normalizePath(item.url) !== previous; });
      var choice = (fresh.length ? fresh : candidates)[Math.floor(Math.random() * (fresh.length ? fresh : candidates).length)];
      try { sessionStorage.setItem('nuo:last-wander', normalizePath(choice.url)); } catch (error) { /* private mode */ }
      location.href = choice.url;
    });
  }

  function initContentTools() {
    currentInfo = getPageInfo();
    var existing = document.querySelector('.nuo-content-tools');
    if (existing) existing.remove();
    if (!currentInfo || currentInfo.path === '/wander' || currentInfo.path === '/favorites') return;
    recordVisit();

    var host = document.getElementById('post') || document.getElementById('page');
    if (!host) return;
    var toolbar = document.createElement('div');
    toolbar.className = 'nuo-content-tools';
    toolbar.setAttribute('aria-label', '页面工具');
    toolbar.appendChild(makeButton('🎲 随机漫游', 'wander'));
    toolbar.appendChild(makeButton('▣ 分享卡片', 'share'));
    toolbar.appendChild(makeButton('♡ 收藏', 'bookmark'));
    toolbar.appendChild(makeButton('○ 标记已读', 'read'));
    var spacer = document.createElement('span'); spacer.className = 'nuo-tool-spacer'; toolbar.appendChild(spacer);
    var link = document.createElement('a'); link.className = 'nuo-tool-link'; link.href = '/favorites/'; link.textContent = '书架'; toolbar.appendChild(link);
    toolbar.addEventListener('click', function (event) {
      var action = event.target.dataset.action;
      if (action === 'wander') wander();
      if (action === 'share') showShareModal();
      if (action === 'bookmark') toggleBookmark();
      if (action === 'read') toggleRead();
    });
    var article = host.querySelector('#article-container');
    if (article) host.insertBefore(toolbar, article);
    else host.insertBefore(toolbar, host.firstChild);
    updateButtonState();
    initReadingProgress();
  }

  function libraryItem(path, saved, states, visits) {
    var item = Object.assign({}, visits[path], saved[path], states[path], { path: path });
    item.url = internalUrl(item.url || path) || path;
    item.title = item.title || path;
    return item;
  }

  function formatDate(timestamp, prefix) {
    if (!timestamp) return '';
    return (prefix ? prefix + ' ' : '') + new Date(timestamp).toLocaleDateString('zh-CN');
  }

  function renderLibraryItems(container, items, emptyText, options) {
    if (!container) return;
    container.innerHTML = '';
    if (!items.length) {
      container.innerHTML = '<div class="nuo-library-empty">' + escapeHtml(emptyText) + '</div>';
      return;
    }
    items.forEach(function (item) {
      var row = document.createElement('div'); row.className = 'nuo-library-item';
      var meta = [item.kind || '页面', options.meta(item)].filter(Boolean).join(' · ');
      row.innerHTML = '<div class="nuo-library-item-main"><a class="nuo-library-item-title" href="' + escapeHtml(item.url) + '">' + escapeHtml(item.title) + '</a><div class="nuo-library-item-meta">' + escapeHtml(meta) + '</div></div>';
      if (options.progress && item.progress > 0) {
        var progress = document.createElement('div'); progress.className = 'nuo-library-progress';
        var progressBar = document.createElement('span'); progressBar.style.width = Math.round(Math.min(1, item.progress) * 100) + '%';
        progress.appendChild(progressBar); row.appendChild(progress);
      }
      if (options.removable) {
        var remove = makeButton('移除', 'remove-bookmark', 'nuo-library-remove');
        remove.dataset.path = item.path;
        row.appendChild(remove);
      }
      container.appendChild(row);
    });
  }

  function renderReadingList() {
    var root = document.querySelector('.nuo-library-page');
    if (!root) return;
    var saved = bookmarks();
    var states = reading();
    var visitMap = {};
    history().forEach(function (item) { if (item && item.path) visitMap[item.path] = item; });
    var byPath = function (path) { return libraryItem(path, saved, states, visitMap); };
    var byUpdated = function (a, b) { return (b.updatedAt || b.visitedAt || b.savedAt || 0) - (a.updatedAt || a.visitedAt || a.savedAt || 0); };

    var continuing = Object.keys(states).map(byPath).filter(function (item) {
      return !item.read && item.progress > .03 && item.progress < .97;
    }).sort(byUpdated);
    var savedItems = Object.keys(saved).map(byPath).sort(function (a, b) { return (b.savedAt || 0) - (a.savedAt || 0); });
    var completed = Object.keys(states).map(byPath).filter(function (item) { return item.read; }).sort(byUpdated);
    var recent = history().map(function (item) { return byPath(item.path); }).slice(0, 8);

    renderLibraryItems(root.querySelector('[data-library-section="continuing"]'), continuing, '还没有读到一半的文章。', {
      progress: true,
      meta: function (item) { return '已读 ' + Math.round(item.progress * 100) + '%'; }
    });
    renderLibraryItems(root.querySelector('[data-library-section="saved"]'), savedItems, '还没有收藏。去文章里点一下“♡ 收藏”吧。', {
      removable: true,
      meta: function (item) { return formatDate(item.savedAt, '收藏于'); }
    });
    renderLibraryItems(root.querySelector('[data-library-section="completed"]'), completed, '还没有标记为已读的内容。', {
      meta: function (item) { return formatDate(item.updatedAt, '标记于'); }
    });
    renderLibraryItems(root.querySelector('[data-library-section="recent"]'), recent, '最近还没有浏览记录。', {
      meta: function (item) { return formatDate(item.visitedAt, '浏览于'); }
    });

    if (root.dataset.bound !== 'true') {
      root.dataset.bound = 'true';
      root.addEventListener('click', function (event) {
        if (event.target.dataset.action !== 'remove-bookmark') return;
        var state = bookmarks();
        delete state[event.target.dataset.path];
        writeStorage(BOOKMARKS_KEY, state);
        renderReadingList();
      });
    }
  }

  function boot() {
    window.setTimeout(function () { initContentTools(); renderReadingList(); }, 0);
  }

  window.NuoTools = { wander: wander, refresh: boot };
  document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('pjax:complete', boot);
})();
