---
title: 1nuo 评测
date: 2026-02-20 17:50
top_img: /img/academicbanner.jpg
---

<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>

<div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center;">
  <button id="btn-attractions" class="nuo-tab-btn" onclick="switchTab('attractions')">🏛️ 景点评测</button>
  <button id="btn-digital" class="nuo-tab-btn" onclick="switchTab('digital')">🍹 饮品评测</button>
  
  <a href="/rate/admin/" class="nuo-tab-btn" style="text-decoration: none; color: inherit; margin-left: auto; font-size: 14px; display: flex; align-items: center; gap: 5px;" title="进入后台">
    <span>⚙️</span> 评测后台
  </a>
</div>

<div id="section-attractions" class="nuo-section" style="display: none;">
  <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; padding: 0 5px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
    <h2 style="margin: 0; font-size: 18px; color: #333;">🏛️ 所有景点均分</h2>
    <div style="text-align: right;">
      <div style="font-size: 12px; color: #888;">平均综合得分</div>
      <strong id="global-avg-score" style="font-size: 24px; color: #2c3e50; line-height: 1;">0.00</strong>
    </div>
  </div>
  <div id="average-bar-chart" style="width: 100%; height: 200px; margin-bottom: 20px;"></div>
  <div id="cards-container" style="display: flex; flex-wrap: wrap; gap: 20px;"></div>
</div>

<div id="section-digital" class="nuo-section" style="display: none;">
  <div style="padding: 80px 20px; text-align: center; background: #fffdf6; border: 2px dashed #f1c40f; border-radius: 16px; color: #e67e22; margin-top: 10px;">
    <div style="font-size: 40px; margin-bottom: 15px;">🍹</div>
    <div style="font-size: 18px; font-weight: bold;">饮品评测维度还在开发中...</div>
    <div style="font-size: 13px; color: #999; margin-top: 10px;">敬请期待 1nuo 的数字化尝新报告</div>
  </div>
</div>

<div id="nuo-modal" class="nuo-modal">
  <div class="nuo-modal-content">
    <span class="nuo-modal-close" onclick="closeModal()">&times;</span>
    <h3 id="modal-title" style="margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">景点名称</h3>
    <div id="modal-text" style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 15px; white-space: pre-wrap;">简评内容</div>
    <div id="modal-images" style="display: flex; flex-wrap: wrap; gap: 10px;"></div>
  </div>
</div>

