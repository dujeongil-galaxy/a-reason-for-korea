# CHANGELOG

本站按「改动必记账」维护：改完代码 → 跑校验 → 用**真实提交号**记一笔 → 踩到的新坑写进 [PITFALLS.md](PITFALLS.md)。

> **2026-11-26 历史重写**：本文件里 2026-11-25 16:52 之后的哈希是重写前的旧值，对照见 [HASH-MAP.md](HASH-MAP.md)。

## 2026-11-28 · 每部剧补上第二首 OST（BGM 由 1 首变 1~2 首）

- 站长指正：**一部剧不止一首 OST**——《继承者们》还有《咬住下唇》（아랫입술 물고，OST Part.4，eSNa），「我不说你也不找」。这轮把 14 张卡的 **OST 专辑全部扫了一遍**（网易云各 Part 单曲 + 全曲专辑），逐部挑第二首，**12 张卡各加一首**，BGM 行总数 14 → 26。

| 卡 | 第二首 | 网易云 id | OST |
|---|---|---|---|
| 《暴君的厨师》 | 있어줘요 — 许阁（허각） | 2740922186 | Part.2 |
| 《车贞淑医生》 | 이 밤이 지나면 — 朴敏惠（박민혜） | 2047059099 | Part.4 |
| 《死期将至》 | 거짓말인데 — Sondia | 2103739607 | Part.1 |
| 《哲仁王后》 | 마음이 별이 되어 — 寒星（장한별） | 1806729608 | Part.2 |
| 《你好妈妈，再见》 | Touch — 김영근 | 1429356004 | Part 2 |
| 《打架吧鬼神》 | 우연한 일들 — 金昭希 / 宋宥彬（김소희, 송유빈） | 423407596 | Part 3 |
| 《我亲爱的朋友们》 | 바람에 머문다 — LYn | 414979313 | Part.3 |
| 《无理的前进》 | 거북이 날다 — Jadu | 35090939 | Part.1 |
| 《来自星星的你》 | 너의 모든 순간 — 成始璄（성시cery） | 28242975 | Part.7 |
| 《奇皇后》 | 사랑합니다 — 金俊秀（XIA 준수） | 28095030 | Part.3 |
| 《继承者们》 | 아랫입술 물고（咬住下唇） — eSNa | 27906297 | Part 4 |
| 《拥抱太阳的月亮》 | 달빛이 지고 — 임세주（해오라） | 527806269 | Part 1 |

- 仍是 1 首的两张：《亲爱的恩东啊》——该剧其余 OST（《처음 너를 본 순간》等）在韩方与网易云的署名对不上（南惠胜 / 박상희），也没找到官方 MV，**宁缺勿错**；《大长今》——OST 是纯配乐专辑，本来就**没有人声单曲**，只挂《하망연(何茫然)》。
- 外文三语同步补上第二首（YouTube，逐条 oEmbed 复核 HTTP 200 + 频道名）：Warner Music Korea、MUSIC&NEW ×2、VLENDING 블렌딩、ClsQ（站长已认可的频道，.《마음이 별이 되어》MV）、김영근 本人频道、STONE MUSIC ×2、The Jadu - Topic、1theK（원더케이）、XIA - Topic、RIAK OFFICIAL、Glimlach（eSNa《아랫입술 물고》中韩字幕版）。
- 校验：`BGM_PICKS` 登记表改成**每卡一个数组（1~2 首）**，逐条锁定 id / 歌名 / 四语说明；断言四语行数一致（26 行）、每行必须挂在自己的卡上、按区锁平台规则不变；新增 2 条故障注入（删掉中文页第二首 / 外文页第二首泄漏网易云链接）。结果 `VERIFY OK · 463 translated nodes · 69 translated attributes · 4 languages`，`SELF-TEST 277/277 injected faults rejected`。

## 2026-11-28 · BGM 推荐行扩到外文三语：外文页优先 Spotify、没有才用 YouTube

- 站长定平台规矩：**中文页只挂网易云 / QQ 音乐（其他平台不挂）；外文页优先 Spotify，没有才用 YouTube。**
- 按此规则把 BGM 行做成**四语齐全**（此前只有中文页有）：BGM 行从「中文独有块（`data-zh-only`）」改成常规 i18n 节点 `picks.<slug>.bgm`——中文页挂网易云单曲，en / jp / ko 挂 YouTube 官方渠道。
- Spotify 先试了：本机拿不到可用凭据（`open.spotify.com/get_access_token` 403、`clienttoken.spotify.com` 400、`musicu.fcg` 搜索模块匿名请求列表恒空、`api.spotify.com/v1/search` 401、Spotify 搜索/专辑网页只有 SSR 空壳、MusicBrainz 这些韩剧 OST 单曲没有 Spotify 外链），所以 14 首**全部走 YouTube 兜底**。将来 Spotify 通道可用时，只改 `BGM_PICKS` 登记表的 `en/jp/ko.id`，版式与文案都不用动。
- 14 条外文链接逐条 oEmbed 复核（HTTP 200 + 歌名 + 频道），**频道全部是发行方 / 经纪公司 / OST 官方 / 艺人本人号**：Warner Music Korea、MUSIC&NEW 뮤직앤뉴、VLENDING 블렌딩、Luna OST드라마（tvN）、STONE MUSIC、Dreamus Music、DOREMI Entertainment、1theK（원더케이）、RIAK OFFICIAL、Alessandro Safina（艺人 Topic 号）、Lena Park（艺人本人频道）。
- 外文页说明文案用**各语区自己的剧名**（en `The Heirs (2013)` / jp「相続者たち（2013）」/ ko「상속자들 (2013)」）+ OST Part 号 + 平台名；歌名与歌手按官方 OST 命名（韩文原名，需要时附罗马字）。
- 校验：新增 `BGM_PICKS` 登记表（14 条 × 四语，逐条锁定 id / 歌名 / 说明文案）+ **按区锁平台**的断言（中文页 BGM 行只能指向 `music.163.com` / `y.qq.com`；外文三页只能指向 `open.spotify.com` / `youtu.be` / `youtube.com`，且大陆通道不得外溢）+ 四语行数一致 + 全站 `uct2` 扫描；故障注入改为 7 条（删行 / 带 uct2 / 中文行挂 YouTube / 外文行泄漏网易云 / 换同剧另一首 / 说明漂移 / 外文页少一行）。结果 `VERIFY OK · 451 translated nodes · 69 translated attributes · 4 languages`，`SELF-TEST 275/275 injected faults rejected`。
- 站长指正两处：**《哲仁王后》**那条我原挂的是 Luna OST드라마 的 1 小时音频，站长指正应挂官方 MV，已换成 `youtu.be/BbZLHTfub3c`（Im Han Byul — 별들 중에서，Mr. Queen OST Part.8 MV，`si=` 跟踪参数照惯例去掉）；据此把「MV 优先、1 小时音频兜底」的取向统一到**《你好妈妈，再见》**，也换成 MV（`youtu.be/EDXVhBn9RB4`，Park Ji Min — 별처럼 빛나는 시간，Hi Bye Mama! OST Part.1 MV）。
- 顺带核实：《你好妈妈，再见》OST Part.1 的主唱 **JAMIE（제이미）就是 박지민**（Bugs / Genie 专辑页：아티스트 JAMIE（제이미），专辑介绍写「박지민 - 별처럼 빛나는 시간」），网易云记作 JAMIE、韩方记作 박지민，是同一人同一录音，不存在挂错版本。
- 《哦！文姬》《医生》(닥터, 2013) 仍无 BGM：两个大陆平台都没有这两部的 OST（且它们本就没有人声单曲），见上一条记录。

## 2026-11-28 · 看韩剧区 BGM 推荐行扩到 14 张卡（逐部查网易云 OST，仍只挂中文区）

- 站长指令：样式沿用上一版；其他几部剧的 BGM 自己去网易云查各自的 OST 挂上中文页；外文三语先不动。
- 看韩剧区共 16 张卡（14 部剧 + 《哦！文姬》《医生》两部电影），**14 张挂上 BGM**，2 张查不到（见下）。
- 挑选口径（写死，便于以后复核）：每部剧挂其官方 OST 的**主打曲**——Part.N 单曲专辑的首曲；同一部剧有多首时取流传最广的一首；说明行写明 OST Part 号与网易云计费方式（照抄歌曲页标题里的 `VIP单曲` / `单曲`，不一律写 VIP）。

| 卡 | BGM | 网易云 id | OST |
|---|---|---|---|
| 《暴君的厨师》 | 시간을 넘어 너에게로 — 道英 | 2738613686 | Part.1 |
| 《车贞淑医生》 | 숨 — 郑承焕 | 2043178599 | Part.3 |
| 《死期将至》 | 기적은 없어도 — 徐仁国 | 2108515847 | Part 2 |
| 《哲仁王后》 | 별들 중에서 — 林韩星 | 1818581719 | Part.8 |
| 《你好妈妈，再见》 | 별처럼 빛나는 시간 — JAMIE | 1427705631 | Part 1 |
| 《打架吧鬼神》 | 너만 보여 — 柳智娴 | 421423448 | Part.1 |
| 《我亲爱的朋友们》 | Baby Blue — Kevin Oh | 412902448 | Part.1 |
| 《无理的前进》 | Shooting Star — 寒星 | 35345403 | Part.2 |
| 《亲爱的恩东啊》 | 내맘이 그래요 — 金泰贤 | 32451208 | Part.1 |
| 《来自星星的你》 | 안녕 — 孝琳 | 28228208 | Part.4 |
| 《奇皇后》 | 가시사랑 — 4MEN | 27901889 | Part.1 |
| 《继承者们》 | My Wish — 朴正炫 | 1476000538 | Part.8 |
| 《拥抱太阳的月亮》 | 시간을 거슬러 — LYn | 5350321 | Part.2 |
| 《大长今》 | 하망연(何茫然) — Alessandro Safina | 5413431 | 原声配乐 |

- 逐首核对方式（2026-11-28）：网易云公开搜索接口取 id，`api/v1/album/<id>` 拉专辑曲目确认是不是该剧 OST 与该 Part 的主打曲，再打开歌曲页核对标题、歌手、专辑与计费标；每首都留下了上面的 id 与 Part 号，便于复查。
- 《大长今》特殊处理：网易云上的《대장금 OST》专辑全是配乐（无词），站点注明「OST 原声配乐」；该剧最出名的唱段「새로운 하늘을」网易云未收录。
- **查不到的两张**：《哦！文姬》（오! 문희）与《医生》（닥터, 2013）的 OST 专辑在**网易云与 QQ 音乐都没有收录**——
  - 检索口径：中文名 / 韩文名 / 去空格 / 去标点 / 加 OST 后缀 / 曲名直搜（`오! 문희 OST`、`오! 문희 O.S.T`、`오! 문희 soundtrack`、`오! 문희 정지훈`、`오! 문희 OST Part`、`닥터 OST`、`닥터 2013`、`닥터 원음곡`、`닥터 스코어`、`닥터 모그`、`닥터 김성홍`），两边都只返回同名无关内容（`닥터스`《Doctors》、`닥터 이방인`《Doctor 异乡人》、`닥터X`、`낭만닥터 김사부`、`고스트 닥터`、`닥터신`、`굿닥터`、`닥터진` 等剧的 OST，以及 MBC 剧《文姬》、`H.O.T.`、民谣《옹헤야》等）；
  - 原因也查清了：**《哦！文姬》的 OST 是纯配乐**（音乐总监 정지훈，代表曲《옹헤야》《당디기》《12번을 넘어져도 일어나는 사나이》），本来就没有「OST 单曲」；《医生》(닥터, 2013) 的 Mowg 配乐同样没有对应单曲发行。
  - 结论：这两张卡暂不挂 BGM 行（是「两个大陆平台都没收录 + 本就没有人声单曲」，不是「漏查」）。
- 链接脱敏：14 条链接全部只保留 `music.163.com/song?id=<id>`，不带 `uct2=` 账号令牌；仍标 `data-zh-only`，由 build 阶段在 en/jp/ko 整块摘除。
- 校验：从「单卡」升级为 `BGM_PICKS` 登记表（14 条：id / 歌名+歌手 / 说明文案逐条锁定），断言每行必须挂在自己的卡上、行数必须等于登记条数、外文三页 0 命中、全站 0 个 `uct2`；新增 2 条故障注入（换成同剧另一首 / 说明文案漂移）。结果 `VERIFY OK · 437 translated nodes · 69 translated attributes · 4 languages`，`SELF-TEST 274/274 injected faults rejected`。

## 2026-11-28 · 看韩剧区新增 BGM 推荐行（先只挂中文区看效果）

- 站长给了一条网易云单曲链接（`music.163.com/song?id=1476000538`），是《继承者们》的 OST。站内只保留 `music.163.com/song?id=1476000538`，链接尾部的 `uct2=`（与登录账号绑定的加密令牌，见 PITFALLS §65）不写进仓库。
- 曲目核实：网易云页标题「My Wish - 朴正炫 - 单曲 - 网易云音乐」，VIP 单曲，专辑《Sky Flowers》；官方 OST 资料确认《My Wish》（마음으로만 / 只在心里）出自《继承者们》OST Part.8，是李敏镐×朴信惠的爱情主题曲。
- 卡片位置：《继承者们》卡（`picks.drama4`）的观看按钮下方、反盗版说明上方，新增一行「BGM 标签 + 歌名链接 + 通道说明」；新增 `.pick-bgm` 系列样式（比观看按钮轻一级，不抢主行动）。
- 按站长要求**先只挂中文区**：BGM 行标 `data-zh-only`，`build-i18n.mjs` 生成 en/jp/ko 时整块摘除（不走 i18n 字典），外文三页既不出现这一行、也不出现网易云歌曲链接（大陆通道不外溢）。
- 校验：`data-zh-only` 不变量从「源页一律不许出现」收紧为「卡片上不许出现」（元素级允许，且不得带 `data-i18n` 键）；新增 BGM 专项断言（必须挂在《继承者们》卡上、必须带 data-zh-only、链接已脱敏、全站 0 个 `uct2`、外文三页 0 个 BGM 块 / 0 条网易云歌曲链接）+ 4 条故障注入；结果 `VERIFY OK · 437 translated nodes · 69 translated attributes · 4 languages`，`SELF-TEST 272/272 injected faults rejected`。

## 2026-11-27 · 看韩剧区新增电影卡《医生》（닥터 / Doctor, 2013）

- 站长指定挂这部 2013 年的韩国惊悚片，并加一条站长点评——原文照录「这种电影只有韩国敢拍，人性的丑陋发挥到极致，全程看的心惊肉跳！」，只补「站长点评：」标签。
- 影片信息核对：导演金成洪（김성홍），主演金昌完（김창완）、裴素恩（배소연），2013-06-20 韩国上映，97 分钟；IMDb `tt2466708` / TMDB `258936` / Wikidata `Q19483699`。
- 各区正版渠道实查（2026-11-28）：美区 Prime Video 可订阅 / 租 $1.99 / 买 $7.99，另 Tubi 免费带广告（JustWatch 美区，2026-11-24 数据）；韩区 wavve 租赁（JustWatch 韩区）；港区 / 台湾 / 日区挂 Prime Video 分区页（`primevideo.com/-/zh_HK`、`/zh_TW`、`/ja_JP`，同一影片条目 `0PX65SCPDHH3DU6GTVCH4438EA`，逐条 HTTP 200 且标题命中《Doctor》）。JustWatch 只为该片建了美区与韩区页面，港台日无条目页。
- 本片五区均未见 Netflix 条目 → 四语一律不挂 Netflix 链接，也不挂第三方合租平台入口；中文页红字改为本片专属说明（不再是「到 Netflix 搜索片名观看」）。
- 海报：官方竖版海报（英文维基百科收录的官方物料，原图 264×376，按站内 2:3 裁切放大为 500×750），存 `assets/dakter-poster.jpg`；TMDB / IMDb / Amazon 图源本机均被 Cloudflare 403 挡住，故走维基并在图注写明来源。
- 卡片按发行时间插入 2013 年组（《继承者们》之后、《拥抱太阳的月亮》之前），`SORT_RULES.drama` 同步登记；新增 `.pick-review` 样式（左侧橙色竖线）承载站长点评。
- 校验新增《医生》卡专项断言（四语 label/年份/海报引用/点评文案逐语锁定/渠道数量与归属/别区渠道禁入/禁 Netflix/禁盗版域名）+ 6 条故障注入；结果 `VERIFY OK · 437 translated nodes · 69 translated attributes · 4 languages`，`SELF-TEST 265/265 injected faults rejected`。

## 2026-11-27 · 手机端新增导航按钮：CN 左边放菜单键，站长推荐做三级菜单（从左侧展开）

- 站长指令：手机端右上角「CN」是语言切换；在它**左边**再加一个同款按钮，用来承载 PC 端那条导航栏。
- 层级按站长定义：一级 = 菜单键；二级 = 导航项（缘起 / 理由 / 留一盏灯 / 延伸阅读 / 站长推荐）；三级 = 站长推荐子项（看韩剧 / 听K-pop / 玩游戏 / 学韩语）。
- 三级菜单**从左侧展开**（`.mobile-nav-pane-sub` 起点 `translateX(-100%)`，展开到 0），不是从右边推入；同时二级列表右移 24px、透明度降到 25% 做层次，三级面板顶部有「返回」。
- 桌面端不受影响：`.nav-toggle` / `.mobile-nav` 默认 `display:none`，≥721px 仍是原来的 hover 下拉导航（截图核对过）。
- 头部横向溢出实测（Edge headless，把页面塞进 320 / 360 / 390px 定宽 iframe 里渲染，中英两版逐个量 `getBoundingClientRect` 与 `scrollWidth`）：320px 可用宽 284、360px 324、390px 354；中文页占用 268 / 283 / 286，英文页 268 / 308 / 316，`scrollWidth` 全部等于视口宽度 → 不横向溢出。为此新增 `@media (max-width: 430px)`：菜单键只留图标、品牌名可省略号截断、语言胶囊收紧到 28px。
- 交互实测（真实点击）：菜单键开合 → 二级面板显示、`aria-expanded=true`、锁背景滚动；点「站长推荐」→ 三级面板从左滑入；点「返回」→ 三级收起复位；再点菜单键 → 整块关闭。
- 新增 i18n 键：`nav.toggle` / `nav.back`（html 段）与 `aria.navToggle` / `aria.navMobile` / `aria.navPicks`（attr 段），四语齐全。
- 校验新增手机端导航断言（菜单键必须在语言切换左边、二级四项 + 父按钮、三级四项 + 返回按钮、三级必须 `translateX(-100%)` 左侧展开且不得改成 `translateX(100%)`、桌面隐藏 / 手机显示）+ 6 条故障注入；另把「听K-pop 整页出现 2 次、玩游戏 1 次」这类旧整页计数改成**按区块计数**（桌面下拉 / 手机面板各一次），因为手机端复用同一套文案。
- 校验结果：`VERIFY OK · 430 translated nodes · 68 translated attributes · 4 languages`，`SELF-TEST 259/259 injected faults rejected`。

## 2026-11-27 · 查不到 Netflix 的卡统一按《医生》卡口径：不挂 Netflix 入口，红字换本片专属说明

- 站长新规：站内其他视频若查不到 Netflix，一律按《医生》那条规矩办——不挂 Netflix 入口、不挂第三方合租平台（AFF）入口，红字改成本片专属说明，并写明该页真正能用的渠道。
- 实查（2026-11-28）：站内已挂 Netflix 的 6 张卡逐条打开 `netflix.com/title/<id>` 复核，HTTP 200 且 og:title 是这部片（暴君的厨师 82024852 / 车贞淑医生 81682438 / 来自星星的你 80025266 / 继承者们 81033650 / 哲仁王后 81422314 / 你好妈妈再见 81243996）；查不到 Netflix 的按站内既有逐区核查记录判定。
- 按此口径改了 **37 处**卡片文案（中文页 9 张 + 外文页 28 处）：
  - 中文页去掉「中国香港地区：第三方合租平台开通（邀请码 5rfpUarUEd）」按钮，红字换成「本片未见 Netflix 条目，本站不挂 Netflix 入口；〈该页渠道〉，按所在商店结算 · 请支持正版。」
  - en / jp / ko 三语红字换成对应语言版本（英文 Not on Netflix in this region…、日文 この地域の Netflix には掲載がありません…、韩文 이 지역 Netflix에는 아직 없습니다…）
  - 涉及的卡：drama2 / drama5 / drama6 / drama10 / drama11 / drama12 / drama13 / drama14 / film（各语区查不到 Netflix 的那几语各自改），外加 jp/drama3（日区查不到）。
