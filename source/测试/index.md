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
        <div class="note-card-title">SBTI 赛博人格测试</div>
        <div class="note-card-desc">MBTI 已经过时，SBTI 来了！测测你的赛博人格</div>
      </div>
      <div class="note-card-arrow">→</div>
    </a>
    <a class="note-card" href="/测试/scl90/">
      <div class="note-card-icon">📋</div>
      <div class="note-card-info">
        <div class="note-card-title">SCL-90 症状自评量表</div>
        <div class="note-card-desc">90 道题 · 10 个维度 · 心理健康自评</div>
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
        <div class="note-card-title">社会指数宾果游戏</div>
        <div class="note-card-desc">连成一条线你就是完犊子的死宅社恐了 🤣</div>
      </div>
      <div class="note-card-arrow">→</div>
    </a>
    <a class="note-card" href="/测试/bingo2/">
      <div class="note-card-icon">🌧️</div>
      <div class="note-card-info">
        <div class="note-card-title">阴湿青春 BINGO</div>
        <div class="note-card-desc">连成一线，说明你活到现在真是辛苦了 🫂</div>
      </div>
      <div class="note-card-arrow">→</div>
    </a>
    <a class="note-card" href="/测试/bingo3/">
      <div class="note-card-icon">📵</div>
      <div class="note-card-info">
        <div class="note-card-title">高中违纪 BINGO</div>
        <div class="note-card-desc">五个连成一线的话很有故事了</div>
      </div>
      <div class="note-card-arrow">→</div>
    </a>
    <a class="note-card" href="/测试/bingo4/">
      <div class="note-card-icon">🌑</div>
      <div class="note-card-info">
        <div class="note-card-title">这辈子有了 BINGO</div>
        <div class="note-card-desc">五个连成一线，这辈子就彻彻底底完完全全地有了</div>
      </div>
      <div class="note-card-arrow">→</div>
    </a>
    <a class="note-card" href="/测试/bingo5/">
      <div class="note-card-icon">✨</div>
      <div class="note-card-info">
        <div class="note-card-title">Shiny 青春 BINGO</div>
        <div class="note-card-desc">五个连成一线，说明你度过了一个闪耀的青春</div>
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
.tab-btn:hover{ border-color:var(--theme-color,#49b1f5); color:var(--theme-color,#49b1f5); }
.tab-btn.active{ background:var(--theme-color,#49b1f5); color:#fff; border-color:var(--theme-color,#49b1f5); }

/* 卡片美化 */
.note-card{
  display:flex; align-items:center; padding:20px 24px; margin-bottom:14px;
  background:var(--card-bg,#fff); border:1px solid var(--border-color,#e8ecf1);
  border-radius:14px; text-decoration:none; color:var(--font-color,#363636);
  transition:all .25s cubic-bezier(.4,0,.2,1);
  box-shadow:0 1px 3px rgba(0,0,0,.04);
}
.note-card:hover{
  transform:translateY(-3px); box-shadow:0 6px 20px rgba(0,0,0,.08);
  border-color:var(--theme-color,#49b1f5);
}
.note-card-icon{ font-size:2em; margin-right:18px; flex-shrink:0; }
.note-card-info{ flex:1; display:flex; flex-direction:column; gap:4px; }
.note-card-title{ font-size:1.1em; font-weight:600; }
.note-card-desc{ font-size:0.85em; color:var(--second-color,#858585); }
.note-card-arrow{ font-size:1.3em; color:var(--second-color,#bbb); margin-left:12px; transition:transform .2s; }
.note-card:hover .note-card-arrow{ transform:translateX(4px); color:var(--theme-color,#49b1f5); }
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

