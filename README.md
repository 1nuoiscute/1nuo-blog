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

站内还提供了面向文章和笔记的个人工具：随机漫游、分享卡片和本地阅读清单。阅读清单汇总收藏、已读标记、阅读进度和最近浏览，所有数据只保存在当前浏览器，不需要账号。文章和实质笔记还提供阅读模式：隐藏侧栏、居中排版，并可用 `A−` / `A＋` 调整字号，偏好保存在本地浏览器。

### 内容地图

`/graph/` 在构建时根据文章、笔记、探索和评测共享的标签与分类生成关系数据（`content-graph.json`），再用原生 SVG 画出力导向关系图，不依赖第三方图形库。

- 连线两端表示共享标签或分类，共同主题越多连线越粗，节点大小反映关联数量。
- 每个主题显示一个区域标签，关联最多的节点常显名称，其余悬停或聚焦时显示。
- 支持按主题和内容类型筛选、滚轮缩放、拖动平移、显示全部标签。
- 隐藏、加密、私人、`noindex` 内容以及后台、原始应用资源不会出现在图中。
- 关系数据不可用时降级为按 `search.json` 列出的内容清单。
- 浅色和深色主题各自定义语义令牌，加载时先占位骨架，避免内容跳动。

### 1nuo 评测

`/rate/` 是一个自制的量化评测系统，目前用于记录景点体验：

- 从建筑视觉、文化共鸣、游览体验、质价比四个维度评分。
- 生成综合分数和 S/A/B/C 等级。
- 使用 ECharts 展示平均分和维度对比。
- 支持按省市筛选、关键词搜索、按评分或游览时间排序。
- 提供“景点对撞机”，可以选择两个景点进行横向比较。
- 提供快速打卡：整体感受（1–5）和一句话都可以留空，之后再补细分评分。
- 评测数据存放在 `source/rate/rate_data.json`，管理页面位于 `source/rate/admin/`。

没有细分评分的打卡记录会显示为“待补评分”，不计入平均分和维度图表，排序时排在已评分记录之后。该系统保留使用，可从「收纳 → 评测」进入，并提供旅行足迹地图。当前实际记录以景点为主；饮品入口仍是占位，生活年报属于后续方向，尚未实施。独立的 `1nuo-rate` 仓库已设为私有，不影响博客中的评测页面和记录。

### 内容与笔记

- `source/_posts/`：随笔、项目记录和更新公告。
- `source/notes/`：课程与备考笔记，包括 C 语言、数据结构、线性代数和电路分析。
- `source/about/`、`source/link/`：关于和友链等站点页面。
- `source/shuoshuo/`：已停用的碎碎念页面保留在仓库中，不作为当前维护功能。

仓库中的电气简报脚本和文章记录的是一个已经结束的实验：自动化简报于 2026-02-17 至 2026-05-20 运行，共 29 期，现已停用，历史内容已整理为月度汇总。

## 目录结构

- `source/_posts/`：博客文章
- `source/notes/`：学习笔记
- `source/explore/`：探索入口与互动应用
- `source/rate/`：评测系统页面和数据
- `source/graph/`：内容地图页面
- `themes/butterfly/`：主题及站点定制
- `scripts/`：项目辅助脚本（含 `metadata-policy.js` 公开范围判断与 `content-graph.js` 关系数据生成）

## 订阅与搜索引擎元数据

- 订阅说明页：[`https://www.1nuo.me/subscribe/`](https://www.1nuo.me/subscribe/)，解释 RSS/Atom 是什么以及如何使用阅读器订阅。
- Atom：`https://www.1nuo.me/atom.xml`；RSS 2.0：`https://www.1nuo.me/rss.xml`，导航顶部的「订阅」菜单中提供说明和两个订阅源入口。
- 订阅最近 20 篇公开博客文章，提供摘要；隐藏、加密、私人及 `noindex` 内容不会进入订阅和 sitemap。
- 公开文章提供 `BlogPosting` 结构化数据，首页提供 `WebSite`；普通页面不冒充文章。
- 正式主域名为 `https://www.1nuo.me`，与当前线上非 www → www 的跳转方向一致。站点 URL、canonical、订阅和 sitemap 统一使用 www；Vercel 路由增加同方向永久重定向。平台级域名规则可能先返回现有的 307，最终状态码及路径、查询参数保留仍需上线后核验。
- 评测后台通过 robots meta 和 `X-Robots-Tag` 请求搜索引擎不收录，并从 sitemap 排除。故意不使用 `Disallow`，避免爬虫读不到 `noindex`；这不是密码保护或访问认证。

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

### 工程验收

```bash
npm run test:cards
npm run test:tools
npm run test:map
npm run test:regression
npm run build
npm run test:metadata
npx playwright install chromium
npm run test:browser
```

浏览器验收会临时启动仅监听本机的静态站点，结束后关闭；排行榜、地图和外部资源被隔离，不会提交生产数据。CI 使用 Chromium（Linux 安装需 `npx playwright install --with-deps chromium`），失败时上传诊断截图。测试输出位于被 Git 忽略的 `test-results/`。

GitHub Actions 仍不是 Vercel 的部署闸门：两者可能并行执行。若要求 CI 通过后才上线，需要另行配置部署策略。

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
