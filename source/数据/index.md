---
title: 数据
date: 2026-05-10
comments: false
top_img: https://img.1nuo.me/img/categoriesbanner.webp
---

<div id="data-container" style="min-height:70vh;position:relative;">
  <iframe id="data-frame" src="https://cloud.umami.is/share/sKfrnf4MKWP3znei" frameborder="0" style="width:100%;height:100%;min-height:70vh;border:none;border-radius:0;background:transparent;" allow="cross-origin-isolated" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
</div>

<div id="data-fallback" style="display:none;text-align:center;padding:60px 20px;background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);">
  <div style="font-size:3em;margin-bottom:16px;">📊</div>
  <h2 style="margin-bottom:12px;">无法内嵌显示</h2>
  <p style="color:#7f8c9b;margin-bottom:8px;">Umami 仪表盘不支持在当前页面内展示</p>
  <a href="https://cloud.umami.is/share/sKfrnf4MKWP3znei" target="_blank" rel="noopener" style="display:inline-block;padding:12px 32px;background:#49b1f5;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;">在新标签页打开</a>
</div>

<script>
(function(){
  var frame = document.getElementById('data-frame');
  function resize(){frame.style.height=Math.max(window.innerHeight-250,600)+'px';}
  window.addEventListener('resize',resize); resize();

  // 检测 iframe 是否加载成功
  var loaded = false;
  frame.onload = function(){
    loaded = true;
  };

  // 5秒后如果没加载成功，显示 fallback
  setTimeout(function(){
    if(!loaded){
      frame.style.display='none';
      document.getElementById('data-fallback').style.display='';
    }
  }, 5000);
})();
</script>
