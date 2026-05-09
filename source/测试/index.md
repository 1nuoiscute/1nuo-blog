---
title: 探索
date: 2026-05-10
comments: false
top_img: https://img.1nuo.me/img/categoriesbanner.webp
---

<div class="test-tabs">
  <button class="tab-btn active" data-tab="tests">🧪 测试</button>
  <button class="tab-btn" data-tab="bingo">🎯 Bingo</button>
  <button class="tab-btn" data-tab="draw">🎋 抽签</button>
</div>

<div class="tab-content" id="tab-tests">
  <div class="card-list">
    <a class="card-item" href="/测试/sbti/">
      <div class="card-icon">🧪</div>
      <div class="card-body">
        <div class="card-title">SBTI 赛博人格测试</div>
        <div class="card-desc">MBTI 已经过时，SBTI 来了！测测你的赛博人格</div>
      </div>
      <div class="card-arrow">→</div>
    </a>
    <a class="card-item" href="/测试/scl90/">
      <div class="card-icon">📋</div>
      <div class="card-body">
        <div class="card-title">SCL-90 症状自评量表</div>
        <div class="card-desc">90 道题 · 10 个维度 · 心理健康自评</div>
      </div>
      <div class="card-arrow">→</div>
    </a>
  </div>
</div>

<div class="tab-content" id="tab-bingo" style="display:none">
  <div class="card-list">
    <a class="card-item" href="/测试/bingo/">
      <div class="card-icon">🎯</div>
      <div class="card-body">
        <div class="card-title">社会指数宾果游戏</div>
        <div class="card-desc">连成一条线你就是完犊子的死宅社恐了 🤣</div>
      </div>
      <div class="card-arrow">→</div>
    </a>
    <a class="card-item" href="/测试/bingo2/">
      <div class="card-icon">🌧️</div>
      <div class="card-body">
        <div class="card-title">阴湿青春 BINGO</div>
        <div class="card-desc">连成一线，说明你活到现在真是辛苦了 🫂</div>
      </div>
      <div class="card-arrow">→</div>
    </a>
    <a class="card-item" href="/测试/bingo3/">
      <div class="card-icon">📵</div>
      <div class="card-body">
        <div class="card-title">高中违纪 BINGO</div>
        <div class="card-desc">五个连成一线的话很有故事了</div>
      </div>
      <div class="card-arrow">→</div>
    </a>
    <a class="card-item" href="/测试/bingo4/">
      <div class="card-icon">🌑</div>
      <div class="card-body">
        <div class="card-title">这辈子有了 BINGO</div>
        <div class="card-desc">五个连成一线，这辈子就彻彻底底完完全全地有了</div>
      </div>
      <div class="card-arrow">→</div>
    </a>
    <a class="card-item" href="/测试/bingo5/">
      <div class="card-icon">✨</div>
      <div class="card-body">
        <div class="card-title">Shiny 青春 BINGO</div>
        <div class="card-desc">五个连成一线，说明你度过了一个闪耀的青春</div>
      </div>
      <div class="card-arrow">→</div>
    </a>
  </div>
</div>

<div class="tab-content" id="tab-draw" style="display:none">
  <div class="card-list">
    <a class="card-item" href="/测试/draw/">
      <div class="card-icon">🎋</div>
      <div class="card-body">
        <div class="card-title">幸运签</div>
        <div class="card-desc">摇一签，看看今日运势如何</div>
      </div>
      <div class="card-arrow">→</div>
    </a>
    <a class="card-item" href="/测试/tarot/">
      <div class="card-icon">🔮</div>
      <div class="card-body">
        <div class="card-title">塔罗牌</div>
        <div class="card-desc">78 张牌 · 多牌阵 · 占卜你的命运</div>
      </div>
      <div class="card-arrow">→</div>
    </a>
  </div>
</div>

<style>
/* 应用 frontend-design-pro 规范 */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

:root{--ease:cubic-bezier(0.16,1,0.3,1);--accent:#5A82B8;--accent-soft:#dce8f5;--border:#e7e5e4;--card-bg:#ffffff;--text:#1c1917;--muted:#a8a29e}

.test-tabs{display:flex;gap:8px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.tab-btn{
  display:inline-flex;align-items:center;height:40px;padding:0 24px;
  border:1px solid var(--border);border-radius:999px;
  background:transparent;cursor:pointer;
  font-family:"DM Sans",-apple-system,sans-serif;font-weight:500;font-size:14px;
  color:var(--muted);transition:all .2s var(--ease);
}
.tab-btn:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
.tab-btn.active{background:var(--text);color:#fff;border-color:var(--text)}
.tab-btn.active:hover{background:var(--text);color:#fff}

.card-list{display:flex;flex-direction:column;gap:8px}
.card-item{
  display:flex;align-items:center;padding:16px 20px;
  background:var(--card-bg);border:1px solid var(--border);border-radius:12px;
  text-decoration:none;color:var(--text);
  transition:all .2s var(--ease);box-shadow:0 1px 2px rgba(0,0,0,.04);
}
.card-item:hover{
  transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08);
  border-color:var(--accent);
}
.card-icon{font-size:24px;margin-right:16px;flex-shrink:0;width:32px;text-align:center;opacity:.8}
.card-body{flex:1;min-width:0}
.card-title{font-size:15px;font-weight:600;margin-bottom:2px;letter-spacing:-.01em}
.card-desc{font-size:13px;color:var(--muted)}
.card-arrow{font-size:16px;color:#d6d3d1;margin-left:8px;transition:transform .2s var(--ease)}
.card-item:hover .card-arrow{transform:translateX(4px);color:var(--accent)}
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

