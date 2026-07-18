# 1nuo

1nuo 是一个以博客为核心的个人数字花园，内容之外也收录了一组可以直接玩的互动工具和自制系统。站点基于 Hexo + Butterfly，源码托管在 GitHub，推送后由 Vercel 自动构建发布，`1nuo.me` 的 DNS、CDN 与 SSL 由 Cloudflare 提供。

## 当前功能

### 探索

`/explore/` 是站点的互动实验区，按四个 Tab 组织：

- **测试**：SBTI 赛博人格测试、SCL-90 症状自评量表。
- **Bingo**：社会指数、阴湿青春、高中违纪、这辈子有了、Shiny 青春五款主题宾果；支持生成图片分享结果。
- **小游戏**：经典 2048。
- **好运**：幸运签和 78 张牌、多牌阵塔罗牌。

这些应用主要是独立的静态 HTML/CSS/JavaScript 页面，通过 Hexo 页面中的 iframe 嵌入，彼此隔离，适合快速迭代和部署。

### 1nuo 评测

`/rate/` 是一个自制的量化评测系统，目前用于记录景点体验：

- 从建筑视觉、文化共鸣、游览体验、质价比四个维度评分。
- 生成综合分数和 S/A/B/C 等级。
- 使用 ECharts 展示平均分和维度对比。
- 支持按省市筛选、关键词搜索、按评分或游览时间排序。
- 提供“景点对撞机”，可以选择两个景点进行横向比较。
- 评测数据存放在 `source/rate/rate_data.json`，管理页面位于 `source/rate/admin/`。

评测系统的独立源码和数据结构已开源于 [1nuoiscute/1nuo-rate](https://github.com/1nuoiscute/1nuo-rate)。

### 内容与笔记

- `source/_posts/`：随笔、项目记录和更新公告。
- `source/notes/`：课程与备考笔记，包括 C 语言、数据结构、线性代数和电路分析。
- `source/about/`、`source/link/`、`source/shuoshuo/`：关于、友链和碎碎念等站点页面。

仓库中的电气简报脚本和文章记录的是一个已经结束的实验：自动化简报于 2026-02-17 至 2026-05-20 运行，共 29 期，现已停用，历史内容已整理为月度汇总。

## 目录结构

- `source/_posts/`：博客文章
- `source/notes/`：学习笔记
- `source/explore/`：探索入口与互动应用
- `source/rate/`：评测系统页面和数据
- `themes/butterfly/`：主题及站点定制
- `scripts/`：项目辅助脚本

## 本地开发

需要 Node.js 20 或更高版本：

```bash
npm ci
npm run test:cards
npm run server
```

本地预览地址为 <http://localhost:4000/>。日常发布不需要在本地生成静态站点：修改完成后直接提交并推送到 GitHub，Vercel 会自动执行 Hexo 构建并部署。

塔罗牌数据测试可以单独运行：

```bash
npm run test:cards
```

## 发布文章

```bash
npx hexo new post "文章标题"
```

编辑生成的 Markdown 文件后提交：

```bash
git add .
git commit -m "feat: add a new post"
git push
```

推送到 `master` 后，Vercel 会自动完成生产部署。
