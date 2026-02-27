---
title: 基于 Cloudflare + Deepseek 的私人资产管理平台 1nuo-wealth 发布
date: 2026-02-27 13:54:13
tags: [开源项目, Java, DeepSeek, Cloudflare, 资产管理, AI,]
categories: [项目记录]
top_img: https://img.1nuo.me/img/academicbanner.webp
---

市面上的记账 App 很多，但用起来总觉得差点意思：要么充斥着理财广告和开屏弹窗，要么很难把“日常流水账”和“基金理财动态市值”有机地结合在一个大盘里。
我决定自己动手，写一个完全受自己控制的财务中枢——**1nuo-wealth**。

<div style="display: flex; justify-content: space-between; gap: 10px;">
  <img src="https://img.1nuo.me/blog/2026/02/25/242b0d0c21a772f08399759f7d6e3932.webp" style="width: 32%; margin: 0; border-radius: 8px; object-fit: cover;" />
  <img src="https://img.1nuo.me/blog/2026/02/25/dd76d4d9d8e1decf2fc00b50c811b9f1.webp" style="width: 32%; margin: 0; border-radius: 8px; object-fit: cover;" />
  <img src="https://img.1nuo.me/blog/2026/02/25/284331e2ae3aa1d8c237df5cc1d011f2.webp" style="width: 32%; margin: 0; border-radius: 8px; object-fit: cover;" />
</div>

## 💡 技术选型与初衷

底层架构选择了 **Cloudflare Workers + D1 数据库**，这意味着只要有 Cloudflare 账号，任何人都可以零成本将这套系统部署在边缘节点上，数据完全握在自己手里。

而在交互体验上，我接入了 **DeepSeek (V3/R1)** 的大模型 API，用来解决传统记账最繁琐的“分类与录入”问题。

## 🛠️ 核心特性

去掉那些花哨的概念，1nuo-wealth 主要为你解决以下三个痛点：

### 1. 自然语言记账 (DeepSeek V3 驱动)
不用再在一堆分类里点来点去。你只需要输入一句“午餐肯德基50元微信付”，系统会调用大模型自动提取出：金额 50、分类餐饮、账户微信、支出类型，并直接入库。
如果账单记错了，直接对已有账单说一句“其实是支付宝付了30元”，AI 会自动分析上下文并完成修正。

### 2. 投资雷达与动态资产
系统直连了新浪财经 API，可以实时抓取偏股或货币基金的净值, 你的净资产总额是实时变动的。

无论是加减仓，还是自选基金的自动收益换算，都会动态反映到你的财务大盘中。

### 3. 多账户隔离与 AI 月度审计
* **多用户支持**：系统底层通过 `user_id` 实现了多用户数据隔离，你可以给家人开通独立的账号，数据互不干扰。
* **PWA 沉浸式体验**：手机浏览器里点击“添加到主屏幕”，就能像原生 App 一样全屏使用。
* **R1 财务报告**：月末时，系统会将当月流水和资产切片交给 DeepSeek-R1（满血版），让它帮你生成一份极具逻辑深度的 Markdown 财务健康审计报告。

## 🌐 体验与开源

目前 1nuo-wealth 已经迭代到了稳定的 v2.1 版本。如果你对这个项目感兴趣，但暂时不想自己部署，可以来我的站点体验 Live Demo：

👉 **[1nuo-wealth 在线体验端](https://wealth.1nuo.me/)** *( 注：底层已开启数据物理隔离，注册后的财务数据仅你自己可见，请放心测试 )*

**开源地址**：
如果你想查看源码或者自己部署一套，欢迎访问我的 GitHub 仓库，项目基于 MIT 协议开源。
👉 **[GitHub: 1nuoiscute/1nuo-wealth](https://github.com/1nuoiscute/1nuo-wealth)**

系统还在持续优化中，如果你在使用过程中有任何建议，欢迎在仓库提 Issue 交流。