- 查得到 Netflix 的卡保持原样：Netflix 深链 + 港区合租入口 + 原红字一字不动（zh/en/ko 的 drama1、ko 的 drama7-9、jp 的 drama4 等）。
- 校验新增 `NO_NF_CH` / `NO_NF_NOTE` 登记表（37 条逐语锁定）与三条新断言（无 Netflix 授权不得挂合租平台入口、不得挂 Netflix 深链、红字必须是本片专属说明）；旧断言「aff 入口必须在」改为按卡判定；5 条旧故障注入改指向仍挂 aff 的 drama1。
- 结果 `VERIFY OK · 437 translated nodes · 69 translated attributes · 4 languages`，`SELF-TEST 268/268 injected faults rejected`。

## 2026-11-27 · 音乐区新增张民皓《산, 삶》MV 卡

- 站长给了一条网易云 MV 链接（`music.163.com/mv?id=34822862`）。链接尾部的 `uct2=` 是与登录账号绑定的加密令牌，**挂站前必须脱敏**：站内只保留 `music.163.com/#/mv?id=34822862`，全仓不出现 `uct2`，YouTube 链接也去掉 `si=` 分享跟踪参数，只留 `https://youtu.be/eSZiBdwbDH4`。
- MV 身份双向核实：YouTube oEmbed 标题为 `[MV] Jang Min Ho(장민호) _ Mountain, life(산, 삶)`，频道 1theK（원더케이）；网易云页是同名 MV、艺人「张民皓」、发布时间 2026-11-24；YouTube 页 `publishDate` 同为 2026-11-24。
- 按音乐区既有分区通道新增：中文页挂网易云大陆通道，en/jp/ko 挂 YouTube（中文页禁挂 YouTube、外文页禁挂大陆平台，校验里是硬断言）。
- 缩略图取该 YouTube 视频官方缩略图 `i.ytimg.com/vi/eSZiBdwbDH4/maxresdefault.jpg`（1280×720），存为 `assets/mv-jangminho.jpg`，图注沿用「YouTube 官方 MV 缩略图（1theK）」。
- 按发行时间降序排在音乐区第一位（原第一位是 2024 年的 SEO EVE）；同步登记 `KPOP_SLUGS` / `KPOP_IMAGE` / `KPOP_ZH_LINK` / `KPOP_YT_ID` / `MUSIC_DATE` / `MUSIC_DATE_TEXT` / `SORT_RULES.music`（order + year）。
- 校验结果：`VERIFY OK · 428 translated nodes · 65 translated attributes · 4 languages`，`SELF-TEST 253/253 injected faults rejected`（新增 5 条故障注入：中文页换 YouTube、网易云 MV ID 篡改、外文页 YouTube 链接写错、精确发行日 2026-11-24 被抹、缩略图缺失）。

## 2026-11-26 · 移除「不是韩国的 · 一个例外」整块

- 站长要求删掉影单里《刺杀金正恩》（The Interview）那一条，连小标题、栏目说明一起删；该题材本站不再涉及。
- 影响范围仅在中文源 `index.html`（这一块没有 `data-i18n`，en/jp/ko 三页本来就没有它），删后重跑 `verify-i18n.mjs` 仍全绿。

## 2026-11-26 · 历史重写：抹除旧号 dujeongil 的贡献归属

- 站长明确要求「抹除」，不再只做拦截：用 `git filter-branch --env-filter` 把 15 条提交的 author/committer 邮箱从 `dujeongil@users.noreply.github.com` 改为 `dujeongil-galaxy@users.noreply.github.com`，并修正 1 条错拼署名 `dujeil-galaxy`。
- 内容、时间、说明零改动；从 `4d5260a`（《奇皇后》那条）起共 **19 条提交换了哈希**，其余 144 条不变。
- 生成 [HASH-MAP.md](HASH-MAP.md) 记录旧→新对照；README「提交身份」段落同步改口径。
- 重写前完整备份：`D:\backup\a-reason-before-rewrite-20261126.bundle`（本地，不入库）。
- 已删除 `refs/original/*`，`git log --all` 里旧邮箱出现次数为 0；新 HEAD 的作者/提交者均为 `dujeongil-galaxy`。
- 代价：force push 覆盖远端；第二个克隆（`D:\Ai\WorkBuddy\2026-11-21-13-32-57`）会分叉，需要重新拉。

## 2026-11-26 · 提交身份上锁：pre-commit 拦截旧号邮箱（先做的一步）

- 站长发现贡献页多出 `dujeongil`（十年没用的旧账户）。查明原因：2026-11-25 有 **15 条提交**的 author/committer 邮箱是旧式 noreply `dujeongil@users.noreply.github.com`，GitHub 把它映射到同名旧号；其中一条署名还错拼成 `dujeil-galaxy`。本地当时配置是对的，问题来自另一个环境（云主机那边）沿用了旧格式。
- 处理口径：**旧号名下没有仓库，不删号、不改写历史**（改写会让 CHANGELOG 里引用的真实提交号全部失效），只保证以后不再添名字。
- 新增 `.githooks/pre-commit`：用 `git var GIT_AUTHOR_IDENT` 取实际邮箱，`dujeongil@users.noreply.github.com` 直接 exit 1 并提示改法；其他 `*@users.noreply.github.com` 也拦（防挂到别人名下）；非 noreply 只警告。
- 仓库本地配置固定：`user.name=dujeongil-galaxy`、`user.email=dujeongil-galaxy@users.noreply.github.com`、`core.hooksPath=.githooks`；README 补「提交身份（每个 clone 设一次）」与文件结构一行。
- 自测：模拟旧邮箱 → 退出码 1、正确邮箱 → 退出码 0。
- 遗留：当时判定「不划算」未改写；**同日站长改要求为「抹除」，见上一条，已完成重写**。

## 2026-11-25 · 新增专题报道：Minty／《You Do》／年龄风波（中文单页）

- 站长要求「做一页专题报道、外面挂内链」，并同步 YouTube 道歉视频 `youtu.be/m1D3yLwfGpA`（《죄송합니다.》，2019-12-25），摘要注明由 **Monica（monica.im）** 生成、写清「AI 叫什么」。
- 新增 `report/minty/index.html`：中文单页，9 节（为什么单开一页 → 时间线 → 《You Do》→ 人设怎么搭起来 → 另一半身份 → 承认 → 圣诞道歉视频 → 为什么不舒服 → 后来 → 来源），含可核对时间线表、Monica 五段带时间戳摘要、8 条来源、边界声明。
- 事实口径按**原始报道**重核，不沿用早前聊天里的转述：① CJ E&amp;M 2018-02-23 对 fn스타 确认「她没有递交《高等 Rapper 2》申请」，所以不写「被节目除名」；② 年龄 28 岁（国际 26）来自 CoronaX 2019-10-09 声明；③ 本名在媒体间分裂为 김아린／유소리나，页面按「写冲突、不合并」处理。
- 视频**点击后才加载**：默认是不发请求的播放按钮，点击注入 `youtube-nocookie.com` iframe，维持站点「不主动发外部请求」的调性。
- 主站 Minty 卡在 `.pick-note` 下新增 `.pick-report-link`（新样式在 `assets/styles.css`，一行 margin + 字号），按钮文案「专题报道：她为什么说自己 16 岁」。按钮放在 `data-i18n` **之外**，重建 en/jp/ko 时不会被字典覆盖，也不引入未翻译的 key——本页按预览期规则**只写中文**。
- `sitemap.xml` 增 1 条中文专题地址；`verify-i18n.mjs` 的 sitemap 断言由「恰好 4 条」改为「四语 + 1 篇专题」，并补一条 `report/minty/` 必存在的断言，避免以后每加一页就改脚本。
- 校验：`VERIFY OK 422 nodes / 64 attrs / 4 languages`，自检 **247/247**。
- 上线后站长追问「你这依据不做超链接？」：表格「依据」列与正文里的 `[1]`–`[8]` 全部改成**站内锚点**（`#src-1`…`#src-8`）；`sources` 的 `<li>` 补 `id="src-N"`，点角标直接跳到对应来源并用 `:target` 高亮那一条（`scroll-margin-top` 避开吸顶导航）。角标样式 `.cite-link` 用等宽橙色 + 虚线下划线，`white-space: nowrap`；「依据」列宽度 12em → 13.5em、字号 11px，避免两条来源被折成两行。
- 站长再提「能学维基百科吗，点击弹出小卡片、点小卡跳到底部」：加 `.cite-pop` 引用浮卡 + 8 条摘要数据（Koreaboo／朝鲜日报／머니투데이／首尔经济／fn스타／YouTube／OSEN／Apple Music）。桌面悬停即出、点角标钉住、再点同一角标收起；点卡片空白处或「查看第 N 条来源」跳到 `#src-N` 并触发 `:target` 高亮；Esc、点外部、滚动、改窗口大小都会关闭。纯手写 DOM，无第三方库。
- **顺手修上一轮遗留 bug**：来源条写的是 `id="src-01"`、角标指 `#src-1`，两套编号对不上，锚点其实跳不过去；已统一成 `src-1`…`src-8`。
- 未做：三语翻译（预览期只写中文）、争议 MV 画面复刻（边界声明里写明只转述媒体描述）。

## 2026-11-25 · 后记：尾句下面加一段「多年前的一条朋友圈」（四语原文照录）

- 站长要求把本人多年前的朋友圈原话插在结尾「这个世界不能没有小猫。也希望每一个喜欢，都有它说得出口的理由。」之后，保持原话、只做翻译，不用截图形式。
- 结构：footer 内新增 `.footer-moment`（全宽、顶部细分割线、字号比主句退一级），包含 `.footer-moment-head`（后记 · 多年前的一条朋友圈）、`blockquote.footer-moment-body`（原文）、`.footer-moment-src`（站长本人多年前的朋友圈，原文照录，未作修改）。
- 原文一字未改，含标点与论证顺序；英/日/韩三语只做直译，不软化「爱国」「娱乐圈比不过韩国」这类措辞，也不加译者按。
- 位置说明：没有塞进 `.footer-quote`（那是猫的收束主句，flex 里塞长段落会挤坏版式），而是放在 footer-inner 下方另起一行，视觉上明确退一级，读者读完主句再读到出处。
- 校验：`VERIFY OK 413 nodes / 64 attrs / 4 languages`，自检 **247/247**。

## 2026-11-25 · 附页折叠：PC 端默认收起，点击「附页：…」才展开

- `PC（>=721px）`：`#1thek-note`（1theK 附页）与 `#film-note`（影片档案）默认 `display:none`，点击卡内「附页：1theK 是什么」或「附页：影片档案」按钮才展开，再点一次收起；打开时平滑滚动到该块。
- 手机端（<721px）不加任何限制，保持原有的常显 + 锚点跳转，不影响移动端阅读。
- 实现走 id 选择器 + `is-open` 状态类，**没有改 section 的 class 字符串**——校验脚本对 `class="section archive film-record"` 是逐字比对的，先试过加 `collapsible` 类直接判红（`film-note section missing`），改成 id 后才过关。
- 内容仍完整存在于 HTML 里，只是视觉收起，不影响抓取与四语翻译；站点校验 `VERIFY OK 410/64/4`，自检 **247/247**。

## 2026-11-25 · 手机端港区按钮改短文案（仅 <=720px）

- `手机端`：站长要求「仅手机版优化此布局」。15 张卡的港区主按钮拆成双标签——桌面端仍显示全文
  「中国香港地区：第三方合租平台开通（邀请码 5rfpUarUEd，非 Netflix 官方渠道）」，
  `<=720px` 只显示「中国香港地区：合租平台开通（邀请码 5rfpUarUEd）」，定性交给下方红字括注，避免按钮折成两行。
- 实现：`index.html` 每个 featured 按钮内加 `.aff-label-long` / `.aff-label-short` 两个 span；
  `assets/styles.css` 默认隐藏 short，720px 断点内反转。信息量没减，只是把「非官方渠道」的说明从按钮移到红字。
- 校验不受影响（`PICKS_PRIMARY_LABEL.zh` 仍逐字存在于源码里，`VERIFY OK 410/64/4`，自检 **247/247**）。

## 2026-11-25 · 港区按钮定性：第三方合租平台，非 Netflix 官方渠道（四语同步）

- `d7eb064` — 站长确认邀请码链接（nfshare）背后是**第三方合租平台**，要求写清楚并同步四语。
- 中文按钮：「中国香港地区：通过此链接开通（邀请码 5rfpUarUEd）」→ **「中国香港地区：第三方合租平台开通（邀请码 5rfpUarUEd，非 Netflix 官方渠道）」**（15 张卡全覆盖，邀请码逐字保留）。
- 红字提示加一句括注：**「到 Netflix 搜索片名观看 · 请支持正版。（上方港区按钮为第三方合租平台，非 Netflix 官方渠道）」**，避免「请支持正版」紧贴一条合租入口造成误导。
- 英/日/韩三语的红字里 AFF 链接同句改写（不新增按钮、不直译港区口径）：
  - en … `to access Netflix through a third-party account-sharing platform (not an official Netflix channel).`
  - jp … `こちら</a>（第三者のアカウント共有サービス経由、Netflix 公式窓口ではありません）から…`
  - ko … `여기</a>(제3자 계정 공유 서비스, Netflix 공식 채널 아님)를 눌러…`
- 校验：`PICKS_ACTIONS_EXPECT` / `PICKS_PRIMARY_LABEL.zh` / `DRAMA_NOTE` 四处常量同步改写，`VERIFY OK 410/64/4`，自检 **247/247**。

## 2026-11-25 · 新增《奇皇后》(2013)：四语一卡四入口，不硬挂 Netflix

- `4d5260a` — 站长要求新增 MBC《奇皇后》(기황후 / Empress Ki, 2013-10-28 ~ 2014-04-29, 51 集) 卡，口径沿用「正版平台不限买断/短租/订阅，尽量别空着」。
- 逐区实查后落四个入口（都写清地区，不冒充本区）：
  - 中文页（港区）→ Viu 站内搜索页（Viu 官方专题页列有该剧，含简中/英文字幕；商品 ID 从机房 IP 取不到，沿用 63 号坑的搜索页口径）
  - 英文页（美区）→ Viki 商品页 `tv/37211c-empress-ki`（51 集、英文字幕，免费带广告 + 订阅；JustWatch 美区同日确认在架）
  - 日文页（日区）→ U-NEXT 商品页 `title/SID0022475`（全 51 话；大陆 IP 503 属地区封锁）
  - 韩文页（韩区）→ TVING 站内搜索结果页（拿不到 contents ID，文案写「검색」，不冒充商品页）
- 有一处**故意留白**：Netflix 在 SG/SA/FR 等区确认有该剧（51 集），但 `netflix.com/title/<id>` 的 ID 取不到（Netflix 商品页与搜索页全 JS + 403），按「不编号码、不挂死链」的既有规则不挂；四页的港区 AFF 与红字提示照旧保留。
- 位置按年份降序插在 `drama3`(星你, 2013-12-18) 与 `drama4`(继承者们, 2013-08-07) 之间：`SORT_RULES.drama.order` / `.year` 增 `drama14`(2013)，本地海报 `assets/empress-ki-poster.jpg`(500×750, MBC 官方物料)，四语 `label/imageCredit/title/desc/actions/note` + `imageAlt` 齐备。
- 校验：`SUB_DOMAINS` 增 `https://video.unext.jp/title/`（日区 title 级商品页）与 `https://www.tving.com/search?keyword=`（韩区站内搜索）；`LICENSED_SUB_EXTRA` 增四条并锁 URL/文案/位置；`VERIFY OK 410 nodes / 64 attrs / 4 languages`，自检 **247/247**。

## 2026-11-25 · 《拥抱太阳的月亮》年份：2012 单写 → 2011–2012（拍摄年 + 播出年）

- `db71938` — 站长多次强调「不是 2012 年的」。核对 MBC 官方页、维基、namu 后确认这部剧本身有**两个年份口径**：拍摄／制作年份 **2011 年 12 月开机**，播出年份 **2012 年 1 月 4 日—3 月 15 日（MBC 水木剧）**。之前卡片只写「2012 年 MBC 作品」，等于把播出年当成作品年，站长感到被无视是合理的。
- 四语统一改法：标签 `剧集 · 2012` → **`剧集 · 2011–2012`**（英/日/韩同步），正文改为「2011 年 12 月开机拍摄、2012 年 1 月 4 日在 MBC 首播」，英文/日文/韩文的标题年份同步成 2011–2012。
- 校验：`SORT_RULES.drama.year.drama6 = 2012` 保留（排序仍按播出年，年序 2013 > 2012 > 2003 不破）；label 仍强制含「2012」，故障注入改成替换 `剧集 · 2011–2012` 并验证被判红，自检 **247/247**。
- 备注：若站长要的是**纯 2011**（完全不出现 2012），改 `SORT_RULES.drama.year.drama6` 与四语标签即可，但会与 MBC 官方首播日期冲突，故本轮保留双年份写法。

## 2026-11-25 · 站长「所有的都是，实在找不到就挂英语的，尽量不要空着」：四语视频卡零空缺

- `6eb284a` — 收尾最后一轮：日区《无理的前进》改挂英語圏美区两条（Prime Video · Kocowa 频道、OnDemandKorea）；中英双语页的《亲爱的恩东啊》挂美区 Viki（免费带广告）。
- **Viki 禁令收窄**：`DEAD_SUB_PLATFORMS` 由整站前缀 `www.viki.com/tv/` 改为两条实测打不开的具体剧集页（`12699c-heirs`、`20503c-my-love-from-the-star`）。新挂的 `27377c-my-love-eun-dong` 本机实测 200 且标题命中，属于「找得到就挂」的例外；两条旧死链照旧判红，注入用例 247/247 仍全过。
- `DRAMA_SUB` 增 `jp/drama2`（日区本区无配信，按站长口径改挂英語圏），`LICENSED_SUB_EXTRA` 增 `en/drama12`、`zh/drama12`、`jp/drama2`。
- 覆盖终态：**中文 14/14、英文 14/14、日文 14/14、韩文 14/14**，视频区（含《哦！文姬》电影卡）零空缺；`VERIFY OK 404/63/4`，自检 247/247。
- 仍不碰的底线：所有卡片保留港区/AFF 与红字提示；外区入口一律写明「英文区/英語圏」，不冒充本区服务。

## 2026-11-25 · 站长「找不到就换英语区」：中文页三部港区无渠道作品改挂美区正版

- `aeea4b0` — 站长原话：「可以，找不到就换英语区」。港区实查确实没有持牌渠道的三部，中文页改为挂**英文区**入口，按钮文案逐条写明「英文区：…」，不让读者误认成港区服务。
  - 《大长今》→ 美区 Prime Video · Kocowa 频道（订阅）
  - 《我亲爱的朋友们》→ 美区 Tubi（免费带广告）
  - 《无理的前进》→ 美区 Prime Video · Kocowa 频道（订阅）+ OnDemandKorea（订阅）
- 中文页「禁挂外区订阅」的旧断言不删，改成**逐 URL 例外**：新增 `ZH_OVERSEAS_OK`，只有上面四条 URL 放行，其余外区订阅按钮照样判红（不做域名级放行，避免以后顺手把别的外区服务推给中文读者）。三条新入口同时进 `LICENSED_SUB_EXTRA`（URL + 文案 + 位置专项断言），`VERIFY OK 404/63/4`，自检仍 **247/247**（说明「外区订阅硬塞进中文页必判红」的旧用例还活着，只是换了未被放行的 URL）。
- 仍留空：中文页与英文页的《亲爱的恩东啊》——美区只剩 Rakuten Viki，站长 2026-11-24 已判 Viki 全站不挂；日区《无理的前进》日区未配信，是否也按「换英语区」挂美区入口，等站长一句话。

## 2026-11-25 · 视频区按站长「正版平台不限计费方式」复检：港区《拥抱太阳的月亮》补挂 Viu

- `77d2e66` — 站长指令：「补全视频区，4 语言版本，只要是正版平台，无论买断制还是短期租赁，或者会员订阅制，均可」。按此把四个语言页的视频卡（剧集 + 电影）逐张复检一遍，**能挂的真渠道就挂，挂不上的写清原因，绝不编号码**。
- **补挂 1 处（港区）**：中文页《拥抱太阳的月亮》原 `netflix.com/title/80031790` 已于 2026-11-25 判 404 并移除，此后只剩 AFF 红字。港区现存唯一持牌渠道是 **Viu**：Viu 官方 2024-11 稿件写明该剧「已上架 Viu，并提供粤语配音」，JustWatch 港区同日检索显示 1 季 HD 在架。Viu 商品 ID 从中国大陆 IP 取不到（站点按地区 503），故挂**港区站内搜索直达页**并写明是搜索入口，不编 `vod/<id>`。按钮文案「香港：Viu 观看（订阅）· 含粤语版」，排在 featured AFF 之上，AFF 与红字原样保留。
- **仍不挂（每条都留了证据）**：
  - 港区《大长今》《我亲爱的朋友们》《无理的前进》《亲爱的恩东啊》：JustWatch 港区与台区逐条检索均为「not available for streaming」；`tv.apple.com/hk` 四条商品页实测 404；爱奇艺国际站只有剪辑与解说、无正版专辑页。
  - 日区《无理的前进》（日文通行名《恋にチアアップ！》）：JustWatch 日区「まだ配信されていません」，`tv.apple.com/jp` 404。
  - 美区《亲爱的恩东啊》：JustWatch 美区只剩 Rakuten Viki；本站 2026-11-24 已按站长判定 Viki 全站不挂，维持不挂。
