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
    <div class="section-title">🔋 Token 用量 <small>当前对话</small></div>
    <div class="grid-2" id="token-grid">
      <div class="loading">加载中...</div>
    </div>
  </div>

  <!-- 技能 -->
  <div class="section">
    <div class="section-title">🧰 技能 <small>66 个 · 13 自写 + 53 内置</small></div>
    <div class="card">
      <div class="skill-list" id="skill-list"></div>
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

// Token 用量（当前活跃会话）
var tokenGrid = document.getElementById('token-grid');
tokenGrid.innerHTML = 
  '<div class="card">'+
    '<div class="card-label">飞书私聊 · 小易</div>'+
    '<div style="display:flex;align-items:baseline;gap:8px">'+
      '<span class="card-value">175k</span>'+
      '<span style="font-size:13px;color:var(--muted)">/ 1000k</span>'+
    '</div>'+
    '<div style="margin-top:8px;height:4px;background:#f0f0f0;border-radius:2px;overflow:hidden">'+
      '<div style="height:100%;width:17%;background:var(--accent);border-radius:2px"></div>'+
    '</div>'+
    '<div style="display:flex;justify-content:space-between;margin-top:4px">'+
      '<span style="font-size:11px;color:var(--muted)">17%</span>'+
      '<span style="font-size:11px;color:var(--muted)">🗄️ 95% 缓存</span>'+
    '</div>'+
  '</div>'+
  '<div class="card">'+
    '<div class="card-label">模型</div>'+
    '<div class="card-value" style="font-size:18px">DeepSeek V4 Flash</div>'+
    '<div class="card-sub">当前对话用满自动切换</div>'+
  '</div>';

// 技能列表
var selfSkills = ['feishu','frontend-design-pro','gi-summarize','humanize','lossless-claw','my-find-skills','openclaw-auto-updater','openclaw-cli','openclaw-tavily-search-0-1-0','self-improving-agent','skill-vetter','todo-tracker-safe','yaml-safe-edit'];
var allSkills = ['1password','apple-notes','apple-reminders','bear-notes','blogwatcher','blucli','bluebubbles','camsnap','canvas','clawhub','coding-agent','discord','eightctl','feishu','frontend-design-pro','gemini','gh-issues','gifgrep','gi-summarize','github','gog','goplaces','healthcheck','himalaya','humanize','imsg','lossless-claw','mcporter','model-usage','my-find-skills','nano-pdf','node-connect','notion','obsidian','openai-whisper','openai-whisper-api','openclaw-auto-updater','openclaw-cli','openclaw-tavily-search-0-1-0','openhue','oracle','ordercli','peekaboo','sag','self-improving-agent','session-logs','sherpa-onnx-tts','skill-creator','skill-vetter','slack','songsee','sonoscli','spotify-player','summarize','taskflow','taskflow-inbox-triage','things-mac','tmux','todo-tracker-safe','trello','video-frames','voice-call','wacli','weather','xurl','yaml-safe-edit'];
var skillList = document.getElementById('skill-list');
skillList.innerHTML = '';
allSkills.forEach(function(s){
  var isSelf = selfSkills.indexOf(s) !== -1;
  var el = document.createElement('span');
  el.className = 'skill-tag' + (isSelf ? ' self' : '');
  el.textContent = s;
  skillList.appendChild(el);
});
</script>
