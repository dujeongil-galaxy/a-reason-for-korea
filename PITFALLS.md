# PITFALLS

只记真实踩过、下次还会复发的坑。

## 1. 滚动淡入不要把内容默认藏起来

- **现象**：首版写 `.js .reveal { opacity: 0 }` + IntersectionObserver，长图截图里下方四个章节整片空白。
- **原因**：在无滚动、虚拟时间或 observer 回调不触发的渲染环境里，元素永远等不到 `isIntersecting`，内容就永久不可见。
- **规则**：内容默认可见；JS 只对「当前确实在首屏外」的元素加 `.pending` 做动画，另加 2.5s 定时兜底强制全部显示；`prefers-reduced-motion` 下直接全部可见。
- **验收**：必须肉眼看长图，确认四个章节都在，不能只看脚本校验全绿。

## 2. Windows 无头 Edge 的最小布局宽度不等于 `--window-size`

- **现象**：`--window-size=390,844 --screenshot` 出来的图里，副标题右侧像被裁掉，看着像移动端横向溢出。
- **真因**：CDP 实测 `innerWidth=492`（Windows 最小窗口宽度），截图却按 390 输出，右边约 100px 是**被截图裁掉**，不是页面溢出。
- **规则**：窄屏验收用 CDP `Emulation.setDeviceMetricsOverride({ width: 390, height: 844, mobile: true })`，再比 `docScrollWidth <= innerWidth`；不要只信 `--screenshot` 的边角。
- **顺带修掉的真问题**：CSS Grid 子项要 `min-width: 0` / 列用 `minmax(0, 1fr)`，长中文给 `overflow-wrap: anywhere`，避免 `1fr` 列被 min-content 撑开。

## 3. 全局 credential.helper 指向已不存在的 GCM 路径

- **现象**：`git push` 会打一行 `.../versions/1.2.0/.../git-credential-manager.exe: No such file or directory`，但推送实际成功。
- **说明**：本机 `git credential fill` 仍能非交互取到可用 token（classic `ghp_`，scope `repo, workflow`）；那行只是 helper 探测失败的噪音，不是认证失败。
- **规则**：看到这行不要误判成 push 失败，以 `git ls-remote` / push 退出码和远端分支为准。

## 4. 生成页替换相对路径时，替换串不能补闭合引号

- **现象**：生成脚本写 `out.replace(/\b(href|src)="(assets\/|favicon\.svg)/g, '$1="../$2"')`，结果生成页里变成 `href="../assets/"styles.css"`——多出一个引号，CSS 直接失效。
- **原因**：正则只吃掉 `href="assets/` 这一段，原字符串剩下的 `styles.css"` 还在；替换串里又补了闭合引号，于是引号多了一个。
- **规则**：这类「只加前缀」的替换，替换串结尾**不要带引号**：`'$1="../$2'`。
- **为什么能立刻抓到**：`verify-i18n.mjs` 的资源检查要求生成页出现 `../assets/styles.css` 等四个精确路径，第一次跑就判红。

## 5. 截图缩放会把小字「压没」，不要凭它判断元素重叠

- **现象**：加语言切换器后，四语首屏截图里右上角的「Source ↗」看起来只剩 `urce ↗`，像被切换器盖住。
- **真因**：1440px 截图被缩小展示，小字笔画糊掉了；CDP 实测切换器与源码按钮间距 20px（`overlap = -20`），`scrollWidth == clientWidth`，没有任何重叠或压缩。
- **规则**：判断重叠、裁切、溢出一律用 `getBoundingClientRect()` 与 `scrollWidth / clientWidth` 的数值，截图只用来看整体观感和字体缺字。

## 6. 多语言站点：中文只留一份，靠校验防漂移

- **现象**：四语页面最容易出现的维护事故，是中文源文案和字典里的中文副本不一致，或某个语言漏翻一个 key，页面悄悄退回中文。
- **规则**：`index.html` 是唯一中文源；`assets/i18n.js` 只存 en/jp/ko 译文与四语的属性 / JS 文案；生成页由脚本产出、不手改。
- **强制层**：`scripts/verify-i18n.mjs` 逐字比对 81 个译文节点、11 个属性、四语 key 集合、中文关键串是否还在、附页章节与边界声明、剪报图片与存档链接、资源路径与切换器状态，并内置 14 项故意造错的自检，必须 14/14 判红才算通过。

## 7. 新增可翻译属性时，`\b` 边界会咬到 `data-i18n-*` 自己

