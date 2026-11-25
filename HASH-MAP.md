# 提交哈希映射（2026-11-26 历史重写）

为使 GitHub 贡献页不再出现旧号 `dujeongil`，2026-11-26 用 `git filter-branch` 改写了 author/committer 邮箱：`dujeongil@users.noreply.github.com` → `dujeongil-galaxy@users.noreply.github.com`，并修正一条署名 `dujeil-galaxy`。

提交内容、时间、说明均未改变；但从 `4d5260a` 起，19 条提交的哈希全部重算，此后 CHANGELOG 里 2026-11-25 之后的旧哈希请按本表对照。其余 144 条提交哈希不变。

重写前的完整备份为本地 bundle（未入库）：`D:\backup\a-reason-before-rewrite-20261126.bundle`。

| 日期 | 旧提交 | 新提交 | 说明 |
| --- | --- | --- | --- |
| 2026-11-25 | `4d5260a` | `4e67625` | feat(drama): 新增《奇皇后》(2013) 卡片，四语挂正版入口 |
| 2026-11-25 | `d024fa7` | `4bb2145` | docs: 记账《奇皇后》新增与 64 号坑 |
| 2026-11-25 | `d7eb064` | `f3668e2` | fix(picks): 港区按钮明确标注第三方合租平台、非 Netflix 官方渠道（四语同步） |
| 2026-11-25 | `0e3d6bf` | `35a1231` | docs: 记账合租平台定性 |
| 2026-11-25 | `b4ec043` | `97a30db` | style(picks): 手机端港区合租按钮改用短文案（<=720px） |
| 2026-11-25 | `8229d85` | `e59001f` | docs: 记账手机端按钮断行优化 |
| 2026-11-25 | `dc39452` | `730ff01` | feat(picks): 附页（1theK / 影片档案）PC 端默认收起，点击展开 |
| 2026-11-25 | `e1b833d` | `dc3e248` | docs: 记账附页折叠 |
| 2026-11-25 | `cae5aea` | `4337418` | feat(footer): 尾句下方加入后记·多年前的一条朋友圈（四语原文照录） |
| 2026-11-25 | `526d3fd` | `d41cb97` | docs: 记账后记段落 |
| 2026-11-25 | `144b3f5` | `7ff7dbc` | style(footer): 后记只留原话一句，去掉小标题与出处说明 |
| 2026-11-25 | `8cbd70c` | `9c9e035` | style(footer): 后记引文改左对齐，与尾句同一条左边线 |
| 2026-11-25 | `2f19fc8` | `4b640c5` | fix(css): 附页折叠改用属性选择器（#1thek-note 数字开头为非法 id 选择器） |
| 2026-11-25 | `50ae373` | `dc91788` | feat(picks): 新增「学韩语」二级菜单与入口区（三张文字卡） |
| 2026-11-25 | `7d73ed5` | `af2992c` | style(picks): 学韩语外链标题加 ↗ 标记 |
| 2026-11-25 | `3725168` | `4e94fb3` | feat(report): 新增中文专题页 report/minty（Minty／You Do／年龄风波），Minty 卡挂内链；只动中文，不生成 en/jp/ko |
| 2026-11-25 | `cf5bcbe` | `af7d69a` | docs(report): 依据列与正文 [1]-[8] 改为站内锚点，来源条加 id + :target 高亮 |
| 2026-11-25 | `8190fb5` | `652333d` | feat(report): 引用角标改为维基式浮卡（悬停/点击弹简要，点卡片跳文末来源） |
| 2026-11-26 | `21ac30d` | `2fb4c39` | chore(identity): 加 pre-commit 拦截旧号邮箱，防止提交算到 dujeongil 名下 |
