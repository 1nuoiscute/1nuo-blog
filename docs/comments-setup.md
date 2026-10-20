# 博客账号评论

博客仍由 GitHub → Vercel 发布。独立评论接口运行在 Cloudflare Workers，评论数据存在 D1，与现有 `1nuo_wealth` 数据库分开。

- 接口：`https://comments.1nuo.me`；健康检查 `/health`。
- Worker / 数据库：`1nuo-blog-comments`。
- 管理页：`https://www.1nuo.me/comments-admin/`。只有配置的 Clerk User ID 可审核；页面本身不代替接口权限校验。
- 博客开关：`themes/butterfly/_config.yml` 中的 `nuo_comments.api`。清空后回到原评论界面，不删除数据库。
- 原 Giscus / Twikoo 小组件在折叠的历史入口中保留，未迁移、未冻结其原有写入能力。

## 第一版行为

登录后可发纯文本评论、回复主评论和删除自己的评论。新评论默认待审核，仅作者登录后可见；管理员发布后才公开。管理员自己的评论直接发布。隐藏主评论也会隐藏其回复，删除已公开评论保留无正文的占位。

评论正文与昵称均按普通文本渲染，不解析 HTML。昵称、头像是用户选择的展示资料快照，不是唯一身份；所有权、管理员权限仅由验证后的 Clerk `sub` 决定。客户端传入的管理员标记、作者 ID 和审核状态无效。

账号切换会清空未发送草稿，提交失败保留草稿。每个账号每分钟最多 3 次、每天最多 40 次提交。后续如增加图片、邮件通知或云端同步，需单独实现。

## 运行与发布

独立 Worker 使用 Node.js 24：

```powershell
npm ci --prefix workers/comments
npm test --prefix workers/comments
npm run test:comments
npm run test:account
npm run migrate --prefix workers/comments
npm run deploy --prefix workers/comments
```

迁移命令使用 `--remote`，只应用新增迁移，禁止通过编辑已应用迁移变更生产结构。Cloudflare 授权由本机 Wrangler 保存，仓库中没有 API Token。Worker 在服务端通过 Clerk 公开 JWKS 验证 RS256 签名、签发者、有效期、会话状态和站点来源，因此此实现不需要 Clerk Secret Key。

`workers/comments/wrangler.jsonc` 中的账户 ID、数据库 ID、Clerk 签发域名与管理员用户 ID 都不是密钥。更换管理员必须由站点所有者明确指定 ID；禁止自动把首个注册用户提升为管理员。

## 当前配置与验收边界

当前 Clerk 仍是开发实例。转正式实例时，必须一起更新博客 Publishable Key、Worker `CLERK_ISSUER` 和正式实例的管理员 User ID，复核已有作者身份；开发实例与正式实例的用户不能直接当成同一个 ID。

API 测试使用本地 RSA 签名和 SQLite，覆盖伪造/过期令牌、越权、审核可见性、跨文章回复、限流。浏览器测试使用模拟账号与 API；线上检查健康接口、读取、未登录写入拒绝、组件加载。不代表已代替用户完成真实登录后的发帖、审核全流程。

备份可在 `workers/comments` 目录运行 `npx wrangler d1 export DB --remote --output ../../test-results/comments-backup.sql`。导出文件可能包含未公开评论，不提交到 Git；重要备份应另存到站点所有者管理的位置。