- **现象**：为剪报图加 `alt` 翻译时，把 `alt` 加进 `ATTR_TARGETS`。生成脚本原先用 `new RegExp('\\b' + target + '="[^"]*"')` 找真实属性；对 `data-i18n-alt="archive.imgAlt"`，`-` 与 `a` 之间也是词边界，正则会匹配到这段的尾部，把 **翻译 key 替换成译文**，属性钩子直接坏掉。
- **真因**：之前没炸纯属侥幸——所有真实属性都写在 `data-i18n-*` **之前**，而 `String.replace` 不带 `g` 只换第一个匹配。安全性依赖属性书写顺序，加一个新属性就可能翻车。
- **规则**：匹配真实属性一律用 `(^|\s)` 前缀（提取侧用 `(?:^|\s)`），别靠 `\b`；生成脚本与校验脚本两处必须同步改。
- **强制层**：新增 fault「image alt left untranslated」，故意把英文页 alt 换回中文，确认校验判红。

## 8. 验收脚本自己也会制造假红

- **现象**：附页验收第一次跑，四语 × 两种视口共 8 例全报 `hidden reveal elements`。
- **真因**：检查在滚动之前执行，附页位于首屏外，`.reveal` 元素按设计处于 `.pending`，2.5s 兜底还没到；页面本身是好的。
- **规则**：验收要在「页面就绪后再等 1s + 滚到目标章节 + 等待超过 2.5s 兜底」之后再读，否则测到的是动画初始态，不是读者看到的内容。数值项（溢出、图片加载、链接数量）则不受影响。
- **第二次复发（附页链接验收）**：这次只等 2.8s 且用 `parseFloat(opacity) < 0.99` 判隐藏，把淡入过渡的中间值（0.135 / 0.03）也算成红，8 例全假红。判据应直接查 `.pending` 类（兜底就是移除它），不要用数值阈值；时序照已验证的版本：轮询就绪 → `wait(1000)` → 滚动 → `wait(3200)`。

## 9. 语言切换器的短标签不是「随便取一个字」

- **现象**：窄屏切换器原先用 `中 / EN / 日 / 韓`，韩文页高亮显示繁体汉字「韓」，站长一眼看出不对；日语也该是 `JP` 而不是「日」。三个汉字 + 一个拉丁缩写，体系混着，还暗含简繁体不一致。
- **规则**：短标签统一成 `CN / EN / JP / KR`，**四个一律两字母大写拉丁地区缩写，不留汉字例外**；不要用单个汉字指代语言，更不要混简繁。技术层的 `lang` / `hreflang` 仍按 ISO 639-1 用 `zh / en / ja / ko`，两套互不冲突：一个是给人看的视觉缩写，一个是给机器读的语言代码。
- **路径层也统一（2026-11-13 站长指令：ja 改 jp）**：文件夹名、canonical / og:url / hreflang 链接的网址、语言切换器 href、`data-lang-link`、字典键、`body data-lang` 全部用 `jp`，与 JP 徽标一致；旧 `/ja/` 网址不再保留（改声誉留 redirect stub 会违背「文件夹统一」的本意）。**但 ISO 语言代码层不动**：`<html lang>` / `hreflang` / 切换器 `<a lang>` 仍是 `ja`（jp 不是合法语言代码，改了 hreflang 信号失效），`styles.css` 的 `html[lang="ja"]` 字体栈选择器也依赖这一点。三层各管各的：视觉缩写 `JP` ／ 路径与内部标识 `jp` ／ W3C 语言代码 `ja`。强制层：`build-i18n.mjs` 的 `LANGS` 用 `jp`、`LANG_ATTR = { jp: 'ja' }` 负责切换器 lang 回填 ISO；`verify-i18n.mjs` 的 `LANGS` / `HTML_LANG` / `SHORT_LABELS` / 故障注入同步改键，35 项自检必须全拒。
- **顺带修掉的真问题**：窄屏原先用 `.lang-long { display: none }` 隐藏语言全名，读屏软件只剩「JP」「KR」这类缩写可念。改成 `clip` 视觉隐藏（1px + `position: absolute`，仍留在可访问性树里），短标签加 `aria-hidden="true"`。
- **强制层**：`verify-i18n.mjs` 校验四个短标签的值、每个标签都匹配 `/^[A-Z]{2}$/`、`aria-hidden`、CSS 不允许 `display: none` 且必须有 `clip: rect(...)`；对应故障注入覆盖汉字回退（含中文）、非大写拉丁、日文不是 JP、标签丢失、`aria-hidden` 缺失、`display:none` 回归、`clip` 被删，必须判红。

