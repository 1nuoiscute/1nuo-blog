# 1nuo 项目上下文记录

这份文件用于记录项目的真实背景、当前状态和协作时需要遵守的边界。修改项目之前，先读这里，再读相关更新公告。

## 网站定位

1nuo 是以个人博客为核心的数字花园，不是一个单一功能的技术 Demo。博客文章、学习笔记、互动小应用和个人记录都属于项目本身。

当前主要内容包括：

- `source/_posts/`：随笔、项目经历和更新公告。
- `source/notes/`：C 语言、数据结构、线性代数、电路分析等学习笔记。
- `source/explore/`：SBTI、SCL-90、Bingo、2048、幸运签、塔罗牌等互动功能。
- `source/rate/`：个人景点评测记录、数据和展示页面。这些内容属于博客记录，不应因为独立仓库的状态而删除。

## 真实部署链路

```text
本地修改
  → git push GitHub（master）
  → Vercel 自动安装依赖并执行 hexo generate
  → Vercel 发布静态站点
  → Cloudflare 为 1nuo.me 提供 DNS、CDN 和 SSL
```

日常工作不要求在本地执行 Hexo 构建。推送 GitHub 后由 Vercel 完成构建和部署。仓库的实际域名是 `https://1nuo.me`，不是配置文件里的示例域名。

由于当前网络环境，GitHub HTTPS 推送可能被重置；SSH 推送通常更可靠：

```bash
git push git@github.com:1nuoiscute/1nuo-blog.git master
```

## 当前功能与历史功能

### 当前内容

“探索”和博客里的评测页面是网站现有内容的一部分。探索区是互动实验和娱乐功能，评测页面是个人旅行记录与展示，不应仅按“是否有外部用户”判断其存在意义。

### 已停用的电气简报

西南交大电气简报自动化流水线曾于 2026-02-17 至 2026-05-20 运行，共 29 期，已在 2026-05-21 停更。停更原因和历史总结见：

- `source/_posts/ee-intelligence-shutdown.md`
- `source/_posts/site-update-2026-05-21.md`

`spy_v1.4.py`、`spy_v1.5.py` 和 `.github/workflows/news_spy.yml` 是历史项目记录，不是当前网站运行链路。不要把它们描述成仍在工作的自动化功能。

## 评测系统的两个层次

需要严格区分：

1. 博客仓库里的 `source/rate/`：个人评测记录和网站页面，是博客内容的一部分，应保留，除非用户明确要求删除。
2. GitHub 上独立的 `1nuo-rate` 仓库：评测工具的独立源码副本。该仓库目前已设为私有，暂时不处理、不删除，除非用户再次明确决定。

用户考虑的是独立仓库是否继续保留，不是删除博客里的评测内容。

## 重要协作边界

- 删除、归档或重构较大功能前，先和用户讨论其意义，不要根据“没人关注”直接推断应该删除。
- 先读更新公告和项目记录，再判断某个脚本或功能是否仍在运行。
- README 应优先介绍当前网站实际存在的探索、内容、笔记和评测功能；历史项目只做准确的归档说明。
- 不要把独立仓库、博客页面和博客内容混为一谈。
- 不要在文档中写入 GitHub Token、API Key 或其他凭据。

## 已完成的工程修复

- `_config.yml` 的站点 URL 已改为 `https://1nuo.me`。
- 修正了 `index_generator` 和 `topindex_generator` 的 YAML 缩进。
- 塔罗牌数据测试脚本已改为跨平台路径，命令是 `npm run test:cards`。
- 增加了 GitHub Actions 构建校验，但它不替代 Vercel 部署。
- 博客评测后台不再把 GitHub Token 写入 `localStorage`。
- README 已改为介绍当前网站功能，并注明评测系统目前是隐藏的实验功能。