- **校验**：`SUB_DOMAINS` 增 `https://www.viu.com/ott/hk/`；`LICENSED_SUB_EXTRA` 增 `zh/drama6`（URL + 文案 + 位置的专项断言）。`VERIFY OK` **404 节点 / 63 属性 / 4 语**，自检 **247/247**。见 PITFALLS 63。

## 2026-11-25 · 影片卡 YouTube/Apple TV 复核：换租买版、日文页补 YouTube

- `de82c72`：英文页 YouTube 副按钮由已下架（UNPLAYABLE）的免费带广告版 `watch?v=Ck9onnQBStU` 换成同片 YouTube Movies 租买版 `youtu.be/cflWf3XKeFI`（label `Rent or buy on YouTube`）；日文页 Apple TV `id1691528206` 原本已 404，本轮把「日区无任何渠道」改为挂 YouTube 租买主按钮（韩语原版，日区可租买），文案「YouTube でレンタル・購入する · 正版で応援しましょう」。
- 同步：`PICKS_ACTIONS_EXPECT.jp.primary` null→`youtube`、`PICKS_PRIMARY_LABEL.jp` 改文案、`LICENSED_SUB_EXTRA['en/film']` 换 URL/label、`SUB_DOMAINS` 增 `https://youtu.be/`；两条故障注入改为「日文页注入美区 Amazon 主按钮」「日文页注入港区 aff 主按钮」，自检仍 247/247 全红。
- 结论口径：YouTube 免费版下架 ≠ 该片在 YouTube 消失（租买版仍在）；`itunes.apple.com/search` 日区返回空 ≠ 日区无上架，不能单独当判死依据（见 PITFALLS 62）。

## 2026-11-25 · 影片档案 teaser 移到加速器卡片下方（四语）+ 位置断言反转收紧

- `ae20406` — 站长：「附页：影片档案，请放在加速器下方」。`index.html` 里 `<p class="archive-teaser picks-film-teaser reveal">` 从链游 credit 之后、加速器小标题之前，移到 `#picks-accelerators` 卡片网格闭合之后、picks 区块 `</section>` 之前；`node scripts/build-i18n.mjs` 重生成 `en/` `jp/` `ko/`，四语入口现在都在加速器下方、`#archive` 与 `#film-note` 之上。
- **校验反转（强度只增不减）**：旧断言「teaser 必须在加速器标题之前」改为「必须在加速器小标题、`#picks-accelerators` 网格、最后一张加速器卡（`picks.geili.actions`）之后，且在 `#archive` / `#film-note` 之前」；四语循环里新增同序断言（网格后、film-note 前），以前只查中文 source，现在四语都锁。
- **故障注入 +2**：「teaser 移回加速器标题上方」（中文 source）、「teaser 推到 film-note 之下」（en 页），自检 **245/245 → 247/247**；`VERIFY OK` 404 节点 / 63 属性 / 4 语。
- **版权排查（结论：不挂）**：英文区《Beloved Eun-dong》(2015，JTBC《사랑하는 은동아》) 只有 Viki 收录（本站已判 Viki 地区不可用且不挂）、Netflix 授权互相矛盾，无可用持牌渠道；日语区《오! 문희》(Oh! My Gran, 2020) 在 U-NEXT / FOD / Amazon JP / Hulu / TSUTAYA / Rakuten 均无上架记录（此前 Apple TV 已 404），《チアアップ！》(발칙하게 고고, 2015，日文通行名《無理的前進》) 日本 VOD 无授权。宁可不挂，也不挂盗版与聚合站。

## 2026-11-25 · 按站长「中文找不到就推英文、尽可能补齐」补齐正版订阅 + 修两条死链

- `dbd680e` — 站长看《大长今》后定调：「中文没有、英文倒是有，中文实在找不到就去推英文，反正尽可能补齐」。本轮按 JustWatch 港/台/日/韩/美四区实查 + 逐条 `curl` 验 URL 200，只挂订阅制持牌平台，报 404 的一律不挂。
- **修死链（2 条）**：① drama6《拥抱太阳的月亮》`netflix.com/title/80031790` 已 404（该剧已从港区/美区下架）→ 中英文页均移除该 Netflix 按钮，`NETFLIX_TITLE_ID` 同步删 `zh/drama6`、`en/drama6`，英文卡改挂美区 OnDemandKorea（`contentId=707960`）；② 日文页《哦！文姬》Apple TV `id1691528206` 已 404 → 移除该按钮，日区实查无该片持牌租买/订阅渠道，整卡只留 AFF 红字。
- **补格（10 处，全部订阅制、URL 已验 200）**：en drama2 OnDemandKorea `contentId=1609890`；en drama3 OnDemandKorea `735544`；en drama6 OnDemandKorea `707960`；jp drama5《大长今》FOD（`fod.fujitv.co.jp/title/4e07/4e07120001/`，文案「FOD で見る（定額制）」）；ko drama5《大长今》wavve（`M_EP201703035422.1`，文案「wavve에서 보기 (정액제)」）；ko drama7 / drama8 / drama9 / drama10 各挂 TVING（`P001443981` / `P001158358` / `P001781079` / `P001754712`）；ko drama12 Watcha（`watcha.com/contents/tPVXJ4E`，文案「왓챠에서 보기 (정액제)」）；en film YouTube 免费带广告（`watch?v=Ck9onnQBStU`，文案「Watch free on YouTube (with ads)」）。新按钮一律排在 AFF 红字之上，AFF 邀请码与红字原样保留。
- **不挂（保持原状）**：大长今 / 我亲爱的朋友们 / 亲爱的恩东啊 / 无理的前进 港区实查无持牌渠道，中文页维持只挂 AFF 红字；Viki 全站不挂（本机打开 `viki.com/videos/1069131v-...` 即返回「该地区无法使用 Viki」，站长此前已判死链）；en/jp/ko 不新增 `netflix.com` 直链，仍由 `NETFLIX_TITLE_ID` 统一管理。
- **校验**：`DRAMA_SUB` / `DRAMA_SUB_EXTRA` / `LICENSED_SUB_EXTRA` 由「单平台」升级为「数组多平台」，逐条锁 URL + 文案 + 顺序，并用「订阅按钮数量 == 登记条目数」替代原来的「恰好一个」；`SUB_DOMAINS` 白名单加 `https://www.ondemandkorea.com/player/`、`https://fod.fujitv.co.jp/title/`、`https://www.youtube.com/watch?`；`PICKS_ACTIONS_EXPECT.jp.primary` 改为 `null`（无渠道区禁挂任何租买按钮与 YouTube，只留红字）；两条依赖已删 Apple TV 的故障注入改为「硬塞按钮」，Netflix 删除用例改用 en/drama1。`VERIFY OK` **404 节点 / 63 属性 / 4 语**，自检 **245/245**。

## 2026-11-24 · 影片档案挂正版 + 1theK 附页 + 影片档案按钮移入玩游戏区

- `37e2f38` — 站长怒指「影片档案故意不挂视频链接，一说政治就回避」。认账：film-note 区原文写着「本站不提供影片播放资源 / 不提供任何播放链接」，与已定的按区补挂正版规则冲突，属回避。核实外网：《出租车司机》Netflix title **80200945**（KR/JP 有，HK/TW/US 无；findmyvideos + netflix-movies.info + Netflix 官方条目交叉），美区 Prime Video、台区 Catchplay。
- **改动**：① film-note 新增「正版观看渠道 · 按所在地区」区块，四语各挂 Netflix 80200945（日/韩）+ Prime Video（美）+ Catchplay（台），删掉旧的「不提供播放链接」措辞；② 撤掉顶部导航的「影片档案」链接（四语），改在站长推荐「玩游戏」板块下（链游 credit 之后、加速器之前）新增「附页：影片档案」按钮跳 #film-note；③ 1theK 卡片 actions 内加「附页：1theK 是什么」按钮，新增独立 `#1thek-note` 介绍区块（CWAVE MEDIA 旗下平台、四语文案 + 中文站/YouTube 链接），位置在 1theK 卡片与端游区之间。
- **校验**：`FILM_KEYS` 移除 nav.film、加 9 个新 key；nav 断言反转（禁出现 film 链接、必带 teaser/watchLinks）；新增专项断言（三条正版深链写死、teaser 必须在 kpop 与 accelerator 之间、1theK 附页按钮在 actions 内且区块在端游前、禁「不提供播放链接」旧措辞回归）+ 5 条故障注入（nav film 复活、teaser 删除、watchLinks 删除、Netflix ID 篡改、1theK 按钮/区块删除）。`VERIFY OK` **404 节点 / 63 属性**，自检 **245/245**。
- **验收**：Edge CDP 四语桌面 **4/4**（导航无 film 链接、teaser 在玩游戏区、3 个正版按钮、1theK 附页按钮+区块、无溢出无坏图）；截图 `D:/WorkBuddy-Cache/shots/apx-20261124/`。

## 2026-11-24 · 中文《打架吧鬼神》补挂 Prime Video 正版

- `da2f01a` — 站长问「`primevideo.com/servicerestricted` 不是打架吧鬼神吗，为什么不做」。核实：该 URL 是 Prime Video **通用服务地区限制页**（无作品 ID，任何链接从受限地区打开都跳这里），不能当作品页挂；但 Prime Video 确实有《打架吧鬼神》真实详情页（`zh_TW/detail/打架吧,鬼神/0HVE4CVQNSBVA7YGU5OYIR2H51`，繁中简介吻合金所炫+玉泽演版）。JustWatch 港/台只收录 HBO Max（404 死链）故上一轮漏挂。按「港区没有退台湾」规则给中文卡补挂 Prime Video（台区 zh_TW 详情页），AFF 邀请码+红字原样保留。
- **校验**：`SUB_DOMAINS` 加 `primevideo.com/-/zh_TW/detail/`，`LICENSED_SUB_EXTRA` 加 `zh/drama11`，新增 2 组故障注入（按钮删除 / URL 篡改）。`VERIFY OK` **396 节点 / 63 属性**，自检 **240/240**。
- **验收**：Edge CDP 真浏览器验中文 drama11 卡——Prime 按钮在 AFF 之上、无溢出、无坏图；截图 `D:/WorkBuddy-Cache/shots/d11-20261124/zh-d11-card2.png`。

## 2026-11-24 · 按区补挂正规正版订阅（中文港区→台区，日韩本区）

- `a114acc` — 站长问「文姬在 Netflix 不是有吗」，核实后确认没有（聚合站 WebSearch 摘要断章取义说「Yes」，正文实为「not yet available on Netflix」）；随即定新规则：「港区没有的推荐台区（仅中文版），英文版/日韩只要是正规正版平台都可以推，AFF 不删」。
- **全区实查**：JustWatch GraphQL 对 14 卡（13 剧 + 文姬）× 港/台/日/韩/美五区抓全部 FLATRATE/RENT/BUY/FREE 渠道（1074 次请求限速跑完），逐条 curl 验证 URL 200。排除 HBO Max（404 死链）、Viki（历史死链）、Tencent onelink（跳转不稳）。
- **改动**：只给「本区有正版但当前无订阅按钮」的卡补齐——zh 死期将至→港区 Prime、文姬→港区无退台区 Catchplay；jp 拥抱月亮/恩东啊→U-NEXT，死期将至/打架吧鬼神/我亲爱的朋友们→Prime Video JP；ko 拥抱月亮/死期将至/恩东啊→wavve，打架吧鬼神/我亲爱的朋友们→TVING。共 12 个按钮，文案四语本地化，全部排在 aff 红字之上，AFF 邀请码与红字原样保留。drama2/5/12 美区、文姬港/日/美无订阅仍保持无按钮。
- **校验**：新增 `LICENSED_SUB_EXTRA` 写死 12 条 URL+文案 + 专项断言（覆盖不在 `DRAMA_SLUGS` 的 drama6/10-13/film，否则会漏判）；`SUB_DOMAINS` 加 catchplay/app.primevideo；新增 4 组故障注入（文姬按钮删除/URL 篡改、日文按钮删除、韩语文案漂移）。`VERIFY OK` **396 节点 / 63 属性**，自检 **238/238**。
- **验收**：Edge CDP 四语桌面 **4/4**，逐卡验新增按钮 URL/文案/位置、AFF 保留、无溢出、图片加载；截图 `D:/WorkBuddy-Cache/shots/subs-zones-20261124/`。

## 2026-11-24 · 四语按区挂 Netflix 正版，AFF 全部保留

- `c211776` — 站长指出「日韩也没做 Netflix 链接，中文按港区算、港区没有再看台湾，AFF 不删」。
- **地区实查**：JustWatch 港/台/日/韩/美五区逐条查 13 剧（GraphQL offers + 官方交叉）。Netflix title ID 跨区通用，带 locale 前缀反而是 404，链接统一 `netflix.com/title/{ID}`。港区与台湾一致：drama1/3/4/6/7/8/9 有；日区 drama1/4/7/8/9 有（星你/拥抱月亮/大长今等无）；韩区 drama1/3/4/7/8/9 有（拥抱月亮等无）；美区沿用上一轮 drama1/6/7/8/9。
- **改动**：zh 7 卡、jp 5 卡、ko 6 卡挂对应地区 Netflix 订阅按钮，文案四语本地化；所有卡的 aff 邀请码按钮与红字提示原样保留， Netflix 按钮排在其上。查无 Netflix 的卡（drama2/5/10-13）一律不挂，避免死链。
- **校验**：`NETFLIX_TITLE_ID` 扩为四语映射 + `NETFLIX_LABEL` 文案锁死；禁链断言改为「允许 title 深链、禁首页/搜索页泛链」，中文源只禁非 Netflix 外区订阅按钮；订阅按钮并存规则（Netflix 不计入 DRAMA_SUB 唯一占位）；新增 6 组故障注入（中文/日文 ID 篡改、韩文无授权区注入、按钮删除、文案漂移、按钮挪到红字下方）。`VERIFY OK` **396 节点 / 63 属性**，自检 **234/234**。
- **验收**：Edge CDP 四语桌面 **4/4** 全过，逐卡验 Netflix ID/文案/位置、无串区、AFF 保留、无横向溢出、图片加载；截图 `D:/WorkBuddy-Cache/shots/netflix-zones-20261124/`。

## 2026-11-24 · 英文视频区补挂 Netflix/Prime/Tubi 正版，修正误导性无版权提示

- `6318663` — 站长质疑「英文版视频区怎么那么多无版权的，是真的没有英文版吗？奈飞也没有吗？」。
- **查证**：JustWatch 美区 2026-11-24 逐条实查 + Netflix 官方条目交叉核对，英文区 14 张卡里有 8 张存在可用正版：暴君的厨师 `netflix.com/title/82024852`、车贞淑医生 `81682438`、哲仁王后 `81422314`、你好再见妈妈 `81243996`、拥抱太阳的月亮 `80031790`、死亡游戏 Prime `gti a3b03bc3`，打架吧鬼神与亲爱的朋友们 Tubi 免费带广告。亲爱的恩东啊美区仅剩已封禁的 Viki 死链，确实无有效正版。
- **根因**：旧规则（2026-11-22）以「Netflix 入口就是 aff 红字」为由禁止任何 `netflix.com` 链接，且上一轮把「未检索到正版」做成放在剧集区顶部的全局一句，两个因素叠加让英文用户误以为整区无正版。
- **修正**：英文区 8 张卡挂上真实正版订阅按钮（Netflix 条目深链 / Prime / Tubi），中国大陆 aff 红字照旧保留；全局提示改为「未列出观看按钮的作品，本站未检索到正版资源，可能已下架」限定范围，四语各自手写同义改写。Netflix 禁令收窄为「中文源全禁、外文页只允许 title/ID 条目深链，禁首页/搜索页泛链」。
- **校验**：`NETFLIX_TITLE_PREFIX` / `NETFLIX_TITLE_ID` / `DRAMA_SUB_EXTRA` 写死链接与条目 ID，`SUB_DOMAINS` 加 Netflix title 前缀；新增 4 组故障注入（改首页泛链、篡改条目 ID、日文页注入 Netflix、删 Prime 按钮）。`VERIFY OK` **396 节点 / 63 属性**，自检 **228/228**。
- **验收**：Edge CDP 四语桌面/移动 **8/8** 全过，逐组验 Netflix ID、Prime/Tubi 链接、无 Viki、提示限定语、无横向溢出；截图 `D:/WorkBuddy-Cache/shots/streaming-20261124/`。

## 2026-11-24 · 新增剑灵与天堂2四语卡：中文台服、英文美服

- `24f4fef` — 站长要求新增剑灵（中文挂台服、英文按美服算）与天堂2（中文台服、英文优先美服/国际服）。
- **官网核实**：剑灵台服 `tw.ncsoft.com/bns/`（页面标题「劍靈-台灣官方網站」，2026-11-18 仍有活动）、美服 `bladeandsoul.com` → `bladeandsoul.plaync.com/en-us/`（Blade & Soul NEO）、韩服 `bns.plaync.com`；`bns.tw` 虽返回 200 但实为玩家门派站，不可挂。天堂2台服 `tw.ncsoft.com/lineage2/`（新天堂II，2026-11-18 仍在更新）、美服 `lineage2.com` → `na-lineage2.plaync.com/en-us/`、韩服 `lineage2.plaync.com`（不是 l2.plaync.com）。剑灵日服原版与 NEO 已于 2026-03-11 停服、天堂2未找到活跃日服，故日语页也挂台服。
- **发行日与排序**：剑灵韩国首发 2012-06-30、天堂2韩国首发 2003-10-01（英文维基交叉核对）。卡片按韩国首发年降序插入 pubg 之后、kart 之前与 audition 之后、bnb 之前；天堂2(2003-10) 与泡泡堂(2003-04) 同年，新增 `PC_GAME_DATE` 精确到日，并把旧版 `PC_GAME_YEAR` 循环的严格 `>` 改成 `>=`。
- **图片**：`assets/bladeandsoul-poster.jpg`、`assets/lineage2-poster.jpg` 取自各自台服官网官方主视觉（og:image / meta 图），裁成 460×215；两作无主机版，不挂 PS/Xbox/Steam 按钮，只挂地区官网按钮。
- **校验**：`PC_OFFICIAL_SLUGS` / `PC_OFFICIAL_LINK` 写死四语地区链接，新增地区串链、无主机按钮、图片引用、四语节点断言；7 组故障注入（中文挂美服、英文挂台服、韩文挂美服、注入 Xbox、海报引用破坏、天堂2挪到泡泡堂之后、日语 note 删除）。`VERIFY OK` **396 节点 / 63 属性**，自检 **224/224**。
- **验收**：Edge CDP 四语桌面/移动 **8/8** 全过，逐卡验链接、按钮文案、图片 naturalWidth、顺序、无横向溢出；截图 `D:/WorkBuddy-Cache/shots/mmorpg-20261124/`。

## 2026-11-24 · 全站视频订阅体检：三条 Viki 死链换正版 + 劲舞团地区入口

