---
title: 1nuo 评测
date: 2026-02-20 17:50
top_img: https://img.1nuo.me/img/academicbanner.webp
---

<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>

<div class="nuo-nav-container">
  <div class="nuo-nav-left">
    <button id="btn-attractions" class="nuo-tab-btn" onclick="switchTab('attractions')">🏛️ 景点评测</button>
    <button id="btn-digital" class="nuo-tab-btn" onclick="switchTab('digital')">🍹 饮品评测</button>
    <button class="nuo-tab-btn nuo-pk-trigger" onclick="openPKModal()">⚔️ 景点比拼</button>
  </div>
  <a href="/rate/admin/index.html" class="nuo-tab-btn nuo-admin-btn">
    <span>⚙️</span> 评测后台
  </a>
</div>

<div id="nuo-filter-bar" style="display: none; margin-bottom: 20px; padding: 15px; background: #fff; border-radius: 12px; border: 1px solid #eee; gap: 12px; align-items: center; flex-wrap: wrap; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
  <div class="filter-group"><span class="filter-label">地区:</span><select id="filter-province" onchange="onProvinceChange()" class="nuo-select"></select><select id="filter-city" onchange="applyFilters()" class="nuo-select"></select></div>
  <div class="filter-group"><span class="filter-label">排序:</span><select id="filter-sort" onchange="applyFilters()" class="nuo-select">
    <option value="default">默认记录</option><option value="visit_time">游玩时间 ↓</option><option value="final_score">综合得分 ↓</option>
    <option value="arch">建筑视觉 ↓</option><option value="cult">文化共鸣 ↓</option><option value="exp">游览体验 ↓</option><option value="val">质价比 ↓</option>
  </select></div>
  <div class="filter-group" style="flex-grow: 1; min-width: 180px;"><span class="filter-label">搜索:</span><input type="text" id="filter-search" oninput="applyFilters()" placeholder="搜景点、标签、简评..." class="nuo-input"></div>
  <div id="filter-count" style="font-size: 11px; color: #94a3b8; font-weight: bold; background: #f1f5f9; padding: 3px 10px; border-radius: 20px;"></div>
</div>

<div id="section-attractions" class="nuo-section" style="display: none;">
  <div class="chart-header">
    <h2 style="margin: 0; font-size: 17px; color: #333;">🏛️ 评分看板</h2>
    <div style="text-align: right;"><div style="font-size: 10px; color: #999;">Average</div><strong id="global-avg-score" style="font-size: 26px; color: #2c3e50; line-height: 1;">0.00</strong></div>
  </div>
  <div style="width: 100%; overflow: hidden;"><div id="average-bar-chart" style="width: 100%; height: 240px; margin-bottom: 15px;"></div></div>
  <div id="cards-container" style="display: flex; flex-wrap: wrap; gap: 20px;"></div>
</div>

<div id="section-digital" class="nuo-section" style="display: none;">
  <div style="padding: 60px 20px; text-align: center; background: #fffdf6; border: 2px dashed #f1c40f; border-radius: 16px; color: #e67e22;"><div style="font-size: 40px;">🍹</div><div style="font-size: 16px; font-weight: bold;">饮品评测维度还在开发中...</div></div>
</div>

<div id="pk-modal" class="nuo-modal">
  <div class="nuo-modal-content" style="max-width: 800px; width: 95%;">
    <span class="nuo-modal-close" onclick="closePKModal()">&times;</span>
    <h3 style="text-align: center; margin-bottom: 25px;">⚔️ 景点对撞机</h3>
    <div style="display: flex; gap: 20px; align-items: flex-start; position: relative;">
      <div id="pk-slot-0" class="pk-slot" onclick="showPKList(0, event)"><div class="pk-plus">+</div></div>
      <div class="pk-vs-circle">VS</div>
      <div id="pk-slot-1" class="pk-slot" onclick="showPKList(1, event)"><div class="pk-plus">+</div></div>
    </div>
    <div id="pk-comparison-area" style="margin-top: 30px; display: none;"></div>
  </div>
</div>

<div id="pk-list-popover" class="nuo-popover"><div id="pk-list-items"></div></div>

<div id="nuo-modal" class="nuo-modal">
  <div class="nuo-modal-content"><span class="nuo-modal-close" onclick="closeModal()">&times;</span><h3 id="modal-title"></h3><div id="modal-text"></div><div id="modal-images"></div></div>
