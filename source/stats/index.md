---
title: 站内数据
date: 2026-05-11
comments: false
top_img: https://img.1nuo.me/img/categoriesbanner.webp
---

<div id="stats-app" style="min-height:60vh;">
  <p style="text-align:center;color:#a8a29e;padding:40px;">加载中...</p>
</div>

<style>
#stats-app {
  max-width: 560px;
  margin: 0 auto;
}
.stat-card {
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
}
.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.stat-label {
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
}
.stat-count {
  font-size: 22px;
  font-weight: 700;
  color: #5A82B8;
  font-variant-numeric: tabular-nums;
}
.stat-total {
  text-align: center;
  padding: 30px 20px;
  font-size: 14px;
  color: #a8a29e;
}
.stat-total .num {
  font-size: 42px;
  font-weight: 700;
  color: #1c1917;
  display: block;
  margin: 8px 0;
  font-variant-numeric: tabular-nums;
}
</style>

<script>
(async function() {
  const names = {
    bingo1: { icon: '🎮', label: '社会指数宾果' },
    bingo2: { icon: '😔', label: '阴湿青春 BINGO' },
    bingo3: { icon: '🚨', label: '高中违纪 BINGO' },
    bingo4: { icon: '💀', label: '这辈子有了 BINGO' },
    bingo5: { icon: '✨', label: 'Shiny 青春 BINGO' },
    draw:   { icon: '🎋', label: '幸运签' },
    tarot:  { icon: '🔮', label: '塔罗牌' },
    scl90:  { icon: '📋', label: 'SCL-90 自评量表' },
    sbti:   { icon: '🤖', label: 'SBTI 赛博人格测试' }
  };

  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    const total = data.total || 0;

    let html = '<div class="stat-total"><span class="num">' + total + '</span>总互动次数</div>';

    for (const [key, info] of Object.entries(names)) {
      const count = data[key] || 0;
      html += '<div class="stat-card"><div class="stat-label">' + info.icon + ' ' + info.label + '</div><div class="stat-count">' + count + '</div></div>';
    }

    document.getElementById('stats-app').innerHTML = html;
  } catch(e) {
    document.getElementById('stats-app').innerHTML = '<p style="text-align:center;color:#e74c3c;padding:40px;">加载失败，请稍后再试</p>';
  }
})();
</script>