- `aba2389` — 站长指出截图中三条 Viki 是死链、要求「对视频做一次全站检查，有正版的就挂正版，没有的写『本站未检索到正版资源，可能已下架』（自己写这句话，不要改变原意）」；劲舞团英文版挂台服 `https://landing.mangot5.com/`，日韩找对应服务器，找不到也用台服。
- **体检方法**：HTTP 状态 + Edge headless + CDP 真浏览器渲染逐条看页面标题/正文。HTTP 200 一律不等于有效——三条 Viki 返回 200 且能渲染剧集页，但按站长判定为死链（他的网络环境打不开），全部替换；U-NEXT 星你第一次抓到 U-NEXT 首页，延长等待后确认是「星から来たあなた 第1話」正常页；wavve 第一次 body 为空，延长后确认「발칙하게 고고」正常页，两条均保留。其余 TVING / Prime Video / watcha 均实测有内容。
- **三条 Viki 替换**（JustWatch 美区 2026-11-24 逐条查 + 真浏览器验证页面标题）：《来自星星的你》→ Kocowa via Prime Video（`amzn1.dv.gti.b8608d49...`，页面标题 "Watch My Love From the Star | Prime Video"）；《继承者们》→ Tubi 免费带广告（`tubitv.com/series/300001259/the-heirs`，页面标题 "Watch The Heirs Streaming Online | Tubi Free TV"，美区除 Viki 外无订阅平台，Prime 购买按钮保留）；《大长今》→ Kocowa via Prime Video（`amzn1.dv.gti.e409f09d...`）。三语字典订阅按钮文字同步改，站长的「查不到就写提示」以 `SUB_UNAVAILABLE` 四语手写文案落地（zh/en/jp/ko 各写各的，含义一致），写进校验；`DEAD_SUB_PLATFORMS` 禁 Viki 剧集页复发。
- **劲舞团**：zh 保持国服 au.9you.com；en/jp 挂台服 MangoT5（日服 X-BEAT 2016-03-31 关服，外网核实）；ko 挂韩服 audition.hanbiton.com（2026-11-18 仍有更新公告，活跃运营）。四语 note 全部重写，纠正旧文案「韩服 2019 年停运、台服未核实」的错误说法。校验 `AUDITION_SERVER` 按区写死 + 串区检测。
- **校验**：`DRAMA_SUB` 三条替换、`SUB_DOMAINS` 加 Tubi、死链平台黑名单、四语提示文案断言、劲舞团地区断言；新增 5 组故障注入（Viki 复活、提示文案被删、英/韩串区、旧注入更新）。`VERIFY OK` **384 节点 / 61 属性**，自检 **217/217**（上轮 213）。
- **验收**：Edge headless + CDP 四语桌面 1440 / 移动 390 共 **8/8**，逐组验提示文案、无 Viki 死链、订阅链接归属、劲舞团地区链接、图片 naturalWidth、无横向溢出；逐卡截图肉眼确认三剧按钮与劲舞团 note 渲染正常。截图 `D:/WorkBuddy-Cache/shots/sub-audition-20261124/`。

## 2026-11-24 · 复核《拥抱太阳的月亮》年份：以 Netflix 官方为准，确为 2012

- `74ed794` — 站长提出「《拥抱太阳的月亮》不是 2012 年的，去 nf 查，盗版网站那个标记是错误数据，不可信」。按要求以 Netflix 官方为准核验，但结论与质疑相反：真浏览器（Edge headless + CDP）打开 `netflix.com/title/80031790`，中文界面显示「拥抱太阳的月亮 2012⁨TV-14⁩剧情片」，英文界面显示「The Moon Embracing the Sun 2012 20 Episodes」，zh/hu-en/tw-en 多地区一致。
- **外网交叉核对同结论**：en 维基 `January 4, 2012 – March 15, 2012`（MBC，20 集 + 2 特辑）；ko 维基、百度百科、韩星网均为 MBC 2012-01-04 首播。站点当前 `picks.drama6.label` 的 2012 与 Netflix 及所有权威源一致，并非盗版站错误数据，故**不改年份**。
- **校验加固**：在 `verify-i18n.mjs` 故障注入尾部加一条「把 drama6 年份从 Netflix 核实的 2012 篡改成 2013」，连同注释写明核验来源与日期；确认该注入被判红。`VERIFY OK` 383 节点 / 61 属性 / 4 语言，自检 **213/213**（上轮 212）。

## 2026-11-24 · 两首新歌：임효라《미스코리아》+ Stellar《공부하세요》

- `504d25e` — 站长给 QQ 音乐歌曲页（songid 204137216）说「这首歌没有 MV，中文版你看着处理；而且很容易搜到李孝利，其他 3 语言用这个 YouTube」，并要求新增《学习吧》（QQ MV q0012sypyu1 / YouTube rS_k1DhhDy4）、「不是北韩的那个，不要去推、别给线索」，还要看发行时间。
- **核实**：QQ 页确认前者是 trot 歌手 임효라 的《미스코리아》（2017-09-20），不是李孝利；指定 YouTube `iB0FLshLbLk` 是她在 가요콘서트 的现场演出，不是官方 MV。后者是 Stellar 第三支数字单曲《공부하세요》，QQ 与 en 维基均记 **2013-07-11**；相邻曲目真实发行日是 U.sso.boy 2017-11-16、《请开门》2013-10-30，所以新卡分别插在 ussoboy 之后、music1 之后。
- **四语实现**：新卡 `picks.misskorea.*` / `picks.study.*` 各 7 键 + imageAlt，中文《미스코리아》只挂 QQ 歌曲页并写明「QQ 音乐只有歌曲页，没有 MV；不是李孝利」，三语挂指定 YouTube 且说明是现场舞台；Stellar 中文挂 QQ MV、三语挂 YouTube。新增两张 1280×720 真图：`assets/mv-misskorea.jpg`（YouTube 缩略图裁掉黑边与广告条）、`assets/mv-study.jpg`（官方 MV 缩略图）。图片与来源说明四语齐全，**全站不出现任何北韩相关线索词**。
- **校验写死**：`KPOP_SLUGS` / `KPOP_IMAGE` / `KPOP_ZH_LINK` / `KPOP_YT_ID` 纳入两首；新增 `MUSIC_DATE`（精确到日）、`MUSIC_DATE_TEXT`、`MUSIC_DISAMBIG`、`FORBIDDEN_DPRK`，`SORT_RULES.music` 加 date 比对，四语逐页检查链接归属、无 MV 说明、不是李孝利、精确日期、无北韩词。新增 **7 组故障注入**（中文挂 YouTube、外文泄漏 QQ、两卡倒序、删韩语辨析、抹掉 2013-07-11、注入北韩词、海报缺失）。`VERIFY OK` **383 节点 / 61 属性**，自检 **212/212**（上轮 371/205）。
- **验收**：Edge headless + CDP 四语桌面 1440 / 移动 390 共 8 组，逐组验 9 首歌顺序、图片 naturalWidth、链接地区归属、中文无 YouTube、辨析文案、无横向溢出，全过；肉眼确认四语卡片渲染。截图 `D:/WorkBuddy-Cache/shots/songs-20261124/`。

## 2026-11-24 · 影片档案：补写光州事件，不采纳线索站的「剧情片」口径

- `7a77309` — 站长给出 ncat30.com 的一条《出租车司机》详情页，要求「记载一下这个，不要完全采纳此网站的说法，对光州事件避而不谈。国内你大概也搜不到什么内容了，去外网抓数据」。该站有 cdndefend SHA-1 Cookie 挑战，本地算出 Cookie 后抓到原文：只有片名、导演（写作「张薰」）、演员、2017-09-21 首映和播放地址，正文一句「韩国剧情片」，光州事件只字未提。
- **不采纳、不挂链**：仓库 `FORBIDDEN_PIRATE_DOMAINS` 已禁 ncat30.com，档案只写可核对事实，原站域名四语一律不出现（校验加注入确认）。
- **外网取数**：en/ko 维基百科交叉核对——2017-08-02 韩国上映、137 分钟、张勋导演/严宥娜编剧；取材于 ARD 记者 Jürgen Hinzpeter 与出租车司机 Kim Sa-bok（片中「金万燮」为虚构姓名）；KOFIC 首日 698,090 张、8 月 20 日累计 10,068,708 人，Showbox 称 9 月 9 日破 1,200 万，全球约 8,710 万美元；1980-05-18 至 27 光州民主化运动，英文维基援引估计死亡最高约 2,500 人，长期被列为禁忌，Hinzpeter 把影像带出封锁线经国际媒体播出。
- **实现**：新 `id="film-note"` 附页 + 导航「影片档案」，四语新增 22 键（371 节点 / 59 属性）；五条外网来源全部 `target="_blank" rel="noopener noreferrer"`，2026-11-24 实测 HTTP 200；样式为事实表 + 档案正文，窄屏单列。
- **校验**：`FILM_SECTION` / `FILM_SOURCE_LINKS` / `FILM_MARKERS` / `FILM_KEYS` 四语写死光州事件年份、约 2,500 人、原型姓名与票房数字，缺任一即判红；新增 8 组故障注入（删区、抹掉英文光州段、删日文年份、删韩文死亡数、掉一条来源、导航漂移、注入盗版域名、删字典键）。`VERIFY OK` **371 节点 / 59 属性**，自检 **205/205**（上轮 349/197）。
- **验收**：Edge headless + CDP 四语桌面 1440 + 移动 390 共 8 组，逐组验导航锚点 / 区块 / 光州标记 / 5 条外链 / target+rel / 无盗版域名 / 无横向溢出，全过；肉眼确认四语标题、事实表与来源区渲染正常。截图 `D:/WorkBuddy-Cache/shots/film-record/`。
- **记账坑**：插入来源列表时 Python 的 `crlf()` 把已含 CRLF 的片段再转一次，产生 4 处 `\r\r\n`，Git 把 HTML 当二进制、单次提交出现 5000 行 diff；统一改回 LF 后重提，最终 326 行。见 PITFALLS 50。

## 2026-11-24 · 导航锚点 + 搜索框分区 + 三区排序规则写死

- `f00f36d` — 站长三条指令一次性落地：①「导航『看韩剧』锚点指向 #picks 不对」→ 改为 `#picks-dramas`（`NAV_SUB_HREFS` 同步）；②「端游下面做一个只能搜端游、手游区独立只能搜手游，不然数据很乱」→ 原 `searchGame` 一框搜四容器拆成 `searchPC`（只扫 `picks-pc-games`）/ `searchMobile`（只扫 `picks-mobile-games`），分别置于各自子标题下，app.js SCOPES 同步，i18n 四语 `picks.search.game.*` 换成 pc/mobile 两组；③「严格遵循最新上映的在前，写死；视频音乐游戏都是」→ 三区全部按发行年降序重排。
- **剧集 14 张**：2025 暴君的厨师 → 2023 车贞淑医生/死期将至 → 2020 哦！文姬/哲仁王后/你好妈妈再见 → 2016 打架吧鬼神/我亲爱的朋友们 → 2015 无理的前进/亲爱的恩东啊 → 2013 来自星星的你/继承者们 → 2012 拥抱太阳的月亮 → 2003 大长今。film 卡 label 补「电影 · 2020」（《哦！文姬》KBS 官方 2020-09-02）以便排序。
- **音乐 7 首 MV**：2024 마라탕후루 → 2019 Arcadia → 2018 So Special → 2017 Let's Go Now → 2013 请开门 → 2012 짜라빠빠（网络爆红版）→ 2004 우유송；1theK 平台卡无年份、保持在网格外最后。四语 label 全部补年份。MV 年份经查证（1theK/音乐平台/维基），非编造。
- **端游 10 款**：此前新加的 4 款（bnb/kart/audition/rbeat）没纳入排序断言，现已补 2022 R2Beat / 2006 跑跑 / 2005 劲舞团 / 2003 泡泡堂，整体降序；手游 browndust 2023 / nikke 2022 已正确。
- **校验写死**：新增 `SORT_RULES`（drama/music/pc/mobile 四区 order + year 映射）+ `checkDescending()` 通用断言，按 label 节点 DOM 出现顺序逐年比对，**四语页面全部覆盖**；同年并列允许（`>=`），缺年/倒序/串位判红。导航锚点、搜索框 id/占位键/app.js 作用域均加四语断言。新增 8 组故障注入（锚点回退、搜索框残留、作用域放宽、剧集/音乐序倒转、年份漂移等）。`VERIFY OK` **349 节点 / 59 属性**，自检 **197/197**（上轮 189）。
- **验收**：Edge headless 四语桌面 + 390px 移动 8 组，每组验导航 href / 双搜索框存在 / 四区年份降序 / PC 搜索不误伤手游卡，全过；肉眼看剧集区 2025 在前、端游搜索框位置正确。截图 `D:/WorkBuddy-Cache/shots/arg-rules/`。

## 2026-11-24 · 韩剧区新增两部：《亲爱的恩东啊》《我亲爱的朋友们》

- `b460d34` — 站长「想起了两个我看过的」给出 ncat30 两个详情页链接（该站有 cdndefend 防护抓不到，改用 TMDB + 维基核实）。**《亲爱的恩东啊》**（사랑하는 은동아 / My Love Eun Dong，2015 JTBC 金土剧，朱镇模、金莎朗主演，跨越二十年的初恋重逢）；**《我亲爱的朋友们》**（디어 마이 프렌즈 / Dear My Friends，2016 tvN 十周年企划，卢熙京编剧，高贤贞、金惠子、罗文姬等主演，第 53 届百想最佳电视剧）。两部均已看过、非瞎推。
- **易错点**：TMDB 搜 "Dear My Sister" 返回的是《TV Novel: Dear My Sister》(id 200556)，**不是**《亲爱的恩东啊》——后者英文名是 *My Love Eun Dong*（id **62838**）。《我亲爱的朋友们》= id **66434**（非 138461 "My Dear Friend" 等其他同名条目）。逐个读详情页标题 + 首播年份确认后才用。
- **实现**：drama12/drama13 标准两栏海报卡，海报经 TMDB jina 代理取路径、`image.tmdb.org/t/p/w780` 下载、转 500×750 入库，肉眼确认剧名对应；四语各 7 键 + zh imageAlt 补齐，韩剧 actions 沿用各语既有 nfshare 写法。
- **校验**：`FIXED_SLUGS`/`FIXED_IMAGE` 加两卡，新增 2 组故障注入（韩语页删海报、英文页删标题）。`VERIFY OK` **349 节点 / 57 属性 / 4 语言**，自检 **189/189**（上轮 337/55/187）。
- **验收**：Edge headless 四语桌面 + 390px 移动 8 组全过；肉眼看两卡海报与标题正确对应、布局整齐。截图 `D:/WorkBuddy-Cache/shots/arg-d12/`。

## 2026-11-24 · 补齐前一轮 10 张「仅中文纯文字卡」：抓海报 + 补四语

- `b8d6002` — 站长接手反馈：Qwen 那 9 个提交（`02ac8eb`~`31ff796`）把 6 部韩剧 + 4 款端游做成 `data-zh-only` 纯文字卡，**既没抓图、也只做中文**，理由是「抓不到」。实际前 5 部韩剧和 6 首 MV 都四语齐全有图，证明不是抓不到而是偷懒。本轮全部补齐。
- **海报补齐**：6 部韩剧从 TMDB 官方剧集页抓海报（经 jina.ai 代理读渲染后页面拿 poster 路径，再从 `image.tmdb.org/t/p/w780` 下载），逐张肉眼确认对应剧名，转码 500×750 JPEG——`moon-embracing-sun` / `mr-queen` / `hi-bye-mama` / `tyrants-chef` / `deaths-game` / `fight-ghost`。4 款端游：R2Beat 从 `git show 02ac8eb:assets/rbeat-poster.jpg` 恢复（Qwen 曾抓了又删），泡泡堂 / 跑跑卡丁车 / 劲舞团用 Wikipedia Commons 的官方 logo + 主题色渐变底合成 460×215 头图（无盗版水印）。
- **结构 + 四语**：10 张卡全部去掉 `data-zh-only`、改为标准两栏海报结构，新增 `picks.drama6~11` 与 `picks.bnb/kart/audition/rbeat` 各 7 键（label/imageCredit/title/desc/actions/note/imageAlt）四语齐全。韩剧各语 actions 沿用本语既有观看渠道写法（nfshare 链接 + 本语提示），端游四语说明自然翻译；R2Beat 那句「Steam 仅简中所以只在中文站推荐」删掉，改为中性说明「Steam 页面为简体中文」。
- **校验**：verify 删掉整套 zh-only 断言与 4 组注入，新增 `FIXED_SLUGS` / `FIXED_IMAGE` + 10 卡的四语键/海报/渲染断言 + 6 组故障注入（海报缺失、label 键改错、日文译文删除、韩文 imageAlt 删除、data-zh-only 复用、英文页海报缺失）。`VERIFY OK` **337 节点 / 55 属性 / 4 语言**，自检 **187/187**（此前 Qwen 版 277/45/185）。
- **验收**：Edge headless + CDP 四语桌面 1440 + 390px 移动共 8 组、每组 10 卡 × 4 项断言（label/title/图片加载/图片路径）全过，无横向溢出、无 data-zh-only 残留；肉眼确认 6 部韩剧海报与标题一一对应、4 款端游 logo 头图正常。截图 `D:/WorkBuddy-Cache/shots/arg-fix/`。

## 2026-11-23 · 端游卡加 PlayStation / Xbox 按钮（四语按地区挂链接）

- `f44ce23` — 站长指令「端游板块把 PlayStation 和 Xbox 的也挂一下，中文用港区、英文美区、日语日区、韩语韩区，以后都这个规则」。**这条地区规则是长期约定**，已写入项目 `.workbuddy/memory/MEMORY.md` 与用户级记忆。
- **地区映射**：zh=港区（PS `zh-hant-hk` / Xbox `zh-HK`）、en=美区（`en-us` / `en-US`）、jp=日区（`ja-jp` / `ja-JP`）、ko=韩区（`ko-kr` / `ko-KR`）。PS 前缀全小写、Xbox 首字母大写，写错即 404。
- **链接形式（关键）**：PS 商品 ID 按地区绑定、跨区失效，**改用 concept 页**（concept ID 跨区通用，`/{地区}/concept/{ID}` 自动落该地区 SKU）；Xbox 商品 ID 跨区通用，只换前缀。逐个 curl 验证 6 个 PS concept + 3 个 Xbox 商品页在四语地区均 200 且命中游戏名。
- **平台例外**：剑星无 Xbox 版（截至 2026-11 仍 PS/PC/Switch2，跳过 Xbox）；神佑释放 PS/Xbox 主机服 2022-11-30 已停服；永恒轮回 PC only（Xbox 页是 2021 遗留占位、从未正式发售）。这三张按实际可用性挂按钮——前两张里的神佑释放/永恒轮回只有 Steam，剑星 Steam + PS。三款有全平台的（我独自升级/Lies of P/PUBG）挂 Steam + PS + Xbox 三按钮。Steam 保持橙色主按钮，PS/Xbox 用 secondary 样式（复用既有 `.pick-link-secondary`，无新 CSS）。
- **校验**：新增 `REGION_LOCALE` / `PC_PLATFORM` / `PS_BASE` / `XB_BASE` 常量；四语逐语断言每张卡的平台按钮组合、地区前缀正确、串区检测（其他三地区前缀泄露即判红）、无平台卡不得挂按钮；新增 4 组故障注入（地区前缀错、串区泄露、无 PS 版本卡强挂 PS、有 PS 版本卡漏挂）。`VERIFY OK` **240 节点 / 33 属性 / 4 语言**，自检 **176/176**（上一轮 172）。
- **验收**：Edge headless + CDP 四语各 6 张卡共 124 项断言全过——按钮组合、地区前缀、无串区泄露全部正确；肉眼看中文页确认 Steam 橙色高亮 + PlayStation + Xbox 竖排整齐。截图 `D:/WorkBuddy-Cache/shots/arg-plat/`。

## 2026-11-23 · 端游区按发行时间降序重排为 6 款

- `543afe6` — 站长指令「端游区新增 2 个，按发行时间最新的靠前」。用 Steam 官方 `store.steampowered.com/api/appdetails` 核实发行日与开发商：app/2373990《我独自升级：起立·觉醒》Netmarble Neo / Netmarble、2025-11-24；app/1254120《神佑释放 Bless Unleashed》VALOFE、2021-08-06（用户给的链接标题写「神网释放」，以 Steam 官方名「神佑释放」为准，链接原样保留）。
- **重排**：端游区从 4 卡扩到 6 卡，按发行日降序——我独自升级 2025 → 剑星 2024 → Lies of P 2023 → 神佑释放 2021 → 永恒轮回 2020 → PUBG 2017。此前顺序（2023/2024/2017/2020）本就是乱的，一并理顺。两款新卡沿用标准两栏海报结构，单 Steam 按钮；两张 Steam 官方头图转码为 460×215 JPEG。
- **四语**：`assets/i18n.js` 为两款新卡补齐 en/jp/ko 的 label / imageCredit / title / desc / actions / note 与四语 imageAlt（zh 只补 attr，html 在源页面），共 44 行键。generated 三语页面已重建。
- **校验**：`PC_GAME_SLUGS` / `GAME_IMAGE` 加入两款新卡；新增 `PC_GAME_YEAR` 年份映射 + 源页面 label 出现顺序与降序双重断言；故障注入新增 4 组（卡序颠倒、新卡删除、Steam 链接被换、海报文件缺失）。`VERIFY OK` **240 节点 / 33 属性 / 4 语言**，自检 **172/172**（此前 228/31/168）。
- **验收**：Edge headless + CDP 四语桌面 + 390px 移动共 8 组 56 项断言全过——六卡顺序一致、年份降序、6 张海报加载、6 个 Steam 链接、标准两栏、无横向溢出。截图 `D:/WorkBuddy-Cache/shots/arg-pc/`。

