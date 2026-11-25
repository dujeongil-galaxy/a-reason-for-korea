# 哈韩，也要有一个理由

> 不是因为舞台有多亮，是因为街角那只猫，有人给它留了一碗水。

一个关于「喜欢一个地方，能不能说出一个像样的理由」的网站。缘起是一条抖音分享：

> 「希望很多猫咪都生长在韩国吧」 #这个世界不能没有小猫 #韩国 #善意 #正能量

## 四种语言，四个独立网址

| 语言 | 网址 |
| --- | --- |
| 中文（源文案） | https://dujeongil-galaxy.github.io/a-reason-for-korea/ |
| English | https://dujeongil-galaxy.github.io/a-reason-for-korea/en/ |
| 日本語 | https://dujeongil-galaxy.github.io/a-reason-for-korea/jp/ |
| 한국어 | https://dujeongil-galaxy.github.io/a-reason-for-korea/ko/ |

每页右上角可切换语言，当前语言高亮；窄屏自动改为短标签（`CN / EN / JP / KR`）——四个一律是两字母大写拉丁地区缩写，不用「中」「日」「韓」这类单字汉字，也不混简繁。短标签带 `aria-hidden`，语言全名以视觉隐藏方式保留给读屏软件。四个页面各有自己的 `hreflang`、`canonical` 与 `og:url`，都是**完整翻译后的静态 HTML**——关掉 JavaScript 也能正常阅读，方便单独分享与收录。

## SEO（2026-11-22 站长指令：按推荐执行 A+C+D 长尾）

搜索引擎目前只收录到 GitHub 仓库页、站点本身的标题是金句没有可检索词。做法：

- **title / description 关键词前置、金句后置**，四语各自本地化、不机翻。核心长尾按语言定：中文「为什么喜欢韩国」、英文 `Why I Like Korea`、日文「韓国が好きな理由」、韩文「한국을 좋아하는 이유」；再各自带上品牌「哈韩的一个理由」/ `K-pop` / 猫与善意 / 片名《哦！文姬》。
- **每语一段 JSON-LD**（`WebSite`）：`inLanguage` 分别 `zh-CN / en / ja / ko`，`url` 指向各自页面，`keywords` 用当地语言，不得混用别的语言。
- **`sitemap.xml`** 收录四语地址 + `hreflang`（含 `x-default`），**`robots.txt`** 指向它；四页 head 都有 `<link rel="sitemap">`。
- **AI 摘要（如双休购那种）无法保证必进**：站内只负责把结构化数据、关键词和入口做扎实，是否展示由搜索引擎/AI 决定。

**中文原文没有删除、也没有复制成第二份**：`index.html` 是唯一的中文源文案，中文页仍是默认首页。

## 这一页在说什么

四个理由，一条底线：

1. 善意落在细节里 —— 一个碗、一只没被清走的纸箱、一次弯腰。
2. 看它怎么对待最弱小的那一个 —— 猫是一把很轻的尺，却称得出很重的东西。
3. **喜欢不是免检** —— 喜欢不等于替一切辩护，也不等于把一个真实的国家想象成精修图。保留判断，才叫「有理由」。
4. 把喜欢带回自己身边 —— 一碗干净的水、不弃养、领养代替购买。

页面还有两个小互动：「给小猫留一盏灯」和「写下你自己的理由」卡片生成器。它们在四种语言里都是本地化文案。

## 附页：一页差点找不到的旧报

放在「延伸阅读」之后、页脚之前，像夹在书末的一张剪报，**不属于上面四条理由**。「延伸阅读」末尾有一行站内链接引过去。

这张剪报由**站长本人发给 AI**，图片 `assets/clipping-hkcd.jpg` 原样保留（未修改，标注来源与版权），页面只写清这一屏能确认的范围：截图止于标题、未包含正文、图上没有明确发布日期。另附三条同题公开报道存档链接，仅作线索；页面逐条标注了 2026-11-13 的可访问状态（人民网、山西新闻网已失效，仅凤凰网仍可正常阅读），失效链接不删除、保留作线索。四种语言的文字都不复述标题、不评价事件、不替它下结论，并明确声明「不核实其中细节、不为其表述背书、也不代表任何立场」。附页引言四语统一写清归属链是「站长 → AI」（`站长给 AI 的` / `gave this screenshot to the AI` / `AI に渡した` / `AI에게 건넨`），不用第一人称「我」——网页不是站长本人在说话。

## 内容边界（重要）