## 10. 别把站长本人给的材料写成「有人 / 读者提供」

- **现象**：附页引言写成「有人留下一张网页截图」、图注写成「读者提供」，把站长本人直接发来的截图匿名化成了来源不明的第三方材料。站长一眼指出：「这个明明是我给你的截图」。
- **规则**：材料归属要写具体、方向要明确（「站长给 AI 的」「站长提供」），不要为了「客观感」用「有人」「读者」「某位朋友」这类模糊主语；四语译文同步（en `the owner of this site` / ja `このサイトの持ち主` / ko `이 사이트의 주인`）。Hero 里「有人给它留了一碗水」是修辞意象，不是归属，不必改。**第一人称「我」的问题见第 14 条**。
- **强制层**：校验里放一组 `ANONYMOUS_MARKERS`（四语的旧匿名措辞）与 `FIRST_PERSON_MARKERS`（四语旧第一人称措辞），中文源页与三张生成页都不许出现；再要求 intro 与 caption 必须含各语的归属词、intro 必须含 `AI_MARKERS`。故障注入覆盖中/英/日/韩回退。

## 11. 静态站里的外部链接会烂，但别悄悄删掉

- **现象**：附页三条 2014 年存档链接，上线时写着「仍可在几处存档里找到」；站长复核发现前两条已打不开（山西新闻网报 504），本机实测人民网连不上（`000`）、山西返回 `404`、只有凤凰网 `200`。
- **规则**：链接失效时**保留链接 + 打状态标记 + 写核查日期**，不要删掉，也不要让边界声明继续说「仍可访问」；失效链接本身就是「这一页曾经存在过」的痕迹，正好是附页的主题。状态会变，说明里要写明「只记录本次核查」。
- **强制层**：`verify-i18n.mjs` 校验 `is-dead` 恰好 2 个、`is-live` 恰好 1 个、核查日期存在、边界声明与字典逐字一致；5 项故障注入覆盖徽章被删、全标成可访问、中文源页丢徽章、核查说明被删、边界声明回退成「仍可访问」。

## 12. CDP 截图的 `clip` 是文档坐标，不是视口坐标

- **现象**：验收脚本滚动到附页后，用 `getBoundingClientRect()` 的 `top` 当 `clip.y` 截图，8 张全是 2-3 KB 的纯米白空白图；数值检查却全绿。
- **真因**：`Page.captureScreenshot({ clip })` 的坐标相对文档顶部。滚动后视口坐标 ≈ 文档坐标 − `scrollY`，直接把 `rect.top` 传进去，裁剪区域落在了视口之外。首屏截图（y=0、未滚动）恰好不受影响，所以之前一直没暴露。
- **规则**：要截局部，给 `clip.y` 加上 `window.scrollY` 并配 `captureBeyondViewport: true`；否则滚动到位后直接截整屏更省事。**脚本产出截图后必须看一眼文件大小或内容**，空白图不能当验收通过。

## 13. 统一一套视觉体系时，别留一个「例外」还替它写解释

- **现象**：第 9 条把日/韩短标签改成 `JP / KR` 之后，中文仍留着汉字「中」，我还专门解释「中文保留『中』」，并在回复里把「要不要换成 CN」当作可选问题抛给站长。站长直接指出：「既然是 EN\JP\KR，中文为什么不直接改成 CN」。
- **真因**：修问题时只解决了被点名的那两个（日、韩），没有把「同一组元素必须同一套编码体系」当成规则收口；把本该由设计一致性直接推出的决定，降级成了需要用户再表态的偏好问题。半套统一比不统一更扎眼。
- **规则**：一组同类 UI 元素要改就一次改齐，改完自己反问「还有没有例外」；不要把一致性问题包装成「你要不要也换一下」。回复里也不替例外找理由。
- **强制层**：`SHORT_LABELS` 四个值全部为拉丁缩写，另加 `/^[A-Z]{2}$/` 断言（对源页和四张页面都查），并补 2 项故障注入：中文标签回退成「中」、中文标签写成小写 `cn`。

## 14. 网页文案里的「我」不是站长

