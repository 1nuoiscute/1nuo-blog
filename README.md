# 1nuo

1nuo 的个人博客与数字花园，基于 [Hexo](https://hexo.io/) 和 Butterfly 主题构建。

## 内容结构

- `source/_posts/`：博客文章
- `source/notes/`：课程与学习笔记
- `source/explore/`：互动小应用及其页面入口
- `source/rate/`：1nuo 评测系统
- `themes/butterfly/`：主题及本项目的定制
- `spy_v1.5.py`：西南交大电气情报采集脚本

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

## 自动化情报采集

`.github/workflows/news_spy.yml` 提供手动触发入口。运行前需要在 GitHub Actions Secrets 中配置：

- `DEEPSEEK_API_KEY`
- `PUSHPLUS_TOKEN`

脚本会更新历史标题、待发布数据和文章文件；请先检查生成内容再发布到生产站点。