## 2026-11-23 · 撤 Yooldo 与占位卡，链游区定 4 卡 + 健康度徽章

- `836e946` — 上一轮体检结论落地：Yooldo 代币 5 月单日暴跌约 93%、原团队 Catze Labs 停更、被秃鹫基金接管且第三方评级 4.2/10「Avoid」，判定「危险」→ 撤卡；站长确认「占位的那个一起撤」，链游区从 5 卡 + 占位卡收敛为 **ONE → WEMIX → MSU → Planetarium 四张**，正好铺满两列网格，无空格。
- **健康度标记**：按体检结论给每张卡的标题上方加徽章——ONE / WEMIX = **尚可**（琥珀），MSU / Planetarium = **健康**（绿）；「危险」档 Yooldo 已撤故四卡无红档，但 CSS 保留 `.pick-health-risk`（防未来回退）。徽章文案逐语锁定：zh「健康/尚可」、en「Healthy/Fair」、jp「健全/まずまず」、ko「양호/보통」，均为自然译文，未照搬站长措辞。
- **图例说明**：底部新增 `picks.chain.legend` 独立行解释评级口径——zh「标记说明：健康＝运营与数据都在增长；尚可＝仍在运营，但有明显隐忧。评级依据公开信息，仅供参考。」，四语自然句。`picks.chain.credit`（站长推荐，内容由 AI 生成）从原占位卡内移回网格下方独立行（`.picks-chain-credit-standalone`），保持加粗。
- **资源清理**：`git rm assets/yooldo-chain.jpg` 与 `assets/chain-soon.jpg`；四语字典删除全部 `picks.yooldo.*` / `picks.chain.soon.*` 键（attr + html 共 38 行）。
- **校验**：`CHAIN_SLUGS` 从 5 去 yooldo，`CHAIN_HEALTH` / `CHAIN_HEALTH_ZH` / `CHAIN_HEALTH_EXPECT` / `CHAIN_LEGEND_ZH` / `CHAIN_LEGEND_EXPECT` 常量 + 四语逐语锁定断言 + 徽章 class 断言 + 图例断言 + 旧卡残留断言 + CSS 颜色断言；删占位卡相关断言与 4 组故障注入，新增 10 组健康徽章故障注入。`VERIFY OK` **228 节点 / 31 属性 / 4 语言**，自检 **168/168**（此前 233/33/162，因删卡减少、加徽章图例增加）。
- **验收**：Edge headless + CDP 四语桌面 + 390px 移动共 8 组截图与 DOM 断言全过——四卡数=4、徽章文案/颜色正确（尚可 rgb(138,90,0) / 健康 rgb(19,115,51)）、无 Yooldo/占位残留、credit 独立行、图例行齐全、无横向溢出。截图 `D:/WorkBuddy-Cache/shots/arg-health/`。

## 2026-11-23 · 链游区加区块链高风险提示（四语红字警示条）

- `67308e8` — 站长要求提醒访客「区块链属高风险投资、请量力而行」，并强调整句自己写、不照搬其措辞与写作风格。在链游区说明行下方、`#picks-chain-games` 网格上方新增 `picks.chain.risk` 警示条：中「风险提示：区块链项目与虚拟资产价格波动剧烈，投入前请先确认自己能够承受相应损失，按自身财力谨慎参与。」；en/jp/ko 各写自然完整句（含 <strong> 加粗前缀），覆盖「高波动 + 量力而行」两层意思，未照抄原话标签式表达。
- 样式 `.picks-chain-risk`：浅色警示块 + 3px 红左边框 + 红字加粗（#C5221F / 700），`<strong>` 前缀 800；不动 `.picks-coming-note` 与其他红字规则。
- 校验：`CHAIN_RISK_ZH` / `CHAIN_RISK_CSS` 常量、中文源三处文案断言、四语节点 + <strong> 断言、CSS 红字加粗 + 红边框断言、3 组故障注入（删提示 / 文案软化 / 去红加粗）。节点 232 → 233，自检 159 → **162/162**。
- 验收：四语桌面 CDP 截图确认红字加粗警示条与文案；390px 视口读取计算样式确认 color rgb(197,34,31)、weight 700、3px 红边框、元素宽 354px 无溢出。

## 2026-11-23 · 链游区加「敬请期待」占位卡，底部备注移入卡内

- `5ff251a` — 站长截图反馈：链游区 5 卡在两列网格里落单（Planetarium 右下空一格），要求右边补一张占位卡；底部独立的「站长推荐，内容由 AI 生成」那行删掉，写进占位卡；占位卡上半文案「正在开发/建设中」自由发挥多写点，底部贴备注。
  - 新占位卡 `picks.chain.soon.*`：标准两栏结构、海报 `assets/chain-soon.jpg`（ffmpeg 深蓝渐变 + 双层框 + COMING SOON，1280×720）；正文写「链游生态变化快、项目停运/转支付基建/地区法规调整，本站持续跟踪仍运营且有官网的项目，逐一核实再补进来」。四语 label/title/desc/imageCredit + imageAlt 齐全。底部复用 `picks.chain.credit` 节点，保持加粗。
  - 校验新增占位卡断言（标准两栏、图片引用、四语节点、credit 必须在卡内而非区级独立行）+ 5 组故障注入；`VERIFY OK` 232 节点 / 33 属性 / **159/159** 自检；四语桌面 + 移动端 CDP 截图确认 6 卡 3 行、占位卡右下、备注在卡内、无乱码溢出。

## 2026-11-23 · 链游区底部备注整句重写去「自动」并加粗

- `6dd6503` — 站长反馈底部备注「站长推荐 + AI 自动生成」：不要写「自动」、整句重写、加粗，并强调「别学我写作风格」（不要照搬标签式堆砌）。四语改成自然完整句：zh「站长推荐，内容由 AI 生成」/ en「Recommended by the webmaster, with content generated by AI」/ jp「運営者がおすすめする内容を AI が生成」/ ko「운영자가 추천하는 내용을 AI가 생성」。
  - CSS 新增 `.picks-chain-credit { font-weight: 700; }`（只作用于这一行，不碰 `.picks-coming-note` 其他提示）。校验脚本同步更新 `CHAIN_CREDIT_ZH` 常量 + 加粗断言 + 1 组故障注入（去掉加粗判红）。
  - 验收：`VERIFY OK` 228 节点 / 32 属性 / **155/155** 自检；四语桌面 CDP 特写截图确认文案无「自动/自動/자동」且明显加粗，移动端无横向溢出。

## 2026-11-23 · 链游区重写为 5 卡（顺序打乱 + 底部 AI 备注）

- `bade3b8` — 站长指令「这几都加上吧，mir4 还是转 wemixplay，msu 保持不变，顺序打乱，底部写『站长推荐 + AI 自动生成』」。按上一轮「第一梯队」口径落地 5 卡，顺序打乱为 **ONE → Yooldo → WEMIX PLAY → MapleStory Universe → Planetarium Labs**。
  - **选型与链接规则**：有平台挂平台官网（ONE → `to.nexus`、WEMIX → `wemixplay.com`、MSU → `msu.io`），工作室挂其官网（Planetarium → `planetariumlabs.com`）；Yooldo 原 `yooldo.gg` 已失效（402），改用仍在运营的 `app.yooldo.pro`，note 内说明域名变更。MIR4 卡换回 WEMIX（四语文案 + 图片从 `45e8536^` 历史恢复），MSU 卡未动。
  - **图片**：ONE / Planetarium 用官网 og:image、WEMIX 从 git 历史恢复、Yooldo 用 Trouble Punk 官方 logo 叠底生成（原站有 Cloudflare 验证抓不到 og）；统一 ffmpeg 转 1280×720 JPEG。已关停的 Arena-Z / XOCIETY / Intella X / Ragnarok Libre 与转型金融的 CONX(XPLA) 未加入。
  - **底部备注**：新增 `picks.chain.credit` 四语键（zh「站长推荐 + AI 自动生成」/ en「Webmaster picks + AI-generated」/ jp「運営者のおすすめ + AI 自動生成」/ ko「운영자 추천 + AI 자동 생성」），带专属 class `picks-chain-credit`，校验锁定。区级 notice 从「只推荐平台」改为「平台与工作室为主」以匹配实况。
  - **记账**：校验常量 `CHAIN_SLUGS` 从 2 改 5，新增 credit 断言 2 组 + 故障注入 4 组，149 → **154/154**；节点 209 → 228、属性 29 → 32。四语桌面 + 390px 移动真渲染截图确认 5 卡、图片、南韩 IP 提示、AI 备注齐全，无溢出/乱码。截图 `D:/WorkBuddy-Cache/shots/arg-chain-v3/`。

## 2026-11-23 · 加速器正文内联超链接改红色加粗

- `a7f61d4` — 站长发截图要求「超链接，文字改用红色加粗」：指加速器两卡正文里的内联链接（外星仔「外星仔加速器 PC 端」/ 给梨「专属邀请链接」），原为继承 `--ink-soft` 的墨色，看不出是链接。
  - 实质确认：全站只有这两处正文段落含内联 `<a>`（四语各两处，其余卡片正文无链接），故一条 `.pick-desc a { font-weight: 700; color: #C5221F; }` 精确命中、四语同步，不改 HTML / i18n、不动按钮样式。
  - **坑**：属性顺序要与已存在的 `.pick-netflix-note { color:#C5221F; font-weight:700 }` 相反（写成 `font-weight` 在前），否则校验里 Netflix 红字那条故障注入 `replace('color: #C5221F; font-weight: 700;', ...)` 会连同新规则一起改，自检对不上。
  - 校验新增 `pick-desc a` 红加粗断言 + 1 组故障注入，149 → **150/150**；zh/en/jp/ko 桌面 + 390px 移动真渲染截图确认链接红加粗、正文其余墨色、按钮未误伤、无溢出。截图 `D:/WorkBuddy-Cache/shots/arg-acc-red/`。

## 2026-11-23 · 链游区收敛为 MIR4 + MSU（移除 WEMIX / MARBLEX / ONECHAIN）

- `45e8536` — 站长决定「只保留 wemixplay 和 msu，算了，wemixplay 也替换成 mir4 吧 传奇4」「删掉 MARBLEX」。
  - 链游区从四平台收敛为两张具体推荐：MIR4（传奇4，WEMADE，官网 `https://mir4global.com/?lang=cn`）+ MapleStory Universe（`https://msu.io/`）；删除 WEMIX PLAY / MARBLEX / ONECHAIN NEXUS 三张卡及其四语字典键，删掉三张旧主视觉，`assets/mir4-platform.jpg`（官方 og 图转码 1280×720）入库。
  - 四语卡文案保留链上经济 / NFT 风险提示；英文 / 日文 / 韩文 MSU note 仍锁定「南韩（남한）IP 访问 NFT 受限」（中文面不出现，中文读者不在该限制区）。
  - `CHAIN_SLUGS` 改为 `['mir4','msu']`，`CHAIN_IMAGE` / `CHAIN_LINK` 同步；故障注入里的 wemix / marblex / onechain 引用全部改成 mir4。
  - 构建 209 节点；`VERIFY OK` + **149/149** 自检全过；zh / en / jp / ko 桌面与 390px 移动 CDP 截图验收通过（两卡完整、无旧内容残留、无溢出）。
  - 踩坑见 PITFALLS 35（精确整块字符串替换失败，改用 data-i18n label 正则定位 article）。

## 2026-11-23 · 棕色尘埃2 更正 + 新增加速器推荐区

- `d785b76` — 站长更正「棕色尘埃不对，准确说是棕色尘埃2」，并要求链游下方新增加速器推荐（带口令 / 邀请码）。
  - 手游卡 Brave Nine → Brown Dust 2：四语文案、三通道下载链接（App Store `id6450099588` / Google Play `com.neowizgames.game.browndust2` / QooApp `22741`）、Google Play feature graphic 转码覆盖 `assets/browndust-poster.jpg`；保留 `picks.browndust.*` slug 与文件名，避免连带改校验键。
  - 加速区两张卡：外星仔（口令 `574567`，50 小时萌新卡，`https://www.et001.com/`）、给梨（邀请码 `9ydA8H`，120 小时 SVIP，`https://www.geilijiasu.com/fission/accept?inviteCode=9ydA8H`）；新增 `picks.accelerator.notice` 风险声明 + `nav.picks.game.accelerator` 导航键，两张官方品牌图本地化。
  - 校验新增加速器断言 + 8 组故障注入；构建 221 节点、**149/149** 自检全过；四语桌面 + 390px 移动真渲染验收通过。
  - 踩坑：英文 `webmaster's` 与 `'574567'` 的单引号破坏 JS 字符串，改成无撇号写法；故障注入只删第一处 `574567` 会漏掉正文 `<strong>` 里的第二处，改为 `split().join()` 全删。

## 2026-11-23 · 游戏板块新增链游平台区

- `acfc271` — 站长给出四个平台并要求「手游下方新增链游（注意仍属于游戏板块），仅推荐平台」。
  - 四个平台单官网按钮卡：WEMIX PLAY / MARBLEX / ONECHAIN NEXUS / MapleStory Universe；官方主视觉转码 1280×720，四语 alt / 来源说明齐备。
  - 韩文 MSU note 明确「남한 IP 限制访问 NFT」（站长要求写「南韩」而非普通「韩国」）；校验锁定该提示。
  - 构建 207 节点、142/142 自检全过；四语桌面 + 移动验收通过。该区的四平台后续在 `45e8536` 收敛为 MIR4 + MSU。

## 2026-11-23 · 游戏区落地端游 / 手游两分类

- `7c459a2` — 站长给出四款端游 Steam 链接，要求游戏区做端游 / 手游分类，手游要 App Store + Google Play + QooApp。
  - 端游 4 款：Lies of P / 剑星 / PUBG / 永恒轮回，各挂 Steam；手游 2 款：棕色尘埃 / NIKKE，各挂三通道下载。六张官方海报本地化（Steam 头图 / Google Play 宣传图，ffmpeg 转 1280×720 JPEG）。
  - 导航锚点 `#picks-games` 拆为 `#picks-pc-games` / `#picks-mobile-games`；旧游戏占位与 `picks.coming` 键同步撤销。
  - 校验新增游戏区断言 + 12 组故障注入；构建 181 节点、131/131 自检全过；桌面 + 移动真渲染验收通过。

## 2026-11-22 · 1theK 卡按区挂链，每语只留一个按钮

- `06488a4` — 站长纠正「这个页面你只做中文按钮就可以了啊……别搞这么多按钮出来」。
  - `picks.1thek.actions` 每语只保留一个对应语言站按钮：zh `/china/`、en `/english/`、jp `/japan/`、ko `/`（此前一张卡挂了多语按钮）。
  - 构建 144 节点、122/122 自检全过。

## 2026-11-22 · 音乐区加入任昌丁《请开门》MV 卡（大陆 QQ / 外文 YouTube）

- `62a7c29` — 站长说「音乐区域先加一下这个吧」，给了 QQ 音乐 MV 链接（大陆）和 YouTube MV 链接（其他区域）。
  - 中文源新增音乐卡，**标准两栏结构**（与剧集卡完全一致，锁死排版规则）：左竖版 MV 缩略图（`assets/door-mv-thumb.jpg`，1280×720，任昌丁白西装领舞，CSS `object-fit: cover` 自动裁成竖版）、右文字区（标题/简介/按钮/红字/注记）。
  - **按区挂链接**：中文页 actions 按钮挂 QQ 音乐 MV（`https://y.qq.com/n/m/detail/mv/index.html?vid=f0015hf64je`），外文三页 actions 按钮挂 YouTube MV（`https://youtu.be/GQ53MTOVS04`）。中文页 ytnote 改为纯文字提示（无链接，遵守「中文源禁 YouTube 直链」红线），外文页 ytnote 保留 YouTube 链接。
  - 四语字典新增 `picks.music1.*` 键（label/title/desc/actions/note/ytnote/imageAlt/imageCredit），年份锁定 2013（MV 发行年）。
  - CSS 调整：`.picks-grid` 单卡时居中收窄（`max-width: 720px; margin: 0 auto`），避免右侧空洞。
  - 校验新增音乐卡断言（标准两栏结构、按区通道、年份 2013、图片资源存在）+ 11 组故障注入（MV 缩略图漂移、通道错区、结构回退、年份漂移等），修复 zh 字典无 html 段的故障注入（改操作 `s.source` 而非 `s.dict.zh.html`），**122/122**。
  - 踩坑见 PITFALLS 34（zh 字典没有 html 段，故障注入不能写 `s.dict.zh.html[...]`）。

## 2026-11-22 · 文姬卡改回标准两栏竖版海报（与剧集卡同款）

- 站长给两张标准卡截图：「文姬那张卡片做成这种大小不行吗，大不了图片缩小」。确认要的是与剧集卡完全一致的尺寸与结构，不是特殊布局。
  - 《哦！文姬》卡撤掉 `.pick-poster-row-feature` / `.pick-figure-still` 堆叠，换成与五部剧集卡相同的 `.pick-poster-row` + `.pick-figure-poster` + `.pick-image-poster`，海报缩到同样的 210px 栏宽。
  - 图片从 16:9 横剧照换成竖版海报 `assets/oh-my-gran-poster.jpg`（1010×1440，GoldPoster），四语 alt / 来源说明从「剧照 / Letterboxd」改成「海报 / GoldPoster」。
  - 清掉 CSS 里所有只为特殊布局服务的规则；verify 改为断言六张卡统一标准两栏、禁止回退到 feature/still/stacked，故障注入同步重做，保持 **111/111**。
  - 实测桌面六张卡高度一致（446-447px）、海报栏宽均 210px、卡底空白 35px，手机端竖版海报在上无溢出；真实文件把文姬卡塞回 feature 布局判红 2 条。

## 2026-11-22 · 保持等高，用内容把卡片撑满

- `778e5c6` — 站长追问：「用657px然后想尽一切办法占满，是做不到吗」。上一轮把高度降到 380px 不是要的——要保持与电影卡等高，把内容填满。
  - 撤掉 `align-items: start` 恢复等高；`.pick-card` 改 flex column、`.pick-poster-row { flex:1 }`，竖版海报列加宽到 210px 并 `height:100%; object-fit:cover` 撑满整卡；`.pick-poster-body .pick-actions { margin-top:auto }` 把按钮/红字/注记贴到卡底，标题简介留在顶部，中间的间距自然吸收高度差。
  - 实测首卡 657px、卡底空白从 311px 降到 35px（与其他卡一致），没有任何溢出；两列框架、电影卡图上文下都不动。
  - 校验把「不得拉伸」改成「必须等高 + 内容撑满」的 5 条断言 + 3 组故障注入，并把旧的海报比例断言/注入改到新规则，109 → **111/111**。踩坑见 PITFALLS 32。

## 2026-11-22 · 网格卡片按内容高度，消除首卡空白

- `348727e` — 站长给两张截图：第一行《车贞淑医生》卡被右边更高的电影卡一起拉伸，底部空出一大块；下面四张卡高度贴合内容，「这个多好」。
  - `.picks-grid` 加 `align-items: start`：卡片各按自身内容高度排，不再被同行最高的卡拉长。实测首卡高度 657 → 380px，底部空白消失；网格仍是两列、电影卡仍图上文下，框架没动。
  - 手机 390px 下 `sw=iw=390` 无溢出。
  - 校验新增网格对齐断言 + 1 组故障注入，108 → **109/109**；踩到的坑见 PITFALLS 31。

## 2026-11-22 · 电影卡图上文下（网格框架不变）

- `38a3477` — 站长纠正：「我说的是独占吗？原有框架不变，图片在上面，文字在下面」。`b75d374` 的跨两列置顶做过了头，本轮撤掉 `.pick-card-feature`，恢复成两列网格里的普通卡。
  - 只保留卡内竖向堆叠：`.pick-poster-row-feature { display:flex; flex-direction:column }`，16:9 剧照在上，片名 / 简介 / 按钮 / 注记在下；卡片宽度与相邻剧集卡一致。
  - 校验把「必须跨栏」改成「**不得跨栏**」的反向断言 + 1 组故障注入，109 → **108/108**；桌面 1280 / 手机 390 均无横向溢出。

## 2026-11-22 · 电影卡改为置顶跨栏横向大图（已撤回）

