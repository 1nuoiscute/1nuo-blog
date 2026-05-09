---
title: 娱乐
date: 2026-05-09
comments: false
top_img: https://img.1nuo.me/img/categoriesbanner.webp
---

<div class="test-tabs">
  <button class="tab-btn active" data-tab="tests">🧪 测试</button>
  <button class="tab-btn" data-tab="bingo">🎯 Bingo</button>
</div>

<div class="tab-content" id="tab-tests">
  <div class="note-collections">
    <a class="note-card" href="/测试/sbti/">
      <div class="note-card-icon">🧪</div>
      <div class="note-card-info">
        <h2>SBTI 赛博人格测试</h2>
        <p>MBTI 已经过时，SBTI 来了！测测你的赛博人格</p>
      </div>
      <div class="note-card-arrow">→</div>
    </a>
    <a class="note-card" href="/测试/scl90/">
      <div class="note-card-icon">📋</div>
      <div class="note-card-info">
        <h2>SCL-90 症状自评量表</h2>
        <p>90 道题 · 10 个维度 · 心理健康自评</p>
      </div>
      <div class="note-card-arrow">→</div>
    </a>
  </div>
</div>

<div class="tab-content" id="tab-bingo" style="display:none">
  <div class="note-collections">
    <a class="note-card" href="/测试/bingo/">
      <div class="note-card-icon">🎯</div>
      <div class="note-card-info">
        <h2>社会指数宾果游戏</h2>
        <p>连成一条线你就是完犊子的死宅社恐了 🤣</p>
      </div>
      <div class="note-card-arrow">→</div>
    </a>
  </div>
</div>

<link rel="stylesheet" href="/css/notes.css">
<style>
.test-tabs {
  display:flex; gap:8px; margin-bottom:20px;
  padding-bottom:12px; border-bottom:1px solid var(--border-color,#e8e8e8);
}
.tab-btn {
  padding:8px 24px; border:1px solid var(--border-color,#ddd); border-radius:999px;
  background:transparent; color:var(--font-color,#555); cursor:pointer;
  font-size:0.95em; transition:all .2s;
}
.tab-btn:hover { border-color:var(--theme-color,#49b1f5); color:var(--theme-color,#49b1f5); }
.tab-btn.active { background:var(--theme-color,#49b1f5); color:#fff; border-color:var(--theme-color,#49b1f5); }
</style>
<script>
(function(){
  var btns = document.querySelectorAll('.tab-btn');
  btns.forEach(function(btn){
    btn.addEventListener('click', function(){
      btns.forEach(function(b){ b.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(c){ c.style.display = 'none'; });
      document.getElementById('tab-' + this.dataset.tab).style.display = '';
    });
  });
})();
</script>