- 本站是**个人观点页**，不引用未经核实的数据，不写「某国人都如何」这类全称判断，也不代表任何机构。
- 「延伸阅读」只列公开可访问的链接（原抖音分享、话题文章、一篇关于韩国猫岛计划的报道），仅作线索；本站不对其中的事实、数据与时效性作核查或背书。
- 「站长推荐」收集韩国电影 / 剧集 / 音乐。**导航二级菜单**（2026-11-22）：四语的「站长推荐」下面挂「看韩剧 / 听K-pop / 玩游戏」三项，分别指向 `#picks` / `#picks-kpop` / `#picks-games`；标题下的分类名与菜单第一项一一对应。**只在桌面显示**（≤720px 整条导航隐藏），站长明确要求手机端先不做。K-pop 与游戏目前只是**占位**，写「正在开发中，请等待站长写入数据」，等站长填数据。**音乐区**（2026-11-22 新增）：当前只有一张卡——任昌丁 & 金昌烈《请开门》(문을 여시오, 2013) MV，使用标准两栏布局（与剧集卡完全同款，锁死排版规则），左竖版 MV 缩略图（`assets/door-mv-thumb.jpg`）、右文字区。**按区挂链接**：中文页主按钮挂 QQ 音乐 MV（`https://y.qq.com/n/m/detail/mv/index.html?vid=f0015hf64je`，大陆专用），外文三页主按钮挂 YouTube MV（`https://youtu.be/GQ53MTOVS04`，其他地区）；中文页 ytnote 改为纯文字提示（无链接，遵守「中文源禁 YouTube 直链」红线），外文页 ytnote 保留 YouTube 链接。六张影视卡仍在**原有两列网格**里（不跨列、不置顶、不独占）：《哦！文姬》与五部剧集**完全同款**：标准两栏、左边竖版海报、右边片名 / 简介 / 购买按钮 / 注记，卡片尺寸一致，无任何特殊布局。片名线索即使来自盗版站，页面也**只写片名、绝不挂该链接**。**主购买按钮按地区定**（2026-11-22 复核版）：
  - **中文（港区）**：aff 邀请码链接 `https://nfshare.cn/?sid=5rfpUarUEd`，文案「中国香港地区：通过此链接开通（邀请码 5rfpUarUEd）」——**港区口径只有中文能写**。
  - **英文（美区）**：Prime Video 可租可买 → 主按钮挂 `https://watch.amazon.com/detail?gti=amzn1.dv.gti.3a505a12-509d-4f34-af76-47f0ea441f72`，文案「Rent or buy on Prime Video」；副按钮挂 YouTube Movies 租买 `https://youtu.be/cflWf3XKeFI?si=pZ-WkU6w5wYkh4Wq`，文案「Rent or buy on YouTube」（2026-11-25：原挂的免费带广告版 `watch?v=Ck9onnQBStU` 已下架成死链，YouTube 现存版本只能租买，两个链接并列挂）。
  - **日文（日区）**：Netflix / Amazon Japan 均无此片；原 Apple TV 日区商品页 `id1691528206` 实测 404（2026-11-25 移除，勿回挂）→ 改挂 YouTube Movies《오! 문희》日区租买 `https://youtu.be/cflWf3XKeFI?si=pZ-WkU6w5wYkh4Wq`，文案「YouTube でレンタル・購入する · 正版で応援しましょう」。
  - **韩文（韩区）**：YouTube 可租借买断 → 主按钮挂 `https://youtu.be/cflWf3XKeFI?si=pZ-WkU6w5wYkh4Wq`。**三个外文主按钮都不挂 aff / 邀请码**。
  - **按钮下方的红色加粗提示**（2026-11-22 站长指令）：中文页保留原文「到 Netflix 搜索片名观看 · 请支持正版」；**英 / 日 / 韩三语各自本地化**为「中国大陆用户请点击**这里**访问 Netflix」——en `Viewers in mainland China: click here to access Netflix.`、jp `中国大陸からご覧になる場合は、こちらから Netflix にアクセスできます。`、ko `중국 본토 시청자는 여기를 눌러 Netflix에 접속하세요.`。其中「这里 / click here / こちら / 여기」都是指向 `https://nfshare.cn/?sid=5rfpUarUEd` 的链接（站长额外增加的 AFF 入口），**不是 Netflix 官网链接**。四页仍一律禁 `netflix.com` 链接与盗版链接；港区口径不得直译进外文（`Hong Kong, China` / `중국 홍콩` / `香港地区` 一律禁）。
