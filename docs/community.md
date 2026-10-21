# 我的交流、关注与个人主页

账号页新增「我的交流」「关注更新」「个人主页」入口，沿用现有 Clerk 会话及 Worker / D1。

## 我的交流

`/activity/` 按五个分类读取当前账号：我的帖子、我的评论、参与的讨论、和大肥鱼聊过、关注更新。每页20条，支持加载更多、刷新，以及带楼层锚点的直接跳转。后续页中的目标评论会先加载再定位。

自己的待审核帖子、评论会显示状态；其他账号的待审核内容和隐藏帖中的交流不会进入列表。AI历史按文章或帖子聚合，链接到本人的AI回复或共享文章总结，避免跳进其他人的分支。

## 关注更新

公开文章、笔记和已发布讨论的评论标题栏提供「关注 / 已关注」。同一账号最多关注200篇，重复关注不重置已读位置；可在 `/activity/?tab=following` 查看更新、标为已读或取消关注。

关注更新页打开时每30秒刷新一次，切回页面时也会刷新；离开页面会停止轮询。

未读通过已发布回复的固定楼层与关注记录中的 `seen_floor` 比较，排除本人回复、待审、隐藏及不可见分支。只在回复首次发布时形成新楼层。读到的楼层和「标为已读」时看到的最新楼层作为已读上限，后到的新回复保持未读；旧设备不能把游标倒退。

## 个人主页

`/people/` 是本人设置；`/people/?id=<独立公开UUID>` 是分享页。新账号默认不公开主页，主动开启后展示昵称、头像、简介、公开帖子与公开评论。关闭后访客接口返回404，评论和帖子中的主页链接也随之移除。

昵称和简介按文本显示，沿用本站屏蔽词规则。头像可使用当前账号头像。保存通过版本号与写入令牌处理多标签页冲突，失败保留输入。

「推荐收藏」从本人书架逐条勾选，最多40篇。公开响应只返回仍在本人收藏、且仍属于网站公开内容的条目；标题由网站内容目录提供。未选择的收藏、阅读进度和已读明细不公开。

成就由真实记录计算，可单独关闭展示：

- 话题发起人：发布过讨论。
- 来聊两句：有公开评论或回复。
- 大肥鱼的朋友：参与过已有公开AI回复的交流。
- 十篇之后：账号标记读完至少十篇内容。
- 合成2048：账号2048成绩的最大方块达到2048。

## 接口与数据

迁移 `0011_community.sql` 添加 `community_profiles`、`profile_bookmarks`、`thread_follows`、`account_ai_threads`。既有AI任务按请求人回填交流索引，后续任务由触发器更新；复用文章总结时也记录实际请求人。

- `GET /v1/community/activity?kind=posts|comments|participated|ai&offset=0`：本人交流。
- `GET /v1/community/follows?offset=0`：本人关注与未读。
- `GET /v1/community/follow?thread=...`：关注状态与可用性。
- `POST/DELETE /v1/community/follow`：关注 / 取消，正文 `thread`。
- `POST /v1/community/follows/read`：正文 `thread/throughFloor`，单调更新已读位置。
- `GET/POST /v1/community/profile`：本人主页设置，保存携带版本号和选中收藏。
- `GET /v1/community/profiles/<公开UUID>?kind=posts|comments|books&offset=0`：已公开主页，访客可读。

所有本人接口只采用验证后JWT的身份，公开响应不返回Clerk User ID。`scripts/community-catalog.js` 在构建时生成 `/community/catalog.json`，复用统一公开性规则，过滤隐藏、加密、私人、noindex和后台内容。服务端从固定站点读取目录，关注及公开收藏的标题、路径以目录或已公开讨论为准。

## 验证与发布

`npm test --prefix workers/comments` 覆盖账号隔离、公开开关、收藏选择、未读、竞态和分页；`node tests/community-browser.cjs` 使用真实Worker逻辑、本地SQLite与测试签名账号验证完整浏览器流程。该浏览器集成使用Node24，已接入GitHub Actions。

先应用新增D1迁移、部署Worker，再推送GitHub由Vercel发布页面与内容目录。不创建正式测试账号、不向正式评论区发布测试内容。