<style>
  .nuo-tab-btn {
    padding: 8px 16px; border: 1px solid #ddd; border-radius: 8px;
    background: #f8f9fa; cursor: pointer; font-weight: bold; transition: 0.3s;
    font-size: 14px;
  }
  .nuo-tab-btn:hover { background: #e9ecef; border-color: #3498db; color: #3498db; }
  .nuo-tab-btn.active { background: #2c3e50; color: #fff; border-color: #2c3e50; }
  
  .nuo-card {
    position: relative; 
    border: 1px solid #eee; border-radius: 12px; padding: 20px; width: 100%; max-width: 350px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.05); background: #fff; transition: transform 0.2s;
  }
  .nuo-card:hover { transform: translateY(-5px); }
  
  .nuo-rating-badge {
    position: absolute; top: 20px; right: 20px; 
    font-size: 28px; font-weight: 900; color: #e74c3c; font-style: italic;
    text-shadow: 1px 1px 2px rgba(231,76,60,0.2);
  }

  .nuo-score-row { display: flex; align-items: center; margin-bottom: 10px; font-size: 13px; }
  .nuo-score-label { width: 65px; color: #555; font-weight: bold; }
  .nuo-score-bar-bg { flex-grow: 1; height: 10px; background: #f0f0f0; border-radius: 5px; margin: 0 10px; overflow: hidden; }
  .nuo-score-bar-fill { height: 100%; border-radius: 5px; background: linear-gradient(90deg, #83bff6, #188df0); transition: width 1s ease-in-out; }
  .nuo-score-value { width: 40px; text-align: left; padding-left: 5px; font-weight: bold; color: #2c3e50; }
  
  .nuo-detail-link {
    font-size: 13px; color: #3498db; text-decoration: none; font-weight: normal; 
    margin-left: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid transparent; transition: 0.2s; cursor: pointer;
  }
  .nuo-detail-link:hover { background: #eaf2f8; border-color: #3498db; }
  .nuo-light-link { color: #2ecc71; border-color: transparent; }
  .nuo-light-link:hover { background: #e9f7ef; border-color: #2ecc71; }

  .nuo-modal {
    display: none; position: fixed; z-index: 9999; left: 0; top: 0; width: 100%; height: 100%;
    background-color: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
    justify-content: center; align-items: center;
  }
  .nuo-modal-content {
    background-color: #fefefe; padding: 20px; border-radius: 12px;
    width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative;
    animation: slideIn 0.3s ease-out;
  }
  @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .nuo-modal-close {
    color: #aaa; position: absolute; right: 20px; top: 15px;
    font-size: 28px; font-weight: bold; cursor: pointer; transition: 0.2s;
  }
  .nuo-modal-close:hover { color: #e74c3c; }
  .nuo-modal-img { width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 10px; }
</style>

<script>
  let globalData = {};

  fetch('/rate/rate_data.json')
    .then(response => response.json())
    .then(data => { 
      globalData = data; 
      // 默认加载景点
      switchTab('attractions');
    })
    .catch(error => console.error('数据加载失败:', error));

  function switchTab(category) {
    // 处理按钮激活状态
    document.querySelectorAll('.nuo-tab-btn').forEach(btn => btn.classList.remove('active'));
    // 只有非链接按钮才会被激活（排除后台按钮）
    const activeBtn = document.getElementById(`btn-${category}`);
    if(activeBtn) activeBtn.classList.add('active');

    // 处理板块显示
    document.querySelectorAll('.nuo-section').forEach(sec => sec.style.display = 'none');
    const section = document.getElementById(`section-${category}`);
    if(section) section.style.display = 'block';

    // 渲染逻辑
    if (category === 'attractions' && globalData.attractions) {
      renderAverageBarChart(globalData.attractions);
      renderCards(globalData.attractions);
    }
  }

  function renderAverageBarChart(data) {
    if (!data || data.length === 0) return;
    let sumArch = 0, sumCult = 0, sumExp = 0, sumVal = 0, sumFinal = 0;
    data.forEach(item => {
      sumArch += item.scores.architecture.val; 
      sumCult += item.scores.culture.val;
      sumExp += item.scores.experience.val; 
      sumVal += item.scores.value.val; 
      sumFinal += item.final_score; 
    });
    const len = data.length;
    document.getElementById('global-avg-score').innerText = (sumFinal / len).toFixed(2);

    var chartDom = document.getElementById('average-bar-chart');
    var myChart = echarts.getInstanceByDom(chartDom);
    if (myChart) myChart.dispose();
    myChart = echarts.init(chartDom);
    var option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { top: 10, left: '3%', right: '10%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', max: 10, splitLine: { show: true, lineStyle: { type: 'dashed' } } },
      yAxis: { type: 'category', data: ['质价比', '游览体验', '文化共鸣', '建筑视觉'], axisTick: { show: false } },
      series: [{
        name: '平均得分', type: 'bar', barWidth: 12,
        data: [(sumVal/len).toFixed(2), (sumExp/len).toFixed(2), (sumCult/len).toFixed(2), (sumArch/len).toFixed(2)],
        itemStyle: { borderRadius: [0, 10, 10, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#f39c12' }, { offset: 1, color: '#e67e22' }]) },
        label: { show: true, position: 'right' }
      }]
    };
    myChart.setOption(option);
  }

  function openModal(index) {
    const item = globalData.attractions[index];
    document.getElementById('modal-title').innerText = item.name + " - 简评";
    document.getElementById('modal-text').innerText = item.short_review || '暂无文字评价';
    
    const imgContainer = document.getElementById('modal-images');
    imgContainer.innerHTML = '';
    if(item.images && item.images.length > 0) {
      item.images.forEach(url => {
        imgContainer.innerHTML += `<img src="${url}" class="nuo-modal-img" alt="现场照片" />`;
      });
    }
    document.getElementById('nuo-modal').style.display = 'flex';
  }

  function closeModal() {
    document.getElementById('nuo-modal').style.display = 'none';
  }

  window.onclick = function(event) {
    const modal = document.getElementById('nuo-modal');
    if (event.target == modal) { modal.style.display = "none"; }
  }

  function renderCards(data) {
    const container = document.getElementById('cards-container');
    container.innerHTML = ''; 
    const tierColors = { 'S': '#FACA30', 'A': '#e74c3c', 'B': '#3498db', 'C': '#2ecc71' };
    
    data.forEach((item, index) => {
      const tagsHtml = item.tags.map(tag => {
        const bgColor = tierColors[tag.tier] || '#95a5a6';
        return `<span title="Tier: ${tag.tier}" style="background:${bgColor}; color:#fff; padding:3px 10px; border-radius:4px; font-size:12px; cursor:help; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${tag.name}</span>`;
      }).join(' ');

      const makeRow = (label, scoreObj) => `
        <div class="nuo-score-row">
          <div class="nuo-score-label">${label}</div>
          <div class="nuo-score-bar-bg"><div class="nuo-score-bar-fill" style="width: ${(scoreObj.val / 10) * 100}%;"></div></div>
          <div class="nuo-score-value">${scoreObj.text}</div>
        </div>
      `;

      const sloganHtml = item.slogan ? `<div style="font-size: 13px; color: #7f8c8d; font-style: italic; margin-top: 5px;">「 ${item.slogan} 」</div>` : '';
      let linkHtml = '';
      if (item.link) {
        linkHtml = `<a href="${item.link}" target="_blank" class="nuo-detail-link">📝 深度评测 ➔</a>`;
      } else if (item.short_review || (item.images && item.images.length > 0)) {
        linkHtml = `<span class="nuo-detail-link nuo-light-link" onclick="openModal(${index})">💬 简评 & 照片</span>`;
      }

      const cardHTML = `
        <div class="nuo-card">
          <div class="nuo-rating-badge">${item.rating}</div>
          <div style="border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px; width: 80%;">
            <h3 style="margin: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 5px; font-size: 16px;">
              ${item.name} ${linkHtml}
            </h3>
            ${sloganHtml}
          </div>
          <div style="margin-bottom: 15px;">
            ${makeRow('建筑视觉', item.scores.architecture)}
            ${makeRow('文化共鸣', item.scores.culture)}
            ${makeRow('游览体验', item.scores.experience)}
            ${makeRow('质价比', item.scores.value)}
          </div>
          <div style="margin-top: 10px; margin-bottom: 5px; display: flex; gap: 5px; flex-wrap: wrap;">${tagsHtml}</div>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ccc; display:flex; justify-content:space-between; align-items:flex-end;">
            <div style="display: flex; flex-direction: column; gap: 4px; max-width: 65%;">
              <span style="font-size: 11px; color: #888; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">📍 ${item.location || '未知'}</span>
              <span style="font-size: 11px; color: #888; font-style: italic;">🗓️ ${item.visit_time || '未知'}</span>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #888;">综合得分</div>
              <strong style="font-size: 22px; color: #2c3e50; line-height: 1;">${item.final_score}</strong>
            </div>
          </div>
        </div>
      `;
      container.innerHTML += cardHTML;
    });
  }
</script>

---