- **购买引导以后都要按区实查一次**（站长 2026-11-22 追加的长期规则）：每新增或改动一条推荐片的正版引导，都必须**重新查一遍当地真实的租买渠道**，不沿用旧结论、不给所有语言套同一口径。顺序：① 先用**原名 + 导演 + 主演**确认是同一部片（避免像 `Oh! Baby` 那种同名撞片，本片真名是 `Oh! My Gran` / `오! 문희`）；② 再查 JustWatch 对应国家页、Moviefone where-to-watch、iTunes Search API（日区）等**地区化**来源；③ `YouTube Free`（免费带广告）**不算**租买；④ 当地有可租买渠道就挂当地官方商品页，中文港区 aff 单独保留，Netflix 只留红字提示、不许把 `netflix.com` 做成链接（外文的红字里「这里」是 AFF 入口）。
  - **备注：这只是站长额外增加的 AFF**（推广 / 邀请码引导），不是本站原有栏目的通用规则；但既然挂了，就必须按实查结果挂对、挂到当地，不能想当然。
- **推荐必须带预览图**（站长 2026-11-22 定下的长期规则）：每条推荐都要有一张来自正版资料站的剧照 / 海报，下载到 `assets/` 本地引用，四语 alt + 来源说明齐全；不用盗版站素材，不挂外链图片。六张卡各用本地竖版海报（首部影片为 `assets/oh-my-gran-poster.jpg`，1010×1440，300 KB，GoldPoster 收录的官方宣传海报）。`verify-i18n.mjs` 对盗版域名、两条链接、四语推荐文案、图片引用/alt/来源说明、海报两栏布局均有断言 + 8 组故障注入。
- **推荐按时间线排列**（站长 2026-11-22 追加的长期规则）：「以后也是，年份越近，越靠前」——推荐区按作品年份倒序排列，新片在前、老片在后。当前顺序：《车贞淑医生》2023 → 《哦！文姬》2020 → 《无理的前进》2015 → 《来自星星的你》2013 → 《继承者们》2013 → 《大长今》2003。剧集卡片用竖版海报（2:3 / 3:4），`.pick-image-poster` 保留原始比例，≤420px 时海报与文字改为上下堆叠。海报来自 TMDB / MBC 官方页，本地存放在 `assets/*-poster.jpg`。
- **剧集购买按钮按区实查结果挂**（2026-11-22）：中文五部统一挂港区 aff 邀请码；外文只有在当地查到可租买时才挂主按钮——en《继承者们》挂美区 Amazon 买断页、jp《来自星星的你》《继承者们》挂日区 Amazon 租买页；其余外文区（含韩区全部五部）查无租买渠道，只有本地化的红字 AFF 入口，不挂任何购买按钮。`verify-i18n.mjs` 对五部剧的四语字段、年份顺序、海报引用、按区按钮、无渠道区禁按钮均有断言 + 20 组故障注入。
- **订阅制渠道也要挂，但只挂查得到的**（2026-11-22 站长追问「只有订阅制，既然能买正版，为什么不挂」）：订阅当然算正版，所以**按区实查到的持牌订阅平台要挂出来**，形式是卡内**虚线边框的订阅按钮**（`.pick-link-sub`），位置固定在租买按钮与红字 AFF **之上**，文案必须标明订阅属性（`subscription` / `定額制` / `정액제`），不冒充买断。
  - **AFF 入口一律保留**：不删、不挪、不降级；订阅按钮只是加在它上面一行。
  - **只挂非 Netflix 平台**：Netflix 的入口就是那条红字 AFF，四页仍禁 `netflix.com` 直链。
  - **查不到就不挂**：该区只有 Netflix（如《车贞淑医生》美区 / 日区）或查无订阅渠道（如《无理的前进》日区、《哦！文姬》日 / 韩区）的卡片，一个订阅按钮都不挂，宁缺勿造死链。
  - 当前挂法：en《无理的前进》Kocowa（Prime 频道）、《来自星星的你》《继承者们》《大长今》Viki；jp《来自星星的你》《继承者们》《大长今》U-NEXT；ko《车贞淑医生》《来自星星的你》《大长今》TVING、《无理的前进》wavve、《继承者们》왓챠；中文四页不挂（这些平台在中国大陆均不可用）。
  - 取数方式：JustWatch GraphQL（`apis.justwatch.com/graphql`，`country=US/JP/KR`）逐区拉 `offers`，再逐条 curl 复核落地页状态码（Viki 剧集页从 episode 页里的 `/tv/NNNc-` 反查）。`verify-i18n.mjs` 以 `DRAMA_SUB` 锁定链接与文案、`SUB_DOMAINS` 白名单卡域名，并断言「订阅按钮必须在租买按钮与红字之上」「每卡仅一条」「无渠道区禁挂」「中文页禁挂外区订阅」。
