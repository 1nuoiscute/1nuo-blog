---
title: 1nuo 评测
date: 2026-02-20 17:50
top_img: /img/academicbanner.jpg
---

<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>

<div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
  <button id="btn-attractions" class="nuo-tab-btn" onclick="switchTab('attractions')">🏛️ 景点评测</button>
  <button id="btn-digital" class="nuo-tab-btn" onclick="switchTab('digital')">🍹 饮品评测</button>
  
  <a href="/rate/admin/index.html" class="nuo-tab-btn nuo-admin-btn" style="text-decoration: none; margin-left: auto;">
    <span>⚙️</span> 评测后台
  </a>
</div>

<div id="nuo-filter-bar" style="display: none; margin-bottom: 20px; padding: 15px; background: #fff; border-radius: 12px; border: 1px solid #eee; gap: 12px; align-items: center; flex-wrap: wrap; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
  <div class="filter-group">
    <span class="filter-label">地区:</span>
    <select id="filter-province" onchange="onProvinceChange()" class="nuo-select"></select>
    <select id="filter-city" onchange="applyFilters()" class="nuo-select"></select>
  </div>

  <div class="filter-group">
    <span class="filter-label">排序:</span>
    <select id="filter-sort" onchange="applyFilters()" class="nuo-select">
      <option value="default">默认记录</option>
      <option value="visit_time">游玩时间 ↓</option>
      <option value="final_score">综合得分 ↓</option>
      <option value="arch">建筑视觉 ↓</option>
      <option value="cult">文化共鸣 ↓</option>
      <option value="exp">游览体验 ↓</option>
      <option value="val">质价比 ↓</option>
    </select>
  </div>

  <div class="filter-group" style="flex-grow: 1; min-width: 180px;">
    <span class="filter-label">搜索:</span>
    <input type="text" id="filter-search" oninput="applyFilters()" placeholder="搜景点、标签、简评..." class="nuo-input">
  </div>

  <div id="filter-count" style="font-size: 11px; color: #94a3b8; font-weight: bold; background: #f1f5f9; padding: 3px 10px; border-radius: 20px;"></div>
</div>

<div id="section-attractions" class="nuo-section" style="display: none;">
  <div class="chart-header">
    <h2 style="margin: 0; font-size: 17px; color: #333;">🏛️ 评分看板</h2>
    <div style="text-align: right;">
      <div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Average</div>
      <strong id="global-avg-score" style="font-size: 26px; color: #2c3e50; line-height: 1;">0.00</strong>
    </div>
  </div>
  <div style="width: 100%; overflow: hidden;">
    <div id="average-bar-chart" style="width: 100%; height: 220px; margin-bottom: 15px;"></div>
  </div>
  <div id="cards-container" style="display: flex; flex-wrap: wrap; gap: 20px;"></div>
</div>

<div id="section-digital" class="nuo-section" style="display: none;">
  <div style="padding: 60px 20px; text-align: center; background: #fffdf6; border: 2px dashed #f1c40f; border-radius: 16px; color: #e67e22;">
    <div style="font-size: 40px; margin-bottom: 10px;">🍹</div>
    <div style="font-size: 16px; font-weight: bold;">饮品评测维度还在开发中...</div>
  </div>
</div>

<div id="nuo-modal" class="nuo-modal">
  <div class="nuo-modal-content">
    <span class="nuo-modal-close" onclick="closeModal()">&times;</span>
    <h3 id="modal-title" style="margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px; font-size: 18px;"></h3>
    <div id="modal-text" style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 20px; white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 10px; border-left: 4px solid #2ecc71;"></div>
    <div id="modal-images" style="display: flex; flex-direction: column; gap: 15px;"></div>
  </div>
</div>