- **现象**：把匿名化改成「这张网页截图是站长给**我**的」之后，站长要求把「我」替换成 `AI`。句子虽然写清了来源，却用了第一人称 —— 网页是 AI 写的、给访客看的，「我」既像站长在自称，也像网站在自称，视角是乱的。真实关系是**站长把截图交给了 AI**。
- **规则**：写归属要写成明确的「谁 → 谁」，不要靠第一人称 pronouns 让读者猜叙述者。四语统一：`站长给 AI 的` / `gave this screenshot to the AI` / `AI に渡した` / `AI에게 건넨`；图注「站长提供的这张网页截图」没有视角歧义，保持不动。
- **强制层**：`verify-i18n.mjs` 加 `AI_MARKERS`（四语intro必含）与 `FIRST_PERSON_MARKERS`（四语旧第一人称句一律不许回来），中文源页和三张生成页都查；新增 4 项故障注入（中文回退「给我的」、英文删掉 `to the AI`、日/韩回退旧句），累计 35 项必须全判红。

## 15. 产品名是「TikTok」不是「Douyin」，且同一句原文可能在一页里出现两次

- **现象**：站长指出机翻把「抖音」译成了 `Douyin` / `더우인(Douyin)` / `抖音（Douyin）`，要求统一为 `TikTok`。第一次按「一处替换一次」写脚本时，日文公共从句 `ある抖音（Douyin）の投稿と、その裏にある四つの理由。` 实际在 `hero.sub` 与 `meta.description` 各出现一次，`count` 断言直接判 1≠2 失败；把故障注入改成单次 `replace` 后又出现「中文源里『一条抖音分享』有两处、改掉一处仍不算漏」的假绿，`SELF-TEST` 报 `41/42`。
- **真因**：① 译文里复用中文从句，导致一个字符串对应多个出现位置；② 防回退断言只查「某个词还在不在」，而中文源里同一短语出现多次，只改一处不会让 `includes` 变 false。**校验器自己也会被半套修改骗过去**，这和第 13 条是同一类错误。
- **规则**：按字节批量替换时逐条断言**实际命中次数**（不是想当然写 1）；命中 2 次就 `want=2` 一次替换两处。防回退断言列出**全部**中文原文片段逐条核对（`ZH_PRODUCT_COPY` 4 条），故障注入用全局 `/g` 替换把同串一次改干净。
- **边界**：产品名不等于域名。`https://v.douyin.com/ETkls6EwUXo/` 是原始分享的真实链接，href 与可读文字 `v.douyin.com` 一律不动；断言查生成页可见文本时要先剥掉 `href="…"` 和 `<script>`，且旧名用大写 `Douyin` 匹配，避免误伤小写域名。
- **强制层**：`verify-i18n.mjs` 2b 段（中文原文 4 条 + 三语禁旧名 + 三语必含 `TikTok`）+ 5 组故障注入，`SELF-TEST 42/42` 全判红（`19b1330`）。

## 16. 推送 403：账号有权限不等于令牌有权限

- **现象**：本地 `git push` 与 GitHub 连接器写入同一仓库都返回 403。用 `curl /repos/dujeongil-galaxy/a-reason-for-korea` 看到 `"push": true`，据此判断「权限够，是 git 传凭据方式不对」，于是绕了一圈改 URL 内嵌凭据、测 `GIT_TRACE_CURL`、给连接器重授权，全无效。真正原因：本地那把 fine-grained PAT 的 **Contents 权限是只读**。
- **真因**：`/repos/...` 的 `permissions` 字段反映的是**发起请求的账号在该仓库的权限**，不是**这把令牌被授予的权限**。fine-grained PAT 的权限是独立的一层，必须单独看。此外 GitHub App 安装令牌（`x-access-token`，前缀 `ghs_`）与连接器走的 integration 令牌是另外两套身份，都可能没有本站 Contents 写权限。
- **规则**：诊断顺序应为 ① `curl -X POST /repos/<o>/<r>/git/blobs` 做最小写探测 → ② 看响应是 `Resource not accessible by personal access token`（PAT 权限不足）还是 `by integration`（App/连接器授权范围不足）→ ③ 再决定去 PAT 页改 Contents 还是去 App 安装页勾仓库。**不要拿 `/repos` 的 `push: true` 当令牌可写的证据**；认证失败用 reconnect，权限不足别去 reconnect。
- **解决**：让站长新建 fine-grained PAT（Resource owner 选组织、Only select repositories 勾本站、Repository permissions → Contents: Read and write），用 `git -c credential.helper= push "https://x-access-token:<PAT>@github.com/<o>/<r>.git" main` 直推；令牌只走 shell 变量，不写文件、不进日志、不改 `origin`。本次 `c231dc5` 三笔据此推送成功（`00c724f..1f9ca34`）。

