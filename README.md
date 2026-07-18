# 1nuo

1nuo 的个人博客与数字花园，基于 [Hexo](https://hexo.io/) 和 Butterfly 主题构建。

## 内容结构

- `source/_posts/`：博客文章
- `source/notes/`：课程与学习笔记
- `source/explore/`：互动小应用及其页面入口
- `source/rate/`：1nuo 评测系统
- `themes/butterfly/`：主题及本项目的定制
- `spy_v1.5.py`：西南交大电气情报采集脚本（历史项目，已于 2026-05-21 停用）

## 本地开发

需要 Node.js 20 或更高版本：

```bash
npm ci
npm run test:cards
npm run server
```

打开 <http://localhost:4000/> 预览。生成静态文件使用：

```bash
npm run build
```

生成结果位于 `public/`，该目录不提交到 Git。

## 发布文章

```bash
npx hexo new post "文章标题"
```

编辑生成的 Markdown 文件后运行 `npm run build` 检查，再按仓库的部署配置发布。

## 历史项目：西南交大电气简报

电气简报自动化流水线曾在 2026-02-17 至 2026-05-20 运行，共发布 29 期，后来因维护成本和精力安排停止。历史文章已整理到站内的月度汇总页面。

仓库中的 `spy_v1.4.py`、`spy_v1.5.py` 与 `.github/workflows/news_spy.yml` 仅作为项目记录保留，不属于当前网站的运行链路，也不应作为日常发布流程使用。
