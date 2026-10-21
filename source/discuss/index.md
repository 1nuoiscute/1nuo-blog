---
title: 讨论
date: 2026-10-21
type: discuss
comments: false
aside: false
top_img: false
---

<section class="nuo-discuss" data-nuo-discuss aria-label="讨论区">
  <header class="nd-heading"><div><h1>讨论</h1><p>分享一个发现，问个问题，或聊聊最近的想法。</p></div><button class="nd-primary" type="button" data-discuss-new>＋ 发起讨论</button></header>
  <nav class="nd-toolbar" aria-label="筛选讨论" data-discuss-toolbar>
    <div class="nd-categories"><button type="button" data-category="" aria-pressed="true">全部</button><button type="button" data-category="chat" aria-pressed="false">随便聊聊</button><button type="button" data-category="question" aria-pressed="false">问题交流</button><button type="button" data-category="feedback" aria-pressed="false">网站反馈</button></div>
    <div class="nd-views"><button type="button" data-discuss-mine aria-pressed="false">我的帖子</button><button type="button" data-discuss-admin hidden aria-pressed="false">管理</button><label><span class="nd-sr">排序</span><select data-discuss-sort><option value="active">最新回复</option><option value="new">最新发布</option></select></label></div>
  </nav>
  <div class="nd-admin-filters" data-discuss-admin-filters hidden><label>查看状态 <select data-discuss-state><option value="pending">待审核</option><option value="published">已发布</option><option value="hidden">已隐藏</option></select></label><a href="/comments-admin/">管理回复</a></div>
  <p class="nd-status" data-discuss-status role="status" aria-live="polite">正在加载讨论…</p><div data-discuss-content></div><button class="nd-more" type="button" data-discuss-more hidden>加载更多</button>
  <section class="nd-editor" data-discuss-editor hidden aria-labelledby="nd-editor-title">
    <div class="nd-editor-heading"><h2 id="nd-editor-title">发起讨论</h2><button type="button" data-discuss-close>收起</button></div>
    <form data-discuss-form>
      <label for="nd-title">标题</label><input id="nd-title" name="title" maxlength="100" placeholder="想聊些什么？" required>
      <label for="nd-category">分类</label><select id="nd-category" name="category"><option value="chat">随便聊聊</option><option value="question">问题交流</option><option value="feedback">网站反馈</option></select>
      <div class="nd-editor-tabs"><button type="button" data-discuss-write aria-pressed="true">写正文</button><button type="button" data-discuss-preview aria-pressed="false">预览</button><span>支持 Markdown</span></div>
      <label class="nd-sr" for="nd-body">正文</label><textarea id="nd-body" name="body" rows="10" maxlength="6000" placeholder="展开说说你的想法…" required></textarea><div class="nd-prose nd-preview" data-discuss-preview-body hidden></div>
      <div class="nd-editor-bottom"><span data-discuss-draft>草稿保存在此设备</span><span data-discuss-count>0 / 6000</span><button class="nd-primary" type="submit" data-discuss-submit>发布讨论</button></div><p class="nd-status" data-discuss-form-status role="status" aria-live="polite"></p>
    </form>
  </section><noscript>请启用 JavaScript 后浏览和参与讨论。</noscript>
</section>

<template id="nd-comments-template">
<section class="nuo-comments" data-nuo-comments data-api="https://comments.1nuo.me" aria-label="回复">
  <div class="nuo-comments-heading"><h2>回复 <span class="nuo-comments-count" data-comments-count></span></h2><a class="nuo-comments-admin-link" href="/comments-admin/" hidden data-comments-admin-link>管理回复</a></div>
  <form class="nuo-comments-form" data-comments-form>
    <div class="nuo-composer-top"><div class="nuo-comments-person"><span class="nuo-comment-avatar" data-comments-avatar aria-hidden="true">访</span><div class="nuo-comments-person-copy"><strong data-comments-identity>登录后加入讨论</strong><span data-comments-identity-hint>用你的账号，留下一点想法。</span></div></div><button class="nuo-comments-login" type="button" data-comments-login>登录 / 注册</button></div>
    <div class="nuo-comments-reply" hidden data-comments-reply-box><span data-comments-reply></span><button type="button" hidden data-comments-cancel>取消回复</button></div>
    <label class="nd-sr" for="nd-reply-body">写下回复</label><textarea id="nd-reply-body" rows="3" maxlength="2000" placeholder="写下你的回复…" required disabled data-comments-body></textarea>
    <div class="nuo-composer-bottom"><small class="nuo-comments-review-note">DeepSeek 辅助审核</small><div class="nuo-comments-send"><span class="nuo-comments-counter" data-comments-counter>0 / 2000</span><button type="submit" disabled data-comments-submit>发表回复</button></div></div>
  </form><p class="nuo-comments-status" data-comments-status role="status" aria-live="polite">正在加载回复…</p><div class="nuo-comments-list" data-comments-list></div><button class="nuo-comments-more" type="button" hidden data-comments-more>加载更多</button>
</section>
</template>