## 17. 链接线索来自盗版站时，只取片名，不取链接

- **现象**：站长给了一条盗版站链接作为推荐片的线索，并明确「不要挂这个链接，这是盗版，请引导用户去 Netflix 支持正版，中国大陆请访问 ... 购买（带邀请码，别删）」。直接把链接放上去最省事，但等于给盗版站导流。
- **规则**：盗版 URL 只用于**离线确认片名**（本次为 2020 年韩国电影《哦！文姬》，原名 `오! 문희`、国际名 `Oh! My Gran`）。页面只写片名与一句剧情，不放该域名、不引用其海报、不写「资源」字样；引导语落到 Netflix 官方站，中国大陆购买链接逐字保留邀请码 `sid=5rfpUarUEd`。
- **片名不机翻**：en 用国际发行名 `Oh! My Gran`，jp/ko 用原名 `『오! 문희』` 并附国际名；不要译成 `Oh! Moon-hee` 之外的自造名，也不要把中文「哦！文姬」直译成拼音。
- **强制层**：`verify-i18n.mjs` 新增 `FORBIDDEN_PIRATE_DOMAINS`（四页 + 中文源禁 `ncat30.com`）、`PICKS_LINKS`（Netflix 与带邀请码的 nfshare 必须逐字在四页出现）、`PICKS_HEAD` / `MUSIC_SOON` 四语逐字断言 + 5 组故障注入，`SELF-TEST 52/52`。

## 18. 手机溢出要看 clientWidth，不是 innerWidth

- **现象**：320px 视口审计时 `window.innerWidth` 返回 **326**、`documentElement.scrollWidth` 也是 326，但 `clientWidth` 是 320。第一版审计脚本拿 `innerWidth` 当屏幕宽度，于是报「溢出元素 0」，漏掉了真实存在的 6px 横向滚动。
- **真因**：移动端 layout viewport 会被最宽内容撑开，`innerWidth` 跟着变成撑开后的宽度；只有 `documentElement.clientWidth` 才是设备视口的真实宽度。
- **规则**：溢出检测一律以 `documentElement.clientWidth` 为边界，逐个比对元素 `getBoundingClientRect().right`，同时比对 `scrollWidth` 是否大于 `clientWidth`。**不要拿 `innerWidth` 当屏幕宽度**。
- **本次结论**：溢出源是顶部 `.lang-switch`（right=326），不是新加的「站长推荐」（picks right=320）。修法是 `@media (max-width: 360px)` 收紧 header gap 12→8px、brand 15→14px、语言按钮 `padding 10→7px` / `min-width 34→30px`。320/360/390/414 四档 `scrollWidth` 全部等于视口宽度，溢出 0。
- **强制层**：`verify-i18n.mjs` 1e 段断言窄屏规则存在 + 1 组故障注入（删掉 media block 后只报这两条），`SELF-TEST 52 → 53/53`。

## 19. 推荐内容默认带预览图；图片的 HTML 尺寸属性会压过 CSS 比例

- **现象**：站长看了「站长推荐」卡片后说「哦，文姬！没有预览图吗。带图推是最好的。以后也遵循这个规则」。当时卡片只有文字，确实少了最直观的一眼信息。
- **规则（长期）**：每条推荐必须配一张预览图，来源限于**正版电影 / 音乐资料站**（本次用 Letterboxd 收录的片方宣传剧照），**不用盗版站素材、不挂外链图床**；图片下载到 `assets/` 本地引用，避免外链失效；四语 alt 与来源说明齐全。首图 `assets/oh-my-gran-still.jpg` 用 ffmpeg 从 1200×675 原图压到 174 KB（原 386 KB）。
- **踩坑**：图片标签写了 `width="1200" height="675"`（为 CLS 预留空间），CSS 写了 `width:100%; aspect-ratio:16/9` 却没写 `height:auto`——**HTML 的 height 属性作为 presentational hint 压过了 aspect-ratio**，实测渲染成 441×675 的竖长条而不是 16:9 横幅。加 `height:auto` 后变成正确的 441×248。
- **规则**：凡是用 `width`/`height` 属性 + CSS `aspect-ratio` 的响应式图片，CSS 里必须写 `height:auto`；或者干脆不写 HTML 尺寸属性。上线前用 CDP 读 `naturalWidth` 与 `getBoundingClientRect()` 实测比例，别只看截图。
- **强制层**：`verify-i18n.mjs` 1d 段新增图片引用 / 文件存在 / `height:auto` 断言，生成页新增四语来源说明逐字断言，3 组故障注入（删图片引用、来源说明留中文、删 `height:auto`），`SELF-TEST 53 → 56/56`。

