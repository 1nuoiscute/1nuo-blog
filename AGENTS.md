# 1nuo 项目协作规则

开始处理本仓库的任何任务前，必须先完整阅读根目录的 [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)。

如果任务涉及某个功能是否仍在使用，先阅读对应的更新公告或项目记录，再做判断。尤其注意：

- `source/rate/` 是博客个人评测记录的一部分，不能与独立的 `1nuo-rate` 仓库混为一谈。
- `spy_v1.4.py`、`spy_v1.5.py` 和 `.github/workflows/news_spy.yml` 属于已停用的电气简报历史项目。
- 网站通过 GitHub → Vercel → Cloudflare 部署，日常任务不要求本地 Hexo 构建。
- 删除、归档或大规模重构前，先和用户讨论项目意义和影响，不要仅凭“没人关注”推断应该删除。
- 不在仓库中写入任何 Token、API Key 或其他凭据。
