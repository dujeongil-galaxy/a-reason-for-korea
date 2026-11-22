# CHANGELOG

本站按「改动必记账」维护：改完代码 → 跑校验 → 用**真实提交号**记一笔 → 踩到的新坑写进 [PITFALLS.md](PITFALLS.md)。

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