## 20. YouTube 租买页锁地区；中国大陆一律按港区算，日区不挂购买链接

- **现象**：站长给的 YouTube Movies 链接 `https://youtu.be/cflWf3XKeFI?si=...` 是《오!문희》的官方租买页，但**只有韩国 IP 能租借/买断**。查 JustWatch / Moviefone 各地区数据：美国 YouTube 只有「YouTube Free（免费带广告）」，租买在 Amazon（租 $2.99 / 买 $9.99）；日本与香港 JustWatch 无该片条目。结论：**不存在美区/日区/港区的 YouTube 租买替代链接**，YouTube 的地区可用性由片方授权 + 访问 IP 决定，同一个视频 ID 无法"换地区版本"。
- **诊断坑**：用 `&gl=US|JP|HK` 参数抓 YouTube 页面并不能真的切换地区，四个地区都返回同一个韩区页面 + `UNPLAYABLE "Video unavailable"`（出口 IP 不变）。地区可用性不能靠 `gl` 参数实测，要查 JustWatch 等地区化流媒体数据库。
- **最终口径（站长 2026-11-22 指令）**：中国大陆以后都按**港区**算；港区 YouTube 搜不到也不能租买，所以 **aff 邀请码链接不能删，继续保留**——zh/en/ko 三页 featured 按钮指向 `https://nfshare.cn/?sid=5rfpUarUEd`，文案写「中国香港地区」，邀请码 `5rfpUarUEd` 逐字保留；按钮下方红字保留奈飞原文案「到 Netflix 搜索片名观看 · 请支持正版」；**日区（jp）不挂任何购买链接**，只留 Netflix 文字推荐。四页一律禁 `youtu.be` / `youtube.com/watch` / `www.netflix.com` 链接与盗版域名。
- **实现**：三条按钮 key（youtube / netflix / cn）合并为一条整块 `picks.film.actions`（字典值是完整 HTML 片段，`translateNodes` 直接替换 innerHTML），这样日区能单独去掉 `<a>` 而不影响其他三语。`verify-i18n.mjs` 用 `PICKS_ACTIONS_EXPECT` 逐语校验 aff 有无 / 邀请码 / Netflix 文案，`FORBIDDEN_PURCHASE_LINKS` 四页禁链接；`SELF-TEST 56 → 62/62`。真实文件给日区塞回 aff 链接 → 精准判红两条，恢复后全绿。

## 21. 「港区」是中文口径，不要直译进外文按钮文案

- **现象**：站长看英文页截图指出——aff 按钮的英文文案被写成 `Hong Kong, China: get access through this link`，是把中文源的「中国香港地区」逐字翻译过去的。站长原话「英语的直接链奈飞没错，挂 aff 也没错，但是为什么要直接翻译港区？」：链 Netflix、挂 aff 都认可，唯独不该把港区划分这种**中文语境专属口径**译进外文。
- **原因**：上一轮「中国大陆一律按港区算」是站长给中文站的地区分类决定（用于解释 aff 链接为何写香港），不是必须逐语复制的文案。做法应是「决策口径中文保留、外文本地化重写」：中文源写「中国香港地区：通过此链接开通」，英/韩只写「Get access through this link / 이 링크로 이용권 구매」+ 邀请码，让国际读者看得懂；日文页本就没有 aff 按钮，不受影响。
- **诊断坑**：用户截图里英文页每句下面都跟一行中文，看着像「页面混了中文」。实测 `en/index.html` 的 CJK 只有导航的「中文 / 日本語」和署名「新浪」三处——中英逐句对照是**浏览器翻译插件叠加**的效果，不是页面 bug。遇到这类截图先 grep 生成页确认有无真中文残留，别急着改页面。
- **强制层**：`verify-i18n.mjs` 新增 `FORBIDDEN_REGION_CALQUES = ['Hong Kong, China', '중국 홍콩']`，在 en/ko 的 aff 分支逐页断言不得出现（中文源不受限），+ 1 组故障注入，`SELF-TEST 62 → 63/63`。真实文件把 `Hong Kong, China` 塞回英文页 → 只报新增断言 + 节点不同步两条，恢复后全绿。

