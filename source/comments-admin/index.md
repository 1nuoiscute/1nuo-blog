---
title: 评论管理
date: 2026-10-20 21:00:00
comments: false
aside: false
top_img: false
noindex: true
sitemap: false
search: false
---

<section class="nuo-comments nuo-review" data-nuo-comments-admin data-api="https://comments.1nuo.me">
<div class="nuo-review-intro"><p>低风险评论自动发布，其他评论由你决定。</p><a href="/account/">账号设置</a></div>
<div class="nuo-review-toolbar">
<div class="nuo-review-tabs" role="group" aria-label="评论状态"><button type="button" data-comments-tab="pending" aria-pressed="true">待审核</button><button type="button" data-comments-tab="published" aria-pressed="false">已发布</button><button type="button" data-comments-tab="hidden" aria-pressed="false">已隐藏</button></div>
<label class="nuo-comments-sr-only">查看状态 <select data-comments-filter><option value="pending">待审核</option><option value="published">已发布</option><option value="hidden">已隐藏</option></select></label>
<div class="nuo-review-actions"><button class="nuo-review-refresh" type="button" data-comments-refresh>刷新列表</button><button class="nuo-review-refresh" type="button" data-comments-diagnose>检查 AI 链路</button></div>
</div>
<p class="nuo-review-service" data-comments-service>正在检查自动审核…</p>
<p class="nuo-review-service nuo-review-diagnosis" data-comments-diagnosis hidden></p>
<p class="nuo-comments-status" data-comments-status role="status" aria-live="polite">正在验证管理员身份…</p>
<button class="nuo-comments-login" type="button" data-comments-login>登录 / 注册</button>
  <div class="nuo-comments-list" data-comments-list></div>
</section>