- `b75d374` — 站长两张截图：「这个横向放，这些滚去它下面」。上一轮把电影卡压成两栏小图不是站长要的。
  - 《哦！文姬》卡加 `.pick-card-feature`（`grid-column:1/-1; order:-1`）置顶并跨满两列；内部 `.pick-poster-row-feature` 改为 `flex-column`，剧照 16:9 横向铺满（桌面实测 1090px 宽），片名 / 简介 / 购买按钮 / 红字 / 注记全部落到图下方。
  - 五部剧集卡保持两栏不变，相邻卡不再被撑高；桌面 1280 下 `sw=iw=1280`，手机 390 下 `sw=iw=390` 无溢出。
  - 校验新增置顶跨栏 class、图上文下 DOM 顺序、两条 CSS 规则断言 + 3 组故障注入，106 → **109/109**；真实文件去掉 feature class 判红 1 条，恢复全绿。

## 2026-11-22 · 推荐区二级菜单、K-pop/游戏占位与卡片排版优化

- `32e745f` — 站长给了 5 张截图：① 首卡被右侧电影卡撑出一大块空白；② 要在**四语**「站长推荐」下做二级菜单「看韩剧 / 听K-pop / 玩游戏」；③ 手机端先不做，「不然布局会很乱」；④ 标题下「看韩剧」位置要对应二级菜单；⑤ 占位写「正在开发中，请等待站长写入数据」。
  - **排版**：电影卡从整幅横图改成和剧集卡相同的「图 + 文」两栏（`.pick-poster-row` + `.pick-figure-still`，16:9 不变）。六张卡实测高度从「671 / 380」变成 412 / 412、420 / 420、466 / 466，首卡底部空白从 325px 降到 95px，肉眼看不再是一大片空地。
  - **菜单**：`.nav-dropdown` 悬停 / 键盘聚焦展开，默认 `display:none`；三项四语手写文案，锚点 `#picks` / `#picks-kpop` / `#picks-games`。≤720px 时整条 `.site-nav` 隐藏，手机端天然没有下拉，实测 390px `nav=none`、`scrollWidth=390`。
  - **对应与占位**：标题下 `.picks-subhead` 写「看韩剧」（与菜单第一项同一标签）；`#picks-kpop` / `#picks-games` 两块虚线占位标注「正在开发中，请等待站长写入数据」，K-pop / 游戏标题复用菜单标签，保证下拉与页面一一对应。
  - **机器强制**：新增 `NAV_SUB` / `COMING_NOTE` / `NAV_SUB_HREFS`，逐页断言三项顺序、锚点、标题分类、两处标签与占位注记；CSS 断言默认收起 + hover 展开 + 电影图 16:9；中文源断言两栏结构与占位锚点。新增 6 组故障注入（菜单死链、日文分类回退中文、韩文注记删除、中文游戏锚点删除、菜单默认展开、电影卡回退），100 → **106/106**。
  - **验证**：真实文件把 en 菜单 kpop 改成 `#picks-dead` → 精准判红 1 条，恢复全绿；CDP 截图核对 zh 菜单展开三项、en 首卡排版与两块占位、ko 390px 无导航下拉无溢出；四语 × 320/360/390/414 共 16 项 `overflow=0`。
  - **记账依据**：README 更新推荐区口径与注入计数；PITFALLS 新增第 29 条。

## 2026-11-22 · 撤销推荐区韩国音乐占位卡

- `9db3f54` — 站长：「韩国音乐那个专区撤了，删一行代码」。中文源里其实是一个 4 行 `<article class="pick-card pick-card-soon">`（标签 + 占位句），删掉卡片后还有三语字典里的 6 个 `picks.music.*` 键、两条废弃 CSS 规则和对应的校验断言要一起清，不是真的一行。
  - **改了什么**：中文源删掉音乐卡；`assets/i18n.js` 删 en/jp/ko 的 `picks.music.label` / `picks.music.soon` 各 2 键；`assets/styles.css` 删 `.pick-card-soon` / `.pick-placeholder`；`build-i18n.mjs` 重建三语页（每语 126 节点，原 128）。推荐区现在只有 6 张影视卡，末卡是《大长今》，无空位。
  - **机器强制**：`MUSIC_SOON` 常量改为 `MUSIC_FORBIDDEN`（类名 + 4 语占位文案共 8 个标记），中文源与三语页都断言音乐专区不得回退；删掉旧的「音乐占位句中文残留」注入（已失效），新增「中文源重新塞回音乐卡」「英文页重新塞回占位标记」「整个 picks 区被删」三组注入。故障注入 **99 → 100/100**。
  - **验证**：真实文件把音乐卡塞回中文源 → 判红 8 条（5 条音乐专区回退 + 三条语言字典键集失配），恢复全绿；CDP 四语 × 320/360/390/414 共 16 项 `overflow=0`，截图确认推荐区末卡后干净收尾、音乐卡不残留。
  - **记账依据**：README 更新推荐区口径与注入计数；PITFALLS 新增第 28 条。

## 2026-11-22 · 外文剧集卡补挂订阅制渠道（AFF 原样保留）

- `406950b` — 站长质疑上一轮的取舍：「其余外文区（含韩区全部五部）只有订阅制（Netflix / TVING / Viki / Kocowa），既然能买正版，为什么不挂？」。这条质疑成立：上一轮我用的是**自己定的「只挂单片可租买」口径**，把订阅制整体排除在主按钮之外，并不是站长定的规则。站长随后拍板两件事：**不要删除 AFF**，订阅制有就**加在 AFF 上面那个按钮的位置**；并且**按区严格区分**，不统一列平台名。
  - **判断修正**：主按钮的语义是「点进去就能看这一部」，订阅平台给不出「买断」承诺，所以订阅不做主按钮、改用**虚线次级按钮**（`.pick-link-sub`），文案标明 `subscription` / `定額制` / `정액제`；位置固定在租买按钮与红字 AFF **之上**，AFF 一个都不删、不挪、不降级。
  - **实查（JustWatch GraphQL，`apis.justwatch.com/graphql`，country = US / JP / KR，2026-11-22 取数）**：en《无理的前进》Kocowa（Prime 频道）、`The Heirs`/`My Love from the Star`/`Jewel in the Palace` 挂 Rakuten Viki 剧集页；jp《星から来たあなた》《相続者たち》《宮廷女官チャングムの誓い》挂 U-NEXT；ko《닥터 차정숙》《별에서 온 그대》《대장금》挂 TVING、《발칙하게 고고》挂 wavve、《상속자들》挂 왓챠。**查不到就不挂**：美/日《车贞淑医生》只有 Netflix、《无理的前进》日区无条目、《哦！文姬》日/韩区只有 Apple TV / YouTube 租买 → 一张卡都不加订阅按钮，宁缺勿造死链。
  - **Netflix 的边界**：订阅按钮一律不挂 `netflix.com` 直链（Netflix 的入口就是那条红字 AFF，四页「禁 netflix.com」的站规不动）；该区只有 Netflix 时干脆不加按钮。中文四页也不挂——TVING / Viki / U-NEXT / wavve 在中国大陆均不可用。
  - **链接复核**：12 条链接逐条 curl，TVING / wavve / U-NEXT / Viki 均 200；`watcha.com` 返回 451（非韩区地域封锁，韩区正常）、`watch.amazon.com` 302 落地 `amazon.com/gp/video/detail/B0B67G9KTW` 200，都不算死链。
  - **机器强制**：`verify-i18n.mjs` 新增 `DRAMA_SUB`（12 条链接 + 逐语文案）与 `SUB_DOMAINS` 前缀白名单；断言「有渠道必须有且仅有一条订阅按钮」「链接必须以表内地址开头并在白名单内」「订阅按钮必须排在 featured 与红字之前」「无渠道区禁挂」「中文源禁挂外区订阅」；新增 5 组故障注入（Viki 链接漂移 / U-NEXT 指向 Netflix / TVING 按钮重复 / 塞进 Netflix 独家卡 / 被挤到购买按钮下面），94 → **99/99**。
  - **验证**：`build-i18n.mjs` 重建三语（每语 128 节点）；真实文件把 jp 的 U-NEXT 换成 netflix 直链 → 判红 5 条（node out of sync + 两处 Netflix 链接 + 订阅链接漂移 + 白名单外），恢复后全绿；CDP 四页 × 320/360/390/414 共 16 项 `overflow=0`；截图肉眼核对 en `The Heirs`（Viki → Prime 买断 → 红字）、jp `星から来たあなた`（U-NEXT → Amazon 租买 → 红字）、ko 首卡（TVING → 红字）三处顺序与文案。
  - **记账依据**：README 新增「订阅制渠道也要挂，但只挂查得到的」长期规则；PITFALLS 新增第 27 条。

## 2026-11-22 · 站长推荐按时间线新增五部韩剧

- `d35e71e` — 站长：「我自己没看过的，就不推了。按时间线去记载吧，以后也是，年份越近，越靠前」+ 四个 ncat 链接与「医生车智淑」，要求先推这几部；ncat 有 CDN 质询（四个链接全打不开），改用无头浏览器执行 JS 过验证，读出四部片名（59002 无理的前进 / 21689 来自星星的你 / 35549 继承者们 / 34776 大长今），第五部「医生车智淑」按标准译名《车贞淑医生》（2023 JTBC，严正花、金炳哲）另查维基/百度百科确认。
  - **时间线**：车贞淑医生 2023 → 哦！文姬 2020 → 无理的前进 2015 → 来自星星的你 2013 → 继承者们 2013 → 大长今 2003。五部剧竖版海报 + 四语本地化（人工撰写，非机翻），本地 `assets/*-poster.jpg`（TMDB / MBC 官方页）；`.pick-image-poster` 保留 2:3 原始比例，≤420px 上下堆叠。
  - **按区实查**（五组并行，均用原名+导演+主演确认非同名撞片）：车贞淑医生三区无租买（仅 Netflix/TVING 订阅）；无理的前进三区无租买（Kocowa 订阅）；来自星星的你仅日区 Amazon JP 租 ¥3,080/买 ¥9,240 + FOD；继承者们美区 Amazon 买断 $15.99、日区 Amazon JP 租 ¥4,400；大长今三区无租买（Viki）。按规则：中文五部挂港区 aff；en 继承者们挂美区 Amazon、jp 星你/继承者们挂日区 Amazon；其余外文区只有红字 AFF 入口，无主按钮；四页零 Netflix 链接、零盗版域名。
  - **机器强制**：`verify-i18n.mjs` 新增 `DRAMA_SLUGS / DRAMA_IMAGE / DRAMA_YEAR / DRAMA_PRIMARY / DRAMA_NOTE` 与三区 Amazon 链接常量；中文源校验五部齐全 + 年份倒序顺序 + 海报引用 + 港区 aff 按钮 + 红字原文；四语校验字段齐全 + 红字本地化 + 按区按钮 + 无渠道区禁按钮；新增 16 组故障注入（时间线倒序、卡片删除、海报引用/文件删除、年份漂移、无渠道区加按钮、红字回退中文、三处购买链接改错、中文源塞 Netflix 链接、aff 入口删除、中文 aff 按钮删除、imageAlt 机翻、竖版比例断言删除），79 → **94/94**。真实文件把英文继承者们按钮改回 aff → 判红 2 条；删掉中文第二部剧的 aff 按钮 → 判红 1 条；恢复后全绿。
  - **验证**：build 128 节点 / 17 属性；CDP 四语 × 320/360/390/414 共 16 项 `overflow=0`；CDP 截图肉眼核对手机端竖版海报完整、文字无溢出。
  - **记账依据**：README 新增「按时间线排列」「剧集购买按区实查」两条长期规则；PITFALLS 新增第 26 条。

## 2026-11-22 · SEO 长尾改造（A+C+D）

- `25a1330` — 站长：「有记载，但是很差，看看 seo 怎么做，你先给我一些关键词，我来决定吧」→ 给出 A 品牌 / B 主题 / C 猫与善意 / D 影视四组，站长选「按你的推荐执行」（A+C+D），并提到双休购进了 AI、此站若也能进更好（AI 摘要不稳定，本站在站内只把结构化数据做扎实，不承诺必进）。
  - **title / description**：中文「哈韩的一个理由｜为什么喜欢韩国：猫、善意与《哦！文姬》」；en `Why I Like Korea: Cats, Kindness and K-pop | One Good Reason`；jp「韓国が好きな理由｜猫と善意、K-POPと映画「オ！ムニ」」；ko「한국을 좋아하는 이유｜고양이와 선의, K-POP, 영화 「오 문희」」。四语 description 关键词前置、各自本地化，旧文艺 title 一律禁回退。
  - **JSON-LD**：每语一段 `WebSite`，`inLanguage` = `zh-CN/en/ja/ko`，`url` 指向各自页面，`keywords` 用当地语言；`sitemap.xml`（四语 + hreflang + x-default）、`robots.txt`（指向 sitemap）、四页 head 的 `<link rel="sitemap">` 新增。
  - **机器强制**：`verify-i18n.mjs` 新增 `SEO_TITLE_KEYWORD / SEO_DESC_KEYWORD / SEO_STALE_TITLE / SEO_LD_LANG / SEO_SITEMAP_URLS / SEO_HREFLANG`；`extractTitle / extractJsonLd` 解析；state 纳入 sitemap/robots 文本；新增 11 组故障注入（title 回退、描述去词、日文 title 去词、韩文 JSON-LD 语言错、英文 JSON-LD url 错、中文 JSON-LD 删除、英文 sitemap link 删、sitemap 缺 ko / 缺 x-default、robots 丢 sitemap、sitemap 删除），68 → **79/79**。真实文件删掉 sitemap 的 ko loc → 判红 1 条，恢复后全绿。
  - **验证**：build 98 节点 / 12 属性；CDP 四语 × 320/360/390/414 共 16 项 `overflow=0`。
  - **记账依据**：PITFALLS 新增第 25 条（金句型 title 不利于检索 + 四语 JSON-LD 语言/地址必须逐语对应 + AI 摘要不可承诺）。

## 2026-11-22 · 三语红字提示改为本地化 AFF 入口

- `a13b74d` — 站长指出其他语言按钮下方那条红字「还在机翻」，要求统一替换为「中国大陆用户请点击这里访问 Netflix」，每个语言单独翻译，替掉原来的红色加粗提示语。
  - **改了什么**：en `Viewers in mainland China: click here to access Netflix.`；jp `中国大陸からご覧になる場合は、こちらから Netflix にアクセスできます。`；ko `중국 본토 시청자는 여기를 눌러 Netflix에 접속하세요.`。三语的「这里 / click here / こちら / 여기」都指向 `https://nfshare.cn/?sid=5rfpUarUEd`（站长额外增加的 AFF 入口），**不是 Netflix 官网链接**；中文源红字原文不动，四语主按钮不动，四页仍禁 `netflix.com` 链接。
  - **机器强制**：`PICKS_ACTIONS_EXPECT[lang].note` 改为逐语整段锁定（含 aff 链接）；主按钮校验从「整段 actions 不得含 aff」改成**只取 featured 按钮的 href** 比对，aff 允许出现在外文红字、但禁止当主按钮；新增 2 组故障注入（英文红字链接去掉邀请码 / 日文红字回退旧机翻），66 → **68/68**。真实文件把英文红字链接的邀请码去掉 → 判红 2 条（`node out of sync` + `note wording drift`），恢复后全绿。
  - **验证**：Pages 第 2 次轮询生效；线上 en/jp/ko 新红字各 1、旧机翻文案 0、`netflix.com` 链接 0，三语主按钮按区不变；CDP 四页 × 320/360/390/414 共 16 项 `overflow=0`。
  - **记账依据**：PITFALLS 新增第 24 条（机翻提示语逐语重写 + AFF 入口与 Netflix 官网链接区分 + featured href 校验范围）。

## 2026-11-22 · README 固化「按区实查」长期规则

- `eb8a5ea` — 站长确认上一轮做法：「以后都要这样去检查一次，这个规则写进 README，但备注，这只是站长额外增加的 AFF」。README「站长推荐」段新增长期规则：每新增或改动推荐片的正版引导，必须重新按**当地**实查租买渠道，先用原名 + 导演 + 主演确认同一部片（避免 `Oh! Baby` 同名撞片），再查 JustWatch 国家页 / Moviefone / iTunes API 等地区化来源，`YouTube Free` 不算租买，当地有渠道就挂当地官方页、中文港区 aff 单独保留、Netflix 只留红字不成链接；并按站长原话备注「这只是站长额外增加的 AFF」，非本站原有通用规则，但挂了就要挂对。
  - **本次纯文档**：不动页面代码；`verify-i18n.mjs` 复跑仍 `VERIFY OK` + `SELF-TEST 66/66`。

## 2026-11-22 · 美区 / 日区购买按钮改到当地真实可租买渠道

- `50b731e` — 站长追问「美区和日区建议优化一下，美区看看亚马逊那边，日本的话还是不行吗？奈飞也搜不到？」。复核时发现上一轮检索用的是同名印度电影 `Oh! Baby`，本片正确英文名是 **Oh! My Gran**（오! 문희，2020，罗文姬主演）。
  - **查证结论**：美区 Prime Video 可租 $2.99 / 买 $9.99（JustWatch 美区页 + Moviefone + `watch.amazon.com` 商品页）；日区 Netflix、Amazon Japan、YouTube 均无此片（JustWatch JP 搜索页显示日文名「オ！ムニ (字幕版)」），但 **Apple TV 日区可租 ¥550 / 买 ¥2,100**（iTunes Search API `trackId 1691528206` 确认）；韩区 YouTube 租买不变；中文港区 aff 不变。
  - **改了什么**：`assets/i18n.js` 英文主按钮 → `https://watch.amazon.com/detail?gti=amzn1.dv.gti.3a505a12-509d-4f34-af76-47f0ea441f72`，文案 `Rent or buy on Prime Video`；日文主按钮 → `https://itunes.apple.com/jp/movie/%E3%82%AA-%E3%83%A0%E3%83%8B-%E5%AD%97%E5%B9%95%E7%89%88/id1691528206?uo=4`，文案 `Apple TV でレンタル・購入する · 正版で応援しましょう`。邀请码只留中文源；四页红字 Netflix 提示、禁 Netflix 链接规则均不动；`en/jp/index.html` 由 `build-i18n.mjs` 重建。
  - **机器强制**：`verify-i18n.mjs` 新增 `PRIMARY_LINK`（aff / amazon / apple / youtube 四渠道总表），`PICKS_ACTIONS_EXPECT.primary` 从二值扩到四类，`PICKS_PRIMARY_LABEL` 锁新文案；跨区渠道、YouTube 域、aff/邀请码按区禁入。故障注入 65 → **66/66**。真实文件把英文页 Prime Video 链接改回 aff → 判红 4 条（`primary link missing` / `wrong-region primary link` / `aff forbidden` / 节点不同步），重建恢复后全绿。
  - **记账依据**：PITFALLS 新增第 23 条（同名片误检索 + YouTube 之外渠道复核 + Apple TV 商品页地区 404 干扰）。

## 2026-11-22 · 购买按钮按地区重设（zh/en/jp=aff、ko=YouTube）

- `2ae0f5c` — 站长终版规则：所有语言检查、不直译，只有中文按港区；英文按美区、日文按日区（YouTube 能租买推 YouTube，反之推 aff）；韩文按韩区（YouTube 可租买）。
  - **查证结论**：美区 YouTube 仅免费带广告、租买在 Amazon；日区无 YouTube 租买证据（疑似 Prime Video）；韩区官方 YouTube Movies 可租买。据此 zh=aff、en=aff、jp=aff、ko=YouTube。
  - **改了什么**：`assets/i18n.js` —— jp `picks.film.actions` 从「仅红字」新增 aff 按钮「このリンクから視聴権を取得（招待コード 5rfpUarUEd）」；ko 从 aff 改为 YouTube 按钮「YouTube에서 대여하거나 구매하기 · 정식 서비스로 응원해 주세요」，链接 `https://youtu.be/cflWf3XKeFI?si=pZ-WkU6w5wYkh4Wq`，撤掉 aff/邀请码。中文源不变（唯一保留港区口径）。`en/jp/ko/index.html` 由 `build-i18n.mjs` 重建。四页红字 Netflix 提示都不动。
  - **机器强制**：`scripts/verify-i18n.mjs` 把 `PICKS_ACTIONS_EXPECT` 从 `aff:bool` 升级为 `primary:'aff'|'youtube'`，新增 `PICKS_PRIMARY_LABEL` 逐语锁定按钮文案、`YOUTUBE_DOMAINS`/`FORBIDDEN_NETFLIX_LINK` 分区禁链，`FORBIDDEN_REGION_CALQUES` 加 `香港地区/香港地域`；故障注入 63 → **65/65**。真实文件把韩区按钮改回 aff → 精准判红两条，恢复后全绿。
  - **验证**：CDP 截图 `picks-jp-final.png` / `picks-ko-final.png`（及手机版）肉眼确认按钮与红字；`cdp-overflow.cjs` 四档宽度（320/360/390/414）溢出元素 0。
  - **记账依据**：PITFALLS 新增第 22 条（按区查 YouTube 租买 + YouTube Free≠租买 + 日文新增按钮后重测溢出）。

