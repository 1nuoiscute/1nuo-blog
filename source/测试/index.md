---
title: SBTI 赛博人格测试
date: 2026-05-09
top_img: https://img.1nuo.me/img/categoriesbanner.webp
---

<div class="sbti-intro">
  <p style="text-align:center; font-size:1.1em; margin-bottom:24px; color:var(--second-color, #666);">
    MBTI 已经过时，<strong>SBTI</strong> 来了！<br>
    一个纯娱乐向的人格测试，测测你的赛博人格是什么 🧪
  </p>
</div>

<iframe id="sbti-frame" src="/sbti/" frameborder="0" style="width:100%; min-height:600px; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.06); background:var(--card-bg, #fff);"></iframe>

<script>
(function() {
  function resizeFrame() {
    var frame = document.getElementById('sbti-frame');
    if (frame) {
      frame.style.height = Math.max(window.innerHeight - 200, 600) + 'px';
    }
  }
  window.addEventListener('resize', resizeFrame);
  resizeFrame();
})();
</script>