- **附页的剪报是记忆存档，不是论据**：图片原样保留并标注来源，页面不复述其内容、不评价、不核查，也不把它算作任何一条理由；外部存档链接同样不核查、不背书。四语都写着「记得一件事，不等于替它下结论」。
- **专题报道（2026-11-25）**：`report/minty/` 是独立的**中文单页**，讲 Minty 的年龄风波，不属于四条理由，也不进 i18n 字典（预览期只写中文）。主站只在 K-pop 的 Minty 卡下挂一个 `.pick-report-link` 入口；按钮放在 `data-i18n` 之外，重建语言页不会覆盖它，也不会漏翻译。视频默认不加载，点击后才注入 `youtube-nocookie.com`。页面事实以原始报道为准（CJ E&amp;M 曾确认她没有递交《高等 Rapper 2》申请），不写未核实的「被 Mnet 除名」。
- 第 03 条四语一致地写明「喜欢不是免检」：喜欢一部分，同时保留自己的判断。这是整页的底线。
- 译文是人工撰写的自然表达，不是逐字直译；版式小标签（栏目名、理由小标题）在日/韩页也做了本地化，产品名（WorkBuddy / GitHub Pages / TikTok）与来源名保留原文。插画里纸箱上的 `CAT` 属于图案，不翻译。**抖音的国际产品名是 TikTok**：中文源页照写「抖音」，en/jp/ko 译文一律写 `TikTok`，不得回退成 `Douyin` / `더우인` / `抖音（Douyin）`；`v.douyin.com` 是那条原始分享的真实链接域名，属 URL 不是译文，保留不动。`scripts/verify-i18n.mjs` 有专门断言 + 故障注入防回退（站长 2026-11-16 指令）。延伸阅读第二条标签同样按此口径：中文「抖音」，en/jp/ko 一律 `TikTok`，不写 `Douyin` / `더우인`，也不回退成旧标签「近例 / Another / もう一本 / 또 하나」（站长 2026-11-22 指令）。

## 文件结构

```
index.html                    唯一中文源文案（含 data-i18n 钩子、语言切换器、hreflang）
en/index.html                 英文静态页（脚本生成，勿手改）
jp/index.html                 日文静态页（脚本生成，勿手改）
ko/index.html                 韩文静态页（脚本生成，勿手改）
report/minty/index.html       中文专题报道：Minty／《You Do》／年龄风波（独立单页，暂不翻译）
.githooks/pre-commit          提交身份检查：拦截旧号邮箱 dujeongil@users.noreply.github.com
HASH-MAP.md                   2026-11-26 历史重写的旧→新提交对照
assets/styles.css             样式、响应式、语言字体栈、暗色模式、动效降级
assets/i18n.js                en/jp/ko 译文 + 四语属性 / 运行时文案
assets/app.js                 滚动淡入 / 点灯计数 / 理由卡片 / 复制
assets/clipping-hkcd.jpg      附页剪报（站长发给 AI，原样未修改）
favicon.svg                   猫爪图标
sitemap.xml                   四语地址 + hreflang（x-default 指中文）
robots.txt                    允许抓取并指向 sitemap.xml
scripts/build-i18n.mjs        由 index.html + 字典生成三张语言页
scripts/verify-i18n.mjs       四语一致性 + 附页 + 切换器 + 链接状态 + 归属措辞 + 产品名/read4 标签 + 站长推荐按区主按钮（zh=aff、en=Prime Video、jp=YouTube、ko=YouTube）/三语本地化红字 AFF 入口/港区只中文/预览图/五部剧集时间线（年份倒序、按区购买、竖版海报、按区订阅渠道）/订阅按钮位置与域名白名单/音乐区按区通道（zh=QQ 音乐、外文=YouTube）+ 标准两栏结构 + 年份 2013 锁定/二级菜单三项锚点与标题分类对应/K-pop 游戏占位/六张卡统一标准两栏（竖版海报在左、文字在右，不得回退到特殊堆叠布局）/等高网格 + 海报撑满卡片高度 + 按钮贴底（不留底部空白） + SEO title/description 关键词 + 四语 JSON-LD + sitemap/robots + 极窄屏防溢出校验 + 122 项故障注入自检
.nojekyll                     让 GitHub Pages 跳过 Jekyll
CHANGELOG.md / PITFALLS.md    改动记账与踩坑记录
```

## 改文案之后怎么做

中文只改 `index.html`，其他语言只改 `assets/i18n.js`，**不要直接编辑 `en/`、`ja/`、`ko/` 里的 HTML**（它们会被覆盖）：

