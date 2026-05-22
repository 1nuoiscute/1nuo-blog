---
title: 线性代数笔记
date: 2026-05-22
tags: [线性代数, 笔记]
---

<style>
.la-viewer {
  position: relative;
  max-width: 900px;
  margin: 0 auto;
  background: #1a1a1a;
  border-radius: 12px;
  padding: 12px;
  user-select: none;
}
.la-viewer img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 8px;
  cursor: pointer;
}
.la-nav {
  position: absolute;
  top: 0; bottom: 0;
  width: 40%;
  cursor: pointer;
  z-index: 2;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}
.la-viewer:hover .la-nav { opacity: 1; }
.la-nav-prev { left: 0; justify-content: flex-start; }
.la-nav-next { right: 0; justify-content: flex-end; }
.la-nav span {
  background: rgba(0,0,0,0.5);
  color: #fff;
  width: 44px; height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin: 0 12px;
  transition: background 0.2s;
}
.la-nav:hover span { background: rgba(0,0,0,0.75); }
.la-counter {
  text-align: center;
  color: #888;
  font-size: 14px;
  margin-top: 10px;
  font-family: -apple-system, sans-serif;
}
.la-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.la-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #ddd;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  border: none; padding: 0;
}
.la-dot.active {
  background: #F2A2C8;
  transform: scale(1.3);
}
.la-dot:hover { background: #ccc; }
.pagination-post { display: none; }
#post-comment { display: none; }
.relatedPosts { display: none; }
</style>

<div class="la-viewer" id="laViewer">
  <img id="laImage" src="https://img.1nuo.me/notes/linear-algebra/la-page-01.webp" alt="线性代数笔记">
  <div class="la-nav la-nav-prev" id="laPrev" onclick="prevPage()"><span>‹</span></div>
  <div class="la-nav la-nav-next" id="laNext" onclick="nextPage()"><span>›</span></div>
</div>
<div class="la-counter" id="laCounter">1 / 13</div>
<div class="la-dots" id="laDots"></div>

<p style="margin-top: 24px; text-align: center; color: #999; font-size: 13px;">
  点击图片左右侧或使用键盘 ← → 翻页
</p>

<script>
(function() {
  const total = 13;
  const base = 'https://img.1nuo.me/notes/linear-algebra/la-page-';
  let current = 1;
  const img = document.getElementById('laImage');
  const counter = document.getElementById('laCounter');
  const dots = document.getElementById('laDots');

  // Preload adjacent images
  function preload(n) {
    for (let i = Math.max(1, n-1); i <= Math.min(total, n+1); i++) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = base + String(i).padStart(2, '0') + '.webp';
      document.head.appendChild(link);
    }
  }

  function showPage(n) {
    if (n < 1 || n > total || n === current) return;
    current = n;
    img.src = base + String(n).padStart(2, '0') + '.webp';
    counter.textContent = current + ' / ' + total;
    document.querySelectorAll('.la-dot').forEach((d, i) => {
      d.classList.toggle('active', i + 1 === current);
    });
    preload(current);
  }

  window.prevPage = function() { showPage(current - 1); };
  window.nextPage = function() { showPage(current + 1); };

  // Build dots
  for (let i = 1; i <= total; i++) {
    const dot = document.createElement('button');
    dot.className = 'la-dot' + (i === 1 ? ' active' : '');
    dot.onclick = function() { showPage(i); };
    dots.appendChild(dot);
  }

  // Keyboard
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') { prevPage(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { nextPage(); e.preventDefault(); }
  });

  // Touch swipe
  let touchX = 0;
  img.addEventListener('touchstart', function(e) {
    touchX = e.changedTouches[0].screenX;
  });
  img.addEventListener('touchend', function(e) {
    const diff = e.changedTouches[0].screenX - touchX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? prevPage() : nextPage();
    }
  });

  preload(1);
})();
</script>

<p style="margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px; color: #999; font-size: 13px;">
  🧩 本文由 OpenClaw 小易整理 · 教材：《工程数学 线性代数》（同济大学第七版）
</p>
