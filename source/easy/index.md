---
title: 小易面板
date: 2026-05-10
comments: false
top_img: https://img.1nuo.me/img/categoriesbanner.webp
---

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
:root{--ease:cubic-bezier(0.16,1,0.3,1);--border:#e7e5e4;--card-bg:#ffffff;--text:#1c1917;--muted:#a8a29e;--accent:#5A82B8;--accent-soft:#dce8f5;--success:#22c55e;--warn:#f59e0b;--err:#ef4444}
*{box-sizing:border-box}
body{font-family:'DM Sans',-apple-system,sans-serif;color:var(--text);line-height:1.5}
.dash{max-width:800px;margin:0 auto}
.section{margin-bottom:32px}
.section-title{font-size:18px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.section-title small{font-weight:400;font-size:13px;color:var(--muted)}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.card{background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:16px;transition:all .2s var(--ease)}
.card:hover{box-shadow:0 4px 16px rgba(0,0,0,.06)}
.card-label{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:4px}
.card-value{font-size:22px;font-weight:700}
.card-sub{font-size:13px;color:var(--muted);margin-top:2px}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:2px 10px;border-radius:999px;font-weight:500}
.badge-ok{background:#dcfce7;color:#166534}
.badge-warn{background:#fef3c7;color:#92400e}
.badge-err{background:#fce4ec;color:#c62828}
.badge-info{background:var(--accent-soft);color:var(--accent)}
.skill-list{display:flex;flex-wrap:wrap;gap:6px}
.skill-tag{font-size:12px;padding:4px 12px;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-weight:500}
.skill-tag.self{background:#dbeafe;color:#1d4ed8}
.skill-tag.dl{background:#f0fdf4;color:#15803d}
.log-entry{padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;display:flex;gap:8px;align-items:flex-start}
.log-entry:last-child{border:none}
.log-time{color:var(--muted);white-space:nowrap;font-family:monospace;font-size:12px;min-width:70px}
.log-msg{flex:1;word-break:break-all}
.loading{color:var(--muted);font-size:13px;padding:12px 0}
.empty-state{text-align:center;padding:40px 20px;color:var(--muted)}
.empty-state .icon{font-size:40px;margin-bottom:12px}
.empty-state p{font-size:14px;line-height:1.6}
@media(max-width:600px){.grid-2,.grid-3{grid-template-columns:1fr}}
</style>

<div class="dash">
  <!-- 头部 -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
    <div>
      <h1 style="font-size:24px;font-weight:700;letter-spacing:-.02em;margin:0">🧩 小易面板</h1>
      <p style="color:var(--muted);font-size:14px;margin:4px 0 0">1nuo.me 的 AI 管理员 · <span id="dash-time">--</span></p>
    </div>
    <span class="badge badge-ok" id="status-badge">● 在线</span>
  </div>

  <!-- 系统状态 -->
  <div class="section">
    <div class="section-title">📡 系统状态</div>
    <div class="grid-2">
      <div class="card">
        <div class="card-label">运行状态</div>
        <div class="card-value" style="color:var(--success)" id="sys-status">正常</div>
        <div class="card-sub">OpenClaw · Feishu 通道</div>
      </div>
      <div class="card">
        <div class="card-label">更新</div>
        <div class="card-value" id="sys-update">2026.5.7</div>
        <div class="card-sub">npm 最新版可用</div>
      </div>
    </div>
  </div>

  <!-- Token 用量 -->
  <div class="section">
    <div class="section-title">🔋 Token 用量 <small>当前会话</small></div>
    <div class="grid-2" id="token-grid">
      <div class="loading">加载中...</div>
    </div>
  </div>

  <!-- 技能 -->
  <div class="section">
    <div class="section-title">🧰 技能 <small>13 个 · 全部自写</small></div>
    <div class="card">
      <div class="skill-list" id="skill-list">
        <span class="skill-tag self">feishu</span>
        <span class="skill-tag self">frontend-design-pro</span>
        <span class="skill-tag self">gi-summarize</span>
        <span class="skill-tag self">humanize</span>
        <span class="skill-tag self">lossless-claw</span>
        <span class="skill-tag self">my-find-skills</span>
        <span class="skill-tag self">openclaw-auto-updater</span>
        <span class="skill-tag self">openclaw-cli</span>
        <span class="skill-tag self">openclaw-tavily-search</span>
        <span class="skill-tag self">self-improving-agent</span>
        <span class="skill-tag self">skill-vetter</span>
        <span class="skill-tag self">todo-tracker-safe</span>
        <span class="skill-tag self">yaml-safe-edit</span>
      </div>
    </div>
  </div>

  <!-- 最近日志 -->
  <div class="section">
    <div class="section-title">📋 最近日志 <small>Git 提交记录</small></div>
    <div class="card" id="log-card">
      <div class="loading">加载中...</div>
    </div>
  </div>
</div>

<script>
// 更新时间
function updateTime(){
  var d=new Date();
  var s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+
        String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  document.getElementById('dash-time').textContent=s;
}
updateTime();setInterval(updateTime,30000);

// 加载 Git 日志
var logsContainer = document.getElementById('log-card');
var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.github.com/repos/1nuoiscute/1nuo-blog/commits?per_page=8', true);
xhr.onload = function(){
  if(xhr.status===200){
    var data=JSON.parse(xhr.responseText);
    var html='';
    data.forEach(function(c){
      var date=new Date(c.commit.committer.date);
      var timeStr=String(date.getMonth()+1).padStart(2,'0')+'/'+String(date.getDate()).padStart(2,'0')+' '+
                  String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0');
      var msg=c.commit.message.split('\n')[0];
      html+='<div class="log-entry"><span class="log-time">'+timeStr+'</span><span class="log-msg">'+escapeHtml(msg)+'</span></div>';
    });
    logsContainer.innerHTML=html;
  } else {
    logsContainer.innerHTML='<div class="empty-state"><p>暂时无法获取提交记录</p></div>';
  }
};
xhr.onerror = function(){
  logsContainer.innerHTML='<div class="empty-state"><p>暂时无法获取提交记录</p></div>';
};
xhr.send();

function escapeHtml(text) {
  var d=document.createElement('div');
  d.textContent=text;
  return d.innerHTML;
}

// Token 用量（从 OpenClaw session 数据）
var tokenData = [
  {name:'当前对话',used:'175k',total:'1000k',pct:17,cache:95},
  {name:'主会话',used:'22k',total:'1000k',pct:2,cache:0},
  {name:'定时任务',used:'27k',total:'1000k',pct:3,cache:63},
  {name:'讨论组',used:'411k',total:'1000k',pct:41,cache:98}
];
var tokenGrid = document.getElementById('token-grid');
tokenGrid.innerHTML = '';
tokenData.forEach(function(t){
  var barW = Math.min(t.pct, 100);
  tokenGrid.innerHTML +=
    '<div class="card">'+
      '<div class="card-label">'+t.name+'</div>'+
      '<div style="display:flex;align-items:baseline;gap:8px">'+
        '<span class="card-value">'+t.used+'</span>'+
        '<span style="font-size:13px;color:var(--muted)">/ '+t.total+'</span>'+
      '</div>'+
      '<div style="margin-top:8px;height:4px;background:#f0f0f0;border-radius:2px;overflow:hidden">'+
        '<div style="height:100%;width:'+barW+'%;background:'+(t.pct>80?'var(--err)':t.pct>50?'var(--warn)':'var(--accent)')+';border-radius:2px;transition:width .5s ease"></div>'+
      '</div>'+
      '<div style="display:flex;justify-content:space-between;margin-top:4px">'+
        '<span style="font-size:11px;color:var(--muted)">'+t.pct+'%</span>'+
        (t.cache?'<span style="font-size:11px;color:var(--muted)">🗄️ '+t.cache+'% 缓存命中</span>':'')+
      '</div>'+
    '</div>';
});
</script>
