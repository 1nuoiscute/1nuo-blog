# 博客账号评论

博客仍由 GitHub → Vercel 发布。独立评论接口运行在 Cloudflare Workers，评论数据存在 D1，与现有 `1nuo_wealth` 数据库分开。

- 接口：`https://comments.1nuo.me`；健康检查 `/health`。
- Worker / 数据库：`1nuo-blog-comments`。
- 管理页：`https://www.1nuo.me/comments-admin/`。只有配置的 Clerk User ID 可审核；页面本身不代替接口权限校验。
- 博客开关：`themes/butterfly/_config.yml` 中的 `nuo_comments.api`。清空后回到原评论界面，不删除数据库。
- 原 Giscus / Twikoo 小组件在折叠的历史入口中保留，未迁移、未冻结其原有写入能力。

## 评论与审核

登录后可发纯文本评论、回复主评论和删除自己的评论。评论先保存为待审核，仅作者登录后可见；后台异步调用 DeepSeek，只有结构有效且置信度达到 0.95 的低风险判断才自动发布。其他判断保留待审核，管理员可发布、隐藏或点「AI 复审」。管理员自己的评论直接发布。隐藏主评论也会隐藏其回复，删除已公开评论保留无正文的占位。

评论区沿用账号页的玫瑰色、白底和字体，头像与身份放在输入框上沿，底栏显示字数和发布按钮；适配手机与深色模式。审核页按状态切换，显示自动审核理由，提供刷新入口。普通提交后会在 3、10、25 秒刷新结果，离开页面或切换账号时取消轮询。

### DeepSeek 配置

在 **Cloudflare → Workers & Pages → 1nuo-blog-comments → Settings → Variables and Secrets** 新增 **Secret**，名称 `DEEPSEEK_API_KEY`，最后点 Deploy。此密钥属于 Worker，填到 Vercel 不会生效。禁止放进公开脚本、Wrangler vars、Git 或聊天记录。健康接口的 `autoModerationConfigured` 只说明绑定已存在，不代表密钥有效或余额充足。

按照 [DeepSeek 官方接口说明](https://api-docs.deepseek.com/api/create-chat-completion/)，服务端调用固定地址 `https://api.deepseek.com/chat/completions`，默认模型 `deepseek-flash`，关闭思考模式，使用 JSON 输出和 256 token 上限。模型名可通过 Worker 的 `DEEPSEEK_MODEL` 调整。

只发送评论正文，不附带账号 ID、昵称、头像或邮箱。正文中用户主动输入的个人信息仍会随正文发送。评论被作为不可信数据交给模型，不执行工具或评论中的命令；AI 只是辅助判断，不能保证识别所有攻击或风险。管理页中的理由也只按纯文本展示。

单次请求 10 秒超时，不自动重试；密钥缺失、余额不足、网络失败、截断或无效返回都保持待审核。`AI_DAILY_LIMIT` 默认为全站每天最多 100 次尝试（按 UTC 日计算，最高可配 1000，设为 0 停用自动请求），失败和人工复审也占额度。原有账号提交频率限制继续有效。

### 失败原因与链路自检

失败不再合并成一句「自动审核未完成」。管理页的 AI 说明会写明原因：密钥为空或含空白字符、鉴权失败（401）、请求被拒绝（403）、余额不足（402）、请求过于频繁（429）、服务繁忙（5xx）、请求超时、Worker 无法连接接口、返回不是 JSON、返回被截断、判定格式不合规。理由写入该评论的 `ai_reason`（仅管理员可见），不保存服务商返回的正文；`wrangler tail` 只输出错误码和 HTTP 状态码，不含密钥和评论内容。

管理页「检查 AI 链路」调用 `POST /v1/admin/diagnostics`（仅管理员）。它先用 `GET https://api.deepseek.com/models` 检查 Worker 出口可达、密钥有效、当前 `DEEPSEEK_MODEL` 是否在可用列表中，这一步不消耗 token；随后用与审核完全相同的参数发送一条固定测试留言，确认完整调用（消耗一次调用，不计入每日上限）。健康接口的 `autoModerationConfigured` 只证明绑定存在，不能证明密钥有效，也不能证明 Cloudflare 出口能连上接口。

人工发布、隐藏或删除会使在途 AI 任务失效，迟到的结果不能覆盖人工操作或恢复已删除正文。删除同时清空审核理由。已有待审核评论不会自动批量发送给 DeepSeek，可在管理页逐条复审；未完成或因 Worker 中断卡住的任务，60 秒后可以重新触发。

评论正文与昵称均按普通文本渲染，不解析 HTML。昵称、头像是用户选择的展示资料快照，不是唯一身份；所有权、管理员权限仅由验证后的 Clerk `sub` 决定。客户端传入的管理员标记、作者 ID 和审核状态无效。

新评论通过 Cloudflare 注入的 [`request.cf.country` / `regionCode`](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties) 保存发布时的 IP 属地快照：国内显示省级地区，境外显示国家，港澳台显示对应地区。只存这段粗粒度标签，不存完整 IP、城市或经纬度，不调用额外的属地查询服务；正文提交中自行填写的属地或伪造请求头不会被采用。属地可能受代理网络或定位数据库影响。原有评论没有历史网络信息，保持空白；读取、登录和审核不会改写属地，删除时清空标签。

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

API 测试使用本地 RSA 签名和 SQLite，覆盖伪造/过期令牌、越权、审核可见性、跨文章回复、限流，以及模拟 DeepSeek 的放行、人工判断、异常、每日预算和人工操作竞态。浏览器测试使用模拟账号与 API，覆盖草稿、回复、字数、状态切换和审核理由；可用 `COMMENTS_SCREENSHOTS=1` 生成视觉检查截图。线上检查健康接口、读取、未登录写入拒绝和真实组件加载。不代表已代替用户完成真实登录后的发帖、审核全流程。

2026-10-20 已使用用户配置的密钥向 DeepSeek 发送两条合成样本，均返回 HTTP 200：普通感谢留言判断为放行，承诺收益并诱导转账的广告判断为人工审核。未向评论库插入这些测试内容；两个样本不能代表完整风险识别率。生产 Worker 的密钥绑定已核实为 `secret_text`。

备份可在 `workers/comments` 目录运行 `npx wrangler d1 export DB --remote --output ../../test-results/comments-backup.sql`。导出文件可能包含未公开评论，不提交到 Git；重要备份应另存到站点所有者管理的位置。
