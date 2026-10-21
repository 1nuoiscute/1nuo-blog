(function () {
  'use strict';
  let cloud = window.NuoCloud;
  try { if (window.parent !== window && window.parent.NuoCloud) cloud = window.parent.NuoCloud; } catch { /* foreign embedding keeps its own session */ }
  let snapshot = null, previousUser = null, blocked = false, version = 0;
  const HANDOFF = 'nuo:2048:login-handoff:v1';
  const list = document.getElementById('lb-list'), identity = document.getElementById('lb-identity');
  function text(tag, value, className) { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; }
  function clearHandoff() { try { sessionStorage.removeItem(HANDOFF); } catch { /* private mode */ } }
  function rememberRound() {
    if (blocked || typeof g === 'undefined' || !g) return;
    try { sessionStorage.setItem(HANDOFF, JSON.stringify({ time: Date.now(), owner: previousUser, score: g.s, won: g.w, over: g.o,
      ended: document.getElementById('go').classList.contains('show'), board: g.g.map(row => row.map(tile => tile ? tile.v : 0)) })); } catch { /* private mode */ }
  }
  function restoreRound(over) {
    let saved; try { saved = JSON.parse(sessionStorage.getItem(HANDOFF) || 'null'); } catch { return; }
    clearHandoff();
    if (!saved || !Number.isFinite(saved.time) || Date.now() - saved.time > 1800000 || !Number.isSafeInteger(saved.score) || saved.score < 0 ||
      (saved.owner && saved.owner !== cloud.state().user?.id) || !Array.isArray(saved.board) || saved.board.length !== 4 ||
      !saved.board.every(row => Array.isArray(row) && row.length === 4 && row.every(value => Number.isSafeInteger(value) && value >= 0 && value <= 131072 && (value === 0 || (value >= 2 && (value & (value - 1)) === 0))))) return;
    g.g = saved.board.map(row => row.map(value => value ? { v: value, i: g.n++ } : 0));
    g.s = saved.score; g.w = !!saved.won; g.o = !!saved.over;
    if (saved.ended && saved.score > 0) {
      snapshot = { score: saved.score, maxTile: Math.max(...saved.board.flat()), owner: saved.owner };
      over.call(g, '上一局成绩', '得分：' + saved.score); renderSubmission();
    }
  }
  function draw(items, host) {
    host.replaceChildren();
    if (!items.length) { host.textContent = '暂无记录，来玩一局吧'; return; }
    items.slice(0, 50).forEach((item, i) => {
      if (typeof item.name !== 'string' || !Number.isFinite(item.score)) return;
      const row = text('div', '', 'lb-item');
      row.append(text('span', '#' + (i + 1), 'lb-rank'), text('span', item.name + (item.mine ? '（我）' : ''), 'lb-name'), text('span', String(item.score), 'lb-score'));
      host.append(row);
    });
  }
  async function loadLeaderboard() {
    const current = ++version;
    try {
      const data = await cloud.request('/v1/leaderboard/2048');
      if (current !== version) return;
      draw(data.items, list);
      if (data.personalBest) {
        document.getElementById('lb-personal').textContent = '我的最佳：' + data.personalBest.score;
        const user = cloud.state().user;
        if (user && typeof g !== 'undefined' && g) {
          g.b = Math.max(g.b, data.personalBest.score); document.getElementById('best').textContent = g.b;
          try { localStorage.setItem('nuo:2048-best:' + user.id, String(g.b)); } catch { /* private mode */ }
        }
      }
      else document.getElementById('lb-personal').textContent = '';
    } catch {
      if (current !== version) return;
      list.replaceChildren(text('span', '排行榜加载失败。'));
      const retry = text('button', '重试', 'btn'); retry.onclick = loadLeaderboard; list.append(retry);
    }
  }
  function renderSubmission() {
    document.getElementById('lb-form')?.remove();
    if (!snapshot || snapshot.score <= 0) return;
    const form = document.createElement('form'); form.id = 'lb-form';
    form.style.cssText = 'margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:0 16px';
    const user = cloud.state().user;
    const status = text('p', user ? '以 ' + user.name + ' 的账号提交' : '登录账号后可将本局成绩加入排行榜');
    status.style.cssText = 'width:100%;font-size:12px;text-align:center'; status.setAttribute('role', 'status');
    const button = text('button', user ? '提交分数' : '登录 / 注册', 'btn'); button.type = 'submit';
    if (blocked || (snapshot.owner && user?.id !== snapshot.owner)) { status.textContent = '账号已切换，请开始新一局再参加排行。'; button.disabled = true; }
    form.append(status, button); document.getElementById('go').append(form);
    form.onsubmit = async event => {
      event.preventDefault(); if (button.disabled) return;
      if (!user) { rememberRound(); try { await cloud.login(); } catch (error) { status.textContent = error.message; } return; }
      if (cloud.state().user?.id !== user.id) return;
      button.disabled = true; status.textContent = '提交中…';
      try {
        const result = await cloud.request('/v1/leaderboard/2048', { method: 'POST', body: {
          score: snapshot.score, maxTile: snapshot.maxTile, name: user.name, avatar: user.avatar
        } });
        if (cloud.state().user?.id !== user.id) return;
        clearHandoff(); status.textContent = '已保存，个人最佳 ' + result.personalBest.score; await loadLeaderboard();
      } catch (error) { if (cloud.state().user?.id === user.id) { status.textContent = '提交失败，请重试。'; button.disabled = false; } }
    };
  }
  window.loadLeaderboard = loadLeaderboard;
  window.setupLeaderboard = function () {
    if (!g || g.leaderboardReady) return;
    g.leaderboardReady = true;
    const over = g.over, restart = g.restart;
    g.over = function (title, message) {
      over.call(this, title, message);
      snapshot = { score: this.s, maxTile: Math.max(...this.g.flat().map(tile => tile ? tile.v : 0)), owner: previousUser };
      renderSubmission();
    };
    g.restart = function () { clearHandoff(); snapshot = null; blocked = false; previousUser = cloud.state().user?.id || null; restart.call(this); };
    g.save = function () {
      if (this.s <= this.b) return;
      this.b = this.s;
      try { localStorage.setItem(previousUser ? 'nuo:2048-best:' + previousUser : 'gb', String(this.b)); } catch { /* private mode */ }
    };
    try { g.b = Number(localStorage.getItem(previousUser ? 'nuo:2048-best:' + previousUser : 'gb')) || 0; } catch { g.b = 0; }
    restoreRound(over);
    g.r();
  };
  const unsubscribe = cloud.subscribe(state => {
    const id = state.user?.id || null;
    if (id !== previousUser) {
      if (previousUser) blocked = true;
      previousUser = id;
      if (typeof g !== 'undefined' && g) {
        try { g.b = Number(localStorage.getItem(id ? 'nuo:2048-best:' + id : 'gb')) || 0; } catch { g.b = 0; }
        g.r();
      }
      renderSubmission(); loadLeaderboard();
    }
    identity.textContent = state.user ? '当前账号：' + state.user.name + '。每个账号保留最佳成绩。' : '未登录也能玩，登录后可提交账号榜单。';
  });
  document.getElementById('lb-login').onclick = () => { rememberRound(); cloud.login().catch(error => { identity.textContent = error.message; }); };
  const unsubscribeLogin = cloud.subscribe(state => { document.getElementById('lb-login').hidden = !!state.user; });
  window.addEventListener('pagehide', event => { if (!event.persisted) { unsubscribe(); unsubscribeLogin(); } });
  window.addEventListener('pageshow', event => { if (event.persisted) loadLeaderboard(); });
  document.getElementById('lb-history').addEventListener('toggle', async event => {
    if (!event.target.open || event.target.dataset.loaded) return;
    const host = document.getElementById('lb-history-list'); host.textContent = '加载中…';
    try {
      const response = await fetch('https://status.1nuo.me/leaderboard');
      if (!response.ok) throw new Error();
      const items = await response.json(); if (!Array.isArray(items)) throw new Error();
      draw(items, host); event.target.dataset.loaded = 'true';
    } catch { host.textContent = '历史榜暂时加载失败，收起后可重试。'; }
  });
  setupLeaderboard(); loadLeaderboard(); cloud.ready().then(loadLeaderboard);
})();
