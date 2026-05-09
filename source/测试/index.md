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

<style>
.test-tabs{display:flex;gap:10px;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid #eee}
.tab-btn{display:inline-flex;align-items:center;height:36px;padding:0 20px;border:1px solid #ddd;border-radius:8px;background:#f8f9fa;cursor:pointer;font-weight:bold;font-size:13px;transition:.3s;color:#555}
.tab-btn.active{background:#2c3e50;color:#fff;border-color:#2c3e50}
.tab-btn:hover{border-color:#49b1f5;color:#49b1f5}
.tab-btn.active:hover{color:#fff;border-color:#2c3e50}

.card-list{display:flex;flex-direction:column;gap:12px}
.card-item{display:flex;align-items:center;padding:18px 20px;background:#fff;border:1px solid #eee;border-radius:12px;text-decoration:none;color:#363636;transition:all .25s;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.card-item:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08);border-color:#49b1f5}
.card-icon{font-size:28px;margin-right:16px;flex-shrink:0;width:36px;text-align:center}
.card-body{flex:1;min-width:0}
.card-title{font-size:15px;font-weight:600;margin-bottom:3px}
.card-desc{font-size:12px;color:#999}
.card-arrow{font-size:18px;color:#ccc;margin-left:10px;transition:transform .2s}
.card-item:hover .card-arrow{transform:translateX(4px);color:#49b1f5}
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