<style>
  .nuo-tab-btn { padding: 6px 16px; border: 1px solid #ddd; border-radius: 8px; background: #f8f9fa; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.3s; }
  .nuo-tab-btn.active { background: #2c3e50; color: #fff; border-color: #2c3e50; }
  .nuo-admin-btn { color: #666; display: flex; align-items: center; gap: 4px; font-size: 12px; }
  
  .filter-group { display: flex; align-items: center; gap: 6px; }
  .filter-label { font-size: 12px; font-weight: 800; color: #64748b; }
  .nuo-select, .nuo-input { padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12px; outline: none; }

  .chart-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #eee; }

  .nuo-card { position: relative; border: 1px solid #eee; border-radius: 14px; padding: 18px; width: 100%; max-width: 340px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); background: #fff; transition: 0.3s; }
  .nuo-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08); }
  .nuo-rating-badge { position: absolute; top: 15px; right: 15px; font-size: 28px; font-weight: 900; color: #e74c3c; font-style: italic; opacity: 0.7; }
  
  .nuo-score-row { display: flex; align-items: center; margin-bottom: 8px; font-size: 12px; }
  .nuo-score-label { width: 60px; color: #666; font-weight: bold; }
  .nuo-score-bar-bg { flex-grow: 1; height: 8px; background: #f0f0f0; border-radius: 4px; margin: 0 10px; overflow: hidden; }
  .nuo-score-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #83bff6, #188df0); transition: width 0.8s; }
  .nuo-score-value { width: 30px; font-weight: bold; color: #333; }

  /* 修复：简评按钮瘦身 & 绿色高亮 */
  .nuo-detail-link { font-size: 11px; color: #3498db; text-decoration: none; font-weight: normal; margin-left: 8px; padding: 2px 6px; border-radius: 4px; border: 1px solid transparent; transition: 0.2s; cursor: pointer; white-space: nowrap; }
  .nuo-detail-link:hover { background: #eaf2f8; border-color: #3498db; }
  .nuo-light-link { color: #2ecc71; border: 1px solid #dcfce7; background: #f0fdf4; }
  .nuo-light-link:hover { background: #dcfce7; border-color: #2ecc71; }

  .nuo-modal { display: none; position: fixed; z-index: 99999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(15,23,42,0.5); backdrop-filter: blur(4px); justify-content: center; align-items: center; }
  .nuo-modal-content { background: #fff; padding: 20px; border-radius: 12px; width: 90%; max-width: 500px; max-height: 85vh; overflow-y: auto; position: relative; }
  .nuo-modal-close { position: absolute; right: 15px; top: 10px; font-size: 26px; cursor: pointer; color: #999; }
  .nuo-modal-img { width: 100%; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
</style>

<script>
  let globalData = {};
  let currentFilteredData = [];
  let myChart = null;

  function parseLocation(locStr) {
    if (!locStr) return { province: '未知', city: '未知' };
    const pMatch = locStr.match(/.*?(省|自治区|北京市|上海市|天津市|重庆市)/);
    const province = pMatch ? pMatch[0] : '其他';
    const rest = locStr.replace(province, '');
    const cMatch = rest.match(/.*?(市|自治州|地区|盟)/);
    return { province, city: cMatch ? cMatch[0] : '全境' };
  }

  fetch('/rate/rate_data.json').then(r => r.json()).then(data => { 
    globalData = data; 
    initFilterOptions();
    switchTab('attractions');
  });

  function initFilterOptions() {
    const pSelect = document.getElementById('filter-province');
    const provinces = new Set(['全部省份']);
    globalData.attractions.forEach(item => provinces.add(parseLocation(item.location).province));
    pSelect.innerHTML = Array.from(provinces).map(p => `<option value="${p}">${p}</option>`).join('');
    updateCityOptions();
  }

  function updateCityOptions() {
    const province = document.getElementById('filter-province').value;
    const cSelect = document.getElementById('filter-city');
    const cities = new Set(['全部城市']);
    globalData.attractions.forEach(item => {
      const loc = parseLocation(item.location);
      if (province === '全部省份' || loc.province === province) cities.add(loc.city);
    });
    cSelect.innerHTML = Array.from(cities).map(c => `<option value="${c}">${c}</option>`).join('');
    applyFilters();
  }

  function applyFilters() {
    const p = document.getElementById('filter-province').value, c = document.getElementById('filter-city').value;
    const k = document.getElementById('filter-search').value.toLowerCase(), s = document.getElementById('filter-sort').value;
    let res = globalData.attractions.filter(item => {
      const loc = parseLocation(item.location);
      const matchLoc = (p === '全部省份' || loc.province === p) && (c === '全部城市' || loc.city === c);
      const searchStr = (item.name + (item.slogan||'') + (item.short_review||'') + item.tags.map(t=>t.name).join('')).toLowerCase();
      return matchLoc && (!k || searchStr.includes(k));
    });
    res.sort((a, b) => {
      if (s === 'final_score') return b.final_score - a.final_score;
      if (s === 'arch') return b.scores.architecture.val - a.scores.architecture.val;
      if (s === 'cult') return b.scores.culture.val - a.scores.culture.val;
      if (s === 'exp') return b.scores.experience.val - a.scores.experience.val;
      if (s === 'val') return b.scores.value.val - a.scores.value.val;
      if (s === 'visit_time') return new Date(b.visit_time.replace(/\./g, '/')) - new Date(a.visit_time.replace(/\./g, '/'));
      return 0;
    });
    currentFilteredData = res;
    document.getElementById('filter-count').innerText = `${res.length} 个结果`;
    renderAverageBarChart(res); renderCards(res);
  }

  function switchTab(cat) {
    document.querySelectorAll('.nuo-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${cat}`)?.classList.add('active');
    document.querySelectorAll('.nuo-section').forEach(s => s.style.display = 'none');
    document.getElementById('nuo-filter-bar').style.display = (cat === 'attractions') ? 'flex' : 'none';
    document.getElementById(`section-${cat}`).style.display = 'block';
    if (cat === 'attractions') {
      setTimeout(() => { if (!myChart) myChart = echarts.init(document.getElementById('average-bar-chart')); myChart.resize(); applyFilters(); }, 100);
    }
  }

  function renderAverageBarChart(data) {
    const display = document.getElementById('global-avg-score');
    if (!data.length) { display.innerText = "0.00"; return; }
    let arch=0, cult=0, exp=0, val=0, final=0;
    data.forEach(i => { arch+=i.scores.architecture.val; cult+=i.scores.culture.val; exp+=i.scores.experience.val; val+=i.scores.value.val; final+=i.final_score; });
    const len = data.length; display.innerText = (final/len).toFixed(2);
    if (!myChart) myChart = echarts.init(document.getElementById('average-bar-chart'));
    myChart.setOption({
      tooltip: { trigger: 'axis' }, grid: { top: 10, left: '80', right: '40', bottom: 10 },
      xAxis: { type: 'value', max: 10, splitLine: { lineStyle: { type: 'dashed' } } },
      yAxis: { type: 'category', data: ['质价比', '游览体验', '文化共鸣', '建筑视觉'], axisLine: {show:false}, axisTick: {show:false} },
      series: [{ type: 'bar', barWidth: 12, data: [(val/len).toFixed(2), (exp/len).toFixed(2), (cult/len).toFixed(2), (arch/len).toFixed(2)], itemStyle: { borderRadius: 6, color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{offset:0, color:'#3498db'}, {offset:1, color:'#2ecc71'}]) }, label: { show: true, position: 'right', fontSize: 10 } }]
    }, true);
  }

  function renderCards(data) {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    const colors = { 'S': '#FACA30', 'A': '#e74c3c', 'B': '#3498db', 'C': '#2ecc71' };
    data.forEach(item => {
      const originalIndex = globalData.attractions.findIndex(a => a.id === item.id);
      const tags = item.tags.map(t => `<span style="background:${colors[t.tier]||'#94a3b8'}; color:#fff; padding:2px 6px; border-radius:3px; font-size:10px;">${t.name}</span>`).join(' ');
      const row = (l, s) => `<div class="nuo-score-row"><div class="nuo-score-label">${l}</div><div class="nuo-score-bar-bg"><div class="nuo-score-bar-fill" style="width:${(s.val/10)*100}%;"></div></div><div class="nuo-score-value">${s.text}</div></div>`;

      container.innerHTML += `
        <div class="nuo-card">
          <div class="nuo-rating-badge">${item.rating}</div>
          <div style="margin-bottom: 12px; width: 88%;">
            <h3 style="margin: 0; font-size: 16px; color: #1e293b; display: flex; align-items: center; flex-wrap: wrap;">
              ${item.name} 
              ${item.link ? 
                `<a href="${item.link}" target="_blank" class="nuo-detail-link">📝 深度评测 ➔</a>` : 
                `<span class="nuo-detail-link nuo-light-link" onclick="openModal(${originalIndex})">💬 简评 & 照片</span>`}
            </h3>
            ${item.slogan ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px; font-style: italic; opacity: 0.8;">「 ${item.slogan} 」</div>` : ''}
          </div>
          ${row('建筑视觉', item.scores.architecture)}${row('文化共鸣', item.scores.culture)}${row('游览体验', item.scores.experience)}${row('质价比', item.scores.value)}
          <div style="margin-top: 10px; display: flex; gap: 4px; flex-wrap: wrap;">${tags}</div>
          <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size: 10px; color: #94a3b8;">📍 ${item.location}<br>🗓️ ${item.visit_time}</div>
            <div style="text-align: right;"><strong style="font-size: 20px; color: #1e293b;">${item.final_score}</strong></div>
          </div>
        </div>`;
    });
  }

  function openModal(idx) {
    if (idx === -1) return;
    const item = globalData.attractions[idx];
    document.getElementById('modal-title').innerText = item.name;
    document.getElementById('modal-text').innerText = item.short_review || '暂无评价';
    document.getElementById('modal-images').innerHTML = (item.images||[]).map(u => `<img src="${u}" class="nuo-modal-img" />`).join('');
    document.getElementById('nuo-modal').style.display = 'flex';
  }

  function closeModal() { document.getElementById('nuo-modal').style.display = 'none'; }
  window.onclick = (e) => { if (e.target.id === 'nuo-modal') closeModal(); }
  window.onresize = () => { if(myChart) myChart.resize(); };
</script>