```bash
node scripts/build-i18n.mjs     # 重新生成三张语言页
node scripts/verify-i18n.mjs    # 校验；内含故意造错的自检，必须 94/94 判红
```

校验会检查四语 key 是否齐全（98 个节点 / 12 个属性）、中文是否被删、生成页是否与字典逐字一致、资源路径 / 语言切换链接 / canonical 是否正确，附页章节、边界声明、剪报图片归属措辞、三条存档链接及其状态标记在四语里是否都在，以及 SEO 关键词、四语 JSON-LD 的语言/地址、sitemap 四语入口与 robots 指向。

## 提交身份（每个 clone 设一次）

2026-11-25 有 15 条提交用了旧式 noreply 地址 `dujeongil@users.noreply.github.com`，GitHub 会把它映射到十年没用的 `dujeongil` 账户，贡献页因此多出一个名字。仓库现在带一个 pre-commit 钩子，邮箱不对直接拦下：

```bash
git config --local user.email "dujeongil-galaxy@users.noreply.github.com"
git config --local core.hooksPath .githooks
```

更稳的写法是用 GitHub 设置里带数字 ID 的 noreply：`<ID>+dujeongil-galaxy@users.noreply.github.com`。旧号名下没有别的东西，2026-11-26 已按站长要求**重写历史**把这 15 条改到新号名下（另修一条错拼的 `dujeil-galaxy`），贡献页上的 `dujeongil` 会随之消失。重写让 19 条提交换了哈希，旧→新对照见 [HASH-MAP.md](HASH-MAP.md)。

## 本地预览

所有资源都是相对路径，中文页直接双击 `index.html` 就能看；语言页也可以直接打开对应文件。若想完整模拟线上子路径：

```bash
python -m http.server 8000
# http://localhost:8000/  ·  /en/  ·  /ja/  ·  /ko/
```

## 技术与部署

- 纯静态 HTML / CSS / JS，**无第三方库、无网络请求、无埋点**（构建脚本只在开发时跑）。
- 「留一盏灯」的计数只写在访问者自己的 `localStorage`，不上传，且页面已明确说明这一点。
- 用户输入用 `textContent` 渲染，不进 `innerHTML`；字典里的 HTML 片段是人工维护的可信内容，校验脚本会拦截可执行标记。
- 支持响应式、键盘焦点、跳转正文、`prefers-reduced-motion` 与系统暗色模式。
- GitHub Pages 从 **main 分支 / 根目录** 发布；四个入口一次推送全部更新。

## 记账

改动与真实提交号见 [CHANGELOG.md](CHANGELOG.md)，踩过的坑见 [PITFALLS.md](PITFALLS.md)。

最近一笔：`de82c72`（2026-11-25）站长追问「YouTube 和 Apple TV 什么的，也核实没有吗？」——实查后：英文页原挂的 YouTube 免费带广告版 `Ck9onnQBStU` 已 UNPLAYABLE（死链），同片 YouTube Movies 租买版 `cflWf3XKeFI` 仍在（带 offerId、需付费），故英文页把副按钮换成「Rent or buy on YouTube」；日文页原 Apple TV `id1691528206` 已是 404 且 iTunes Search API 日区返回空（API 空≠无上架），改挂同一 YouTube 租买版为主按钮，`PICKS_ACTIONS_EXPECT.jp.primary` 由 `null` 改为 `youtube`、`PICKS_PRIMARY_LABEL.jp` 同步改文案、`LICENSED_SUB_EXTRA['en/film']` 换链接、`SUB_DOMAINS` 补 `https://youtu.be/`，两条以「日文页无渠道」为前提的故障注入改为「错区 Amazon / 港区 aff 上主按钮必判红」；`node scripts/build-i18n.mjs` + `node scripts/verify-i18n.mjs` 全绿（404 节点 / 63 属性 / 自检 247/247）。
上一笔：`ae20406`（2026-11-25）按站长「附页：影片档案，请放在加速器下方」把 `film.teaser` 从加速器小标题之前移到 `#picks-accelerators` 卡片网格之后（四语同步重生成），并把位置断言反转为「加速器网格之后、`#film-note` 之前」、四语各加一条同序断言，新增 2 条故障注入；`node scripts/build-i18n.mjs` + `node scripts/verify-i18n.mjs` 全绿（404 节点 / 63 属性 / 自检 247/247）。
上一笔：`dbd680e`（2026-11-25）按站长「中文找不到就推英文、尽可能补齐」补齐 10 处正版订阅（OnDemandKorea / FOD / wavve / TVING ×4 / Watcha / YouTube），并修掉 drama6 Netflix 与日文《哦！文姬》Apple TV 两条死链（自检 245/245）。