</div>

<style>
  .nuo-nav-container { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
  .nuo-nav-left { display: flex; gap: 10px; align-items: center; }
  .nuo-tab-btn { display: inline-flex; align-items: center; justify-content: center; height: 36px; padding: 0 16px; border: 1px solid #ddd; border-radius: 8px; background: #f8f9fa; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.3s; line-height: 1; }
  .nuo-tab-btn.active { background: #2c3e50; color: #fff; border-color: #2c3e50; }
  .nuo-pk-trigger { border-color: #e74c3c; color: #e74c3c; }
  .nuo-admin-btn { text-decoration: none; color: #666; font-size: 12px; }

  .filter-group { display: flex; align-items: center; gap: 6px; }
  .filter-label { font-size: 12px; font-weight: 800; color: #64748b; }
  .nuo-select, .nuo-input { padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12px; outline: none; }
  .chart-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; border-bottom: 2px solid #eee; }

  .nuo-card { position: relative; border: 1px solid #eee; border-radius: 14px; padding: 18px; width: 100%; max-width: 340px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); background: #fff; transition: 0.3s; }
  .nuo-rating-badge { position: absolute; top: 15px; right: 15px; font-size: 28px; font-weight: 900; color: #e74c3c; font-style: italic; opacity: 0.7; }
  
  /* --- 修复对齐的关键 CSS --- */
  .nuo-score-row { display: flex; align-items: center; margin-bottom: 8px; font-size: 12px; }
  .nuo-score-label { width: 65px; color: #666; font-weight: bold; flex-shrink: 0; } /* 固定宽度 */
  .nuo-score-bar-bg { flex-grow: 1; height: 8px; background: #f0f0f0; border-radius: 4px; margin: 0 10px; overflow: hidden; }
  .nuo-score-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #83bff6, #188df0); transition: width 0.8s; }
  .nuo-score-value { width: 40px; font-weight: bold; color: #333; flex-shrink: 0; text-align: left; } /* 固定宽度 + 左对齐 */

  .nuo-detail-link { font-size: 11px; color: #3498db; text-decoration: none; margin-left: 8px; padding: 2px 6px; border-radius: 4px; border: 1px solid transparent; cursor: pointer; }
  .nuo-light-link { color: #2ecc71; border: 1px solid #dcfce7; background: #f0fdf4; }

  .pk-slot { flex: 1; min-height: 120px; border: 2px dashed #cbd5e1; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #f8fafc; cursor: pointer; }
  .pk-plus { font-size: 40px; color: #cbd5e1; pointer-events: none; }
  .pk-vs-circle { background: #e74c3c; color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; position: absolute; left: 50%; top: 40px; transform: translateX(-50%); z-index: 5; }
  .nuo-popover { display: none; position: fixed; z-index: 100000; background: #fff; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid #ddd; max-height: 250px; overflow-y: auto; width: 180px; }
  .pk-item { padding: 10px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #f8fafc; }
  .pk-item:hover { background: #f0f9ff; color: #3498db; }
  .pk-win-label { color: #e67e22; font-weight: 900; font-size: 10px; margin-left: 5px; }

  .nuo-modal { display: none; position: fixed; z-index: 99999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); justify-content: center; align-items: center; }
  .nuo-modal-content { background: #fff; padding: 20px; border-radius: 12px; max-height: 85vh; overflow-y: auto; position: relative; }
  .nuo-modal-close { position: absolute; right: 15px; top: 10px; font-size: 26px; cursor: pointer; color: #999; }
  .nuo-modal-img { width: 100%; border-radius: 8px; }
</style>

<script>
  let globalData = {};
  let myChart = null;
  let pkSelected = [null, null];

  function parseLocation(locStr) {
    if (!locStr) return { province: '未知', city: '未知' };
    const pMatch = locStr.match(/.*?(省|自治区|北京市|上海市|天津市|重庆市)/);
    const province = pMatch ? pMatch[0] : '其他';
    const rest = locStr.replace(province, '');
    const cMatch = rest.match(/.*?(市|自治州|地区|盟)/);
    return { province, city: cMatch ? cMatch[0] : '全境' };
  }

  fetch('/rate/rate_data.json').then(r => r.json()).then(data => { 
    globalData = data; initFilterOptions(); switchTab('attractions');
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
      const searchStr = (item.name + (item.slogan||'') + (item.short_review||'') + item.tags.map(t=>t.name).join('')).toLowerCase();
      return (p === '全部省份' || loc.province === p) && (c === '全部城市' || loc.city === c) && (!k || searchStr.includes(k));
    });
    res.sort((a, b) => {
      if (s === 'final_score') return b.final_score - a.final_score;
      if (s === 'arch') return b.scores.architecture.val - a.scores.architecture.val;
      if (s === 'visit_time') return new Date(b.visit_time.replace(/\./g, '/')) - new Date(a.visit_time.replace(/\./g, '/'));
      return 0;
    });
    renderAverageBarChart(res); renderCards(res);
  }

  function renderAverageBarChart(data) {
    const len = data.length; if (!len) return;
    let arch=0, cult=0, exp=0, val=0, final=0;
    data.forEach(i => { arch+=i.scores.architecture.val; cult+=i.scores.culture.val; exp+=i.scores.experience.val; val+=i.scores.value.val; final+=i.final_score; });
    document.getElementById('global-avg-score').innerText = (final/len).toFixed(2);
    if (!myChart) myChart = echarts.init(document.getElementById('average-bar-chart'));
    myChart.setOption({
      tooltip: { trigger: 'axis' }, grid: { top: 20, left: '85', right: '50', bottom: '35' },
      xAxis: { type: 'value', max: 10, splitLine: { lineStyle: { type: 'dashed' } } },
      yAxis: { type: 'category', data: ['质价比', '游览体验', '文化共鸣', '建筑视觉'], axisLine: {show:false}, axisTick: {show:false} },
      series: [{ type: 'bar', barWidth: 12, data: [(val/len).toFixed(2), (exp/len).toFixed(2), (cult/len).toFixed(2), (arch/len).toFixed(2)], itemStyle: { borderRadius: 6, color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{offset:0, color:'#3498db'}, {offset:1, color:'#2ecc71'}]) }, label: { show: true, position: 'right' } }]
    }, true);
  }

  function renderCards(data) {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    const colors = { 'S': '#FACA30', 'A': '#e74c3c', 'B': '#3498db', 'C': '#2ecc71' };
    data.forEach(item => {
      const idx = globalData.attractions.findIndex(a => a.id === item.id);
      const tags = item.tags.map(t => `<span style="background:${colors[t.tier]||'#94a3b8'}; color:#fff; padding:2px 6px; border-radius:3px; font-size:10px;">${t.name}</span>`).join(' ');
      
      // 这里的 row 保持原来的变量名，但样式已在上面 CSS 中修复
      const row = (l, s) => `<div class="nuo-score-row"><div class="nuo-score-label">${l}</div><div class="nuo-score-bar-bg"><div class="nuo-score-bar-fill" style="width:${(s.val/10)*100}%;"></div></div><div class="nuo-score-value">${s.text}</div></div>`;

      container.innerHTML += `
        <div class="nuo-card">
          <div class="nuo-rating-badge">${item.rating}</div>
          <div style="margin-bottom: 12px; width: 88%;">
            <h3 style="margin: 0; font-size: 16px; color: #1e293b; display: flex; align-items: center; flex-wrap: wrap;">${item.name} 
              ${item.link ? `<a href="${item.link}" target="_blank" class="nuo-detail-link">📝 深度评测 ➔</a>` : `<span class="nuo-detail-link nuo-light-link" onclick="openModal(${idx})">💬 简评 & 照片</span>`}</h3>
            ${item.slogan ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px; font-style: italic; opacity: 0.8;">「 ${item.slogan} 」</div>` : ''}
          </div>
          ${row('建筑视觉', item.scores.architecture)}
          ${row('文化共鸣', item.scores.culture)}
          ${row('游览体验', item.scores.experience)}
          ${row('质价比', item.scores.value)}
          <div style="margin-top: 10px; display: flex; gap: 4px; flex-wrap: wrap;">${tags}</div>
          <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size: 10px; color: #94a3b8;">📍 ${item.location}<br>🗓️ ${item.visit_time}</div>
            <div style="text-align: right;"><strong style="font-size: 20px; color: #1e293b;">${item.final_score}</strong></div>
          </div>
        </div>`;
    });
  }

  function openPKModal() { pkSelected = [null, null]; document.getElementById('pk-comparison-area').style.display='none'; renderPKSlots(); document.getElementById('pk-modal').style.display='flex'; }
  function closePKModal() { document.getElementById('pk-modal').style.display='none'; }
  function renderPKSlots() {
    pkSelected.forEach((item, i) => {
      const slot = document.getElementById(`pk-slot-${i}`);
      if (item) {
        slot.innerHTML = `<div style="text-align: center;"><div style="font-weight: bold; color: #1e293b;">${item.name}</div><div style="font-size: 10px; color: #64748b;">${item.location}</div><div style="margin-top: 8px; font-size: 11px; color: #3498db;">[ 重选 ]</div></div>`;
      } else {
        slot.innerHTML = `<div class="pk-plus">+</div>`;
      }
    });
    if (pkSelected[0] && pkSelected[1]) renderPKComparison();
  }
  function showPKList(idx, e) {
    const pop = document.getElementById('pk-list-popover');
    document.getElementById('pk-list-items').innerHTML = globalData.attractions.map(a => `<div class="pk-item" onclick="selectForPK(${idx},'${a.id}')">${a.name}</div>`).join('');
    const rect = e.currentTarget.getBoundingClientRect();
    pop.style.top = (rect.bottom + 5) + 'px';
    pop.style.left = (rect.left) + 'px';
    pop.style.display = 'block';
    e.stopPropagation();
  }
  function selectForPK(idx, id) { pkSelected[idx] = globalData.attractions.find(a => a.id === id); document.getElementById('pk-list-popover').style.display = 'none'; renderPKSlots(); }
  function renderPKComparison() {
    const area = document.getElementById('pk-comparison-area');
    const [a, b] = pkSelected;
    const row = (l, va, vb, ta, tb) => `<div style="margin-bottom: 20px;"><div style="text-align: center; font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 8px;">${l}</div><div style="display: flex; align-items: center; gap: 15px;"><div style="flex: 1; text-align: right;"><span style="font-weight: 800;">${ta}</span>${va>vb?'<span class="pk-win-label">🏆</span>':''}<div class="nuo-score-bar-bg" style="transform: rotate(180deg);"><div class="nuo-score-bar-fill" style="width: ${va*10}%"></div></div></div><div style="flex: 1; text-align: left;">${vb>va?'<span class="pk-win-label">🏆</span>':''}<span style="font-weight: 800;">${tb}</span><div class="nuo-score-bar-bg"><div class="nuo-score-bar-fill" style="width: ${vb*10}%"></div></div></div></div></div>`;
    area.innerHTML = row('综合评分', a.final_score, b.final_score, a.final_score, b.final_score)+row('建筑视觉', a.scores.architecture.val, b.scores.architecture.val, a.scores.architecture.text, b.scores.architecture.text)+row('文化共鸣', a.scores.culture.val, b.scores.culture.val, a.scores.culture.text, b.scores.culture.text)+row('游览体验', a.scores.experience.val, b.scores.experience.val, a.scores.experience.text, b.scores.experience.text)+row('质价比', a.scores.value.val, b.scores.value.val, a.scores.value.text, b.scores.value.text);
    area.style.display = 'block';
  }

  window.onclick = (e) => { 
    document.getElementById('pk-list-popover').style.display = 'none';
    if (e.target.id === 'nuo-modal' || e.target.id === 'pk-modal') { closeModal(); closePKModal(); }
  }
  function openModal(idx) {
    const item = globalData.attractions[idx];
    document.getElementById('modal-title').innerText = item.name;
    document.getElementById('modal-text').innerText = item.short_review || '暂无评价';
    document.getElementById('modal-images').innerHTML = (item.images||[]).map(u => `<img src="${u}" class="nuo-modal-img" />`).join('');
    document.getElementById('nuo-modal').style.display = 'flex';
  }
  function closeModal() { document.getElementById('nuo-modal').style.display = 'none'; }
  function switchTab(cat) {
    document.querySelectorAll('.nuo-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${cat}`)?.classList.add('active');
    document.querySelectorAll('.nuo-section').forEach(s => s.style.display = 'none');
    document.getElementById('nuo-filter-bar').style.display = (cat === 'attractions') ? 'flex' : 'none';
    document.getElementById(`section-${cat}`).style.display = 'block';
    if (cat === 'attractions') setTimeout(() => { if(myChart) myChart.resize(); applyFilters(); }, 100);
  }
</script>