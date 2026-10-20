# Clerk 账号接入

当前接入注册/登录、个人资料与账号安全、退出登录，页面是 `/account/`，导航「账号」可进入。采用 Clerk 官方 JavaScript SDK（ClerkJS 6 + UI 1），无需将 Hexo 改成 React。

尚未设置应用时，页面提示「即将开放」，不会显示虚假登录表单。只有访问账号页才加载 Clerk；浏览文章不要求登录。

## 创建与启用

2026-10-20 用户提供的 Dashboard 说明包含一个现有应用；接续配置时使用该应用，不重新创建或更换。Dashboard 的接入教程应选择 **JavaScript**（黄色 JS 图标），对应本仓库的 Hexo + 原生 JavaScript。页面显示的 Next.js 选中态不代表用户决定迁移框架。已有接入文件，不再运行 `init` 覆盖。

1. 访问 [Clerk Dashboard](https://dashboard.clerk.com/)，打开已创建的应用；仅在尚无应用时创建一个，名称可用 `1nuo`。初次建议只启用邮箱验证码，先验证邮件送达与登录流程，再按需增加社交登录。
2. 本地测试使用 Development 实例。API Keys 页面找到 **Publishable Key**。在启动 Hexo 的进程环境中设置 `CLERK_PUBLISHABLE_KEY`；Hexo 本身不会自动读取 `.env`。不要把实际值写入本仓库。
3. 正式上线前创建 Production 实例，按 [生产部署指南](https://clerk.com/docs/guides/development/deployment/production) 配置站点域名 `www.1nuo.me`，在 Cloudflare 添加 Clerk 控制台给出的 DNS 记录并完成验证。以控制台实际记录为准；Clerk 身份服务的 CNAME 先使用 DNS only，不套代理。
4. Clerk 的 Home URL、Sign-in URL 分别设为 `https://www.1nuo.me/account/`。当前使用 SignIn 的 `withSignUp` 合并注册流程，无需另建注册页面。User profile URL 如需配置也指向此页。
5. Vercel 对应项目 → Settings → Environment Variables，添加 `CLERK_PUBLISHABLE_KEY`，Production 使用正式实例的 Publishable Key，Preview 使用开发实例的值。保存后重新部署，构建会生成 `/js/clerk-config.js`。
6. 此阶段不调用 Backend API，**不需要 Secret Key**。构建器只读取一个指定的公开变量，不会输出整个环境。公开配置本来就可被浏览器读取；仓库内仍不存放实际 Key。

## 上线验收

本地可运行 `npm run test:account`，浏览器测试覆盖未配置、SDK 失败重试、登录状态切换、退出失败与重试、PJAX 清理和返回。外部 Clerk 服务使用模拟对象，不创建真实用户，也不代表正式实例已通过验收。

- 使用正式域名，从导航「账号」打开页面，创建测试账号、验证邮箱并登录。
- 刷新页面后登录状态仍在；修改资料、退出，再验证重新登录。
- 通过站内导航离开账号页再返回，检查无重复表单，手机上也能操作。
- 断网时显示错误与「重新加载」，恢复网络后可重试。
- 检查 Clerk 仪表盘记录；邮件验证、OAuth、生产 DNS 均需真实实例验收，模拟测试不证明这些已成功。

## 功能边界

- 收藏、阅读进度、游戏存档继续存在当前浏览器，尚未接入云端数据库或账号数据同步。
- 这不是评测后台的授权系统；仅在前端隐藏后台按钮不能保护写入 API。未来如增加受保护接口，必须在服务端验证会话和操作权限。
- 使用固定版本 `@clerk/localizations` 的官方简体中文词条，构建为本地 `/js/clerk-zh-cn.js`；未翻译词条沿用 Clerk 默认。外观通过公开的 appearance 接口适配博客浅粉色、字体、深色模式，保留 Clerk 自带标识与开发模式提示。
- 认证可用性取决于 Clerk、邮箱服务和访客网络；面向国内访客，正式启用前应实测邮件到达与服务连接。

参考：[JavaScript Quickstart](https://clerk.com/docs/js-frontend/getting-started/quickstart)、[SignIn](https://clerk.com/docs/js-frontend/reference/components/authentication/sign-in)、[定价](https://clerk.com/pricing)。
