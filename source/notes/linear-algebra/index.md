---
title: 线性代数笔记
date: 2026-05-22
tags: [线性代数, 笔记]
top_img: https://img.1nuo.me/img/academicbanner.webp
---

<p style="margin-bottom:16px"><a href="/notes/" style="color:var(--second-color,#858585);text-decoration:none;font-size:0.85em">← 返回笔记总览</a></p>

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

/* TOC */
.la-toc {
  max-width: 900px;
  margin: 0 auto 24px;
  background: #fafafa;
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid #eee;
}
.la-toc h2 {
  margin: 0 0 16px; font-size: 18px;
  color: #333; display: flex;
  align-items: center; gap: 8px;
}
.la-toc ul {
  list-style: none; padding: 0; margin: 0;
}
.la-toc li {
  margin-bottom: 8px;
}
.la-toc .la-toc-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  color: #555;
  font-size: 14px;
}
.la-toc .la-toc-section:hover {
  background: #f0f0f0;
  color: #333;
}
.la-toc .la-toc-num {
  font-weight: 600;
  color: #F2A2C8;
  min-width: 20px;
  font-size: 13px;
}
.la-toc .la-toc-title {
  flex: 1;
}
.la-toc .la-toc-pages {
  font-size: 12px;
  color: #aaa;
}
.la-toc .la-toc-subs {
  list-style: none;
  padding: 0 0 0 40px;
  margin: 4px 0 0;
}
.la-toc .la-toc-subs li {
  font-size: 13px;
  color: #888;
  padding: 3px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.la-toc .la-toc-subs li:hover {
  background: #f0f0f0;
  color: #555;
}
.la-toc-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
  font-size: 13px;
  color: #aaa;
  cursor: pointer;
  transition: color 0.2s;
  border: none;
  background: none;
  width: 100%;
  padding: 4px;
}
.la-toc-toggle:hover { color: #F2A2C8; }
</style>

<div class="la-toc" id="laToc">
  <h2>📋 目录</h2>
  <ul>
    <li><div class="la-toc-section" onclick="showPage(1)">
      <span class="la-toc-num">一</span>
      <span class="la-toc-title">行列式</span>
      <span class="la-toc-pages">第 1-3 页</span>
    </div>
    <ul class="la-toc-subs">
      <li onclick="showPage(1)">二三阶行列式计算</li>
      <li onclick="showPage(2)">特殊行列式（爪型行列式等）</li>
      <li onclick="showPage(2)">范德蒙德行列式</li>
      <li onclick="showPage(3)">矩阵分块行列式与拉普拉斯公式</li>
      <li onclick="showPage(3)">替换法则</li>
    </ul></li>
    <li><div class="la-toc-section" onclick="showPage(4)">
      <span class="la-toc-num">二</span>
      <span class="la-toc-title">矩阵</span>
      <span class="la-toc-pages">第 4 页</span>
    </div>
    <ul class="la-toc-subs">
      <li onclick="showPage(4)">矩阵乘法（内标相等，方行乘右列）</li>
      <li onclick="showPage(4)">逆矩阵的求法与性质</li>
      <li onclick="showPage(4)">矩阵的高次幂计算</li>
      <li onclick="showPage(4)">矩阵方程求解</li>
    </ul></li>
    <li><div class="la-toc-section" onclick="showPage(5)">
      <span class="la-toc-num">三</span>
      <span class="la-toc-title">向量</span>
      <span class="la-toc-pages">第 5-6 页</span>
    </div>
    <ul class="la-toc-subs">
      <li onclick="showPage(5)">向量组的线性相关与无关的判定</li>
      <li onclick="showPage(5)">向量的线性表示</li>
      <li onclick="showPage(6)">极大线性无关组的求法</li>
    </ul></li>
    <li><div class="la-toc-section" onclick="showPage(7)">
      <span class="la-toc-num">四</span>
      <span class="la-toc-title">线性方程组</span>
      <span class="la-toc-pages">第 7-9 页</span>
    </div>
    <ul class="la-toc-subs">
      <li onclick="showPage(7)">方程组解的情况与判定（唯一解、无解、无穷多解）</li>
      <li onclick="showPage(8)">求通解与基础解系</li>
      <li onclick="showPage(9)">基础解系的性质、判定与线性组合</li>
    </ul></li>
    <li><div class="la-toc-section" onclick="showPage(10)">
      <span class="la-toc-num">五</span>
      <span class="la-toc-title">矩阵相似与特征值</span>
      <span class="la-toc-pages">第 10-12 页</span>
    </div>
    <ul class="la-toc-subs">
      <li onclick="showPage(10)">求特征值与特征向量及其性质</li>
      <li onclick="showPage(11)">判断与求解相似对角化</li>
      <li onclick="showPage(11)">相似矩阵的性质（迹、行列式等）</li>
      <li onclick="showPage(12)">实对称矩阵的正交相似对角化</li>
      <li onclick="showPage(12)">施密特（Schmidt）正交化与单位化过程</li>
    </ul></li>
    <li><div class="la-toc-section" onclick="showPage(13)">
      <span class="la-toc-num">六</span>
      <span class="la-toc-title">二次型</span>
      <span class="la-toc-pages">第 13 页</span>
    </div>
    <ul class="la-toc-subs">
      <li onclick="showPage(13)">二次型的矩阵形式与求秩</li>
      <li onclick="showPage(13)">化二次型为标准形的方法（正交变换法、配方法）</li>
      <li onclick="showPage(13)">惯性定理与规范形</li>
      <li onclick="showPage(13)">正定二次型及其判定条件</li>
    </ul></li>
  </ul>
  <button class="la-toc-toggle" id="laTocToggle" onclick="toggleToc()">收起目录 ▲</button>
</div>

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

  function pad(n) { return String(n).padStart(2, '0'); }

  function preload(n) {
    for (let i = Math.max(1, n-1); i <= Math.min(total, n+1); i++) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = base + pad(i) + '.webp';
      document.head.appendChild(link);
    }
  }

  window.showPage = function(n) {
    if (n < 1 || n > total) return;
    current = n;
    img.src = base + pad(n) + '.webp';
    counter.textContent = current + ' / ' + total;
    document.querySelectorAll('.la-dot').forEach((d, i) => {
      d.classList.toggle('active', i + 1 === current);
    });
    // Scroll to viewer
    document.getElementById('laViewer').scrollIntoView({ behavior: 'smooth', block: 'start' });
    preload(current);
  };

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

  // TOC toggle
  window.toggleToc = function() {
    const toc = document.getElementById('laToc');
    const btn = document.getElementById('laTocToggle');
    const content = toc.querySelector('ul');
    const subs = toc.querySelectorAll('.la-toc-subs');
    if (content.style.display === 'none') {
      content.style.display = '';
      subs.forEach(s => s.style.display = '');
      btn.textContent = '收起目录 ▲';
    } else {
      content.style.display = 'none';
      subs.forEach(s => s.style.display = '');
      btn.textContent = '展开目录 ▼';
    }
  };

  preload(1);
})();
</script>

<p style="margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px; color: #999; font-size: 13px;">
  🧩 本文由 OpenClaw 小易整理
</p>