## 2026-11-22 · 外文页 aff 按钮去掉「港区」直译

- `ea093ee` — 站长截图指出英文页 aff 按钮写着 `Hong Kong, China: get access through this link`，是把中文的「中国香港地区」直译过去的。站长：英语直接链奈飞没错、挂 aff 也没错，只是不该直译港区。
  - **改了什么**：`assets/i18n.js` 的 en / ko `picks.film.actions` 文案去掉地区前缀——英文改为 `Get access through this link (invitation code 5rfpUarUEd)`，韩文改为 `이 링크로 이용권 구매 (초대 코드 5rfpUarUEd)`；aff 链接、邀请码、红字 Netflix 提示、按钮 class 全部不变。中文源「中国香港地区」是上轮拍板的原始口径、保留；日文页无 aff 按钮，不受影响。`en/index.html` / `ko/index.html` 由 `build-i18n.mjs` 重建。
  - **机器强制**：`scripts/verify-i18n.mjs` 新增 `FORBIDDEN_REGION_CALQUES`（`Hong Kong, China` / `중국 홍콩`），en/ko aff 分支逐页断言不得出现；新增 1 组故障注入，`SELF-TEST 62 → 63/63`。真实文件把 `Hong Kong, China` 塞回英文页 → 精准判红，恢复后全绿。
  - **验证**：`build-i18n.mjs` 重建三语页（每语 97 节点）；四页 actions 文案核对正确、en/ko/i18n 里禁词计数 0；CDP 截图 `picks-en-final.png` / `picks-en-final-mobile.png` 肉眼确认按钮文案与红字 Netflix 完整。
  - **诊断记录**：截图里英文页中英逐句对照是浏览器翻译插件叠加，不是页面 bug——`en/index.html` 的 CJK 仅导航「中文 / 日本語」与署名「新浪」三处。

## 2026-11-22 · 站长推荐链接改港区 aff 口径，日区不挂购买链接

- `86266b0` — 站长指令：韩国 YouTube 租买页只有韩国 IP 可用；中国大陆以后一律按港区算，港区 YouTube 搜不到也不能租买，所以 aff 邀请码链接继续保留。日区不挂链接，直接推荐奈飞。
  - **检索结论**：YouTube Movies 的《오!문희》租买页锁韩区 IP；美区 YouTube 只有「免费带广告」，租买在 Amazon（$2.99/$9.99）；日区、港区 JustWatch 无该片条目。不存在美/日/港的 YouTube 租买替代链接。`&gl=` 参数不改出口 IP，四地都返回同一韩区页面。
  - **改了什么**：`index.html` 三条独立按钮 key（youtube/netflix/cn）合并为一条整块 `picks.film.actions`；zh/en/ko 的片段含 aff 链接（港区口径文案 + 邀请码 5rfpUarUEd）+ 红字 Netflix 原文案；jp 片段只有红字 Netflix 日文推荐、无任何 `<a>`。`assets/i18n.js` 三语字典同步。`scripts/verify-i18n.mjs` 新增 `PICKS_ACTIONS_EXPECT`（逐语 aff 有无 / 邀请码 / Netflix 文案）、`FORBIDDEN_PURCHASE_LINKS`（四页禁 youtu.be / youtube.com/watch / netflix.com）；`AFF_LINK_LANGS` 常量。README 计数 56 → 62；PITFALLS 新增第 20 条。
  - **为什么**：日区要「不挂链接」，而构建器是逐字复制中文源 href 的，三条独立 `<a>` 无法让单语去链接——合并成整块 HTML 片段后，各语可独立决定有没有按钮。
  - **验证**：`VERIFY OK` + `SELF-TEST 62/62`；真实文件给日区片段塞回 aff 链接，重建后精准判红两条（JP 不得挂购买链接 / 邀请码不得出现在日区），恢复后全绿。CDP 渲染截图确认：中文桌面/手机显示 aff 按钮 + 红字、YouTube 按钮消失；日区只有一行红字 Netflix、无任何按钮。

## 2026-11-22 · 推荐内容加预览图（长期规则）

- `072a6df` — 站长指出《哦！文姬》推荐卡没有预览图，要求「带图推是最好的，以后也遵循这个规则」。这条作为本站推荐区的**长期约定**：每条推荐都要有来自正版资料站的预览图，本地化引用，四语 alt + 来源说明齐全。
  - **选图**：盗版站素材一概不用。TMDB 有 Cloudflare 验证、Naver 搜索页是 JS 渲染，最终从 Letterboxd 影片页取到片方宣传剧照——罗文姬与李熙俊在废车场奔跑，正好对应「追查肇事逃逸」的剧情。原图 1200×675 / 386 KB，用 ffmpeg `-q:v 5` 压到 **174 KB**，存为 `assets/oh-my-gran-still.jpg`。
  - **改了什么**：`index.html` 电影卡在标签与片名之间插入 `<figure>`（图片 + 来源说明），四语 `alt` 与 `picks.film.imageCredit` 手写翻译；`assets/styles.css` 新增 `.pick-figure / .pick-image / .pick-image-credit`；`en/jp/ko/index.html` 由 `build-i18n.mjs` 重建（每语 98 节点 / 12 属性）。
  - **踩坑（见 PITFALLS 第 19 条）**：图片写了 `width="1200" height="675"` 但 CSS 漏了 `height:auto`，HTML 尺寸属性压过 `aspect-ratio`，CDP 实测渲染成 **441×675 竖长条**；补 `height:auto` 后为正确的 **441×248（16:9）**。已加机器断言防回退。
  - **校验**：`verify-i18n.mjs` VERIFY OK + **SELF-TEST 56/56**（53 + 3）；真实文件两次注入（删图片引用、删 `height:auto`）均精准判红、恢复后全绿。CDP 渲染确认 `naturalWidth=1200 / complete=true / renderedHeight=248`，桌面两栏对齐、手机 390px 文字与来源说明完整；320/360/390/414 四档 `overflowElements=0`。
  - **文档同步**：README 故障注入 53 → 56，写明「推荐必须带预览图」长期规则；PITFALLS 第 19 条。

## 2026-11-22 · 极窄屏（320px）横向溢出修复

- `678866b` — 站长问「手机端加了站长推荐会不会溢出」。量化审计结论：**推荐区块本身不溢出**（320/360/390/414 四档 `picks.right` 均等于视口宽度），但 320px 下页面整体有 **6px 横向溢出**，源头是**原有的**顶部语言切换器 `.lang-switch`（right=326），与本次新增无关。
  - **诊断坑**：第一版审计用 `window.innerWidth` 当屏幕宽度，320px 时它返回 326（layout viewport 被最宽内容撑开），于是误报「0 溢出」。改用 `documentElement.clientWidth`（320）后准确抓到 `.lang-switch` 与其内部 `한국어` 链接两处越界。见 PITFALLS 第 18 条。
  - **改了什么**：`assets/styles.css` 新增 `@media (max-width: 360px)`——header gap 12→8px、brand 15→14px、`.lang-switch a` 的 min-width 34→30px / padding 10→7px；只影响 ≤360px，360px 及以上视觉不变。`scripts/verify-i18n.mjs` 1e 段新增窄屏规则断言 + 1 组故障注入。
  - **验证**：`verify-i18n.mjs` VERIFY OK + **SELF-TEST 53/53**（52 + 1）；真实文件删掉 media block 后只报「narrow-viewport guard missing / lang switch not tightened」两条、退出码 1，恢复后全绿。CDP 四档重测：`innerWidth = scrollWidth = bodyScrollWidth = clientWidth`（320/360/390/414），`overflowElements = 0`。截图 `D:/WorkBuddy-Cache/shots/picks-mobile-check.png`。
  - **文档同步**：README 故障注入 52 → 53；PITFALLS 第 18 条「手机溢出要看 clientWidth，不是 innerWidth」。

## 2026-11-22 · 新增「站长推荐」区块（韩国影视 + 音乐占位）

- `b3003c1` — 站长指令：在「延伸阅读」旁边新增「站长推荐」，用来收集韩国歌曲与韩国电影（电视剧也算）。电影先推荐《哦！文姬》，但站长给的片源链接是盗版站，**不得挂出**；要引导读者去 Netflix 支持正版，中国大陆链接 `https://nfshare.cn/?sid=5rfpUarUEd` 的邀请码必须保留。音乐暂时占位，备注「此专区正在建设中，请稍安勿躁」。
  - **片名核对**：盗版站有浏览器校验，curl/WebFetch 只拿到验证页；用无头 Edge（缓存 profile 放 `D:/WorkBuddy-Cache/edge-profiles`）过校验后读到标题 `哦文姬`，再经搜索确认正式译名《哦！文姬》（原名 `오! 문희`，国际名 `Oh! My Gran`，2020 年韩国电影，罗文姬主演）。**该域名只用于确认片名，页面里 0 次出现。**
  - **改了什么**：`index.html` 导航新增 `#picks` 项，并在「延伸阅读」与「附页」之间插入 `<section id="picks">`——两栏卡片，左电影（标签、片名、一句剧情、Netflix 引导、大陆购买链接、不链接盗版的声明），右音乐占位；`assets/styles.css` 新增 `.picks-*` 样式并纳入 960px 断点单栏；`assets/i18n.js` 三语各补 11 个 `picks.*` 键 + `nav.picks`；`en/jp/ko/index.html` 由 `build-i18n.mjs` 重建（每语 97 节点）。
  - **没改什么**：延伸阅读四条、附页、四个理由、AdSense、语言切换器全部不动；不引用盗版站海报，不写资源站字样；`nfshare.cn` 邀请码 `5rfpUarUEd` 四页逐字保留。
  - **四语文案（手写、非机翻）**：zh《哦！文姬》/「此专区正在建设中，请稍安勿躁」；en `Oh! My Gran (2020)` / `This section is under construction. Please stay tuned.`；jp `『오! 문희』（Oh! My Gran）` / `このコーナーは準備中です。しばらくお待ちください。`；ko `『오! 문희』(Oh! My Gran)` / `이 코너는 준비 중입니다. 조금만 기다려 주세요.`。片名用原名或国际发行名，不自造译名。
  - **校验**：`build` 重建 → `verify` VERIFY OK（97 节点）+ **SELF-TEST 52/52**（原 47 + 5）；按项目硬性要求用真实文件注入盗版链接，确认只报「picks link missing」+「盗版站域名不得出现」两项、退出码 1，恢复后复跑全绿；四页 `ncat30` 计数 0、邀请码四页均在。
  - **肉眼验收**：CDP 无头 Edge 渲染校验 + 截图（缓存放 D 盘）——桌面两栏 `508.5px × 2`、手机 `354px` 单栏，中文与英文页均无溢出/截断，两条链接文字完整（`D:/WorkBuddy-Cache/shots/picks-{desktop,mobile,en-desktop}.png`）。
  - **文档同步**：README 故障注入计数 47 → 52 并补推荐区口径；PITFALLS 新增第 17 条「链接线索来自盗版站时，只取片名，不取链接」。

## 2026-11-22 · read4 标签「近例」改为「抖音」，三语统一 TikTok

- `c231dc5` — 站长截图指出延伸阅读第二条的标签「近例」含糊，要求改成「抖音」，其他语言也翻译，并强调「注意是 TikTok 不是 douyin，禁止机翻」。
  - **理解**：这不是逐字翻译，而是把含糊的时序标签换成平台名。中文写「抖音」，en/jp/ko 一律用该产品通行的国际名 `TikTok`，延续 `19b1330` 已统一的站内口径；不写 `Douyin` / `더우인` / `抖音（Douyin）` 这类拼音或机翻腔。
  - **改了什么**：`index.html` 的 `read4.tag` 近例 → 抖音；`assets/i18n.js` 的 en `Another` / jp `もう一本` / ko `또 하나` 一律改为 `TikTok`；`en/jp/ko/index.html` 由 `scripts/build-i18n.mjs` 重建；`scripts/verify-i18n.mjs` 新增 2c 段（中文源 + 三语字典 + 三张生成页共 7 处逐字断言，旧标签 `近例 / Another / もう一本 / 또 하나` 禁回退）+ 5 组故障注入。
  - **没改什么**：`read4.title` 四语标题本就写了 TikTok，不动；`v.douyin.com` 是原始分享的真实链接域名、属 URL 不是译文，不动；其余三条延伸阅读、四个理由、附页、AdSense 均不动。
  - **同步坑**：动手前本地落后远端 4 个提交（`69afbb7..00c724f`，含新增 `read4` 那条链接），先 `git fetch origin && git merge --ff-only origin/main` 快进再改，否则会在旧结构上动手。
  - **校验**：`build` 重建（每语 86 节点）；`verify` → `VERIFY OK` + `SELF-TEST 47/47`（原 42 + 5）；按项目硬性要求又用真实文件注入一次故障（把 `read4.tag` 改回「近例」），确认**仅新增断言判红**且退出码 1，恢复后复跑全绿；四页标签扫描 `抖音 / TikTok / TikTok / TikTok`，三语页 `Douyin|더우인|抖音` 计数均为 0。
  - **文档同步**：README 故障注入计数 35 → 47（此前漏同步），并补记 read4 标签口径。
  - **推送状态（已上线）**：`c231dc5`（代码）+ `9e4295b`（记账、故障计数 47）+ `1f9ca34`（403 诊断记账）三笔，在站长提供 fine-grained PAT 后推送成功（`00c724f..1f9ca34 main -> main`）。Pages 部署后线上核对：中文 `read4.tag` = `抖音`，en/jp/ko = `TikTok`（运行时 `assets/i18n.js` 三语同为 `TikTok`）；三语页 `Douyin|더우인|抖音` 计数 0，中文页「抖音」只出现在正文（符合中文口径）。此前导出的 `format-patch` 补丁作废，无需应用。
  - **403 排查结论（见 PITFALLS 第 16 条）**：本地原凭据 `x-access-token`（GitHub App 安装令牌）无本仓库写权限；GitHub 连接器同样 `403 Resource not accessible by integration`。`/repos/...` 返回的 `push: true` 反映的是**账号**权限而非**令牌**权限，不能作为令牌可写的依据。最终以 Repository access 含本站、Contents: Read and write 的 fine-grained PAT（`github_pat_` 开头）直连推送成功；推送时令牌只走命令行变量，不落盘、不写日志。

## 2026-11-21 18:05 · 延伸阅读新增一条同频视频链接（`9c2738a`）

- `9c2738a` — 站长给出一条抖音视频（「为了防止韩国人想不开，操碎了心」），要求把这条视频放上站。不写作者名、粉丝数与点赞数，只留标题与链接。
  - **落点**：放在「延伸阅读」章节、原分享下方，作为第二条链接（`read4`）。理由：它与站点「善意落在细节里 / 怎么对待最弱小的那一个」同频，但不是论据——「延伸阅读」本来就只挂公开链接、末尾已有「不核查、不背书、不作断言」的免责声明，自动覆盖新条目；塞进「缘起」会破坏原分享的单一叙事，塞进「四个理由」会变成论据，都不符合本站的内容边界。
  - **改了什么**：`index.html`（中文源）延伸阅读列表新增一个 `<li>`（标签 `近例`、标题「另一条抖音视频：为了防止韩国人想不开，操碎了心」、链接 `https://v.douyin.com/kDbYuYZROUU/`）；`assets/i18n.js` 的 en/jp/ko 各补 `read4.tag` / `read4.title` 两个键（译文按既有口径写 TikTok，不出现 Douyin / 抖音）；`en/jp/ko/index.html` 由 `scripts/build-i18n.mjs` 重建，不手改。
  - **没改什么**：作者、粉丝数、点赞数一概不写（站长明确不喜欢这些）；原分享、四条理由、点灯互动、附页全部不动；四语章节结构与视觉无变化。
  - **校验**：`node scripts/build-i18n.mjs` 重建成功（每语 86 节点）；`node scripts/verify-i18n.mjs` → `VERIFY OK · 86 translated nodes · 11 translated attributes · 4 languages`（原 84 节点 +2）且 `SELF-TEST 42/42 injected faults rejected`；四页 grep 新链接各 1 处；四页扫描确认无「两活宝 / 万赞 / 粉丝 / 关注」等作者与数据字样。
  - **推送状态**：已提交为 `9c2738a` 并推送上线；`00c724f` 为后续基线，本地已快进同步。

## 2026-11-17 22:56 · 接入 Google AdSense：元标记 + Auto Ads 全站挂载（`18dac5e`）

- `18dac5e` — 站长指令：把已验证的 AdSense 接到本站。唯一源页 `index.html` 的 `</head>` 前幂等插入 `<meta name="google-adsense-account" content="ca-pub-5270311938787209">` 与 `adsbygoogle.js`（pub-5270311938787209）两行；en/jp/ko 三语页由 `scripts/build-i18n.mjs` 重新生成（各 84 处翻译节点，标记随模板透传）。Auto Ads 为主机级开关，过审后四语页自动投放，无需逐页加广告单元。
  - **验证**：重建成功；`verify-i18n.mjs` VERIFY OK（84 nodes / 11 attributes / 4 languages）且 SELF-TEST 42/42 全数命中；四页 grep `adsbygoogle` 各 1 处。

## 2026-11-16 14:27 · 译文产品名统一为 TikTok（`19b1330`）

- `19b1330` — 站长指令：「抖音是 TikTok 不是 douyin」，检查机翻后修正 en/jp/ko 译文里的产品名；中文源页与原始链接域名不动。
  - **改了什么**：`assets/i18n.js` 共 12 处 —— en 的 `hero.sub` / `origin.badge` / `read1.title` / `meta.description`（`Douyin` → `TikTok`）；jp 的同一组（「抖音（Douyin）」「あの抖音」→ `TikTok`）；ko 的同一组（`더우인(Douyin)` / `그 더우인` → `TikTok`）。其中日文公共从句「ある抖音（Douyin）の投稿と、その裏にある四つの理由。」在 `hero.sub` 与 `meta.description` 各出现一次，一次替换两处。`en/jp/ko/index.html` 由 `scripts/build-i18n.mjs` 重建，每语页 4 处 `TikTok`。
  - **没改什么**：中文源 `index.html` 四处「抖音」原文（meta description / hero.sub / origin.badge / read1.title）一字未动；`https://v.douyin.com/ETkls6EwUXo/` 是那条原始分享的真实链接，href 与可读文字 `v.douyin.com` 全部保留（URL 不是译文）。
  - **机器强制**：`scripts/verify-i18n.mjs` 新增 2b 段断言 —— ① 中文源四处抖音原文逐条核对（`ZH_PRODUCT_COPY`）；② en/jp/ko 字典与生成页不得出现 `Douyin` / `더우인` / `抖音`（检查可见文本，排除 href 与 script）；③ 每语生成页必须出现 `TikTok`。配套 **5 组**故障注入（en/jp/ko 各自回退旧名、生成页删掉 TikTok、中文源被改掉），`SELF-TEST` 由 37/37 升到 **42/42** 全判红。README「译文口径」段落同步改为 `TikTok` 并写明 URL 例外。
  - **验收**：`node scripts/build-i18n.mjs` 三页重建成功；`node scripts/verify-i18n.mjs` 输出 `VERIFY OK · 84 translated nodes · 11 translated attributes · 4 languages` 且 `SELF-TEST 42/42 injected faults rejected`；三张生成页 grep 旧名（排除 URL）无残留。

## 2026-11-13 · 死链口径统一为 404（去掉 504 措辞）

- `1931a4e` — 站长指令：附页「同题公开报道存档 · 外部链接」核查说明里，人民网「已无法连接」与山西新闻网「返回错误（504 / 404）」口径不统一，统一改成「均已失效（返回 404）」，去掉 504 与无状态码的「已无法连接」两种说法。
  - **改了什么**：`index.html`（中文源）`archive.linksNote` 末句前一段改为「人民网与山西新闻网两条外链均已失效（返回 404）」；`assets/i18n.js` 的 en/jp/ko 三语 `archive.linksNote` 同步为「both…return 404 / いずれも切れており、404 を返します / 모두 끊겨 있으며 404를 반환한다」；`en/jp/ko/index.html` 由 `build-i18n.mjs` 重建；`scripts/verify-i18n.mjs` 新增「死链核查说明不得出现 504」断言（中文源 + 三张生成页）+ 一条「504 被加回」故障注入。
  - **为什么**：站长明确「统一口径为 404」，两条死链用同一状态码描述，不再混用 504 / 无码。徽章（`is-dead` 2、`is-live` 1）、href 指向本页、核查日期均不变。
  - **机器强制**：`verify-i18n.mjs` 新增 504 禁现断言 + 故障注入；`SELF-TEST` 由 36/36 升到 **37/37**，全部判红。

