---
title: 随机漫游
date: 2026-07-19
comments: false
top_img: https://img.1nuo.me/img/categoriesbanner.webp
---

<div class="nuo-wander-page">
  <div class="nuo-wander-card">
    <div class="nuo-wander-kicker">1NUO DIGITAL GARDEN</div>
    <h2>不知道看什么？</h2>
    <p>让 1nuo 随机带你去一篇文章、一份笔记，或一个小角落。</p>
    <button class="nuo-tool-btn nuo-wander-start" type="button" onclick="window.NuoTools && window.NuoTools.wander()">🎲 带我随便逛逛</button>
  </div>
</div>

<style>
  .nuo-wander-page { min-height: 45vh; display: grid; place-items: center; }
  .nuo-wander-card { width: min(100%, 620px); padding: 56px 28px; border: 1px solid #f1dbe4; border-radius: 24px; background: radial-gradient(circle at 100% 0, #fff0f6, transparent 45%), #fff; box-shadow: 0 18px 55px rgba(207, 95, 145, .12); text-align: center; }
  .nuo-wander-kicker { color: #cf5f91; font-size: .75rem; font-weight: 700; letter-spacing: .18em; }
  .nuo-wander-card h2 { margin: 18px 0 8px; color: #503845; font-size: clamp(1.7rem, 5vw, 2.5rem); }
  .nuo-wander-card p { margin: 0 auto 24px; color: #856b77; }
  .nuo-wander-start { min-height: 42px; padding: 0 20px; border-color: #f2a2c8; background: #fff2f7; color: #cf5f91; font-size: .9rem; }
</style>
