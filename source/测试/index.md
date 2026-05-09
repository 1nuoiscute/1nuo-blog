---
title: SBTI 赛博人格测试
date: 2026-05-09
top_img: https://img.1nuo.me/img/categoriesbanner.webp
---

<div id="sbti-container" style="min-height: 70vh; position: relative;">
  <iframe id="sbti-frame" src="/测试/sbti/" frameborder="0" style="width:100%; height:100%; min-height:70vh; border:none; border-radius:0; background:transparent;" allowfullscreen></iframe>
</div>

<script>
(function() {
  var frame = document.getElementById('sbti-frame');
  function resize() {
    frame.style.height = Math.max(window.innerHeight - 250, 600) + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  // 接收 iframe 发来的高度消息
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'sbti-height') {
      frame.style.height = e.data.height + 'px';
    }
  });
})();
</script>