## 2026-11-13 · 附页失效外链统一口径

- `7f0d1a3` — 站长指令：附页「同题公开报道存档 · 外部链接」里前两条失效外链（人民网广东频道、山西新闻网，均 404/504）不再保留原死链，href 统一改为 `https://dujeongil-galaxy.github.io/a-reason-for-korea/`；凤凰网仍可访问，保留。四语核查说明末句改为「前两条已失效的外链统一指向本页（a-reason-for-korea）留存」。
  - **改了什么**：`index.html`（中文源）两条失效 `<a>` 的 `href`；`assets/i18n.js` 的 en/jp/ko 三语 `archive.linksNote`；`scripts/verify-i18n.mjs` 的 `ARCHIVE_LINKS` 常量前两项改为本页 URL，新增 `FORBIDDEN_DEAD_DOMAINS`（旧 `gd.people.com.cn` / `news.sxrb.com`）断言 + 一条「死链域名被加回」故障注入；`en/index.html` / `jp/index.html` / `ko/index.html` 由 `build-i18n.mjs` 重建（构建逐字复制中文源 href）。
  - **为什么**：原死链本身已是「这一页曾经存在过」的痕迹（附页主题），但 404/504 既打不开又误导；站长要求「失效的都是 404，统一口径本页」。`is-dead` 仍 2 个、`is-live` 仍 1 个，徽章与核查日期不变。
  - **机器强制**：`verify-i18n.mjs` 新增「旧死链域名不得复现」断言（中文源 + 三张生成页）；`SELF-TEST` 由 35/35 升到 **36/36**。

## 2026-11-13 · 日语版路径统一 ja→jp

- `351aa6d` — 站长指令：日语版的 `ja` 全部改成 `jp`，包括文件夹和网址。路径/文件夹/内部标识层与语言切换器已有的 **JP** 徽标统一，语言代码层保持 ISO。
  - **改了什么**：文件夹 `ja/` → `jp/`（git mv）；根页与四页的 hreflang 链接网址 `/a-reason-for-korea/ja/` → `/jp/`；语言切换器 href `ja/`、`../ja/` → `jp/`、`../jp/`；`data-lang-link="ja"` → `"jp"`；`assets/i18n.js` 字典键 `ja:` → `jp:`；`scripts/build-i18n.mjs`（`LANGS`、`HTML_LANG`、新增 `LANG_ATTR = { jp: 'ja' }` 负责切换器 `<a lang>` 回填 ISO）与 `scripts/verify-i18n.mjs`（`LANGS` / `HTML_LANG` / `SHORT_LABELS` / `OWNER_MARKERS` / `AI_MARKERS` / 全部故障注入改键）同步；en/ko/jp 三页全部由脚本重新生成，不手改；README 网址表与文件树、PITFALLS 第 2 / 第 9 条同步。
  - **什么没改、为什么**：W3C 语言代码层不动——`<html lang="ja">`、`hreflang="ja"`、切换器 `<a lang="ja">` 仍按 ISO 639-1 用 `ja`（`jp` 不是合法语言代码，改了 hreflang 信号会失效），`styles.css` 的 `html[lang="ja"]` 字体栈选择器也依赖这一点。三层各管各的：视觉缩写 `JP` ／ 路径与内部标识 `jp` ／ W3C 语言代码 `ja`。
  - **旧网址**：`/ja/` 改名后为 404，不留 redirect stub（会违背「文件夹统一」的本意）；如有外链需要可后续在 Pages 层加跳转。
  - 校验：`node scripts/verify-i18n.mjs` → **VERIFY OK（84 译文节点 + 11 译文属性 + 四语）· SELF-TEST 35/35 注入故障全拒**。

## 2026-11-13 · 首版上线

- `0a1b003` — 首版：单页站点「哈韩，也要有一个理由」。
  - 内容结构：Hero / 缘起（一条抖音分享的引用卡）/ 四个理由（其中第 03 条「喜欢不是免检」是整页底线）/ 点灯互动 / 延伸阅读 / 页脚。
  - 内容边界：个人观点页，不引用未经核实的数据，不写全称判断；延伸阅读只列公开链接并明确声明不核查、不背书。
  - 技术：纯静态 HTML + CSS + JS，零依赖、零网络请求、零埋点；全部资源相对路径，适配 GitHub Pages 子路径。
  - 交互：滚动淡入（内容默认可见，只对首屏外元素做动画，并有 2.5s 兜底）、「留一盏灯」本地计数、「写下你的理由」卡片生成与复制（用户输入走 `textContent`）。
  - 部署：公开仓库 `dujeongil-galaxy/a-reason-for-korea`，GitHub Pages 从 **main 分支 / 根目录** 发布。

### 首版已跑过的校验

- `node --check assets/app.js` 通过；脚本扫描 3 处资源引用、10 个 JS 取用的元素 id，缺失 0；5 个 `<section>` 标签配对。
- 无头浏览器渲染验收（桌面 1440px、长图、整页页脚）+ 真实 390px 设备模拟：
  - `docScrollWidth <= innerWidth`（390 / 390、1425 / 1440），无横向溢出；
  - 五个章节与深色页脚全部可见，无整块空白；
  - 点灯按钮：计数 1 → 2、灯亮、按钮文案变「再留一盏灯」；理由卡片生成与文本读取正常。
- 过程中修掉两处真问题，见 [PITFALLS.md](PITFALLS.md)。

## 2026-11-13 · 四语版本（中 / 英 / 日 / 韩）

- `b1ed072` — 新增英 / 日 / 韩三个独立语言页面，中文原文仍是唯一源文案，未删改。
  - 架构：`index.html`（唯一中文源 + `data-i18n` 钩子）→ `assets/i18n.js`（en/ja/ko 译文 + 四语属性 / 运行时文案）→ `scripts/build-i18n.mjs` 生成 `en|ja|ko/index.html`（完整静态译文，关掉 JS 也能读）→ `scripts/verify-i18n.mjs` 校验。
  - 每页独立 URL / `hreflang` / `canonical` / `og:url`；右上角切换器，当前语言高亮，窄屏换短标签；各语言字体栈与非中文标题字号单独适配。
  - 69 个译文节点 + 10 个属性文案；第 03 条「喜欢不是免检」四语一致保留；版式小标签在日/韩页也本地化，产品名与来源名保留原文。
  - 交互文案（点灯按钮、卡片默认文案、复制提示与后缀）四语本地化，`app.js` 按 `body[data-lang]` 取词。

### 四语版本已跑过的校验

- `node --check`（`i18n.js` / `app.js`）、`scripts/build-i18n.mjs`、`scripts/verify-i18n.mjs` 全通过：69 节点 / 10 属性 / 4 语 key 一致，**7/7 故意造错的自检全部判红**（漏 key、中文残留、错 lang、路径未加前缀、中文被删、属性漂移、切换器高亮错误）。
- CDP 逐语验收（1440 桌面 + 真实 390px 设备模拟）：四语 `lang` / `title` / 导航 / 正文 / placeholder / 按钮 / 卡片文案全部本地化；`docScrollWidth <= innerWidth` 无溢出；CSS 与字典均加载；日/韩无豆腐块乱码；点灯计数、灯亮、卡片生成在四语下均通过。
- 中文页视觉与首版保持一致（Hero / 插画 / 章节 / 页脚），仅新增语言切换器；header 元素数值实测无重叠（间距 20px）。
- 新踩的坑记进 [PITFALLS.md](PITFALLS.md) 第 4—6 条：生成脚本多补引号、截图像素错觉、中文只留一份的强制层。

## 2026-11-13 · 附页：一页差点找不到的旧报（四语）

- `17a4478` — 新增「附页」章节：一张站长本人提供的旧网页剪报，四语齐全，中文原文一字未删。（归属措辞后于本日更正，见文末。）
  - **落位**：放在「延伸阅读」之后、页脚之前，像夹在书末的一张剪报；「延伸阅读」末尾加一行站内链接引过去。刻意不塞进「四个理由」——它是一段记忆，不是论据。
  - **内容边界**：图片 `assets/clipping-hkcd.jpg` 原样保留（890×386 / 178 KB），标注来源、版权与可见范围（止于标题、无正文、无明确日期）；页面文字不复述标题、不评价事件、不核查细节、不背书、不代表立场，并写明「记得一件事，不等于替它下结论」。
  - 检索说明：香港商报那个具体页面已难检索，但同题报道在 2014-07-02/03 仍有公开存档（人民网广东频道、山西新闻网、凤凰网等），故把这三条可访问链接一并留在页面上，只作线索。
  - 四语：新增 12 个译文节点 + 1 个 `alt` 属性（累计 81 节点 / 11 属性）；图片四语共用、未翻译，各语 `alt` 与全部说明文字独立本地化。
  - 技术：新增 `.archive-*` 样式（图片卡、两栏说明、暗色模式下柔化白底截图、960px 以下改单栏）；两个脚本的 `ATTR_TARGETS` 支持 `alt`，属性匹配正则改为 `(^|\s)`，不再依赖属性书写顺序。

### 附页已跑过的校验

- `node --check`（`i18n.js` / `app.js` / 两个脚本）、`build-i18n.mjs`、`verify-i18n.mjs` 全通过：**81 节点 / 11 属性 / 4 语一致**，附页章节、边界声明、剪报图片与三条存档链接在四语里齐全；**14/14 故意造错全部判红**（原有 7 项 + 图片文件丢失、附页标题被删、中文边界声明被删、译页边界声明丢失、存档链接丢失、图片路径未加前缀、`alt` 未翻译）。
- CDP 四语 × 两种视口（1440 桌面 / 真实 390px 设备模拟）共 **8 例全绿**：剪报图 `naturalWidth×Height = 890×386` 加载成功、四语 `alt` 已本地化、CSS 加载、`docScrollWidth <= innerWidth`（1425/1440、390/390）、窄屏图片宽 328px 不溢出、三条链接齐全、teaser 指向 `#archive`、滚动并等待兜底后 `revealHidden = 0`。
- 桌面与移动端截图逐语肉眼验收：剪报图完整清晰、图注与边界声明可读、英/日/韩无豆腐块乱码、无重叠或异常留白；DOM 探针确认附页是 `main` 最后一节、页脚紧随其后。
- 新增两条踩坑记录：[PITFALLS.md](PITFALLS.md) 第 7—8 条（`\b` 正则误匹配 `data-i18n-*` 尾部；验收脚本在滚动前检查 reveal 会假红）。

## 2026-11-13 · 窄屏语言切换器短标签修正

- `54f7678` — 站长反馈：韩文页窄屏高亮显示繁体汉字「韓」不对，日语也该用 `JP` 而不是「日」。中文原文一字未删。
  - 四个页面共用的短标签由 `中 / EN / 日 / 韓` 改为 **`中 / EN / JP / KR`**：日/韩统一用两字母拉丁地区缩写，不再用单个汉字，也不再混简繁。桌面仍显示全名 `中文 / English / 日本語 / 한국어`，不受影响。
  - 技术层的 `lang` / `hreflang` 仍是 ISO 639-1 的 `zh / en / ja / ko`，与给人看的视觉缩写互不冲突；这一点写进了 [PITFALLS.md](PITFALLS.md) 第 9 条。
  - 顺带修可访问性缺陷：窄屏原先用 `.lang-long { display: none }` 隐藏全名，读屏只剩缩写可念。改为 1px + `clip: rect(...)` 视觉隐藏（全名仍在可访问性树里），短标签加 `aria-hidden="true"`，`.lang-switch a` 加 `position: relative` 承接定位。
  - `verify-i18n.mjs` 新增校验：四个短标签的值、`aria-hidden`、CSS 禁止 `display: none` 且必须有 `clip: rect(...)`，中文源页与三张生成页都查；新增 6 项对应故障注入（累计 20 项）。

### 短标签修正已跑过的校验

- `node --check`（`i18n.js` / `app.js` / 两个脚本）、`build-i18n.mjs`、`verify-i18n.mjs` 全通过：**81 节点 / 11 属性 / 4 语一致，20/20 故意造错全部判红**（新增 6 项：汉字回退、日文不是 JP、标签丢失、`aria-hidden` 缺失、`display:none` 回归、`clip` 被删）。
- CDP 四语 × 两种视口共 **8 例全绿**：四个短标签均为 `中/EN/JP/KR`、全名四语正确、`aria-hidden` 齐全、当前语言高亮正确；`docScrollWidth <= innerWidth`（1425/1440、390/390），切换器与品牌 `overlap < 0`，切换器右缘未超出 header；桌面 `shortDisplay=none / longWidth=23`，窄屏 `shortDisplay=inline / longWidth=1 / clip=rect(...)`。
- 窄屏 header 特写截图逐语肉眼验收：韩文页 `KR` 高亮、中文页「中」高亮，无「韓」「日」汉字残留，无裁切或重叠。

## 2026-11-13 · 附页归属更正 + 存档链接状态标记

- `8137b22` — 站长指出两处不对：附页把**他本人发来的截图**写成了「有人留下」「读者提供」；三条存档链接里前两条已失效，只有凤凰网还能看。
  - **归属更正**：中文引言改为「这张网页截图是站长给我的」，图注改为「站长提供的这张网页截图」；英 / 日 / 韩同步为 `the owner of this site` / `このサイトの持ち主` / `이 사이트의 주인`。Hero 里「有人给它留了一碗水」是修辞意象、不是归属，保留不动。README 与历史记录里的「读者提供」也一并更正。
  - **链接核查（2026-11-13 实测）**：人民网广东频道连接失败（`000`）、山西新闻网返回 `404`（站长遇到的是 `504`）、凤凰网 `200` 正常。三条链接全部保留，前两条标「已失效」（虚线灰徽章），凤凰网标「仍可访问」（橘色徽章）。
  - 新增核查说明：写明日期、两条链接的错误表现、仅凤凰网可阅读、「状态随时会变，此处只记录本次核查」、失效链接保留作线索。四语本地化。
  - **同步修正边界声明**：原写「同题报道仍可在几处存档里找到」已不成立，改为「曾在几处留有存档，链接与当前可访问状态都附在本页」，四语一致；不核查、不背书、不作论据的底线不变。
  - 新增 3 个可译节点（`archive.statusDead` / `statusLive` / `linksNote`，累计 84 节点 / 11 属性）；`.link-status` 徽章样式（虚线灰 / 橘色实心）与 `.archive-links-note`，链接行改 flex-wrap 以适配窄屏。

### 本次已跑过的校验

- `node --check`（`i18n.js` / `app.js` / 两个脚本）、`build-i18n.mjs`、`verify-i18n.mjs` 全通过：**84 节点 / 11 属性 / 四语一致，29/29 故意造错全部判红**（新增 9 项：中/英/日/韩归属匿名化回退、徽章被删、全标可访问、中文源页丢徽章、核查说明被删、边界声明回退成「仍可访问」）。
- 校验新增：`ANONYMOUS_MARKERS`（四语旧匿名措辞与「仍可访问」旧断言）在中文源页及三张生成页都不许出现；intro 与 caption 必须含各语归属词；`is-dead` 恰好 2 个、`is-live` 恰好 1 个；核查日期存在。
- CDP 四语 × 桌面 1440 + 真实 390px 共 **8 例全绿**：徽章数量 / 文案 / 可见性、三条 href、核查日期、归属词、`docScrollWidth <= innerWidth`（1425/1440、390/390）、无残留 `pending` 元素；桌面与窄屏截图逐语肉眼验收，徽章与说明无裁切、无重叠、日韩无豆腐块。
- 验收脚本自身踩了一次假红（导航后少等 1s、且把淡入过渡中间值当「隐藏」），按已验证时序修正；另修正 CDP `clip` 用文档坐标导致的空白截图，改整屏截图。两条记进 [PITFALLS.md](PITFALLS.md) 第 8 条补充与第 12 条，归属与链接失效的规则分别记在第 10、11 条。

## 2026-11-13 · 短标签体系收口：`中` → `CN`

- `4762c20` — 站长指出：既然是 `EN / JP / KR`，中文没道理还留一个汉字「中」。上一轮只修了被点名的日/韩，留了半套统一。
  - 中文源页短标签 `中` → `CN`，由 `build-i18n.mjs` 自动同步到 `en/` `ja/` `ko/`，四页统一为 **`CN / EN / JP / KR`**。桌面全名 `中文 / English / 日本語 / 한국어` 不变；技术层 `lang` / `hreflang` 仍按 ISO 639-1 用 `zh / en / ja / ko`，未改动。
  - `verify-i18n.mjs`：`SHORT_LABELS` 四个值全部改为拉丁缩写；新增 `SHORT_LABEL_PATTERN = /^[A-Z]{2}$/`，对中文源页与四张页面逐个断言「两大写拉丁字母」，防止以后任何一语回退成汉字或小写。故障注入新增 2 项（中文回退成「中」、中文写成小写 `cn`），累计 **31 项**；同步修正原有故障注入里的 `>中<` 字面量。
  - 文档：`README.md` 短标签说明与自检计数（29 → 31）更新；`PITFALLS.md` 第 9 条规则改为「四个一律拉丁、不留汉字例外」，新增第 13 条记「统一一套视觉体系时别留例外、也别把一致性问题包装成用户偏好选项」。

### 本次已跑过的校验

- `node --check`（`i18n.js` / `app.js` / 两个脚本）、`build-i18n.mjs`、`verify-i18n.mjs` 全通过：**84 节点 / 11 属性 / 四语一致，31/31 故意造错全部判红**；逐页扫描短标签均为 `CN / EN / JP / KR`。
- CDP 四语 × 桌面 1440 + 真实 390px 共 **8 例全绿**：四标签值与全名正确、`aria-hidden` 齐全、当前语言高亮正确；`docScrollWidth <= innerWidth`（1425/1440、390/390），品牌与切换器 `overlap < 0`，切换器右缘未超出 header；桌面 `shortDisplay=none / longWidth=23`，窄屏 `shortDisplay=inline / longWidth=1 / clip=rect(...)`。
- 窄屏 header 特写截图肉眼验收：中文页 `CN` 黑色胶囊高亮、韩文页 `KR` 高亮，四个标签全是拉丁字母，无「中 / 日 / 韓」残留，无裁切或重叠。

## 2026-11-13 · 附页归属去掉第一人称「我」，改为 AI

- `740e393` — 站长要求把「这张网页截图是站长给**我**的」里的「我」替换为 `AI`。上一轮虽然写清了来源，却用了第一人称：网页是 AI 写的、给访客看的，「我」既像站长自称又像网站自称，视角乱了。真实关系是**站长把截图交给了 AI**。
  - 中文引言改为「这张网页截图是**站长给 AI 的**」；英 / 日 / 韩同步为 `The owner of this site gave this screenshot to the AI` / `このサイトの持ち主が AI に渡したものです` / `이 사이트의 주인이 AI에게 건넨 것입니다`。三语译文写入 `assets/i18n.js`，由 `build-i18n.mjs` 从中文源页生成三张语言页。
  - 图注「站长提供的这张网页截图」及三语对应文案没有视角歧义，**保持不动**；不核查、不背书、不作论据的边界声明与链接状态标记也未改。
  - `verify-i18n.mjs` 新增 `AI_MARKERS`（四语 intro 必含）与 `FIRST_PERSON_MARKERS`（四语旧第一人称句一律不许回来），中文源页与三张生成页都查；同步更新 2 项旧故障注入的字面量，新增 4 项（中文回退「给我的」、英文删 `to the AI`、日 / 韩回退旧句），累计 **35 项**。
  - 文档：`README.md` 归属说明与自检计数（31 → 35）更新；`PITFALLS.md` 第 10 条规则改为「归属要写清谁 → 谁」，新增第 14 条「网页文案里的『我』不是站长」。

### 本次已跑过的校验

- `node --check`（`i18n.js` / `app.js` / 两个脚本）、`build-i18n.mjs`、`verify-i18n.mjs` 全通过：**84 节点 / 11 属性 / 四语一致，35/35 故意造错全部判红**；四页 intro 逐字扫描均含各语 AI 标记。
- CDP 四语 × 桌面 1440 + 真实 390px 共 **8 例全绿**：intro 含 AI 与站长词、caption 含站长词、无旧第一人称串、无残留 `pending`、`docScrollWidth <= innerWidth`（1425/1440、390/390）、intro 未被右边缘裁切、剪报图片加载成功。
- 截图逐语肉眼验收：中文「站长给 AI 的」中英间距自然，英文长句换行无裁切，剪报图、图注与状态徽章完好，无重叠或异常留白。