## 22. 购买按钮按地区定：查 YouTube 能否租买，别拍脑袋套统一口径

- **规则（站长 2026-11-22 终版）**：所有语言检查一遍、不直译，**只有中文按港区**。英文按美区、日文按日区——YouTube 能租/买就推 YouTube，不能就推 aff；韩文按韩区，YouTube 可租买→推 YouTube。
- **查证结论（JustWatch / TMDB / Moviefone，2026-11-20/21 快照）**：美区 YouTube 只有「免费带广告」，租买在 Amazon（租 $1.99–2.99 / 买 $7.99–9.99）→ 英文页 aff；日区 JustWatch 页抓不到、TMDB 只说「可通过租借购买观看」未指明平台（疑似 Prime Video），无 YouTube 租买证据 → 日文页 aff；韩区官方 YouTube Movies 租买页（用户给的 `cflWf3XKeFI`）→ 韩文页 YouTube。**YouTube Free（免费带广告）≠ YouTube 商店租买**，别混为一谈。
- **落地**：zh=aff（港区口径，唯一保留）；en=aff（Get access through this link）；jp=aff（このリンクから視聴権を取得，本轮从「无链接」改为 aff）；ko=YouTube（YouTube에서 대여하거나 구매하기，撤掉 aff/邀请码）。四页红字 Netflix 提示保留，四页禁 Netflix 链接与盗版域名。
- **强制层**：`verify-i18n.mjs` 用 `PICKS_ACTIONS_EXPECT[lang].primary` 逐区锁定主按钮（aff/youtube），`PICKS_PRIMARY_LABEL` 逐语锁定按钮文案防机翻/漂移；aff 区禁 YouTube 域、YouTube 区禁 aff/邀请码；`FORBIDDEN_REGION_CALQUES` 扩到含 `香港地区/香港地域`。故障注入 63 → **65/65**：实测把韩区按钮改回 aff → 只报「YouTube link missing」+「aff forbidden」两条，恢复后全绿。
- **验收坑**：日文页新增 aff 按钮、韩文页换成 YouTube 后，重新跑 `cdp-overflow.cjs` 确认 320/360/390/414 四档 `overflowElements=0`，别只看截图。

## 23. 按区找正版渠道：先认准片名，别让 Apple TV 的地区 404 骗到

- **现象**：站长要求「美区看看亚马逊，日本还是不行吗？奈飞也搜不到？」复核发现上一轮的结论建立在错误片名上——检索 `Oh! Baby` 命中的是 2019 年印度泰卢固语电影（Samantha主演），而本站推荐的是 2020 年韩国片《哦！文姬》，正确英文名 **Oh! My Gran**（原名 `오! 문희`，罗文姬主演）。同名/近名电影会给出完全错误的「某区没有渠道」结论。
- **正确片名后的查证**：美区 JustWatch + Moviefone 均列出 Prime Video 租 $2.99 / 买 $9.99，商品页 `watch.amazon.com/detail?gti=amzn1.dv.gti.3a505a12-509d-4f34-af76-47f0ea441f72`；日区 JustWatch 搜索页（`/jp/search?q=Oh! My Gran`）显示日文名「オ！ムニ (字幕版)」，Apple TV 租 ¥550 / 买 ¥2,100、FOD 租 ¥550，**Netflix 与 Amazon Japan 均无此片**；韩区 YouTube 租买页维持不变。
- **地区 404 的坑**：`tv.apple.com/jp/movie/...` 与 iTunes API 返回的 `trackViewUrl` 在本机都跳到 tv.apple.com 并回 404，因为出口 IP 不在日本；**不能据此判定商品不存在**。权威做法是用 `https://itunes.apple.com/lookup?id=1691528206&country=jp` 看 `trackId` / `trackPrice` / `trackRentalPrice` / `country: JPN`，页面链接直接用 API 的 `trackViewUrl`。同理 Amazon 在非美区出口会跳 `getTheApp` splash，也不代表链接失效。
- **落地**：zh=aff、en=Prime Video、jp=Apple TV、ko=YouTube；**aff 邀请码不出现在任何外文主按钮**（2026-11-22 晚些时候起，它作为红字 AFF 入口出现在外文页，见第 24 条）。`verify-i18n.mjs` 用 `PRIMARY_LINK` 四渠道总表逐区锁主链接，跨区渠道 / YouTube 域 / aff 邀请码按区禁入，新增 1 组故障注入（`65 → 66/66`）。真实文件把英文页 Prime Video 链改回 aff → 判红 4 条，恢复后全绿。
- **通用规则**：查「某区能不能租买」时，先拿**原名 + 导演 + 主演**确认是同一部片，再分别查 JustWatch 对应国家页、Moviefone where-to-watch、iTunes API；YouTube Free（免费带广告）永远不等于 YouTube 商店租买。

## 24. 红字提示别机翻：逐语重写，别把 AFF 入口当成 Netflix 官网链接

- **现象**：站长看截图指出 en/jp/ko 主按钮下方那条红字仍是从中文「到 Netflix 搜索片名观看 · 请支持正版」逐字翻过去的（`Find the title on Netflix...` / `Netflix で作品名を検索して...` / `Netflix에서 제목을 검색해...`），要求统一换成「中国大陆用户请点击这里访问 Netflix」，每个语言单独翻译。
- **落地**：en `Viewers in mainland China: click here to access Netflix.`；jp `中国大陸からご覧になる場合は、こちらから Netflix にアクセスできます。`；ko `중국 본토 시청자는 여기를 눌러 Netflix에 접속하세요.`。三语的「这里 / click here / こちら / 여기」都指向 AFF 入口 `nfshare.cn/?sid=5rfpUarUEd`，这是站长额外加的推广 / 邀请码链接，**不是 Netflix 官网**；`netflix.com` 依旧禁成链接，中文页红字原文不动。
- **校验坑**：旧断言「非中文页不得出现 aff / 邀请码」会被新红字误伤。改成只用正则取 `class="pick-link pick-link-featured"` 的 href 比对主按钮——aff 允许出现在 note 里但禁止当主按钮；note 整段逐语锁定防机翻回退。故障注入 66 → **68/68**：真实文件把英文红字链接的邀请码去掉 → 判红 2 条，恢复后全绿。
- **验收**：Pages 第 2 次轮询生效，线上 en/jp/ko 新红字各 1、旧机翻文案 0、`netflix.com` 链接 0；CDP 四页 × 320/360/390/414 共 16 项 `overflow=0`。

## 25. SEO：金句型 title 检索不到，JSON-LD 必须逐语对应

- **现象**：截图里搜站名只出 GitHub 仓库页 `哈韩，也要有一个理由 - GitHub`，站点本身没被有效收录。原因是 `<title>` 与 description 都是金句（「哈韩，也要有一个理由 · 这个世界不能没有小猫」），不含任何可检索的核心词；且没有 sitemap / robots / 结构化数据。
- **做法（站长选 A+C+D 长尾）**：title / description 关键词前置、金句后置，四语各自本地化——核心词 zh「为什么喜欢韩国」/ en `Why I Like Korea` / jp「韓国が好きな理由」/ ko「한국을 좋아하는 이유」。**不要机翻**：日文写 K-POP 而非直译，韩文写 `오 문희` 用当地片名。
- **JSON-LD 坑**：`<script type="application/ld+json" data-i18n="meta.jsonld">` 走构建脚本的 data-i18n 翻译，三语字典都要有 `meta.jsonld` 且必须是合法 JSON 字符串（单引号包、内部双引号）。`inLanguage` 必须按**页面语言层**写 `ja`（不是目录 `jp`）、`zh-CN`（不是 `zh`）；`url` 指向各自页面。混用会判红。
- **sitemap 坑**：hreflang 用 ISO 语言码 `ja`，路径仍是 `jp/`；`x-default` 指中文根页。robots 的 Sitemap 行写绝对地址。四页 head 都要有 `<link rel="sitemap">`（构建时绝对路径不相对化）。
- **AI 摘要**：站长提到双休购进了 AI 但「偶尔会推、偶尔又不会」。站内只能把 title / 结构化数据 / sitemap 做扎实，**不能承诺 AI 一定会展示**，是否展示是搜索引擎侧的决定。
- **校验**：新增 11 组故障注入（title 回退、描述去词、JSON-LD 语言/url 错、sitemap 缺项等），68 → **79/79**。真实文件删掉 sitemap 的 ko loc → 判红 1 条，恢复后全绿；CDP 四语 × 320/360/390/414 共 16 项 `overflow=0`。
