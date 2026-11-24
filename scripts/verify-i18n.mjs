/* ============================================================
   Verify the four-language site.

   Checks key-set parity, that Chinese copy was NOT deleted, that
   every generated page matches its dictionary exactly, and that
   links / assets / metadata point at the right place.

   IMPORTANT: the checks are pure functions over a `state` object,
   so the same code can be run against deliberately broken copies.
   Every new check must be covered by an injected fault at the bottom.

   Run: node scripts/verify-i18n.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://dujeongil-galaxy.github.io/a-reason-for-korea/';
const LANGS = ['en', 'jp', 'ko'];
const HTML_LANG = { en: 'en', jp: 'ja', ko: 'ko', zh: 'zh-CN' };
const ATTR_TARGETS = new Set(['aria-label', 'placeholder', 'content', 'alt']);
const CHINESE_MARKERS = [
  '哈韩，也要', '善意落在细节里', '喜欢不是免检',
  '这个世界不能没有小猫', '给小猫留一盏灯', '延伸阅读',
  '一页差点找不到的旧报', '不想遗忘', '记得一件事，不等于替它下结论'
];
const REQUIRED_ASSETS = [
  '../assets/styles.css', '../assets/i18n.js', '../assets/app.js', '../favicon.svg',
  '../assets/clipping-hkcd.jpg', '../assets/oh-my-gran-poster.jpg'
];
const ARCHIVE_LINKS = [
  'https://dujeongil-galaxy.github.io/a-reason-for-korea/',
  'https://dujeongil-galaxy.github.io/a-reason-for-korea/',
  'https://news.ifeng.com/c/7fk6pvzKGtR'
];
/* 旧死链域名：站长 2026-11-13 指令，前两条已失效的外链统一改指本页，
   这两个域名不得再出现在任何页面（机器强制防回退）。 */
const FORBIDDEN_DEAD_DOMAINS = ['gd.people.com.cn', 'news.sxrb.com'];
/* Mobile switcher labels: every one is a two-letter uppercase Latin code.
   No CJK glyph anywhere, including Chinese — the whole set must be one system. */
const SHORT_LABELS = { zh: 'CN', en: 'EN', jp: 'JP', ko: 'KR' };
const SHORT_LABEL_PATTERN = /^[A-Z]{2}$/;
/* Two archives are dead, one is alive; the check date must stay visible. */
const STATUS_COUNTS = { dead: 2, live: 1 };
const OWNER_MARKERS = {
  en: 'owner of this site', jp: 'このサイトの持ち主', ko: '이 사이트의 주인'
};
/* The clipping was handed by the site owner TO THE AI. No anonymous source,
   and no first-person "me" — the page is not spoken by the site owner. */
const AI_MARKERS = {
  zh: '站长给 AI 的', en: 'to the AI', jp: 'AI に渡した', ko: 'AI에게 건넨'
};
const FIRST_PERSON_MARKERS = [
  '站长给我的',
  'This screenshot came from the owner of this site',
  'このサイトの持ち主から届いた',
  '이 사이트의 주인이 건네준 것입니다'
];
/* Anonymous attribution and "still available" claims must never come back. */
const ANONYMOUS_MARKERS = [
  '有人留下一张网页截图', '读者提供',
  'Someone left behind', 'supplied by a reader',
  'ある人が一枚', '読者から提供された',
  '어떤 분이 스크린샷', '독자가 제공한',
  'are still available in a few public archives',
  'いくつかのアーカイブに残っており', '몇 곳의 아카이브에 남아 있어'
];
/* 抖音 的国际产品名是 TikTok。中文源页保留「抖音」，v.douyin.com 是原始
   分享链接域名、不改。en/jp/ko 译文里不得再出现 Douyin / 더우인 / 抖音。
   （站长 2026-11-16 指令，机器强制防回退。） */
const PRODUCT_NAME = 'TikTok';
const STALE_PRODUCT_NAMES = ['Douyin', '더우인', '抖音'];
/* 中文源里四处提到抖音的原文，逐条核对，避免「改一处留一处」蒙混过关。 */
const ZH_PRODUCT_COPY = [
  '一条关于猫、善意与韩国的抖音分享',
  '一条抖音分享，和它背后的四个理由。',
  '来自一条抖音分享',
  '那条抖音视频：'
];
/* read4 标签口径（站长 2026-11-22 指令）：中文写「抖音」，en/jp/ko 一律用
   国际产品名 TikTok —— 不是逐字机翻的 Douyin，也不是含糊的旧标签「近例」。 */
const READ4_TAG = { zh: '抖音', en: 'TikTok', jp: 'TikTok', ko: 'TikTok' };
const STALE_READ4_TAGS = ['近例', 'Another', 'もう一本', '또 하나'];
/* 站长推荐（2026-11-22 按区复核版）：片名线索来自盗版站，但该域名绝不能出现在页面上；
   主按钮按地区定：中文按港区挂 aff（邀请码逐字保留）；英文按美区挂 Prime Video 租买页；
   日文按日区挂 Apple TV 租买页（日区 Netflix / Amazon JP / YouTube 均无此片）；
   韩文按韩区挂 YouTube 租买页。港区口径只有中文源可写，外文一律不直译；
   Netflix 只作红色加粗提示行、四页均不得成链接。 */
const FORBIDDEN_PIRATE_DOMAINS = ['ncat30.com'];
const AFF_LINK = 'https://nfshare.cn/?sid=5rfpUarUEd';
const AMAZON_LINK = 'https://watch.amazon.com/detail?gti=amzn1.dv.gti.3a505a12-509d-4f34-af76-47f0ea441f72';
const APPLE_TV_LINK = 'https://itunes.apple.com/jp/movie/%E3%82%AA-%E3%83%A0%E3%83%8B-%E5%AD%97%E5%B9%95%E7%89%88/id1691528206?uo=4';
const YOUTUBE_LINK = 'https://youtu.be/cflWf3XKeFI?si=pZ-WkU6w5wYkh4Wq';
const YOUTUBE_DOMAINS = ['https://youtu.be/', 'youtube.com/watch'];
const PRIMARY_LINK = { aff: AFF_LINK, amazon: AMAZON_LINK, apple: APPLE_TV_LINK, youtube: YOUTUBE_LINK };
const FORBIDDEN_NETFLIX_LINK = 'https://www.netflix.com/';
/* 2026-11-24 站长问「英文版那么多无版权，奈飞也没有吗」。JustWatch 美区实查：多数剧有 Netflix 正版。
   英文页允许挂 Netflix 官方条目深链（title/ID），仍禁止 netflix.com 首页/搜索页这类泛链；中文源一律禁。 */
const NETFLIX_TITLE_PREFIX = 'https://www.netflix.com/title/';
/* 2026-11-24 站长要求日韩也挂 Netflix、中文按港区（港区没有再看台湾）。
   JustWatch 港/台/日/韩/美五区逐条实查：title ID 跨区通用，链接统一 netflix.com/title/ID。
   zh 按港区（与台湾一致）；jp 按日区（星你/拥抱月亮/大长今/死亡游戏/鬼神/恩东啊/朋友们无 Netflix）；
   ko 按韩区（拥抱月亮/大长今等无）；en 沿用美区。查不到的区一律禁挂，aff 红字全部保留。 */
const NETFLIX_TITLE_ID = {
  'zh/drama1': '81682438', 'zh/drama3': '80025266', 'zh/drama4': '81033650',
  'zh/drama6': '80031790', 'zh/drama7': '81422314', 'zh/drama8': '81243996', 'zh/drama9': '82024852',
  'en/drama1': '81682438', 'en/drama6': '80031790', 'en/drama7': '81422314',
  'en/drama8': '81243996', 'en/drama9': '82024852',
  'jp/drama1': '81682438', 'jp/drama4': '81033650', 'jp/drama7': '81422314',
  'jp/drama8': '81243996', 'jp/drama9': '82024852',
  'ko/drama1': '81682438', 'ko/drama3': '80025266', 'ko/drama4': '81033650',
  'ko/drama7': '81422314', 'ko/drama8': '81243996', 'ko/drama9': '82024852'
};
const NETFLIX_LABEL = {
  zh: '在 Netflix 观看（订阅）', en: 'Watch on Netflix (subscription)',
  jp: 'Netflix で見る（定額制）', ko: 'Netflix에서 보기 (정액제)'
};
/* 外文页按钮文案禁止直译中文语境的「港区」划分；中文源保留原始口径不受此限 */
const FORBIDDEN_REGION_CALQUES = ['Hong Kong, China', '중국 홍콩', '香港地区', '香港地域'];
const PICKS_HEAD = {
  zh: '站长推荐', en: 'Picks from the webmaster', jp: '運営のおすすめ', ko: '운영자 추천'
};
/* 站长推荐二级菜单（2026-11-22）：四语各三项，下拉只在桌面出现，手机端不做。
   K-pop / 游戏先占位，等站长写入数据；标题下的分类名必须与菜单对应。 */
const NAV_SUB = {
  zh: { drama: '看韩剧', kpop: '听K-pop', game: '玩游戏' },
  en: { drama: 'Watch K-dramas', kpop: 'Listen to K-pop', game: 'Play games' },
  jp: { drama: '韓国ドラマを見る', kpop: 'K-popを聴く', game: 'ゲームを遊ぶ' },
  ko: { drama: '한국 드라마 보기', kpop: 'K-pop 듣기', game: '게임 하기' }
};
const COMING_NOTE = {
  zh: '正在开发中，请等待站长写入数据',
  en: 'Under construction. The webmaster is preparing the content.',
  jp: '準備中です。運営者がデータを入力するのをお待ちください。',
  ko: '준비 중입니다. 운영자가 데이터를 입력할 때까지 기다려 주세요.'
};
const NAV_SUB_HREFS = ['#picks-dramas', '#picks-kpop', '#picks-pc-games'];
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* 韩国音乐专区已撤（站长 2026-11-22）：四语一律不得再出现占位卡与占位文案。 */
const MUSIC_FORBIDDEN = [
  'picks.music.label', 'picks.music.soon', 'pick-card-soon', 'pick-placeholder',
  '此专区正在建设中，请稍安勿躁', 'This section is under construction. Please stay tuned.',
  'このコーナーは準備中です。しばらくお待ちください。', '이 코너는 준비 중입니다. 조금만 기다려 주세요.'
];
/* 整块 actions：zh=aff（港区）、en=Prime Video（美区）、jp=Apple TV（日区）、ko=YouTube（韩区）；
   primary 逐语锁定。红字 note：中文保留原文；en/jp/ko 逐语本地化为「中国大陆用户点这里访问 Netflix」，
   「这里」必须指向 aff 入口（AFF_LINK），不得回退成旧版机翻的「搜索片名观看」。 */
const PICKS_ACTIONS_EXPECT = {
  zh: { primary: 'aff', note: '到 Netflix 搜索片名观看 · 请支持正版' },
  en: { primary: 'amazon', note: 'Viewers in mainland China: <a href="' + AFF_LINK + '" target="_blank" rel="noopener noreferrer">click here</a> to access Netflix.' },
  jp: { primary: 'apple', note: '中国大陸からご覧になる場合は、<a href="' + AFF_LINK + '" target="_blank" rel="noopener noreferrer">こちら</a>から Netflix にアクセスできます。' },
  ko: { primary: 'youtube', note: '중국 본토 시청자는 <a href="' + AFF_LINK + '" target="_blank" rel="noopener noreferrer">여기</a>를 눌러 Netflix에 접속하세요.' }
};
/* 按钮文案逐语本地化锁定：不直译、不机翻、不漂移 */
const PICKS_PRIMARY_LABEL = {
  zh: '中国香港地区：通过此链接开通（邀请码 5rfpUarUEd）',
  en: 'Rent or buy on Prime Video',
  jp: 'Apple TV でレンタル・購入する · 正版で応援しましょう',
  ko: 'YouTube에서 대여하거나 구매하기 · 정식 서비스로 응원해 주세요'
};
const PICKS_ZH_NODES = {
  'picks.head': '站长推荐',
  'picks.film.title': '《哦！文姬》'
};
/* 推荐必须带预览图（站长 2026-11-22 规则）：本地图片 + 四语 alt + 来源说明。 */
const PICKS_IMAGE = 'assets/oh-my-gran-poster.jpg';
const PICKS_CREDIT = {
  zh: '海报：《哦！文姬》官方宣传物料（经 GoldPoster 收录）',
  en: 'Poster for Oh! My Gran (official promotional material, via GoldPoster)',
  jp: '『오! 문희』のポスター（公式宣伝素材・GoldPoster 掲載）',
  ko: '『오! 문희』 포스터(공식 홍보 자료, GoldPoster 수록)'
};

/* 音乐区（2026-11-22 站长指令）：第一首《请开门》(문을 여시오, 2013)。
   MV 通道按区：中文页 = QQ 音乐（大陆），外文页 = YouTube（其他地区）。
   QQ 音乐 MV 链接仅中文页可见；YouTube 链接仅外文页可见，中文源整页禁 YouTube。
   音乐卡与剧集卡同一套标准两栏结构（排版规则锁死）。 */
const MUSIC_SLUGS = ['music1'];
const MUSIC_YEAR = { music1: '2013' };
const MUSIC_IMAGE = 'assets/door-mv-thumb.jpg';
const QQ_MV_LINK = 'https://y.qq.com/n/m/detail/mv/index.html?vid=f0015hf64je';
const YT_MV_LINK_SHORT = 'https://youtu.be/GQ53MTOVS04';
const YT_MV_LINK_WATCH = 'https://www.youtube.com/watch?v=GQ53MTOVS04';
/* 注：verify 既有断言「中文页禁 YouTube 域」继续生效——中文页 MV 主按钮只挂 QQ 音乐，
   YouTube 通道只在外文页出现（ytnote 行），中文页该行由构建时替换为纯文字说明。 */
const MUSIC_CREDIT = {
  zh: 'MV 官方缩略图：任昌丁、金昌烈《请开门》（NH EMG 官方频道）',
  en: 'Official MV thumbnail: Lim Chang-jung & Kim Chang-ryeol "Open the Door" (문을 여시오, NH EMG official channel)',
  jp: '公式 MV サムネイル：イム・チャンジョン＆キム・チャンリョル「문을 여시오」（NH EMG 公式チャンネル）',
  ko: '공식 MV 썸네일: 임창정 & 김창렬 『문을 여시오』 (NH EMG 공식 채널)'
};
/* 外文页 ytnote 行（逐语锁定，防机翻回退） */
const MUSIC_YTNOTE = {
  en: 'Viewers outside mainland China: <a href="' + YT_MV_LINK_SHORT + '" target="_blank" rel="noopener noreferrer">watch the "Open the Door" MV on YouTube</a>.',
  jp: '中国大陸以外からご覧の方は、<a href="' + YT_MV_LINK_SHORT + '" target="_blank" rel="noopener noreferrer">こちらから YouTube で「문을 여시오」の MV をご覧ください</a>。',
  ko: '중국 본토 외부 시청자는 <a href="' + YT_MV_LINK_SHORT + '" target="_blank" rel="noopener noreferrer">여기를 눌러 YouTube에서 『문을 여시오』 MV를 보세요</a>.'
};

/* 游戏区（2026-11-23 站长指令）：端游 4 款（Steam 商店页链接）+ 手游 2 款
   （棕色尘埃 / NIKKE，各挂 App Store + Google Play + QooApp）。
   端游/手游拆成两个锚点两个子标题；六张卡全部沿用剧集卡标准两栏结构。 */
/* K-POP 小众音乐卡（多卡）：中文页挂 QQ/网易云，外文页挂 YouTube。
   与单卡 music1 分开校验，避免动 music1 的既有断言。 */
const KPOP_SLUGS = ['minty', 'seoeve', 'ussoboy', 'sospecial', 'milksong', 'jjarappappa', 'misskorea', 'study'];
const KPOP_IMAGE = {
  minty: 'assets/mv-minty.jpg', seoeve: 'assets/mv-seoeve.jpg', ussoboy: 'assets/mv-ussoboy.jpg',
  sospecial: 'assets/mv-soSpecial.jpg', milksong: 'assets/mv-milksong.jpg', jjarappappa: 'assets/mv-jjarappappa.jpg',
  misskorea: 'assets/mv-misskorea.jpg', study: 'assets/mv-study.jpg'
};
const KPOP_ZH_LINK = {
  minty: 'music.163.com/#/mv?id=10894437',
  seoeve: 'y.qq.com/n/m/detail/mv/index.html?vid=004AWNv33sYmI4',
  ussoboy: 'music.163.com/#/mv?id=34726420',
  sospecial: 'y.qq.com/n/m/detail/mv/index.html?vid=s00256y3tzt',
  milksong: 'y.qq.com/n/m/detail/mv/index.html?vid=g0013sfftjs',
  jjarappappa: 'y.qq.com/n/m/detail/mv/index.html?vid=o00204lrds8',
  misskorea: 'i.y.qq.com/v8/playsong.html?songid=204137216', study: 'y.qq.com/n/m/detail/mv/index.html?vid=q0012sypyu1'
};
const KPOP_YT_ID = {
  minty: '6rzemizJoNQ', seoeve: 'dd9yeNZXWXg', ussoboy: 'CD7J5oCKH2Q',
  sospecial: 'pzP_w8rpxHA', milksong: 'bpGZSJPq3pk', jjarappappa: 'clgGG_qWFww',
  misskorea: 'iB0FLshLbLk', study: 'rS_k1DhhDy4'
};

/* 新增两首歌的发行日期（精确到日，防「只比年份」把同年顺序排错）。 */
const MUSIC_DATE = { seoeve:'2024', minty:'2019', sospecial:'2018',
  ussoboy:'2017-11-16', misskorea:'2017-09-20', music1:'2013-10-30',
  study:'2013-07-11', jjarappappa:'2012', milksong:'2004' };
const MUSIC_DATE_TEXT = { misskorea:'2017-09-20', study:'2013-07-11' };
const MUSIC_DISAMBIG = { zh:'不是李孝利', en:'not Lee Hyori',
  jp:'イ・ヒョリではありません', ko:'이효리가 아닙니다' };
/* 站长红线：本站不推北韩相关资源，四语页面都不给这类线索。 */
const FORBIDDEN_DPRK = ['북한','北韓','北朝鲜','DPRK','North Korea','조선민주주의인민공화국'];

const PC_GAME_SLUGS = ['sololeveling', 'stellarblade', 'liesofp', 'blessunleashed', 'eternalreturn', 'pubg'];
const MOBILE_GAME_SLUGS = ['browndust', 'nikke'];
const GAME_SLUGS = [...PC_GAME_SLUGS, ...MOBILE_GAME_SLUGS];
const GAME_IMAGE = {
  sololeveling: 'assets/sololeveling-poster.jpg',
  stellarblade: 'assets/stellarblade-poster.jpg',
  liesofp: 'assets/liesofp-poster.jpg',
  stellarblade: 'assets/stellarblade-poster.jpg',
  pubg: 'assets/pubg-poster.jpg',
  blessunleashed: 'assets/blessunleashed-poster.jpg',
  eternalreturn: 'assets/eternalreturn-poster.jpg',
  browndust: 'assets/browndust-poster.jpg',
  nikke: 'assets/nikke-poster.jpg'
};
/* 端游唯一商店 = Steam；手游三通道必须齐全（App Store / Google Play / QooApp） */
const STEAM_LINK = 'store.steampowered.com/app/';
/* 端游发行年份（按 Steam 商店页 release date），用于校验「最新靠前」的排序 */
const PC_GAME_YEAR = { sololeveling: 2025, stellarblade: 2024, liesofp: 2023, rbeat: 2022,
  blessunleashed: 2021, eternalreturn: 2020, pubg: 2017, bladeandsoul: 2012, kart: 2006, audition: 2005, lineage2: 2003, bnb: 2003 };

/* 2026-11-24 站长新增两款韩系端游：中文挂台服官网、英文挂美服/国际服。
   剑灵日服原版与 NEO 于 2026-03-11 停服，日语改挂台服；天堂2未找到活跃日服，日语同样挂台服；
   韩语一律挂韩服官网。两作均无主机版，禁止出现 PS/Xbox/Steam 按钮。 */
const PC_OFFICIAL_SLUGS = ['bladeandsoul', 'lineage2'];
const PC_OFFICIAL_LINK = {
  bladeandsoul: {
    zh: 'https://tw.ncsoft.com/bns/', en: 'https://www.bladeandsoul.com/',
    jp: 'https://tw.ncsoft.com/bns/', ko: 'https://bns.plaync.com/'
  },
  lineage2: {
    zh: 'https://tw.ncsoft.com/lineage2/', en: 'https://www.lineage2.com/',
    jp: 'https://tw.ncsoft.com/lineage2/', ko: 'https://lineage2.plaync.com/'
  }
};
/* 天堂2(2003-10-01) 晚于泡泡堂(2003-04)，同年也要按日排序 */
const PC_GAME_DATE = { lineage2: '2003-10-01', bnb: '2003-04-01' };
/* 站长 2026-11-24 定：视频 / 音乐 / 游戏三区一律按上映发行时间降序（最新在前），写死进校验。
   每区按 label 节点在 DOM 出现顺序比对年份，缺年/倒序/串位一律判红。 */
const SORT_RULES = {
  drama: { grid: 'picks-dramas',
    order: ['drama9','drama1','drama10','film','drama7','drama8','drama11','drama13',
            'drama2','drama12','drama3','drama4','drama6','drama5'],
    year: { drama9:2025, drama1:2023, drama10:2023, film:2020, drama7:2020, drama8:2020,
            drama11:2016, drama13:2016, drama2:2015, drama12:2015, drama3:2013,
            drama4:2013, drama6:2012, drama5:2003 } },
  music: { grid: 'picks-kpop',
    order: ['seoeve','minty','sospecial','ussoboy','misskorea','music1','study','jjarappappa','milksong'],
    year: { seoeve:2024, minty:2019, sospecial:2018, ussoboy:2017, misskorea:2017,
            music1:2013, study:2013, jjarappappa:2012, milksong:2004 },
    date: MUSIC_DATE },
  pc: { grid: 'picks-pc-games',
    order: ['sololeveling','stellarblade','liesofp','rbeat','blessunleashed',
            'eternalreturn','pubg','bladeandsoul','kart','audition','lineage2','bnb'],
    year: PC_GAME_YEAR,
    date: PC_GAME_DATE },
  mobile: { grid: 'picks-mobile-games', order: ['browndust','nikke'],
    year: { browndust:2023, nikke:2022 } }
};

/* 端游主机商店地区规则（站长 2026-11-23 定为长期规则）：
   zh=港区 / en=美区 / jp=日区 / ko=韩区。PS 用 concept 页（ID 跨区通用），
   Xbox 用商品 ID（跨区通用）；PS 前缀全小写、Xbox 首字母大写，写错即 404。 */
const REGION_LOCALE = {
  zh: { ps: 'zh-hant-hk', xb: 'zh-HK' },
  en: { ps: 'en-us', xb: 'en-US' },
  jp: { ps: 'ja-jp', xb: 'ja-JP' },
  ko: { ps: 'ko-kr', xb: 'ko-KR' }
};
/* null = 该平台无可用版本，不得挂按钮（剑星无 Xbox；神佑释放主机服 2022 停服；永恒轮回 PC only） */
const PC_PLATFORM = {
  sololeveling:   { ps: '10018442', xb: 'solo-levelingarise-overdrive/9MVHCQ7CJX01' },
  stellarblade:   { ps: '10006891', xb: null },
  liesofp:        { ps: '10006052', xb: 'lies-of-p/9PCM4CMTPPGC' },
  blessunleashed: { ps: null, xb: null },
  eternalreturn:  { ps: null, xb: null },
  pubg:           { ps: '232860', xb: 'pubg-battlegrounds/C0MN5DN8KR3F' }
};
const PS_BASE = 'https://store.playstation.com/';
const XB_BASE = 'https://www.xbox.com/';
const MOBILE_LINKS = ['apps.apple.com/', 'play.google.com/store/apps/details', 'qoo-app.com/'];

/* 链游平台（2026-11-23 站长指令）：手游下方第三个游戏子分类，只推荐平台不推荐游戏。
   四个平台各一张标准两栏卡、单个官网按钮；韩语版 note 必须写明南韩(남한) IP 限制 NFT。 */
const CHAIN_SLUGS = ['one', 'wemix', 'msu', 'planetarium'];
const CHAIN_IMAGE = {
  one: 'assets/one-chain.jpg',
  wemix: 'assets/wemix-platform.jpg',
  msu: 'assets/msu-platform.jpg',
  planetarium: 'assets/planetarium-chain.jpg'
};
const CHAIN_LINK = {
  one: 'https://to.nexus/',
  wemix: 'https://wemixplay.com/',
  msu: 'https://msu.io/',
  planetarium: 'https://www.planetariumlabs.com/'
};
const CHAIN_KO_NFT_NOTE = '남한 IP에서는 NFT 접근이 제한될 수 있습니다.';
const CHAIN_CREDIT_ZH = '站长推荐，内容由 AI 生成';
const CHAIN_RISK_ZH = '区块链项目与虚拟资产价格波动剧烈';
const CHAIN_RISK_CSS = '.picks-chain-risk';
/* 链游健康度标记（2026-11-23 站长指令）：撤 Yooldo 与占位卡后剩四张，
   按运营体检结论打标——MSU / Planetarium = 健康，ONE / WEMIX = 尚可。
   四语逐语锁定，图例说明评级口径。 */
const CHAIN_HEALTH = { one: 'fair', wemix: 'fair', msu: 'good', planetarium: 'good' };
const CHAIN_HEALTH_ZH = { good: '健康', fair: '尚可' };
const CHAIN_HEALTH_CSS = ['.pick-health-good', '.pick-health-fair'];
const CHAIN_LEGEND_ZH = '标记说明：健康＝运营与数据都在增长';
/* 逐语锁定：健康徽章与图例必须是真正的译文，不能用通用汉字检测——
   日文「健全 / まずまず」本身就是汉字词，会被 CJK 正则误判。 */
const CHAIN_HEALTH_EXPECT = {
  en: { good: 'Healthy', fair: 'Fair' },
  jp: { good: '健全', fair: 'まずまず' },
  ko: { good: '양호', fair: '보통' }
};
const CHAIN_LEGEND_EXPECT = {
  en: 'Badge key: Healthy = operations and metrics are growing',
  jp: 'バッジの意味：健全＝運用と指標が伸びている',
  ko: '배지 기준: 양호 = 운영과 지표가 성장 중'
};

/* 加速器推荐（2026-11-23 站长指令）：链游区下方两个工具卡，带邀请码/口令。
   外星仔 = 50 小时萌新卡（口令 574567，官网 et001.com）；
   给梨 = 120 小时 SVIP（邀请码 9ydA8H，专属 fission 链接）。 */
const ACC_SLUGS = ['etalien', 'geili'];
const ACC_IMAGE = { etalien: 'assets/etalien-accelerator.jpg', geili: 'assets/geili-accelerator.jpg' };
const ACC_LINK = {
  etalien: 'https://www.et001.com/',
  geili: 'https://www.geilijiasu.com/fission/accept?inviteCode=9ydA8H'
};
const ACC_CODE = { etalien: '574567', geili: '9ydA8H' };

/* 剧集时间线（2026-11-22 站长规则：新增推荐按年份倒序，越近越靠前）。
   五部剧按年份：2023 车贞淑医生 / 2015 无理的前进 / 2013 来自星星的你 /
   2013 继承者们 / 2003 大长今。每部本地竖版海报 + 四语 alt/来源说明。 */
const DRAMA_SLUGS = ['drama1', 'drama2', 'drama3', 'drama4', 'drama5'];
const DRAMA_IMAGE = {
  drama1: 'assets/doctor-cha-poster.jpg',
  drama2: 'assets/sassy-go-go-poster.jpg',
  drama3: 'assets/my-love-from-star-poster.jpg',
  drama4: 'assets/the-heirs-poster.jpg',
  drama5: 'assets/dae-jang-geum-poster.jpg'
};
const DRAMA_YEAR = { drama1: '2023', drama2: '2015', drama3: '2013', drama4: '2013', drama5: '2003' };
/* 按区实查后的主按钮（2026-11-22）：无租买渠道的区只有红字，不挂购买按钮。
   en/drama4 美区 Amazon 买断；jp/drama3 与 jp/drama4 日区 Amazon 租买；其余无。
   中文五部统一 aff 港区口径；韩区五部均无租买 → 只有红字。 */
const DRAMA_AMAZON_US = 'https://watch.amazon.com/detail?gti=amzn1.dv.gti.48bbb40c-29e6-73ba-eafe-e8d48570412f';
const DRAMA_AMAZON_JP_STAR = 'https://watch.amazon.co.jp/detail?gti=amzn1.dv.gti.70ae1894-d080-80dc-72e9-3739218bb8a0';
const DRAMA_AMAZON_JP_HEIRS = 'https://watch.amazon.co.jp/detail?gti=amzn1.dv.gti.a37f89de-a7ea-4c5f-9188-2ba82f552e4a';
/* 期望的 featured 按钮链接：键为 lang/slug，缺省为 null（只允许红字，不许主按钮） */
const DRAMA_PRIMARY = {
  'zh/drama1': AFF_LINK, 'zh/drama2': AFF_LINK, 'zh/drama3': AFF_LINK,
  'zh/drama4': AFF_LINK, 'zh/drama5': AFF_LINK,
  'en/drama4': DRAMA_AMAZON_US,
  'jp/drama3': DRAMA_AMAZON_JP_STAR, 'jp/drama4': DRAMA_AMAZON_JP_HEIRS
};
const DRAMA_NOTE = {
  zh: '到 Netflix 搜索片名观看 · 请支持正版',
  en: 'Viewers in mainland China: <a href="' + AFF_LINK + '" target="_blank" rel="noopener noreferrer">click here</a> to access Netflix.',
  jp: '中国大陸からご覧になる場合は、<a href="https://nfshare.cn/?sid=5rfpUarUEd" target="_blank" rel="noopener noreferrer">こちら</a>から Netflix にアクセスできます。',
  ko: '중국 본토 시청자는 <a href="https://nfshare.cn/?sid=5rfpUarUEd" target="_blank" rel="noopener noreferrer">여기</a>를 눌러 Netflix에 접속하세요.'
};
/* 订阅制渠道（2026-11-22 站长追问「只有订阅制，既然能买正版，为什么不挂」）：
   按 JustWatch 逐区实查（apis.justwatch.com/graphql，country = US / JP / KR，2026-11-22 取数）。
   只挂**非 Netflix** 的持牌订阅平台——Netflix 的入口就是那条红字 AFF，不许再挂 netflix.com 直链。
   表里没有的 lang/slug（该区只有 Netflix，或查无订阅渠道）一律禁挂订阅按钮。 */
const DRAMA_SUB = {
  'en/drama2': {
    url: 'https://watch.amazon.com/detail?gti=amzn1.dv.gti.7498e914-8cdf-4f9c-ad95-4342e43e3c90',
    label: 'Watch on Kocowa via Prime Video (subscription)'
  },
  /* 2026-11-24 站长指出三条 Viki 为死链（页面打不开/内容不可用）。
     按 JustWatch 美区逐条实查并真浏览器验证：星你 → Kocowa via Prime Video；
     继承者们 → Tubi 免费带广告（美区无 Viki 以外的订阅平台，已有 Prime 购买按钮）；
     大长今 → Kocowa via Prime Video。三条原文案「Watch on Viki (subscription)」一并改。 */
  'en/drama3': { url: 'https://watch.amazon.com/detail?gti=amzn1.dv.gti.b8608d49-3ed5-4ed9-9655-fbd806b49fce', label: 'Watch on Kocowa via Prime Video (subscription)' },
  'en/drama4': { url: 'https://tubitv.com/series/300001259/the-heirs', label: 'Watch free on Tubi (with ads)' },
  'en/drama5': { url: 'https://watch.amazon.com/detail?gti=amzn1.dv.gti.e409f09d-a4d5-4c1a-b092-1f58faa85fb4', label: 'Watch on Kocowa via Prime Video (subscription)' },
  /* Netflix 订阅按钮统一由 NETFLIX_TITLE_ID 管理（四语按区），不再列入 DRAMA_SUB。 */
  'jp/drama3': { url: 'https://video.unext.jp/episode/SID0003058/ED00073535', label: 'U-NEXT で見る（定額制）' },
  'jp/drama4': { url: 'https://video.unext.jp/episode/SID0017711/ED00046626', label: 'U-NEXT で見る（定額制）' },
  'jp/drama5': { url: 'https://video.unext.jp/episode/SID0020374/ED00094308', label: 'U-NEXT で見る（定額制）' },
  'ko/drama1': { url: 'https://www.tving.com/contents/P001710496', label: 'TVING에서 보기 (정액제)' },
  'ko/drama2': {
    url: 'https://www.wavve.com/player/vod?contentid=K02_PS-2015161154-01-000.1',
    label: 'wavve에서 보기 (정액제)'
  },
  'ko/drama3': { url: 'https://www.tving.com/contents/P001446333', label: 'TVING에서 보기 (정액제)' },
  'ko/drama4': { url: 'https://watcha.com/contents/tRW31aR', label: '왓챠에서 보기 (정액제)' },
  'ko/drama5': { url: 'https://www.tving.com/contents/P001790390', label: 'TVING에서 보기 (정액제)' }
};
/* 英文区非 Netflix 正版（2026-11-24 JustWatch 美区实查），drama10/11/13 不在 DRAMA_SLUGS 内，单独写死。 */
const DRAMA_SUB_EXTRA = {
  'en/drama10': { url: 'https://watch.amazon.com/detail?gti=amzn1.dv.gti.a3b03bc3-0b7d-49e5-8eb1-6d80ac89dd13', label: 'Watch on Prime Video (subscription)' },
  'en/drama11': { url: 'https://tubitv.com/series/300009794/bring-it-on-ghost-subbed', label: 'Watch free on Tubi (with ads)' },
  'en/drama13': { url: 'https://tubitv.com/series/300010014/dear-my-friends', label: 'Watch free on Tubi (with ads)' }
};
/* 2026-11-24 站长：中文按港区、港区没有退台湾区；英/日/韩按本区，正规正版订阅平台都可挂。
   给原本无订阅按钮但本区有正版的卡补齐（JustWatch 五区实查 + URL 逐条 curl 200 验证，
   排除 HBO Max 404 / Viki 死链 / Tencent onelink 跳转）。AFF 全部保留。写死防回归。 */
const LICENSED_SUB_EXTRA = {
  'zh/drama10': { url: 'https://app.primevideo.com/detail?gti=amzn1.dv.gti.a3b03bc3-0b7d-49e5-8eb1-6d80ac89dd13', label: '在 Prime Video 观看（订阅）' },
  'zh/film': { url: 'https://www.catchplay.com/tw/video/3ec4e52d-46b6-4b5e-aca4-f06ff0b46d45', label: '在 Catchplay 观看（订阅·台湾）' },
  'jp/drama6': { url: 'https://video.unext.jp/episode/SID0003538/ED00032550', label: 'U-NEXT で見る（定額制）' },
  'jp/drama10': { url: 'https://watch.amazon.co.jp/detail?gti=amzn1.dv.gti.a3b03bc3-0b7d-49e5-8eb1-6d80ac89dd13', label: 'Prime Video で見る（定額制）' },
  'jp/drama11': { url: 'https://watch.amazon.co.jp/detail?gti=amzn1.dv.gti.63df4c98-3660-43f4-8225-5159e6364658', label: 'Prime Video で見る（定額制）' },
  'jp/drama12': { url: 'https://video.unext.jp/episode/SID0026887/ED00139519', label: 'U-NEXT で見る（定額制）' },
  'jp/drama13': { url: 'https://watch.amazon.co.jp/detail?gti=amzn1.dv.gti.bf528ebf-b037-45b2-8287-a86a55defa5e', label: 'Prime Video で見る（定額制）' },
  'ko/drama6': { url: 'https://www.wavve.com/player/vod?contentid=M_EP201611284940.1', label: 'wavve에서 보기 (정액제)' },
  'ko/drama10': { url: 'https://www.wavve.com/player/vod?contentid=J4401_J44000000012_01_0001.1', label: 'wavve에서 보기 (정액제)' },
  'ko/drama11': { url: 'https://www.tving.com/contents/P000298133', label: 'TVING에서 보기 (정액제)' },
  'ko/drama12': { url: 'https://www.wavve.com/player/vod?contentid=J3801_J38000000154_01_0001.1', label: 'wavve에서 보기 (정액제)' },
  'ko/drama13': { url: 'https://www.tving.com/contents/P000275500', label: 'TVING에서 보기 (정액제)' },
};

/* 订阅渠道链接前缀白名单：境外持牌平台；netflix.com 与盗版域都不在内 */
/* 2026-11-24 站长：视频区逐条检查，查不到可用正版就写提示，不许挂死链。
   四语提示文案逐语手写，含义一致：本站未检索到正版资源，可能已下架。 */
const SUB_UNAVAILABLE = {
  zh: '本站未检索到正版资源，可能已下架。',
  en: 'Where no watch button is listed, no licensed source was found for this title and it may have been delisted.',
  jp: '視聴ボタンのない作品は、正版の配信元が確認できず、配信終了の可能性があります。',
  ko: '시청 버튼이 없는 작품은 정식 스트리밍 서비스를 확인하지 못했으며 서비스가 종료되었을 수 있습니다.'
};
/* 已确认失效的订阅平台：Viki 三条剧集页实测打不开，四语一律禁挂。 */
const DEAD_SUB_PLATFORMS = ['www.viki.com/tv/'];
/* 劲舞团服务器入口（2026-11-24 站长指定 + 外网核实）：
   zh=大陆国服；en/jp=台服（日服 X-BEAT 2016 关服）；ko=韩服 audition.hanbiton.com（仍在更新）。 */
const AUDITION_SERVER = {
  zh: 'https://au.9you.com/',
  en: 'https://landing.mangot5.com/',
  jp: 'https://landing.mangot5.com/',
  ko: 'https://audition.hanbiton.com/'
};
const AUDITION_FOREIGN = ['en', 'jp', 'ko'];
const SUB_DOMAINS = [
  'https://www.viki.com/tv/',
  'https://tubitv.com/series/',
  'https://watch.amazon.com/detail?gti=',
  'https://watch.amazon.co.jp/detail?gti=',
  'https://video.unext.jp/episode/',
  'https://www.tving.com/contents/',
  'https://www.wavve.com/player/vod?contentid=',
  'https://watcha.com/contents/',
  'https://www.netflix.com/title/',
  'https://www.catchplay.com/tw/video/',
  'https://app.primevideo.com/detail?gti='
];
/* SEO（2026-11-22 站长指令：按推荐执行 A+C+D 长尾）。
   title / description 关键词前置、金句后置；旧文艺标题不得回退。
   JSON-LD 逐语一段，inLanguage / url / keywords 必须与对应语言一致。 */
const SEO_TITLE_KEYWORD = {
  zh: '为什么喜欢韩国', en: 'Why I Like Korea',
  jp: '韓国が好きな理由', ko: '한국을 좋아하는 이유'
};
const SEO_DESC_KEYWORD = {
  zh: '为什么喜欢韩国', en: 'Why do people like Korea',
  jp: 'なぜ韓国が好きなのか', ko: '한국을 좋아하는 이유는 무엇일까'
};
const SEO_STALE_TITLE = {
  zh: '哈韩，也要有一个理由 · 这个世界不能没有小猫',
  en: 'Liking Korea Needs a Reason · The World Needs Cats',
  jp: '韓国が好きなら、理由も欲しい · 世界に猫は欠かせない',
  ko: '한국을 좋아하는 데도 이유는 필요하다 · 이 세상엔 고양이가 필요해'
};
const SEO_LD_LANG = { zh: 'zh-CN', en: 'en', jp: 'ja', ko: 'ko' };
const SEO_SITEMAP_URLS = [
  SITE, SITE + 'en/', SITE + 'jp/', SITE + 'ko/'
];
const SEO_HREFLANG = ['zh', 'en', 'ja', 'ko', 'x-default'];

/* ---------- 影片档案（站长 2026-11-24）：光州事件必须写明，只挂外网来源 ---------- */
const FILM_SECTION = '<section class="section archive film-record" id="film-note">';
const FILM_SOURCE_LINKS = [
  'https://en.wikipedia.org/wiki/A_Taxi_Driver',
  'https://ko.wikipedia.org/wiki/%ED%83%9D%EC%8B%9C%EC%9A%B4%EC%A0%84%EC%82%AC_(%EC%98%81%ED%99%94)',
  'https://en.wikipedia.org/wiki/Gwangju_Uprising',
  'https://ko.wikipedia.org/wiki/5%C2%B718_%EA%B4%91%EC%A3%BC_%EB%AF%BC%EC%A3%BC%ED%99%94_%EC%9A%B4%EB%8F%99',
  'https://ja.wikipedia.org/wiki/%E5%85%89%E5%B7%9E%E4%BA%8B%E4%BB%B6'
];
const FILM_MARKERS = {
  zh: ['光州事件', '1980 年 5 月 18 日', '2,500', 'Kim Sa-bok', '698,090'],
  en: ['Gwangju Uprising', '18 to 27 May 1980', '2,500', 'Kim Sa-bok', '698,090'],
  jp: ['光州事件', '1980年5月18日', '2,500', 'Kim Sa-bok', '698,090'],
  ko: ['5·18 광주 민주화 운동', '1980년 5월 18일', '2,500', 'Kim Sa-bok', '698,090']
};
const FILM_KEYS = [
  'nav.film', 'film.kicker', 'film.head', 'film.intro',
  'film.fact1.k', 'film.fact1.v', 'film.fact2.k', 'film.fact2.v',
  'film.fact3.k', 'film.fact3.v', 'film.history.head', 'film.history.p1',
  'film.history.p2', 'film.caveat.head', 'film.caveat.p1',
  'film.sourcesLabel', 'film.src1', 'film.src2', 'film.src3', 'film.src4',
  'film.src5', 'film.sourcesNote'
];
/* ---------- extraction helpers ---------- */
function extractNodes(html) {
  const out = {};
  const re = /<([a-zA-Z0-9]+)\b([^>]*\bdata-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(html))) out[m[3]] = m[4];
  return out;
}

function extractAttrs(html) {
  const out = {};
  const re = /<([a-zA-Z0-9]+)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[2];
    for (const a of attrs.matchAll(/data-i18n-([a-z-]+)="([^"]+)"/g)) {
      if (!ATTR_TARGETS.has(a[1])) continue;
      const found = attrs.match(new RegExp('(?:^|\\s)' + a[1] + '="([^"]*)"'));
      out[a[2]] = found ? found[1] : null;
    }
  }
  return out;
}

function extractTitle(html) {
  const m = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/);
  return m ? m[1] : '';
}

function extractJsonLd(html) {
  const m = html.match(/<script type="application\/ld\+json" data-i18n="meta\.jsonld">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (e) { return { __parseError: true }; }
}

function assetRefs(html) {
  return [...html.matchAll(/\b(?:href|src)="([^"]*(?:assets\/|favicon\.svg)[^"]*)"/g)].map(m => m[1]);
}

function shortLabels(html) {
  const out = {};
  const re = /<a data-lang-link="([a-z]+)"[^>]*>[\s\S]*?<span class="lang-short"([^>]*)>([^<]*)<\/span>/g;
  let m;
  while ((m = re.exec(html))) out[m[1]] = { label: m[3], attrs: m[2] };
  return out;
}

function sameKeys(a, b) {
  const x = Object.keys(a).sort().join('|');
  const y = Object.keys(b).sort().join('|');
  return x === y;
}

/* ---------- pure verification ---------- */

/* 官网直挂型端游（剑灵 / 天堂2）四语校验：中文台服、英文美服、日语台服（日服已停）、韩语韩服；
   图片引用、四语节点、地区串链、主机/Steam 按钮全锁。 */
function checkOfficialPCGames(state, errors) {
  const keys = ['label','title','desc','actions','note','imageCredit'];
  for (const slug of PC_OFFICIAL_SLUGS) {
    const link = PC_OFFICIAL_LINK[slug];
    if (!state.officialGameImages[slug]) errors.push('official pc: poster missing -> ' + slug);
    const zhNodes = extractNodes(state.source);
    if (!assetRefs(state.source).includes('assets/' + slug + '-poster.jpg'))
      errors.push('zh: official pc poster not referenced -> ' + slug);
    for (const key of keys) {
      if (!(zhNodes['picks.' + slug + '.' + key] || '').length)
        errors.push('zh: official pc missing key -> ' + slug + '.' + key);
    }
    const zhActions = zhNodes['picks.' + slug + '.actions'] || '';
    if (!zhActions.includes(link.zh)) errors.push('zh: ' + slug + ' must link Taiwan official site');
    if (/store\.steampowered|store\.playstation|xbox\.com/.test(zhActions))
      errors.push('zh: ' + slug + ' must not carry Steam/console buttons');
    for (const lang of LANGS) {
      const page = state.pages[lang] || '';
      const nodes = extractNodes(page);
      if (!assetRefs(page).includes('../assets/' + slug + '-poster.jpg'))
        errors.push(lang + ': official pc poster not referenced -> ' + slug);
      for (const key of keys) {
        const value = state.dict[lang].html['picks.' + slug + '.' + key];
        if (!value) errors.push(lang + ': official pc key missing -> ' + slug + '.' + key);
        else if (!(nodes['picks.' + slug + '.' + key] || '').includes(value))
          errors.push(lang + ': official pc text not rendered -> ' + slug + '.' + key);
      }
      const alt = state.dict[lang].attr['picks.' + slug + '.imageAlt'];
      if (!alt || !page.includes(alt)) errors.push(lang + ': official pc imageAlt missing -> ' + slug);
      const actions = nodes['picks.' + slug + '.actions'] || '';
      if (!actions.includes(link[lang]))
        errors.push(lang + ': ' + slug + ' wrong official site -> expected ' + link[lang]);
      if (/store\.steampowered|store\.playstation|www\.xbox\.com/.test(actions))
        errors.push(lang + ': ' + slug + ' must not carry Steam/console buttons');
      if (lang === 'en' && (actions.includes(link.zh) || actions.includes(link.ko)))
        errors.push('en: ' + slug + ' leaked TW/KR official site');
      if (lang === 'ko' && (actions.includes(link.zh) || actions.includes(link.en)))
        errors.push('ko: ' + slug + ' leaked TW/NA official site');
      if (lang === 'zh' && (actions.includes(link.en) || actions.includes(link.ko)))
        errors.push('zh: ' + slug + ' leaked NA/KR official site');
    }
  }
}
function verify(state) {
  const errors = [];
  const { source, pages, dict } = state;
  const zhNodes = extractNodes(source);
  const zhAttrs = extractAttrs(source);

  if (Object.keys(zhNodes).length < 60) errors.push('zh: data-i18n extraction found too few nodes (parser broken?)');
  if (Object.keys(zhAttrs).length < 8) errors.push('zh: translated-attribute extraction found too few (parser broken?)');

  /* 1. Chinese source must stay intact */
  for (const marker of CHINESE_MARKERS) {
    if (!source.includes(marker)) errors.push('zh: Chinese copy deleted -> ' + marker);
  }
  if (!source.includes('<html lang="zh-CN">')) errors.push('zh: root lang is not zh-CN');
  if (!source.includes('<body data-lang="zh">')) errors.push('zh: body data-lang is not zh');

  /* 1b. the kept clipping: section, image and its caveats must survive */
  if (!source.includes('<section class="section archive" id="archive">')) {
    errors.push('zh: archive section missing');
  }
  if (!assetRefs(source).includes('assets/clipping-hkcd.jpg')) {
    errors.push('zh: clipping image not referenced');
  }
  if (!state.assetExists) errors.push('archive: clipping image file missing from assets/');
  if (!source.includes('不核实其中细节')) errors.push('zh: archive caveat missing');
  for (const link of ARCHIVE_LINKS) {
    if (!source.includes(link)) errors.push('zh: archived report link missing -> ' + link);
  }
  for (const dom of FORBIDDEN_DEAD_DOMAINS) {
    if (source.includes(dom)) errors.push('zh: 旧死链域名不得复现 -> ' + dom);
  }
  /* 死链口径统一为 404：核查说明不得再出现 504（站长 2026-11-13 指令） */
  if (source.includes('504')) errors.push('zh: 死链核查说明不得出现 504，统一口径为 404');

  /* 1d. 站长推荐：盗版站不得出现，正版引导与邀请码必须逐字保留 */
  if (!source.includes('<section class="section picks" id="picks">')) {
    errors.push('zh: picks section missing');
  }
  /* 中文源整块 actions：aff 邀请码链接 + 红字 Netflix 原文 */
  const zhActions = zhNodes['picks.film.actions'] || '';
  if (!source.includes('data-i18n="picks.film.actions"')) {
    errors.push('zh: picks actions block missing');
  }
  if (!zhActions.includes(AFF_LINK)) errors.push('zh: aff link missing from actions block');
  if (!zhActions.includes('5rfpUarUEd')) errors.push('zh: invitation code missing from actions block');
  if (!zhActions.includes(PICKS_PRIMARY_LABEL.zh)) errors.push('zh: primary button label drift');
  if (!zhActions.includes('中国香港地区')) errors.push('zh: HK-region wording missing');
  if (!zhActions.includes(PICKS_ACTIONS_EXPECT.zh.note)) errors.push('zh: Netflix note wording drift');
  if (!/\.pick-netflix-note\s*\{[^}]*color:\s*#C5221F[^}]*font-weight:\s*700/.test(state.css)) {
    errors.push('zh: Netflix note must be red and bold');
  }
  if (!/\.pick-desc a\s*\{[^}]*font-weight:\s*700[^}]*color:\s*#C5221F/.test(state.css)) {
    errors.push('css: inline links in pick-desc must be red and bold');
  }
  if (!/\.picks-chain-credit\s*\{[^}]*font-weight:\s*700/.test(state.css)) {
    errors.push('css: chain credit note must be bold');
  }
  if (!/\.picks-chain-risk\s*\{[^}]*color:\s*#C5221F[^}]*font-weight:\s*700/.test(state.css)) {
    errors.push('css: chain risk warning must be red and bold');
  }
  if (!/\.picks-chain-risk\s*\{[^}]*border-left:\s*3px solid #C5221F/.test(state.css)) {
    errors.push('css: chain risk warning must carry a red left border');
  }
  for (const cssCls of CHAIN_HEALTH_CSS) {
    if (!state.css.includes(cssCls)) errors.push('css: missing health badge style ' + cssCls);
  }
  if (!state.css.includes('.picks-chain-legend')) errors.push('css: chain legend style missing');
  for (const link of YOUTUBE_DOMAINS) {
    if (source.includes(link)) errors.push('zh: 中文按港区，购买链接 forbidden -> ' + link);
  }
  /* 2026-11-24 中文按港区：允许 Netflix title 条目深链，仍禁首页/搜索页泛链。 */
  for (const m of source.matchAll(/https:\/\/www\.netflix\.com\/[^\s"'<>]*/g)) {
    if (!/^https:\/\/www\.netflix\.com\/title\/\d+$/.test(m[0])) errors.push('zh: Netflix link must be a title deep link -> ' + m[0]);
  }
  for (const dom of FORBIDDEN_PIRATE_DOMAINS) {
    if (source.includes(dom)) errors.push('zh: 盗版站域名不得出现 -> ' + dom);
  }
  for (const [key, expected] of Object.entries(PICKS_ZH_NODES)) {
    if (zhNodes[key] !== expected) errors.push('zh: picks node wrong -> ' + key);
  }
  for (const marker of MUSIC_FORBIDDEN) {
    if (source.includes(marker)) errors.push('zh: withdrawn music section returned -> ' + marker);
  }
  /* 二级菜单 / 占位：中文源锚点、四语文案键位与两栏卡片结构
     （2026-11-23：游戏区已填充，不再检查占位符） */
  if ((zhNodes['picks.subhead'] || '') !== NAV_SUB.zh.drama) {
    errors.push('zh: picks subhead must match the dropdown item');
  }
  if (!source.includes('id="picks-kpop"')) errors.push('zh: picks-kpop music anchor missing');
  if (!source.includes('id="picks-pc-games"')) errors.push('zh: picks-pc-games anchor missing');
  if (!source.includes('id="picks-mobile-games"')) errors.push('zh: picks-mobile-games anchor missing');
  if ((source.match(new RegExp(escRe(NAV_SUB.zh.kpop), 'g')) || []).length !== 2) {
    errors.push('zh: 听K-pop must appear in the dropdown and the music subhead');
  }
  if ((source.match(new RegExp(escRe(NAV_SUB.zh.game), 'g')) || []).length !== 1) {
    errors.push('zh: 玩游戏 must appear in the dropdown');
  }
  /* 文姬卡与五部剧集卡同一套标准两栏：竖版海报在左、文字在右，无任何特殊布局 */
  const filmCard = source.match(/<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.film\.label">([\s\S]*?)<\/article>/);
  if (!filmCard) {
    errors.push('zh: film card missing');
  } else {
    const body = filmCard[1];
    if (!body.includes('<div class="pick-poster-row">')) {
      errors.push('zh: film card must use the same standard two-column row as drama cards');
    }
    if (/pick-poster-row-feature|pick-card-feature|pick-figure-still/.test(body)) {
      errors.push('zh: film card must not carry any special stacked/feature layout');
    }
    if (!body.includes('class="pick-figure pick-figure-poster"') ||
        !body.includes('class="pick-image pick-image-poster"')) {
      errors.push('zh: film card must use the poster figure/image classes like drama cards');
    }
    const figEnd = body.indexOf('</figure>');
    if (figEnd === -1 || figEnd > body.indexOf('pick-poster-body')) {
      errors.push('zh: film poster must sit before the text body (left column)');
    }
  }
  if (!assetRefs(source).includes(PICKS_IMAGE)) errors.push('zh: picks preview image not referenced');
  if (!state.picksImageExists) errors.push('picks: preview image file missing from assets/');
  if (/\.pick-poster-row-feature|pick-figure-still|pick-card-feature/.test(state.css)) {
    errors.push('zh: special film-card layout CSS must be removed');
  }

  /* 1d-3. 音乐卡（2026-11-22 站长指令）：中文页 MV 主按钮 = QQ 音乐，
     结构与剧集卡完全同款（排版规则锁死）；QQ 链接只在中文页，YouTube 链接只在英文页。 */
  const musicCard = source.match(/<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.music1\.label">([\s\S]*?)<\/article>/);
  if (!musicCard) {
    errors.push('zh: music card missing');
  } else {
    const body = musicCard[1];
    if (!body.includes('<div class="pick-poster-row">')) {
      errors.push('zh: music card must use the standard two-column poster row');
    }
    if (/pick-poster-row-feature|pick-card-feature|pick-figure-still/.test(body)) {
      errors.push('zh: music card must not carry any special layout');
    }
    if (!body.includes('class="pick-figure pick-figure-poster"') ||
        !body.includes('class="pick-image pick-image-poster"')) {
      errors.push('zh: music card must reuse the standard poster figure/image classes');
    }
    const figEnd = body.indexOf('</figure>');
    if (figEnd === -1 || figEnd > body.indexOf('pick-poster-body')) {
      errors.push('zh: music poster must sit before the text body (left column)');
    }
  }
  if (!assetRefs(source).includes(MUSIC_IMAGE)) errors.push('zh: music MV thumbnail not referenced');
  if (!state.musicImageExists) errors.push('picks: music MV thumbnail file missing from assets/');
  if ((source.match(new RegExp(escRe('data-i18n="picks.music1.label"'), 'g')) || []).length !== 1) {
    errors.push('zh: music card must appear exactly once');
  }
  if (!source.includes('data-i18n="picks.music1.label">韩国音乐 · 2013<')) {
    errors.push('zh: music card label must carry the year 2013 (the MV release year)');
  }
  const zhMusicActions = zhNodes['picks.music1.actions'] || '';
  if (!zhMusicActions.includes(QQ_MV_LINK)) errors.push('zh: QQ Music MV link missing as the mainland channel');
  if (!zhMusicActions.includes('pick-link-featured')) errors.push('zh: QQ Music MV button must be the featured link');
  if (zhMusicActions.includes('youtu')) errors.push('zh: YouTube link forbidden on the Chinese page (mainland uses QQ Music)');
  if ((zhNodes['picks.music1.title'] || '').length < 2) errors.push('zh: music title missing');
  for (const marker of ['picks.music1.label', 'picks.music1.title', 'picks.music1.desc', 'picks.music1.actions', 'picks.music1.note', 'picks.music1.ytnote']) {
    if (!(zhNodes[marker] || '').length && marker !== 'picks.music1.ytnote') {
      errors.push('zh: music node missing -> ' + marker);
    }
  }

  /* 1d-4. 游戏区（2026-11-23）：端游四款 + 手游两款，两锚点两子标题，
     六张卡全部标准两栏；端游挂 Steam，手游三通道齐全；图片与来源说明不缺。 */
  if (!source.includes('id="picks-pc-games"')) errors.push('zh: PC games anchor missing');
  if (!source.includes('id="picks-mobile-games"')) errors.push('zh: mobile games anchor missing');
  if (!source.includes('data-i18n="nav.picks.game.pc"')) errors.push('zh: PC games subhead missing');
  if (!source.includes('data-i18n="nav.picks.game.mobile"')) errors.push('zh: mobile games subhead missing');
  /* 端游必须按发行时间降序：从源 HTML 抽取 .label 节点出现顺序比对 */
  const pcLabelOrder = [];
  for (const m of source.matchAll(/data-i18n="picks\.([a-z]+)\.label"/g)) {
    if (PC_GAME_SLUGS.includes(m[1])) pcLabelOrder.push(m[1]);
  }
  if (pcLabelOrder.join(',') !== PC_GAME_SLUGS.join(',')) {
    errors.push('zh: PC games not in release-date descending order -> ' + pcLabelOrder.join(','));
  }
  for (let oi = 1; oi < PC_GAME_SLUGS.length; oi++) {
    const prev = PC_GAME_SLUGS[oi - 1], cur = PC_GAME_SLUGS[oi];
    if (!(PC_GAME_YEAR[prev] >= PC_GAME_YEAR[cur])) {
      errors.push('pc order year invalid: ' + prev + ' -> ' + cur);
    }
  }
  for (const slug of GAME_SLUGS) {
    const card = source.match(new RegExp('<article class="pick-card">\\s*<p class="pick-card-label" data-i18n="picks\\.' + slug + '\\.label">([\\s\\S]*?)<\\/article>'));
    if (!card) {
      errors.push('zh: game card missing -> ' + slug);
      continue;
    }
    const body = card[1];
    if (!body.includes('<div class="pick-poster-row">')) {
      errors.push('zh: ' + slug + ' card must use standard two-column poster row');
    }
    if (/pick-poster-row-feature|pick-card-feature|pick-figure-still/.test(body)) {
      errors.push('zh: ' + slug + ' card must not carry any special layout');
    }
    if (!body.includes('class="pick-figure pick-figure-poster"') ||
        !body.includes('class="pick-image pick-image-poster"')) {
      errors.push('zh: ' + slug + ' card must reuse standard poster figure/image classes');
    }
    if (!assetRefs(source).includes(GAME_IMAGE[slug])) {
      errors.push('zh: ' + slug + ' poster not referenced -> ' + GAME_IMAGE[slug]);
    }
    if (!state.gameImages[slug]) {
      errors.push('picks: ' + slug + ' poster file missing from assets/');
    }
    if (!(zhNodes['picks.' + slug + '.title'] || '').length ||
        !(zhNodes['picks.' + slug + '.desc'] || '').length ||
        !(zhNodes['picks.' + slug + '.note'] || '').length) {
      errors.push('zh: ' + slug + ' title/desc/note node missing');
    }
    for (const marker of ['picks.' + slug + '.imageCredit']) {
      if (!(zhNodes[marker] || '').length) errors.push('zh: ' + slug + ' imageCredit missing');
    }
    const actions = zhNodes['picks.' + slug + '.actions'] || '';
    if (PC_GAME_SLUGS.includes(slug)) {
      if (!actions.includes(STEAM_LINK)) errors.push('zh: ' + slug + ' Steam link missing');
      const p = PC_PLATFORM[slug], loc = REGION_LOCALE.zh;
      if (p.ps) {
        if (!actions.includes(PS_BASE + loc.ps + '/concept/' + p.ps)) errors.push('zh: ' + slug + ' PS link wrong region ->港区');
      } else if (actions.includes(PS_BASE)) errors.push('zh: ' + slug + ' must not carry a PS button');
      if (p.xb) {
        if (!actions.includes(XB_BASE + loc.xb + '/games/store/' + p.xb)) errors.push('zh: ' + slug + ' Xbox link wrong region ->港区');
      } else if (actions.includes(XB_BASE)) errors.push('zh: ' + slug + ' must not carry an Xbox button');
    } else {
      for (const link of MOBILE_LINKS) {
        if (!actions.includes(link)) errors.push('zh: ' + slug + ' mobile channel missing -> ' + link);
      }
    }
  }

  /* 1d-5. 链游平台（2026-11-23）：手游下方第三个游戏子分类，只推荐平台。
     四张卡标准两栏 + 单官网按钮；区级 notice 提示风险；无游戏下载链接。 */
  if (!source.includes('id="picks-chain-games"')) errors.push('zh: chain platforms anchor missing');
  if (!source.includes('data-i18n="nav.picks.game.chain"')) errors.push('zh: chain platforms subhead missing');
  if (!(zhNodes['picks.chain.notice'] || '').length) errors.push('zh: chain risk notice missing');
  if (!source.includes('data-i18n="picks.chain.risk"')) errors.push('zh: chain risk-warning node missing in source');
  if (!source.includes(CHAIN_RISK_ZH)) errors.push('zh: chain risk warning must state high volatility');
  if (!source.includes('承受相应损失')) errors.push('zh: chain risk warning must mention affording the loss');
  if (!source.includes('按自身财力谨慎参与')) errors.push('zh: chain risk warning must advise participating within ones means');
  if (!(zhNodes['picks.chain.credit'] || '').length) errors.push('zh: chain credit note missing');
  if (!source.includes('data-i18n="picks.chain.credit"')) errors.push('zh: chain credit node missing in source');
  if (!source.includes(CHAIN_CREDIT_ZH)) errors.push('zh: chain credit text must be webmaster + AI');
  if (!source.includes('picks-chain-credit-standalone')) errors.push('zh: chain credit must be a standalone row below the grid');
  if (!(zhNodes['picks.chain.legend'] || '').length) errors.push('zh: chain health legend missing');
  if (!source.includes(CHAIN_LEGEND_ZH)) errors.push('zh: chain legend must explain the health badges');
  if (source.includes('picks.yooldo.') || source.includes('yooldo-chain.jpg')) errors.push('zh: removed Yooldo card must not return');
  if (source.includes('picks.chain.soon.') || source.includes('chain-soon.jpg')) errors.push('zh: removed coming-soon card must not return');
  for (const slug of CHAIN_SLUGS) {
    const card = source.match(new RegExp('<article class="pick-card">\\s*<p class="pick-card-label" data-i18n="picks\\.' + slug + '\\.label">([\\s\\S]*?)<\\/article>'));
    if (!card) { errors.push('zh: chain card missing -> ' + slug); continue; }
    const body = card[1];
    if (!body.includes('<div class="pick-poster-row">')) {
      errors.push('zh: ' + slug + ' chain card must use standard two-column row');
    }
    if (/pick-poster-row-feature|pick-card-feature|pick-figure-still/.test(body)) {
      errors.push('zh: ' + slug + ' chain card must not carry special layout');
    }
    if (!body.includes('class="pick-figure pick-figure-poster"') ||
        !body.includes('class="pick-image pick-image-poster"')) {
      errors.push('zh: ' + slug + ' chain card must reuse standard poster classes');
    }
    if (!assetRefs(source).includes(CHAIN_IMAGE[slug])) {
      errors.push('zh: ' + slug + ' chain poster not referenced');
    }
    if (!state.chainImages[slug]) {
      errors.push('picks: ' + slug + ' chain poster file missing from assets/');
    }
    for (const key of ['label', 'title', 'desc', 'actions', 'note', 'imageCredit']) {
      if (!(zhNodes['picks.' + slug + '.' + key] || '').length) {
        errors.push('zh: ' + slug + ' chain node missing -> ' + key);
      }
    }
    const actions = zhNodes['picks.' + slug + '.actions'] || '';
    if (!actions.includes(CHAIN_LINK[slug])) errors.push('zh: ' + slug + ' chain official link missing');
    if (!actions.includes('pick-link-featured')) errors.push('zh: ' + slug + ' chain featured button missing');
    if (/apps\.apple\.com|play\.google\.com|qoo-app\.com|store\.steampowered/.test(actions)) {
      errors.push('zh: ' + slug + ' chain card must not carry game download buttons');
    }
    const healthKey = 'picks.' + slug + '.health';
    if (!(zhNodes[healthKey] || '').length) errors.push('zh: ' + slug + ' chain health badge missing');
    if ((zhNodes[healthKey] || '') !== CHAIN_HEALTH_ZH[CHAIN_HEALTH[slug]]) {
      errors.push('zh: ' + slug + ' health badge must read ' + CHAIN_HEALTH_ZH[CHAIN_HEALTH[slug]]);
    }
    const healthCls = 'pick-health-' + CHAIN_HEALTH[slug];
    if (!body.includes('class="pick-health ' + healthCls + '"')) {
      errors.push('zh: ' + slug + ' health badge must carry class ' + healthCls);
    }
  }

  /* 1d-6. 加速器推荐：链游区下方两个工具卡，口令/邀请码与官网链接锁死 */
  if (!source.includes('id="picks-accelerators"')) errors.push('zh: accelerators anchor missing');
  if (!source.includes('data-i18n="nav.picks.game.accelerator"')) errors.push('zh: accelerators subhead missing');
  if (!(zhNodes['picks.accelerator.notice'] || '').length) errors.push('zh: accelerators notice missing');
  for (const slug of ACC_SLUGS) {
    const card = source.match(new RegExp('<article class="pick-card">\\s*<p class="pick-card-label" data-i18n="picks\\.' + slug + '\\.label">([\\s\\S]*?)<\\/article>'));
    if (!card) { errors.push('zh: accelerator card missing -> ' + slug); continue; }
    const body = card[1];
    if (!body.includes('<div class="pick-poster-row">')) {
      errors.push('zh: ' + slug + ' accelerator card must use standard two-column row');
    }
    if (/pick-poster-row-feature|pick-card-feature|pick-figure-still/.test(body)) {
      errors.push('zh: ' + slug + ' accelerator card must not carry special layout');
    }
    if (!body.includes('class="pick-figure pick-figure-poster"') ||
        !body.includes('class="pick-image pick-image-poster"')) {
      errors.push('zh: ' + slug + ' accelerator card must reuse standard poster classes');
    }
    if (!assetRefs(source).includes(ACC_IMAGE[slug])) {
      errors.push('zh: ' + slug + ' accelerator poster not referenced');
    }
    if (!state.accImages[slug]) {
      errors.push('picks: ' + slug + ' accelerator poster file missing from assets/');
    }
    for (const key of ['label', 'title', 'desc', 'actions', 'note', 'imageCredit']) {
      if (!(zhNodes['picks.' + slug + '.' + key] || '').length) {
        errors.push('zh: ' + slug + ' accelerator node missing -> ' + key);
      }
    }
    const actions = zhNodes['picks.' + slug + '.actions'] || '';
    if (!actions.includes(ACC_LINK[slug])) errors.push('zh: ' + slug + ' accelerator official link missing');
    if (!actions.includes('pick-link-featured')) errors.push('zh: ' + slug + ' accelerator featured button missing');
    if (!body.includes(ACC_CODE[slug])) errors.push('zh: ' + slug + ' accelerator code missing in card body');
  }

  /* 1d-2. 剧集时间线：五部剧按年份倒序，竖版海报 + 四语本地化 + 按区按钮 */
  const sourceLabels = [...source.matchAll(/data-i18n="(picks\.drama[1-5]\.label)"[^>]*>([^<]*)</g)]
    .map(m => ({ key: m[1], text: m[2] }));
  if (sourceLabels.length !== 5) {
    errors.push('zh: drama timeline must have 5 cards, found ' + sourceLabels.length);
  }
  for (let i = 0; i < DRAMA_SLUGS.length; i++) {
    const slug = DRAMA_SLUGS[i];
    if (!source.includes('data-i18n="picks.' + slug + '.title"')) {
      errors.push('zh: ' + slug + ' title node missing');
    }
    if (!source.includes('data-i18n="picks.' + slug + '.actions"')) {
      errors.push('zh: ' + slug + ' actions node missing');
    }
    if (!assetRefs(source).includes(DRAMA_IMAGE[slug])) {
      errors.push('zh: ' + slug + ' poster not referenced -> ' + DRAMA_IMAGE[slug]);
    }
    if (!state.dramaImages[slug]) {
      errors.push('picks: ' + slug + ' poster file missing from assets/');
    }
    const label = sourceLabels.find(x => x.key === 'picks.' + slug + '.label');
    if (!label || !label.text.includes(DRAMA_YEAR[slug])) {
      errors.push('zh: ' + slug + ' label year drift (want ' + DRAMA_YEAR[slug] + ')');
    }
    /* 中文五部统一挂港区 aff 邀请码按钮 + 红字原文 */
    const actionsBlock = (source.match(new RegExp('data-i18n="picks\\.' + slug + '\\.actions">([\\s\\S]*?)<\\/div>')) || [])[1] || '';
    if (!actionsBlock.includes(DRAMA_PRIMARY['zh/' + slug])) {
      errors.push('zh: ' + slug + ' HK-region aff button missing');
    }
    if (!actionsBlock.includes(DRAMA_NOTE.zh)) {
      errors.push('zh: ' + slug + ' Netflix note missing');
    }
    /* 中文按港区（2026-11-24 站长定）：Netflix 港区正版按钮可挂；TVING/Viki/U-NEXT/wavve 等大陆不可用平台仍禁挂。 */
    const zhSubHrefs = [...actionsBlock.matchAll(/class="pick-link pick-link-sub"\s+href="([^"]+)"/g)].map(m => m[1]);
    for (const href of zhSubHrefs) {
      if (!href.startsWith(NETFLIX_TITLE_PREFIX)) {
        errors.push('zh: ' + slug + ' overseas subscription button forbidden on the Chinese page -> ' + href);
      }
    }
  }
  /* 时间线顺序：DOM 中 drama1..drama5 依次出现，年份由新到旧 */
  let cursor = -1;
  for (const slug of DRAMA_SLUGS) {
    const at = source.indexOf('data-i18n="picks.' + slug + '.label"');
    if (at <= cursor) {
      errors.push('zh: drama timeline out of order at ' + slug);
    }
    cursor = at;
  }
  if (!/\.pick-image-poster\s*\{[^}]*aspect-ratio:\s*auto/.test(state.css)) {
    errors.push('zh: poster images must not be forced into 16:9');
  }
  /* 等高网格：卡片被同行最高的卡拉齐后，内容要撑满，不留底部空白 */
  if (/\.picks-grid\s*\{[^}]*align-items:\s*start/.test(state.css)) {
    errors.push('zh: picks grid must stretch cards to equal height');
  }
  if (!/\.pick-card\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column/.test(state.css)) {
    errors.push('zh: pick card must be a flex column so content can fill its height');
  }
  if (!/\.pick-poster-row\s*\{[^}]*flex:\s*1/.test(state.css)) {
    errors.push('zh: poster row must flex to fill the card height');
  }
  if (!/\.pick-image-poster\s*\{[^}]*height:\s*100%[^}]*object-fit:\s*cover/.test(state.css)) {
    errors.push('zh: drama poster must fill the stretched card height');
  }
  if (!/\.pick-poster-body \.pick-actions\s*\{[^}]*margin-top:\s*auto/.test(state.css)) {
    errors.push('zh: card actions must stick to the bottom of the stretched card');
  }
  if (!state.css.includes('@media (max-width: 420px)')) {
    errors.push('zh: poster row narrow-viewport guard missing');
  }
  if (/\.pick-poster-row-feature|pick-figure-still|pick-card-feature/.test(state.css)) {
    errors.push('zh: special film-card layout CSS must be removed (no stacked/feature/still rules)');
  }
  if (!/\.nav-dropdown-menu\s*\{[^}]*display:\s*none/.test(state.css)) {
    errors.push('css: nav dropdown must be closed by default');
  }
  if (!/\.nav-dropdown:hover \.nav-dropdown-menu[\s\S]*?display:\s*block/.test(state.css)) {
    errors.push('css: nav dropdown hover/focus open rule missing');
  }

  /* 1e. 极窄屏：320px 视口曾被语言切换器撑宽 6px，收紧规则不得回退 */
  if (!state.css.includes('@media (max-width: 360px)')) {
    errors.push('zh: narrow-viewport guard missing');
  }
  if (!/\.lang-switch a\s*\{[^}]*padding:\s*4px 7px/.test(state.css)) {
    errors.push('zh: narrow-viewport lang switch not tightened');
  }

  /* 1c. mobile switcher labels + accessible full names */
  const sourceShorts = shortLabels(source);
  for (const [code, expected] of Object.entries(SHORT_LABELS)) {
    const got = sourceShorts[code];
    if (!got) { errors.push('zh: missing short label -> ' + code); continue; }
    if (got.label !== expected) errors.push('zh: wrong short label ' + code + ' -> ' + got.label);
    if (!SHORT_LABEL_PATTERN.test(got.label)) {
      errors.push('zh: short label must be 2 uppercase Latin letters -> ' + code + ' = ' + got.label);
    }
    if (!got.attrs.includes('aria-hidden="true"')) {
      errors.push('zh: short label needs aria-hidden -> ' + code);
    }
  }
  if (state.css.includes('.lang-long { display: none; }')) {
    errors.push('css: full language name uses display:none and is lost to screen readers');
  }
  if (!/clip:\s*rect\(/.test(state.css)) {
    errors.push('css: full language name is not visually hidden with clip');
  }

  /* 1d. clipping attribution is explicit; link status is marked with a date */
  if (!source.includes('这张网页截图是' + AI_MARKERS.zh)) {
    errors.push('zh: clipping attribution no longer says the owner gave it to the AI');
  }
  if (!source.includes('站长提供的这张网页截图')) {
    errors.push('zh: caption no longer credits the site owner');
  }
  for (const marker of ANONYMOUS_MARKERS) {
    if (source.includes(marker)) errors.push('zh: anonymous/outdated wording returned -> ' + marker);
  }
  for (const marker of FIRST_PERSON_MARKERS) {
    if (source.includes(marker)) errors.push('zh: first-person attribution returned -> ' + marker);
  }
  for (const [kind, count] of Object.entries(STATUS_COUNTS)) {
    const n = (source.match(new RegExp('class="link-status is-' + kind + '"', 'g')) || []).length;
    if (n !== count) errors.push('zh: link status ' + kind + ' count is ' + n + ', expected ' + count);
  }
  if (!source.includes('2026-11-13 核查')) errors.push('zh: link check date/note missing');

  /* 2. dictionaries exist and key sets match */
  for (const lang of ['zh', ...LANGS]) {
    if (!dict[lang]) errors.push('dict: missing language ' + lang);
  }
  for (const lang of LANGS) {
    const d = dict[lang] || {};
    if (!sameKeys(d.html || {}, zhNodes)) errors.push(lang + ': html key set != index.html key set');
    if (!sameKeys(d.attr || {}, zhAttrs)) errors.push(lang + ': attr key set != zh attr key set');
    if (!sameKeys(d.js || {}, dict.zh ? dict.zh.js : {})) errors.push(lang + ': js key set differs from zh');
    if (!sameKeys(d.attr || {}, dict.zh ? dict.zh.attr : {})) errors.push(lang + ': attr key set differs from zh');
  }
  for (const key of Object.keys(zhAttrs)) {
    if (dict.zh && dict.zh.attr[key] !== zhAttrs[key]) {
      errors.push('zh: dictionary attr out of sync with HTML -> ' + key);
    }
  }

  /* 2b. 产品名口径：中文源保留「抖音」，非中文译文一律写 TikTok */
  for (const marker of ZH_PRODUCT_COPY) {
    if (!source.includes(marker)) {
      errors.push('zh: Chinese source must keep the original 抖音 copy -> ' + marker);
    }
  }
  for (const lang of LANGS) {
    const d = dict[lang] || {};
    const values = { ...(d.html || {}), ...(d.attr || {}), ...(d.js || {}) };
    for (const [key, value] of Object.entries(values)) {
      for (const stale of STALE_PRODUCT_NAMES) {
        if (String(value).includes(stale)) {
          errors.push(lang + ': stale product name "' + stale + '" -> ' + key);
        }
      }
    }
    const page = pages[lang] || '';
    /* 只去掉 href 属性与脚本；v.douyin.com 是小写，不会命中大写 Douyin */
    const visible = page.replace(/href="[^"]*"/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
    for (const stale of STALE_PRODUCT_NAMES) {
      if (visible.includes(stale)) {
        errors.push(lang + ': generated page still shows stale name -> ' + stale);
      }
    }
    if (!page.includes(PRODUCT_NAME)) {
      errors.push(lang + ': ' + PRODUCT_NAME + ' missing from generated page');
    }
  }

  /* 2c. read4 标签：中文「抖音」，三语统一 TikTok，旧标签不得回退 */
  if (extractNodes(source)['read4.tag'] !== READ4_TAG.zh) {
    errors.push('zh: read4.tag must be 抖音 (not the old 近例)');
  }
  for (const lang of LANGS) {
    const d = dict[lang] || {};
    const dictTag = (d.html || {})['read4.tag'];
    if (dictTag !== READ4_TAG[lang]) {
      errors.push(lang + ': read4.tag must be ' + READ4_TAG[lang] + ' (got ' + dictTag + ')');
    }
    const pageTag = extractNodes(pages[lang] || '')['read4.tag'];
    if (pageTag !== READ4_TAG[lang]) {
      errors.push(lang + ': generated page read4.tag out of sync -> ' + pageTag);
    }
    for (const stale of STALE_READ4_TAGS) {
      if (pageTag && pageTag.includes(stale)) {
        errors.push(lang + ': stale read4 tag returned -> ' + stale);
      }
    }
  }

  /* 3. trusted fragments must not contain executable markup */
  for (const lang of LANGS) {
    const d = dict[lang] || {};
    for (const [key, value] of Object.entries({ ...(d.html || {}), ...(d.attr || {}) })) {
      if (/<script|<iframe|\bonerror=|\bonload=|javascript:/i.test(value)) {
        errors.push(lang + ': unsafe markup in dictionary -> ' + key);
      }
    }
  }

  /* 4. generated pages */
  for (const lang of LANGS) {
    const page = pages[lang];
    const d = dict[lang] || {};
    if (!page) { errors.push(lang + ': generated page missing'); continue; }

    const nodes = extractNodes(page);
    const attrs = extractAttrs(page);
    for (const key of Object.keys(zhNodes)) {
      if (nodes[key] !== (d.html || {})[key]) errors.push(lang + ': node out of sync -> ' + key);
    }
    for (const key of Object.keys(zhAttrs)) {
      if (attrs[key] !== (d.attr || {})[key]) errors.push(lang + ': attr out of sync -> ' + key);
    }

    if (!page.includes('<html lang="' + HTML_LANG[lang] + '">')) errors.push(lang + ': wrong html lang');
    if (!page.includes('<body data-lang="' + lang + '">')) errors.push(lang + ': wrong body data-lang');

    const url = SITE + lang + '/';
    if (!page.includes('<link rel="canonical" href="' + url + '"')) errors.push(lang + ': wrong canonical');
    if (!page.includes('<meta property="og:url" content="' + url + '"')) errors.push(lang + ': wrong og:url');

    const refs = assetRefs(page);
    for (const required of REQUIRED_ASSETS) {
      if (!refs.includes(required)) errors.push(lang + ': missing asset -> ' + required);
    }
    for (const ref of refs) {
      if (!ref.startsWith('../')) errors.push(lang + ': asset path not relativised -> ' + ref);
    }

    /* language switch */
    const shorts = shortLabels(page);
    for (const [code, expected] of Object.entries(SHORT_LABELS)) {
      const got = shorts[code];
      if (!got || got.label !== expected) {
        errors.push(lang + ': wrong or missing short label -> ' + code);
      } else if (!SHORT_LABEL_PATTERN.test(got.label)) {
        errors.push(lang + ': short label must be 2 uppercase Latin letters -> ' + code + ' = ' + got.label);
      } else if (!got.attrs.includes('aria-hidden="true"')) {
        errors.push(lang + ': short label needs aria-hidden -> ' + code);
      }
    }
    for (const code of ['zh', ...LANGS]) {
      const m = page.match(new RegExp('<a data-lang-link="' + code + '"[^>]*>'));
      if (!m) { errors.push(lang + ': missing lang link -> ' + code); continue; }
      const tag = m[0];
      const isCurrent = code === lang;
      if (isCurrent && (!tag.includes('is-current') || !tag.includes('aria-current="page"'))) {
        errors.push(lang + ': current language not highlighted -> ' + code);
      }
      if (!isCurrent && (tag.includes('is-current') || tag.includes('aria-current'))) {
        errors.push(lang + ': wrong highlighted language -> ' + code);
      }
      const expected = code === 'zh' ? '../' : '../' + code + '/';
      if (!tag.includes('href="' + expected + '"')) errors.push(lang + ': wrong lang href -> ' + code);
    }

    /* archive in every language, including the boundary statement */
    if (!page.includes('<section class="section archive" id="archive">')) {
      errors.push(lang + ': archive section missing');
    }
    for (const link of ARCHIVE_LINKS) {
      if (!page.includes(link)) errors.push(lang + ': archived report link missing -> ' + link);
    }
    for (const dom of FORBIDDEN_DEAD_DOMAINS) {
      if (page.includes(dom)) errors.push(lang + ': 旧死链域名不得复现 -> ' + dom);
    }
    const boundary = (d.html || {})['archive.boundary'];
    if (!boundary || !page.includes(boundary)) {
      errors.push(lang + ': archive boundary statement missing or altered');
    }

    /* link status badges, check date and explicit attribution */
    for (const [kind, count] of Object.entries(STATUS_COUNTS)) {
      const n = (page.match(new RegExp('class="link-status is-' + kind + '"', 'g')) || []).length;
      if (n !== count) errors.push(lang + ': link status ' + kind + ' count is ' + n + ', expected ' + count);
    }
    if (!page.includes('2026-11-13')) errors.push(lang + ': link check date missing');
    /* 死链口径统一为 404：生成页核查说明不得出现 504 */
    if (page.includes('504')) errors.push(lang + ': 死链核查说明不得出现 504，统一口径为 404');
    const owner = OWNER_MARKERS[lang];
    for (const key of ['archive.intro', 'archive.caption']) {
      if (!(nodes[key] || '').includes(owner)) {
        errors.push(lang + ': owner attribution missing in ' + key);
      }
    }
    for (const marker of ANONYMOUS_MARKERS) {
      if (page.includes(marker)) errors.push(lang + ': anonymous/outdated wording returned -> ' + marker);
    }
    if (!(nodes['archive.intro'] || '').includes(AI_MARKERS[lang])) {
      errors.push(lang + ': archive intro no longer says the clipping was given to the AI');
    }
    for (const marker of FIRST_PERSON_MARKERS) {
      if (page.includes(marker)) errors.push(lang + ': first-person attribution returned -> ' + marker);
    }

    /* 站长推荐：主按钮按区——zh=aff（港区）、en=Prime Video、jp=Apple TV、ko=YouTube；
       外文一律不直译港区；盗版域名与 Netflix 链接一律禁入。 */
    if (!page.includes('<section class="section picks" id="picks">')) {
      errors.push(lang + ': picks section missing');
    }
    /* 二级菜单：三项、顺序、锚点与标题下分类名必须一一对应；手机端不做下拉 */
    const sub = NAV_SUB[lang];
    const menu = (page.match(/<div class="nav-dropdown-menu">([\s\S]*?)<\/div>/) || [])[1] || '';
    const menuLinks = [...menu.matchAll(/<a href="([^"]+)" data-i18n="[^"]+">([^<]+)<\/a>/g)];
    if (menuLinks.length !== 3) {
      errors.push(lang + ': nav dropdown must carry exactly three items');
    } else {
      for (let i = 0; i < 3; i++) {
        const label = [sub.drama, sub.kpop, sub.game][i];
        if (menuLinks[i][1] !== NAV_SUB_HREFS[i]) {
          errors.push(lang + ': dropdown item ' + i + ' wrong anchor -> ' + menuLinks[i][1]);
        }
        if (menuLinks[i][2] !== label) {
          errors.push(lang + ': dropdown item ' + i + ' wording drift -> ' + menuLinks[i][2]);
        }
      }
    }
    if ((nodes['picks.subhead'] || '') !== sub.drama) {
      errors.push(lang + ': section subhead must match the first dropdown item');
    }
    if (!page.includes('id="picks-kpop"')) errors.push(lang + ': ' + 'picks-kpop' + ' placeholder missing');
    if (!page.includes('id="picks-pc-games"')) errors.push(lang + ': ' + 'picks-pc-games' + ' placeholder missing');
    if (!page.includes('id="picks-mobile-games"')) errors.push(lang + ': ' + 'picks-mobile-games' + ' placeholder missing');
    if ((page.match(new RegExp(escRe(sub.kpop), 'g')) || []).length !== 2) {
      errors.push(lang + ': ' + 'picks-kpop' + ' label must appear in both dropdown and subhead');
    }
    if ((page.match(new RegExp(escRe(sub.game), 'g')) || []).length !== 1) {
      errors.push(lang + ': ' + 'picks-games' + ' label must appear in dropdown');
    }
    const actions = nodes['picks.film.actions'] || '';
    const want = PICKS_ACTIONS_EXPECT[lang];
    if (!actions.includes(want.note)) errors.push(lang + ': Netflix note wording drift');
    if (!actions.includes(PICKS_PRIMARY_LABEL[lang])) errors.push(lang + ': primary button label drift');
    const featuredHref = (actions.match(/class="pick-link pick-link-featured"\s+href="([^"]+)"/) || [])[1] || '';
    if (!featuredHref) errors.push(lang + ': featured button class missing');
    if (!featuredHref.includes(PRIMARY_LINK[want.primary])) {
      errors.push(lang + ': primary link missing -> ' + want.primary);
    }
    for (const [key, link] of Object.entries(PRIMARY_LINK)) {
      if (key !== want.primary && featuredHref.includes(link)) {
        errors.push(lang + ': wrong-region primary link -> ' + key);
      }
    }
    for (const dom of YOUTUBE_DOMAINS) {
      if (want.primary !== 'youtube' && actions.includes(dom)) {
        errors.push(lang + ': YouTube link forbidden in this region -> ' + dom);
      }
    }
    if (want.primary !== 'aff') {
      if (featuredHref.includes(AFF_LINK) || featuredHref.includes('5rfpUarUEd')) {
        errors.push(lang + ': aff link/code forbidden as primary button outside the Chinese page');
      }
      if (!want.note.includes(AFF_LINK)) {
        errors.push(lang + ': localized Netflix note must link the aff entry');
      }
    }
    for (const calque of FORBIDDEN_REGION_CALQUES) {
      if (actions.includes(calque)) errors.push(lang + ': Hong Kong region must not be translated into foreign copy -> ' + calque);
    }
    /* 四语均允许 Netflix title 深链（2026-11-24 站长要求），禁首页/搜索页泛链。 */
    for (const m of page.matchAll(/https:\/\/www\.netflix\.com\/[^\s"'<>]*/g)) {
      if (!/^https:\/\/www\.netflix\.com\/title\/\d+$/.test(m[0])) {
        errors.push(lang + ': Netflix link must be a title deep link -> ' + m[0]);
      }
    }
    for (const dom of FORBIDDEN_PIRATE_DOMAINS) {
      if (page.includes(dom)) errors.push(lang + ': 盗版站域名不得出现 -> ' + dom);
    }
    if ((nodes['picks.head'] || '') !== PICKS_HEAD[lang]) errors.push(lang + ': picks heading drift');
    for (const marker of MUSIC_FORBIDDEN) {
      if (page.includes(marker)) errors.push(lang + ': withdrawn music section returned -> ' + marker);
    }
    if ((nodes['picks.film.imageCredit'] || '') !== PICKS_CREDIT[lang]) {
      errors.push(lang + ': picks image credit drift');
    }

    /* 音乐区四语（2026-11-22）：外文页 MV 主按钮 = YouTube，附 QQ 音乐注记；
       ytnote 行逐语锁定；卡结构与剧集卡同款；QQ 链接不得当主按钮。 */
    const musicActions = nodes['picks.music1.actions'] || '';
    if (!musicActions.includes(YT_MV_LINK_WATCH)) {
      errors.push(lang + ': YouTube MV link missing as the featured music button');
    }
    if (!musicActions.includes('pick-link-featured')) {
      errors.push(lang + ': music featured button class missing');
    }
    if (musicActions.includes(QQ_MV_LINK)) {
      errors.push(lang + ': QQ Music link must not be the featured MV button outside mainland China');
    }
    if (!(nodes['picks.music1.note'] || '').includes(QQ_MV_LINK)) {
      errors.push(lang + ': music note must mention the webmaster QQ Music link');
    }
    if ((nodes['picks.music1.ytnote'] || '') !== MUSIC_YTNOTE[lang]) {
      errors.push(lang + ': music ytnote wording drift');
    }
    if ((nodes['picks.music1.imageCredit'] || '') !== MUSIC_CREDIT[lang]) {
      errors.push(lang + ': music image credit drift');
    }
    if (!attrs['picks.music1.imageAlt']) errors.push(lang + ': music imageAlt missing');
    if (!nodes['picks.music1.label'] || !nodes['picks.music1.label'].includes(MUSIC_YEAR.music1)) {
      errors.push(lang + ': music label year drift (want ' + MUSIC_YEAR.music1 + ')');
    }
    const musicCardHtml = (page.match(/<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.music1\.label">([\s\S]*?)<\/article>/) || [])[1] || '';
    if (!musicCardHtml.includes('<div class="pick-poster-row">')) {
      errors.push(lang + ': music card must use the standard two-column poster row');
    }
    if (/pick-poster-row-feature|pick-card-feature|pick-figure-still/.test(musicCardHtml)) {
      errors.push(lang + ': music card must not carry any special layout');
    }
    if (!page.includes('id="picks-kpop"')) errors.push(lang + ': music anchor missing');
    if (!page.includes('id="picks-pc-games"')) errors.push(lang + ': PC games anchor missing');
    if (!page.includes('id="picks-mobile-games"')) errors.push(lang + ': mobile games anchor missing');

    /* 游戏区四语（2026-11-23）：六张卡节点齐全、alt/来源不缺、
       端游挂 Steam、手游三通道齐全；卡结构与剧集卡同款。 */
    for (const slug of GAME_SLUGS) {
      for (const key of ['label', 'title', 'desc', 'actions', 'note', 'imageCredit']) {
        if (!(nodes['picks.' + slug + '.' + key] || '').length) {
          errors.push(lang + ': ' + slug + ' node missing -> ' + key);
        }
      }
      if (!attrs['picks.' + slug + '.imageAlt']) errors.push(lang + ': ' + slug + ' imageAlt missing');
      if (!assetRefs(page).includes('../' + GAME_IMAGE[slug])) {
        errors.push(lang + ': ' + slug + ' poster not referenced');
      }
      const actions = nodes['picks.' + slug + '.actions'] || '';
      if (PC_GAME_SLUGS.includes(slug)) {
        if (!actions.includes(STEAM_LINK)) errors.push(lang + ': ' + slug + ' Steam link missing');
        const p = PC_PLATFORM[slug], loc = REGION_LOCALE[lang];
        if (p.ps) {
          if (!actions.includes(PS_BASE + loc.ps + '/concept/' + p.ps)) errors.push(lang + ': ' + slug + ' PS link wrong region -> ' + loc.ps);
        } else if (actions.includes(PS_BASE)) errors.push(lang + ': ' + slug + ' must not carry a PS button');
        if (p.xb) {
          if (!actions.includes(XB_BASE + loc.xb + '/games/store/' + p.xb)) errors.push(lang + ': ' + slug + ' Xbox link wrong region -> ' + loc.xb);
        } else if (actions.includes(XB_BASE)) errors.push(lang + ': ' + slug + ' must not carry an Xbox button');
        /* 串区检测：四语各自只允许自己地区的 PS/Xbox 前缀 */
        for (const other of Object.keys(REGION_LOCALE)) {
          if (other === lang) continue;
          if (actions.includes(PS_BASE + REGION_LOCALE[other].ps + '/')) errors.push(lang + ': ' + slug + ' PS link leaked into ' + other + ' region');
          if (actions.includes(XB_BASE + REGION_LOCALE[other].xb + '/')) errors.push(lang + ': ' + slug + ' Xbox link leaked into ' + other + ' region');
        }
      } else {
        for (const link of MOBILE_LINKS) {
          if (!actions.includes(link)) errors.push(lang + ': ' + slug + ' mobile channel missing -> ' + link);
        }
      }
      const cardHtml = (page.match(new RegExp('<article class="pick-card">\\s*<p class="pick-card-label" data-i18n="picks\\.' + slug + '\\.label">([\\s\\S]*?)<\\/article>')) || [])[1] || '';
      if (!cardHtml.includes('<div class="pick-poster-row">')) {
        errors.push(lang + ': ' + slug + ' card must use standard two-column poster row');
      }
      if (/pick-poster-row-feature|pick-card-feature|pick-figure-still/.test(cardHtml)) {
        errors.push(lang + ': ' + slug + ' card must not carry any special layout');
      }
    }

    /* 链游平台四语（2026-11-23）：四卡节点齐全、官方链接正确、海报引用正确；
       韩语版 note 必须含南韩(남한) IP 限制 NFT 的提示。 */
    if (!page.includes('id="picks-chain-games"')) errors.push(lang + ': chain platforms anchor missing');
    if (!(nodes['picks.chain.notice'] || '').length) errors.push(lang + ': chain risk notice missing');
    if (!(nodes['picks.chain.risk'] || '').length) errors.push(lang + ': chain risk warning node missing');
    if (!page.includes('data-i18n="picks.chain.risk"')) errors.push(lang + ': chain risk warning node missing in page');
    if (!/<strong>/.test(nodes['picks.chain.risk'] || '')) errors.push(lang + ': chain risk warning label must be bold');
    if (!(nodes['picks.chain.credit'] || '').length) errors.push(lang + ': chain credit note missing');
    if (!page.includes('data-i18n="picks.chain.credit"')) errors.push(lang + ': chain credit node missing in page');
    if (!page.includes('picks-chain-credit-standalone')) errors.push(lang + ': chain credit must be a standalone row');
    if (!(nodes['picks.chain.legend'] || '').length) errors.push(lang + ': chain health legend missing');
    if (!(nodes['picks.chain.legend'] || '').includes(CHAIN_LEGEND_EXPECT[lang])) {
      errors.push(lang + ': chain legend must be the locked translation');
    }
    if (page.includes('picks.yooldo.') || page.includes('yooldo-chain.jpg')) errors.push(lang + ': removed Yooldo card must not return');
    if (page.includes('picks.chain.soon.') || page.includes('chain-soon.jpg')) errors.push(lang + ': removed coming-soon card must not return');
    for (const slug of CHAIN_SLUGS) {
      for (const key of ['label', 'title', 'desc', 'actions', 'note', 'imageCredit', 'health']) {
        if (!(nodes['picks.' + slug + '.' + key] || '').length) {
          errors.push(lang + ': ' + slug + ' chain node missing -> ' + key);
        }
      }
      if (!attrs['picks.' + slug + '.imageAlt']) errors.push(lang + ': ' + slug + ' chain imageAlt missing');
      if (!assetRefs(page).includes('../' + CHAIN_IMAGE[slug])) {
        errors.push(lang + ': ' + slug + ' chain poster not referenced');
      }
      const actions = nodes['picks.' + slug + '.actions'] || '';
      if (!actions.includes(CHAIN_LINK[slug])) errors.push(lang + ': ' + slug + ' chain official link missing');
      if (/apps\.apple\.com|play\.google\.com|qoo-app\.com|store\.steampowered/.test(actions)) {
        errors.push(lang + ': ' + slug + ' chain card must not carry game download buttons');
      }
      const cardHtml = (page.match(new RegExp('<article class="pick-card">\\s*<p class="pick-card-label" data-i18n="picks\\.' + slug + '\\.label">([\\s\\S]*?)<\\/article>')) || [])[1] || '';
      if (!cardHtml.includes('<div class="pick-poster-row">')) {
        errors.push(lang + ': ' + slug + ' chain card must use standard two-column row');
      }
      if (!cardHtml.includes('class="pick-health pick-health-' + CHAIN_HEALTH[slug] + '"')) {
        errors.push(lang + ': ' + slug + ' health badge class drifted');
      }
      const expectHealth = CHAIN_HEALTH_EXPECT[lang][CHAIN_HEALTH[slug]];
      if ((nodes['picks.' + slug + '.health'] || '') !== expectHealth) {
        errors.push(lang + ': ' + slug + ' health badge must read ' + expectHealth);
      }
    }
    if (lang === 'ko' && !(nodes['picks.msu.note'] || '').includes(CHAIN_KO_NFT_NOTE)) {
      errors.push('ko: MapleStory Universe note must state South Korean (남한) IP NFT restriction');
    }

    /* 加速器四语校验：两卡齐全、官网与口令/邀请码不丢、标准两栏、海报 alt/来源不缺 */
    if (!page.includes('id="picks-accelerators"')) errors.push(lang + ': accelerators anchor missing');
    if (!(nodes['picks.accelerator.notice'] || '').length) errors.push(lang + ': accelerators notice missing');
    for (const slug of ACC_SLUGS) {
      if (!nodes['picks.' + slug + '.title']) errors.push(lang + ': ' + slug + ' accelerator title missing');
      if (!nodes['picks.' + slug + '.desc']) errors.push(lang + ': ' + slug + ' accelerator desc missing');
      if (!nodes['picks.' + slug + '.note']) errors.push(lang + ': ' + slug + ' accelerator note missing');
      if (!nodes['picks.' + slug + '.imageCredit']) errors.push(lang + ': ' + slug + ' accelerator imageCredit missing');
      if (!attrs['picks.' + slug + '.imageAlt']) errors.push(lang + ': ' + slug + ' accelerator imageAlt missing');
      if (!assetRefs(page).includes('../' + ACC_IMAGE[slug])) {
        errors.push(lang + ': ' + slug + ' accelerator poster not referenced');
      }
      const actions = nodes['picks.' + slug + '.actions'] || '';
      if (!actions.includes(ACC_LINK[slug])) errors.push(lang + ': ' + slug + ' accelerator official link missing');
      if (!actions.includes('pick-link-featured')) errors.push(lang + ': ' + slug + ' accelerator featured button missing');
      const cardHtml = (page.match(new RegExp('<article class="pick-card">\\s*<p class="pick-card-label" data-i18n="picks\\.' + slug + '\\.label">([\\s\\S]*?)<\\/article>')) || [])[1] || '';
      if (!cardHtml.includes('<div class="pick-poster-row">')) {
        errors.push(lang + ': ' + slug + ' accelerator card must use standard two-column row');
      }
      if (/pick-poster-row-feature|pick-card-feature|pick-figure-still/.test(cardHtml)) {
        errors.push(lang + ': ' + slug + ' accelerator card must not carry special layout');
      }
      const desc = nodes['picks.' + slug + '.desc'] || '';
      if (!desc.includes(ACC_LINK[slug])) errors.push(lang + ': ' + slug + ' accelerator desc link missing');
    }

    /* 剧集时间线四语校验：五部齐全、红字本地化、按区按钮与海报 alt/来源不缺 */
    const note = DRAMA_NOTE[lang];
    for (const slug of DRAMA_SLUGS) {
      if (!nodes['picks.' + slug + '.title']) errors.push(lang + ': ' + slug + ' title node missing');
      if (!attrs['picks.' + slug + '.imageAlt']) errors.push(lang + ': ' + slug + ' imageAlt missing');
      if (!nodes['picks.' + slug + '.imageCredit']) errors.push(lang + ': ' + slug + ' imageCredit missing');
      if (!nodes['picks.' + slug + '.label'] || !nodes['picks.' + slug + '.label'].includes(DRAMA_YEAR[slug])) {
        errors.push(lang + ': ' + slug + ' label year drift');
      }
      const actions = nodes['picks.' + slug + '.actions'] || '';
      if (!actions.includes(note)) errors.push(lang + ': ' + slug + ' Netflix note drift');
      if (!actions.includes(AFF_LINK)) errors.push(lang + ': ' + slug + ' aff entry missing in note');
      for (const m of actions.matchAll(/https:\/\/www\.netflix\.com\/[^\s"'<>]*/g)) {
        if (!/^https:\/\/www\.netflix\.com\/title\/\d+$/.test(m[0])) {
          errors.push(lang + ': ' + slug + ' Netflix link must be a title deep link -> ' + m[0]);
        }
      }
      const wantNf = NETFLIX_TITLE_ID[lang + '/' + slug];
      if (wantNf) {
        if (!actions.includes(NETFLIX_TITLE_PREFIX + wantNf)) errors.push(lang + ': ' + slug + ' Netflix title ID drift -> ' + wantNf);
        if (!actions.includes(NETFLIX_LABEL[lang])) errors.push(lang + ': ' + slug + ' Netflix label drift');
      } else if (actions.includes(NETFLIX_TITLE_PREFIX)) {
        errors.push(lang + ': ' + slug + ' Netflix deep link forbidden (no Netflix license in this region)');
      }
      for (const dom of FORBIDDEN_PIRATE_DOMAINS) {
        if (actions.includes(dom)) errors.push(lang + ': ' + slug + ' pirate domain forbidden');
      }
      const featured = (actions.match(/class="pick-link pick-link-featured"\s+href="([^"]+)"/) || [])[1] || '';
      const wantPrimary = DRAMA_PRIMARY[lang + '/' + slug] || null;
      if (wantPrimary) {
        if (!featured.includes(wantPrimary)) {
          errors.push(lang + ': ' + slug + ' featured buy link missing -> ' + wantPrimary);
        }
        /* 有按钮的卡片禁止出现别区购买渠道，aff 只能出现在红字里 */
        for (const [k, link] of Object.entries({
          amazon: AMAZON_LINK, us: DRAMA_AMAZON_US,
          jpStar: DRAMA_AMAZON_JP_STAR, jpHeirs: DRAMA_AMAZON_JP_HEIRS,
          apple: APPLE_TV_LINK
        })) {
          if (k !== (wantPrimary === DRAMA_AMAZON_US ? 'us' : wantPrimary === DRAMA_AMAZON_JP_STAR ? 'jpStar' : wantPrimary === DRAMA_AMAZON_JP_HEIRS ? 'jpHeirs' : wantPrimary) && featured.includes(link)) {
            errors.push(lang + ': ' + slug + ' wrong-region buy link -> ' + k);
          }
        }
      } else if (featured) {
        errors.push(lang + ': ' + slug + ' buy button forbidden where no rent/buy channel exists');
      }
      /* 订阅制渠道：按区实查到了才挂，且必须排在 featured 租买按钮与红字 AFF 之上；
         查不到的区一律禁挂，避免「点进去没有这部片」的死链。 */
      /* 跳过 Netflix 按钮，取第一个非 Netflix 订阅按钮作为 DRAMA_SUB 校验锚点（2026-11-24 并存规则）。 */
      const subHrefs = [...actions.matchAll(/class="pick-link pick-link-sub"\s+href="([^"]+)"/g)].map(m => m[1]);
      const subAnchor = subHrefs.find(h => !h.startsWith(NETFLIX_TITLE_PREFIX)) || '';
      const subWant = DRAMA_SUB[lang + '/' + slug] || null;
      const subCount = (actions.match(/pick-link-sub/g) || []).length;
      if (subWant) {
        if (!subAnchor) errors.push(lang + ': ' + slug + ' subscription button missing');
        else {
          if (!subAnchor.startsWith(subWant.url)) {
            errors.push(lang + ': ' + slug + ' subscription link drift -> ' + subAnchor);
          }
          if (!SUB_DOMAINS.some(prefix => subAnchor.startsWith(prefix))) {
            errors.push(lang + ': ' + slug + ' subscription link outside the licensed-platform allowlist');
          }
          for (const dead of DEAD_SUB_PLATFORMS) {
            if (subAnchor.includes(dead)) errors.push(lang + ': ' + slug + ' dead subscription platform -> ' + dead);
          }
        }
        if (!actions.includes(subWant.label)) {
          errors.push(lang + ': ' + slug + ' subscription label drift');
        }
        /* Netflix 按钮可与非 Netflix 订阅按钮并存（2026-11-24 站长：有正版就多挂）；
           非 Netflix 订阅按钮仍恰好一个。 */
        const nfCount = (actions.match(/netflix\.com\/title\//g) || []).length;
        if (subCount - nfCount !== 1) {
          errors.push(lang + ': ' + slug + ' must carry exactly one non-Netflix subscription button (got ' + (subCount - nfCount) + ')');
        }
        const subAt = actions.indexOf('pick-link-sub');
        const featAt = actions.indexOf('pick-link-featured');
        const redAt = actions.indexOf('pick-netflix-note');
        if (featAt > -1 && subAt > featAt) {
          errors.push(lang + ': ' + slug + ' subscription button must sit above the buy button');
        }
        if (redAt > -1 && subAt > redAt) {
          errors.push(lang + ': ' + slug + ' subscription button must sit above the aff note');
        }
      } else {
        /* 没有非 Netflix 渠道时，只允许该区已核实的 Netflix 按钮，其余订阅按钮禁挂。 */
        const nfCount = (actions.match(/netflix\.com\/title\//g) || []).length;
        const wantNfHere = NETFLIX_TITLE_ID[lang + '/' + slug];
        if (subCount - nfCount > 0) {
          errors.push(lang + ': ' + slug + ' subscription button forbidden where the region has no licensed subscription channel');
        }
        if (nfCount > (wantNfHere ? 1 : 0)) {
          errors.push(lang + ': ' + slug + ' Netflix button count drift (got ' + nfCount + ')');
        }
      }
    }

  /* 英文区 drama10/11/13 正版按钮写死：链接、文案、位置（红字之前）。 */
  {
    const enNodes = extractNodes(state.pages.en || '');
    for (const [key, want] of Object.entries(DRAMA_SUB_EXTRA)) {
      if (!key.startsWith('en/')) continue;
      const slug = key.slice(3);
      const actions = enNodes['picks.' + slug + '.actions'] || '';
      if (!actions.includes(want.url)) errors.push('en: ' + slug + ' licensed subscription link missing');
      if (!actions.includes(want.label)) errors.push('en: ' + slug + ' licensed subscription label drift');
      const subAt = actions.indexOf(want.url);
      const redAt = actions.indexOf('pick-netflix-note');
      if (subAt < 0 || redAt < 0 || subAt > redAt) errors.push('en: ' + slug + ' subscription button must sit above the aff note');
    }
    /* 四区 Netflix 条目 ID / 文案写死（drama6-9 不在 DRAMA_SLUGS，需在此单独断言）。 */
    for (const [key, id] of Object.entries(NETFLIX_TITLE_ID)) {
      const lang = key.slice(0, 2);
      const slug = key.slice(3);
      const nodes = extractNodes(lang === 'zh' ? state.source : (state.pages[lang] || ''));
      const actions = nodes['picks.' + slug + '.actions'] || '';
      if (!actions.includes(NETFLIX_TITLE_PREFIX + id)) errors.push(lang + ': ' + slug + ' Netflix title ID drift -> ' + id);
      if (!actions.includes(NETFLIX_LABEL[lang])) errors.push(lang + ': ' + slug + ' Netflix subscription label drift');
      const nfAt = actions.indexOf(NETFLIX_TITLE_PREFIX + id);
      const redAt = actions.indexOf('pick-netflix-note');
      if (nfAt < 0 || redAt < 0 || nfAt > redAt) errors.push(lang + ': ' + slug + ' Netflix button must sit above the aff note');
    }
    /* 2026-11-24 新增正版订阅按钮专项断言：不在 DRAMA_SLUGS 的卡（drama6/10-13/film）也要锁死。 */
    for (const [key, want] of Object.entries(LICENSED_SUB_EXTRA)) {
      const lang = key.slice(0, 2);
      const slug = key.slice(3);
      const nodes = extractNodes(lang === 'zh' ? state.source : (state.pages[lang] || ''));
      const actions = nodes['picks.' + slug + '.actions'] || '';
      if (!actions.includes('class="pick-link pick-link-sub" href="' + want.url + '"')) {
        errors.push(lang + ': ' + slug + ' licensed subscription link missing -> ' + want.url);
      }
      if (!actions.includes(want.label)) errors.push(lang + ': ' + slug + ' licensed subscription label drift');
      if (!SUB_DOMAINS.some(prefix => want.url.startsWith(prefix))) {
        errors.push(lang + ': ' + slug + ' licensed platform outside allowlist');
      }
      const subAt = actions.indexOf(want.url);
      const redAt = actions.indexOf('pick-netflix-note');
      if (subAt < 0 || redAt < 0 || subAt > redAt) {
        errors.push(lang + ': ' + slug + ' licensed subscription button must sit above the aff note');
      }
      if (!actions.includes(AFF_LINK)) errors.push(lang + ': ' + slug + ' aff entry must be preserved');
    }
  }

    /* 2026-11-24 查无正版提示四语齐全；视频区不得出现已失效的 Viki 剧集页。 */
  for (const lang of LANGS) {
    const p = state.pages[lang] || '';
    if (!p.includes(SUB_UNAVAILABLE[lang])) errors.push(lang + ': no-licensed-source wording missing');
    for (const dead of DEAD_SUB_PLATFORMS) {
      if (p.includes(dead)) errors.push(lang + ': dead Viki title page still linked -> ' + dead);
    }
  }
  /* 劲舞团四语服务器：zh 国服 / en+jp 台服 / ko 韩服，串区判红。 */
  {
    const zhAct = extractNodes(state.source)['picks.audition.actions'] || '';
    if (!zhAct.includes(AUDITION_SERVER.zh)) errors.push('zh: audition CN server link missing');
    for (const lang of AUDITION_FOREIGN) {
      const p = state.pages[lang] || '';
      const act = extractNodes(p)['picks.audition.actions'] || '';
      if (!act.includes(AUDITION_SERVER[lang])) errors.push(lang + ': audition server link drift -> ' + AUDITION_SERVER[lang]);
      for (const other of ['zh','en','jp','ko']) {
        if (other === lang) continue;
        if (other === 'jp' && lang === 'en') continue;
        if (other === 'en' && lang === 'jp') continue;
        if (AUDITION_SERVER[other] !== AUDITION_SERVER[lang] && act.includes(AUDITION_SERVER[other])) {
          errors.push(lang + ': audition server leaked from ' + other);
        }
      }
    }
  }
  /* no Chinese body copy left behind */
    for (const marker of CHINESE_MARKERS) {
      if (page.includes(marker)) errors.push(lang + ': untranslated Chinese left in page -> ' + marker);
    }
  }

  /* 5. SEO（A+C+D 长尾）：title / description 关键词前置，旧文艺标题不得回退；
     四语各一段合法 JSON-LD，inLanguage / url / 关键词逐语对应；
     sitemap.xml 收录四语 + hreflang，robots.txt 指向 sitemap。 */
  const zhTitle = extractTitle(source);
  if (!zhTitle.includes(SEO_TITLE_KEYWORD.zh)) errors.push('zh: title missing SEO keyword -> ' + SEO_TITLE_KEYWORD.zh);
  if (zhTitle.includes(SEO_STALE_TITLE.zh)) errors.push('zh: stale文艺 title returned');
  if (!(zhAttrs['meta.description'] || '').includes(SEO_DESC_KEYWORD.zh)) {
    errors.push('zh: description missing SEO keyword');
  }
  const zhLd = extractJsonLd(source);
  if (!zhLd || zhLd.__parseError) errors.push('zh: JSON-LD missing or invalid JSON');
  else {
    if (zhLd['@type'] !== 'WebSite') errors.push('zh: JSON-LD @type must be WebSite');
    if (zhLd.inLanguage !== SEO_LD_LANG.zh) errors.push('zh: JSON-LD inLanguage wrong');
    if (zhLd.url !== SITE) errors.push('zh: JSON-LD url wrong');
    if (!JSON.stringify(zhLd).includes(SEO_TITLE_KEYWORD.zh)) errors.push('zh: JSON-LD missing SEO keyword');
  }
  if (!source.includes('<link rel="sitemap" type="application/xml"')) errors.push('zh: sitemap link missing');

  for (const lang of LANGS) {
    const page = pages[lang] || '';
    const attrs = extractAttrs(page);
    const title = extractTitle(page);
    if (!title.includes(SEO_TITLE_KEYWORD[lang])) errors.push(lang + ': title missing SEO keyword -> ' + SEO_TITLE_KEYWORD[lang]);
    if (title.includes(SEO_STALE_TITLE[lang])) errors.push(lang + ': stale文艺 title returned');
    if (!(attrs['meta.description'] || '').includes(SEO_DESC_KEYWORD[lang])) {
      errors.push(lang + ': description missing SEO keyword');
    }
    const ld = extractJsonLd(page);
    if (!ld || ld.__parseError) errors.push(lang + ': JSON-LD missing or invalid JSON');
    else {
      if (ld['@type'] !== 'WebSite') errors.push(lang + ': JSON-LD @type must be WebSite');
      if (ld.inLanguage !== SEO_LD_LANG[lang]) errors.push(lang + ': JSON-LD inLanguage wrong');
      if (ld.url !== SITE + lang + '/') errors.push(lang + ': JSON-LD url wrong');
      if (!JSON.stringify(ld).includes(SEO_TITLE_KEYWORD[lang])) errors.push(lang + ': JSON-LD missing SEO keyword');
    }
    if (!page.includes('<link rel="sitemap" type="application/xml"')) errors.push(lang + ': sitemap link missing');
  }

  const sitemap = state.sitemap || '';
  if ((sitemap.match(/<url>/g) || []).length !== 4) errors.push('sitemap: must contain exactly 4 <url> entries');
  for (const url of SEO_SITEMAP_URLS) {
    if (!sitemap.includes('<loc>' + url + '</loc>')) errors.push('sitemap: missing loc -> ' + url);
  }
  for (const hreflang of SEO_HREFLANG) {
    if (!sitemap.includes('hreflang="' + hreflang + '"')) errors.push('sitemap: missing hreflang -> ' + hreflang);
  }
  if (!sitemap.includes('<?xml version="1.0" encoding="UTF-8"?>')) errors.push('sitemap: missing XML declaration');
  const robots = state.robots || '';
  if (!/User-agent:\s*\*/.test(robots)) errors.push('robots.txt: missing User-agent rule');
  if (!robots.includes('Sitemap: ' + SITE + 'sitemap.xml')) errors.push('robots.txt: sitemap directive missing or wrong');

  /* ---------- K-POP 小众音乐卡（多卡，按语言平台映射）---------- */
  {
    const zhNodesK = extractNodes(state.source);
    if (!(zhNodesK['picks.headsub'] || '').length) errors.push('zh: picks.headsub（优先推荐韩国小众歌手行）missing');
    for (const lang of LANGS) {
      if (!(extractNodes(state.pages[lang] || '')['picks.headsub'] || '').length) errors.push(lang + ': picks.headsub missing');
    }
    for (const slug of KPOP_SLUGS) {
      const card = state.source.match(new RegExp('<article class="pick-card">\\s*<p class="pick-card-label" data-i18n="picks\\.' + slug + '\\.label">[\\s\\S]*?<\\/article>'));
      if (!card) { errors.push('zh: kpop card missing -> ' + slug); continue; }
      const zhAct = zhNodesK['picks.' + slug + '.actions'] || '';
      if (!zhAct.includes(KPOP_ZH_LINK[slug])) errors.push('zh: kpop ' + slug + ' 大陆通道链接缺失');
      if (/youtu\.?be|youtube\.com/.test(zhAct)) errors.push('zh: kpop ' + slug + ' 中文页禁挂 YouTube');
      if (!state.kpopImages[slug]) errors.push('kpop: ' + slug + ' 缩略图不在 assets/');
      if (!assetRefs(state.source).includes(KPOP_IMAGE[slug])) errors.push('zh: kpop ' + slug + ' 缩略图未被引用');
      for (const lang of LANGS) {
        const nodes = extractNodes(state.pages[lang] || '');
        const act = nodes['picks.' + slug + '.actions'] || '';
        if (!act.includes('youtu.be/' + KPOP_YT_ID[slug])) errors.push(lang + ': kpop ' + slug + ' YouTube 链接错误/缺失');
        if (/y\.qq\.com|music\.163\.com/.test(act)) errors.push(lang + ': kpop ' + slug + ' 大陆链接泄漏进 ' + lang);
        for (const key of ['label', 'title', 'desc', 'actions', 'note', 'imageCredit']) {
          if (!(nodes['picks.' + slug + '.' + key] || '').length) errors.push(lang + ': kpop ' + slug + ' 缺 ' + key);
        }
      }
    }
  }

  /* ---------- 补齐原仅中文卡（2026-11-24）：10 张卡现四语齐全、均有海报 ----------
     站长指出前一轮把 6 部韩剧 + 4 款端游做成 data-zh-only 纯文字卡且只留中文，
     已全部改为标准两栏海报卡并补四语。不变量：源页无 data-zh-only 残留；
     每张卡的 label/title/desc/imageCredit/imageAlt/actions/note 七键四语齐全；
     四语页面均引用对应海报文件。 */
  const FIXED_SLUGS = ['drama6','drama7','drama8','drama9','drama10','drama11',
    'drama12','drama13','bnb','kart','audition','rbeat'];
  const FIXED_IMAGE = {
    drama6: 'moon-embracing-sun-poster.jpg', drama7: 'mr-queen-poster.jpg',
    drama8: 'hi-bye-mama-poster.jpg', drama9: 'tyrants-chef-poster.jpg',
    drama10: 'deaths-game-poster.jpg', drama11: 'fight-ghost-poster.jpg',
    drama12: 'beloved-eundong-poster.jpg', drama13: 'dear-my-friends-poster.jpg',
    bnb: 'bnb-poster.jpg', kart: 'kart-poster.jpg',
    audition: 'audition-poster.jpg', rbeat: 'rbeat-poster.jpg' };
  if (/data-zh-only/.test(state.source)) errors.push('zh: 源页仍有 data-zh-only 残留');
  for (const slug of FIXED_SLUGS) {
    if (!state.source.includes('data-i18n="picks.' + slug + '.label"'))
      errors.push('zh: 补齐卡缺 label 节点 -> ' + slug);
    if (!state.source.includes('src="assets/' + FIXED_IMAGE[slug] + '"'))
      errors.push('zh: 补齐卡缺海报 -> ' + slug);
    for (const key of ['label','title','desc','imageCredit','actions','note','imageAlt']) {
      if (!state.source.includes('picks.' + slug + '.' + key))
        errors.push('zh: 补齐卡缺键 -> ' + slug + '.' + key);
    }
  }
  for (const lang of LANGS) {
    const page = state.pages[lang] || '';
    if (page.includes('data-zh-only')) errors.push(lang + ': 仍有 data-zh-only 标记残留');
    for (const slug of FIXED_SLUGS) {
      if (!page.includes('assets/' + FIXED_IMAGE[slug]))
        errors.push(lang + ': 补齐卡海报未出现在生成页 -> ' + slug);
      for (const key of ['label','title','desc','imageCredit','actions','note']) {
        const val = state.dict[lang].html['picks.' + slug + '.' + key];
        if (!val) errors.push(lang + ': 补齐卡四语缺键 -> ' + slug + '.' + key);
        else if (val && !page.includes(val)) errors.push(lang + ': 补齐卡译文未渲染 -> ' + slug + '.' + key);
      }
      const alt = state.dict[lang].attr['picks.' + slug + '.imageAlt'];
      if (!alt) errors.push(lang + ': 补齐卡四语缺 imageAlt -> ' + slug);
    }
  }



  /* ---------- 2026-11-24 站长写死规则：三区按上映时间降序 + 搜索框分区 + 导航锚点 ---------- */
  if (!state.source.includes('<a href="#picks-dramas" data-i18n="nav.picks.drama">'))
    errors.push('zh: nav drama anchor must point to #picks-dramas');
  if (/<a href="#picks" data-i18n="nav\.picks\.drama"/.test(state.source))
    errors.push('zh: nav drama still points to #picks (whole section)');
  for (const lang of LANGS) {
    const p = state.pages[lang] || '';
    if (/<a href="#picks"[^>]*data-i18n="nav\.picks\.drama"/.test(p))
      errors.push(lang + ': nav drama anchor drifted to #picks');
    if (!/<a href="#picks-dramas"[^>]*data-i18n="nav\.picks\.drama"/.test(p))
      errors.push(lang + ': nav drama anchor #picks-dramas missing');
  }
  /* 搜索框：端游/手游各一个、只搜自己容器；旧 searchGame 不得残留 */
  for (const p of [state.source, ...LANGS.map(l => state.pages[l] || '')]) {
    if (p.includes('searchGame')) errors.push('search: legacy searchGame box still present');
  }
  for (const [box, grid, subhead] of [['searchPC','picks-pc-games','nav.picks.game.pc'],
                                      ['searchMobile','picks-mobile-games','nav.picks.game.mobile']]) {
    if (!state.source.includes('id="' + box + '"')) errors.push('search: ' + box + ' input missing');
    if (!state.source.includes('data-i18n-placeholder="picks.search.' + (box === 'searchPC' ? 'pc' : 'mobile') + '.ph"'))
      errors.push('search: ' + box + ' placeholder key missing');
    for (const lang of LANGS) {
      const p = state.pages[lang] || '';
      if (!p.includes('id="' + box + '"')) errors.push(lang + ': ' + box + ' input missing');
      if (!p.includes('data-i18n="' + subhead + '"')) errors.push(lang + ': ' + subhead + ' subhead missing');
    }
  }
  const appJs = state.appJs || '';
  if (!appJs.includes("{ box: 'searchPC', containers: ['picks-pc-games'] }"))
    errors.push('app.js: searchPC must scope to picks-pc-games only');
  if (!appJs.includes("{ box: 'searchMobile', containers: ['picks-mobile-games'] }"))
    errors.push('app.js: searchMobile must scope to picks-mobile-games only');
  if (/searchGame/.test(appJs)) errors.push('app.js: legacy searchGame scope still present');
  /* 三区降序：按 label 节点出现顺序取 slug，逐年比对 year[prev] > year[cur] */
  function checkDescending(page, grid, rule, tag) {
    const gi = page.indexOf('id="' + grid + '"');
    if (gi < 0) { errors.push(tag + ': grid ' + grid + ' missing'); return; }
    const after = page.slice(gi);
    const found = [];
    for (const m of after.matchAll(/data-i18n="picks\.([a-z0-9]+)\.label"/g)) {
      if (rule.order.includes(m[1])) found.push(m[1]);
      if (found.length === rule.order.length) break;
    }
    if (found.join(',') !== rule.order.join(',')) {
      errors.push(tag + ': ' + grid + ' order drift -> ' + found.join(','));
      return;
    }
    for (let i = 1; i < found.length; i++) {
      const prev = found[i-1], cur = found[i];
      if (!(rule.year[prev] >= rule.year[cur]))
        errors.push(tag + ': ' + grid + ' year not descending at ' + prev + '(' + rule.year[prev] + ') -> ' + cur + '(' + rule.year[cur] + ')');
    }
    if (rule.date) {
      for (let i = 1; i < found.length; i++) {
        const prev = found[i-1], cur = found[i];
        if (rule.date[prev] && rule.date[cur] && !(rule.date[prev] >= rule.date[cur]))
          errors.push(tag + ': ' + grid + ' release date not descending at ' + prev + '(' + rule.date[prev] + ') -> ' + cur + '(' + rule.date[cur] + ')');
      }
    }
    for (const slug of rule.order) {
      const ly = rule.year[slug];
      if (!new RegExp('picks\.' + slug + '\.label"[^>]*>[^<]*' + ly).test(page))
        errors.push(tag + ': ' + slug + ' label missing year ' + ly);
    }
  }
  checkDescending(state.source, 'picks-dramas', SORT_RULES.drama, 'zh');
  checkDescending(state.source, 'picks-kpop', SORT_RULES.music, 'zh');
  checkDescending(state.source, 'picks-pc-games', SORT_RULES.pc, 'zh');
  checkDescending(state.source, 'picks-mobile-games', SORT_RULES.mobile, 'zh');
  for (const lang of LANGS) {
    const p = state.pages[lang] || '';
    checkDescending(p, 'picks-dramas', SORT_RULES.drama, lang);
    checkDescending(p, 'picks-kpop', SORT_RULES.music, lang);
    checkDescending(p, 'picks-pc-games', SORT_RULES.pc, lang);
    checkDescending(p, 'picks-mobile-games', SORT_RULES.mobile, lang);
  }  /* ---------- 2026-11-24 新增两歌：임효라《미스코리아》+ Stellar《공부하세요》 ----------
     站长明确：前者无 MV，中文只能挂 QQ 歌曲页；三语挂指定 YouTube 现场演出。
     歌名易混李孝利 → 四语必须写明「不是李孝利」。后者按 2013-07-11 精确发行日排。
     两条都不给任何北韩相关资源线索。 */
  {
    const newSlugs = ['misskorea','study'];
    const zhNewNodes = extractNodes(state.source);
    for (const slug of newSlugs) {
      const card = state.source.match(new RegExp('<article class="pick-card">\\s*<p class="pick-card-label" data-i18n="picks\\.' + slug + '\\.label">([\\s\\S]*?)<\\/article>'));
      if (!card) { errors.push('zh: new music card missing -> ' + slug); continue; }
      const body = card[1];
      if (!body.includes('<div class="pick-poster-row">') ||
          !body.includes('class="pick-image pick-image-poster"') ||
          /pick-poster-row-feature|pick-card-feature|pick-figure-still/.test(body))
        errors.push('zh: ' + slug + ' new card must use standard poster layout');
      if (!assetRefs(state.source).includes(KPOP_IMAGE[slug])) errors.push('zh: ' + slug + ' new poster not referenced');
      if (!state.kpopImages[slug]) errors.push('music: ' + slug + ' poster file missing');
      for (const key of ['label','title','desc','actions','note','imageCredit']) {
        if (!(zhNewNodes['picks.' + slug + '.' + key] || '').length)
          errors.push('zh: new song missing key -> ' + slug + '.' + key);
      }
      for (const lang of LANGS) {
        const p = state.pages[lang] || '';
        const nd = extractNodes(p);
        for (const key of ['label','title','desc','actions','note','imageCredit']) {
          const v = state.dict[lang].html['picks.' + slug + '.' + key];
          if (!v) errors.push(lang + ': new song key missing -> ' + slug + '.' + key);
          else if (!(nd['picks.' + slug + '.' + key] || '').includes(v))
            errors.push(lang + ': new song text not rendered -> ' + slug + '.' + key);
        }
        const alt = state.dict[lang].attr['picks.' + slug + '.imageAlt'];
        if (!alt || !p.includes(alt)) errors.push(lang + ': new song imageAlt missing -> ' + slug);
      }
    }
    const zhMiss = zhNewNodes['picks.misskorea.actions'] || '';
    if (!zhMiss.includes('i.y.qq.com/v8/playsong.html?songid=204137216'))
      errors.push('zh: misskorea must link QQ song page');
    if (/youtu\.?be|youtube\.com/.test(zhMiss)) errors.push('zh: misskorea actions must not carry YouTube');
    if (!/QQ 音乐只有歌曲页/.test(zhNewNodes['picks.misskorea.note'] || ''))
      errors.push('zh: misskorea must state QQ Music has no MV');
    for (const lang of LANGS) {
      const act = extractNodes(state.pages[lang] || '')['picks.misskorea.actions'] || '';
      if (!act.includes('https://youtu.be/iB0FLshLbLk')) errors.push(lang + ': misskorea YouTube link wrong');
      if (/y\.qq\.com|music\.163\.com/.test(act)) errors.push(lang + ': misskorea mainland link leaked');
    }
    for (const lang of ['zh', ...LANGS]) {
      const page = lang === 'zh' ? state.source : (state.pages[lang] || '');
      if (!page.replace(/<[^>]+>/g, ' ').includes(MUSIC_DISAMBIG[lang]))
        errors.push(lang + ': misskorea lost the not-Lee-Hyori disambiguation');
    }
    for (const slug of Object.keys(MUSIC_DATE_TEXT)) {
      for (const lang of ['zh', ...LANGS]) {
        const page = lang === 'zh' ? state.source : (state.pages[lang] || '');
        if (!page.includes(MUSIC_DATE_TEXT[slug]))
          errors.push(lang + ': ' + slug + ' exact release date ' + MUSIC_DATE_TEXT[slug] + ' missing');
      }
    }
    for (const lang of ['zh', ...LANGS]) {
      const page = lang === 'zh' ? state.source : (state.pages[lang] || '');
      for (const token of FORBIDDEN_DPRK) {
        if (page.includes(token)) errors.push(lang + ': forbidden DPRK resource token -> ' + token);
      }
    }
  }

  /* ---------- 影片档案：不得照抄线索站「只写剧情片」的说法 ---------- */
  if (!source.includes(FILM_SECTION)) errors.push('zh: film-note section missing');
  if (!source.includes('<a href="#film-note" data-i18n="nav.film">')) errors.push('zh: nav film link missing');
  for (const link of FILM_SOURCE_LINKS) {
    if (!source.includes('href="' + link + '"')) errors.push('zh: film source link missing -> ' + link);
  }
  {
    const filmText = source.replace(/<[^>]+>/g, ' ');
    for (const marker of FILM_MARKERS.zh) {
      if (!filmText.includes(marker)) errors.push('zh: film record lost the Gwangju fact -> ' + marker);
    }
  }
  for (const key of FILM_KEYS) {
    if (!(zhNodes[key] || '').length) errors.push('zh: film key missing/empty -> ' + key);
  }
  for (const lang of LANGS) {
    const p = state.pages[lang] || '';
    if (!p.includes(FILM_SECTION)) errors.push(lang + ': film-note section missing');
    if (!/<a href="#film-note"[^>]*data-i18n="nav\.film"/.test(p)) errors.push(lang + ': nav film link missing');
    for (const link of FILM_SOURCE_LINKS) {
      if (!p.includes('href="' + link + '"')) errors.push(lang + ': film source link missing -> ' + link);
    }
    for (const marker of FILM_MARKERS[lang]) {
      if (!p.includes(marker)) errors.push(lang + ': film record lost the Gwangju fact -> ' + marker);
    }
    for (const key of FILM_KEYS) {
      if (!(state.dict[lang].html[key] || '').length) errors.push(lang + ': film key missing/empty -> ' + key);
    }
  }
  checkOfficialPCGames(state, errors);
  return errors;
}

/* ---------- load real state ---------- */
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/i18n.js'), 'utf8'), sandbox);
const state = {
  source: fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'),
  pages: {},
  dict: sandbox.window.SITE_I18N,
  css: fs.readFileSync(path.join(ROOT, 'assets/styles.css'), 'utf8'),
  appJs: fs.readFileSync(path.join(ROOT, 'assets/app.js'), 'utf8'),
  assetExists: fs.existsSync(path.join(ROOT, 'assets/clipping-hkcd.jpg')),
  picksImageExists: fs.existsSync(path.join(ROOT, 'assets/oh-my-gran-poster.jpg')),
  musicImageExists: fs.existsSync(path.join(ROOT, MUSIC_IMAGE)),
  kpopImages: Object.fromEntries(KPOP_SLUGS.map(s => [s, fs.existsSync(path.join(ROOT, KPOP_IMAGE[s]))])),
  dramaImages: Object.fromEntries(DRAMA_SLUGS.map(slug => [slug,
    fs.existsSync(path.join(ROOT, DRAMA_IMAGE[slug]))])),
  gameImages: Object.fromEntries(GAME_SLUGS.map(slug => [slug,
    fs.existsSync(path.join(ROOT, GAME_IMAGE[slug]))])),
  officialGameImages: Object.fromEntries(PC_OFFICIAL_SLUGS.map(slug => [slug,
    fs.existsSync(path.join(ROOT, 'assets/' + slug + '-poster.jpg'))])),
  chainImages: Object.fromEntries(CHAIN_SLUGS.map(slug => [slug,
    fs.existsSync(path.join(ROOT, CHAIN_IMAGE[slug]))])),
  accImages: Object.fromEntries(ACC_SLUGS.map(slug => [slug,
    fs.existsSync(path.join(ROOT, ACC_IMAGE[slug]))])),
  sitemap: fs.existsSync(path.join(ROOT, 'sitemap.xml')) ? fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8') : '',
  robots: fs.existsSync(path.join(ROOT, 'robots.txt')) ? fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8') : ''
};
for (const lang of LANGS) {
  const file = path.join(ROOT, lang, 'index.html');
  state.pages[lang] = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

const realErrors = verify(state);
if (realErrors.length) {
  console.error('VERIFY FAILED (' + realErrors.length + ')');
  realErrors.slice(0, 40).forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log('VERIFY OK  ·  ' + Object.keys(extractNodes(state.source)).length +
  ' translated nodes  ·  ' + Object.keys(extractAttrs(state.source)).length +
  ' translated attributes  ·  4 languages  ·  archive: 4 pages + 1 image + 3 links');

/* ---------- injected-fault self-test ---------- */
const clone = (s) => JSON.parse(JSON.stringify(s));
const faults = [
  { name: 'missing translation key', mutate: s => { delete s.dict.jp.html['r3.title']; } },
  { name: 'Chinese leftover in translated page', mutate: s => {
    s.pages.en = s.pages.en.replace('Four reasons, one line I will not cross', '四个理由，一条底线');
  } },
  { name: 'wrong html lang', mutate: s => {
    s.pages.ko = s.pages.ko.replace('<html lang="ko">', '<html lang="zh-CN">');
  } },
  { name: 'unprefixed asset path', mutate: s => {
    s.pages.jp = s.pages.jp.replace('../assets/app.js', 'assets/app.js');
  } },
  { name: 'Chinese source deleted', mutate: s => { s.source = s.source.replace('喜欢不是免检', ''); } },
  { name: 'attr drift between zh dict and HTML', mutate: s => {
    s.dict.zh.attr['aria.brand'] = 'wrong';
  } },
  { name: 'broken language switch highlight', mutate: s => {
    s.pages.en = s.pages.en.replace('<a data-lang-link="en" href="../en/" lang="en" class="is-current" aria-current="page">',
      '<a data-lang-link="en" href="../en/" lang="en">');
  } },
  { name: 'clipping image file missing', mutate: s => { s.assetExists = false; } },
  { name: 'archive heading deleted from Chinese source', mutate: s => {
    s.source = s.source.replace('一页差点找不到的旧报', '');
  } },
  { name: 'archive caveat removed from Chinese source', mutate: s => {
    s.source = s.source.replace('不核实其中细节', '');
  } },
  { name: 'archive boundary statement dropped in translation', mutate: s => {
    s.pages.jp = s.pages.jp.replace(s.dict.jp.html['archive.boundary'], '');
  } },
  { name: 'archived report link removed', mutate: s => {
    s.pages.ko = s.pages.ko.replace(ARCHIVE_LINKS[1], '');
  } },
  { name: 'dead-domain reintroduced into Chinese source', mutate: s => {
    s.source = s.source.replace(
      'href="https://dujeongil-galaxy.github.io/a-reason-for-korea/"',
      'href="https://gd.people.com.cn/n/2014/0703/c123932-21570067-3.html"');
  } },
  { name: 'clipping image path not relativised', mutate: s => {
    s.pages.en = s.pages.en.replace('../assets/clipping-hkcd.jpg', 'assets/clipping-hkcd.jpg');
  } },
  { name: 'image alt left untranslated', mutate: s => {
    s.pages.en = s.pages.en.replace(s.dict.en.attr['archive.imgAlt'], '一张香港商报网的网页截图');
  } },
  { name: 'short label falls back to CJK glyph', mutate: s => {
    s.source = s.source.replace('aria-hidden="true">KR<', 'aria-hidden="true">韓<');
  } },
  { name: 'Chinese short label falls back to CJK glyph', mutate: s => {
    s.source = s.source.replace('aria-hidden="true">CN<', 'aria-hidden="true">中<');
  } },
  { name: 'Chinese short label is not uppercase Latin', mutate: s => {
    s.pages.en = s.pages.en.replace('aria-hidden="true">CN<', 'aria-hidden="true">cn<');
  } },
  { name: 'Japanese short label is not JP', mutate: s => {
    s.pages.jp = s.pages.jp.replace('aria-hidden="true">JP<', 'aria-hidden="true">日<');
  } },
  { name: 'short label missing from generated page', mutate: s => {
    s.pages.ko = s.pages.ko.replace(/<span class="lang-short"[^>]*>EN<\/span>/, '');
  } },
  { name: 'short label not hidden from screen readers', mutate: s => {
    s.pages.en = s.pages.en.replace('<span class="lang-short" aria-hidden="true">CN</span>',
      '<span class="lang-short">CN</span>');
  } },
  { name: 'full language name back to display:none', mutate: s => {
    s.css = s.css.replace('.lang-short { display: inline; }',
      '.lang-long { display: none; }\n  .lang-short { display: inline; }');
  } },
  { name: 'clip-based sr-only rule removed', mutate: s => {
    s.css = s.css.replace('clip: rect(0, 0, 0, 0);', 'clip: unset;');
  } },
  { name: 'Chinese clipping attribution anonymised', mutate: s => {
    s.source = s.source.replace('这张网页截图是站长给 AI 的', '有人留下一张网页截图');
  } },
  { name: 'Chinese intro slips back to first person "me"', mutate: s => {
    s.source = s.source.replace('这张网页截图是站长给 AI 的', '这张网页截图是站长给我的');
  } },
  { name: 'Chinese caption credits a reader again', mutate: s => {
    s.source = s.source.replace('站长提供的这张网页截图', '读者提供的一张网页截图');
  } },
  { name: 'English intro anonymised again', mutate: s => {
    s.pages.en = s.pages.en.replace('The owner of this site gave this screenshot to the AI', 'Someone left behind a screenshot');
  } },
  { name: 'English intro loses the AI recipient', mutate: s => {
    s.pages.en = s.pages.en.replace('to the AI', '');
  } },
  { name: 'Japanese intro slips back to first person', mutate: s => {
    s.pages.jp = s.pages.jp.replace('このスクリーンショットは、このサイトの持ち主が AI に渡したものです。',
      'このスクリーンショットは、このサイトの持ち主から届いたものです。');
  } },
  { name: 'Korean intro slips back to first person', mutate: s => {
    s.pages.ko = s.pages.ko.replace('이 스크린샷은 이 사이트의 주인이 AI에게 건넨 것입니다.',
      '이 스크린샷은 이 사이트의 주인이 건네준 것입니다.');
  } },
  { name: 'Japanese caption credits a reader again', mutate: s => {
    s.pages.jp = s.pages.jp.replace('このサイトの持ち主が提供したスクリーンショット', '読者から提供されたスクリーンショット');
  } },
  { name: 'dead-link badge removed', mutate: s => {
    s.pages.ko = s.pages.ko.replace(/<span class="link-status is-dead"[^>]*>[^<]*<\/span>\s*/, '');
  } },
  { name: 'all three links marked as live', mutate: s => {
    s.pages.en = s.pages.en.replace(/class="link-status is-dead"/g, 'class="link-status is-live"');
  } },
  { name: 'source page loses its live badge', mutate: s => {
    s.source = s.source.replace('class="link-status is-live"', 'class="link-status is-dead"');
  } },
  { name: 'link check note deleted', mutate: s => {
    s.pages.jp = s.pages.jp.replace(/<p class="archive-links-note"[\s\S]*?<\/p>/, '');
  } },
  { name: 'boundary claims archives are still available', mutate: s => {
    s.pages.en = s.pages.en.replace('Reports on the same story once appeared in a few public archives',
      'Reports on the same story are still available in a few public archives');
  } },
  { name: 'dead-link note reverts to 504', mutate: s => {
    s.pages.ko = s.pages.ko.replace('404를 반환한다', '504 / 404를 반환한다');
  } },
  { name: 'English product name reverts to Douyin', mutate: s => {
    s.dict.en.html['hero.sub'] = s.dict.en.html['hero.sub'].replace('One TikTok share', 'One Douyin share');
  } },
  { name: 'Japanese badge reverts to Douyin kanji', mutate: s => {
    s.dict.jp.html['origin.badge'] = '抖音（Douyin）の投稿より';
  } },
  { name: 'Korean reading link reverts to 더우인', mutate: s => {
    s.dict.ko.html['read1.title'] = '그 더우인 영상: 많은 고양이들이 한국에서 자랐으면 좋겠다';
  } },
  { name: 'TikTok removed from generated English page', mutate: s => {
    s.pages.en = s.pages.en.replace(/TikTok/g, 'Tik Tok');
  } },
  { name: 'Chinese source loses the original word 抖音', mutate: s => {
    s.source = s.source.replace(/一条抖音分享/g, '一条短视频分享');
  } },
  { name: 'read4 tag reverts to 近例', mutate: s => {
    s.source = s.source.replace('data-i18n="read4.tag">抖音<', 'data-i18n="read4.tag">近例<');
  } },
  { name: 'English read4 tag machine-translates to Douyin', mutate: s => {
    s.dict.en.html['read4.tag'] = 'Douyin';
  } },
  { name: 'Japanese read4 tag reverts to もう一本', mutate: s => {
    s.dict.jp.html['read4.tag'] = 'もう一本';
  } },
  { name: 'Korean read4 tag reverts to 또 하나', mutate: s => {
    s.dict.ko.html['read4.tag'] = '또 하나';
  } },
  { name: 'generated Korean page read4 tag tampered', mutate: s => {
    s.pages.ko = s.pages.ko.replace('data-i18n="read4.tag">TikTok<', 'data-i18n="read4.tag">또 하나<');
  } },
  { name: 'pirate site link reintroduced', mutate: s => {
    s.source = s.source.replace(AFF_LINK, 'https://www.ncat30.com/detail/30464.html');
  } },
  { name: 'YouTube purchase link reintroduced into US English page', mutate: s => {
    s.pages.en = s.pages.en.replace(AMAZON_LINK, YOUTUBE_LINK);
  } },
  { name: 'chain risk warning removed from Chinese source', mutate: s => {
    s.source = s.source.replace(/<p class="picks-chain-risk"[\s\S]*?<\/p>\r?\n/, '');
  } },
  { name: 'chain risk warning softened to generic advice', mutate: s => {
    s.source = s.source.replace(CHAIN_RISK_ZH, '请理性参与');
  } },
  { name: 'chain risk warning red and bold styling stripped', mutate: s => {
    s.css = s.css.replace('color: #C5221F; font-size: 13px; font-weight: 700;', 'color: var(--ink-soft); font-size: 13px; font-weight: 400;');
  } },
  { name: 'chain credit bold styling stripped', mutate: s => {
    s.css = s.css.replace('.picks-chain-credit { font-weight: 700; }', '.picks-chain-credit { font-weight: 400; }');
  } },
  { name: 'Netflix red bold note styling stripped', mutate: s => {
    s.css = s.css.replace('color: #C5221F; font-weight: 700;', 'color: var(--ink-soft); font-weight: 400;');
  } },
  { name: 'pick-desc inline link red bold styling stripped', mutate: s => {
    s.css = s.css.replace('.pick-desc a { font-weight: 700; color: #C5221F; }',
                          '.pick-desc a { font-weight: 400; color: var(--ink-soft); }');
  } },
  { name: 'Netflix note line removed from film actions', mutate: s => {
    s.source = s.source.replace(/<div class="pick-actions" data-i18n="picks\.film\.actions">[\s\S]*?<\/div>/,
      '<div class="pick-actions" data-i18n="picks.film.actions"></div>');
  } },
  { name: 'Prime Video link stripped from English page', mutate: s => {
    s.pages.en = s.pages.en.replace(AMAZON_LINK, 'https://nfshare.cn/');
  } },
  { name: 'Hong Kong region calque reintroduced into English button', mutate: s => {
    s.dict.en.html['picks.film.actions'] = s.dict.en.html['picks.film.actions']
      .replace('>Rent or buy on Prime Video', '>Hong Kong, China: rent or buy on Prime Video');
  } },
  { name: 'JP page given a YouTube link (JP rent/buy is on Apple TV)', mutate: s => {
    s.dict.jp.html['picks.film.actions'] = s.dict.jp.html['picks.film.actions']
      .replace(APPLE_TV_LINK, YOUTUBE_LINK);
  } },
  { name: 'JP page switched back to the HK-region aff link', mutate: s => {
    s.dict.jp.html['picks.film.actions'] = s.dict.jp.html['picks.film.actions']
      .replace(APPLE_TV_LINK, AFF_LINK);
  } },
  { name: 'KO page switched to the US Prime Video link', mutate: s => {
    s.dict.ko.html['picks.film.actions'] = s.dict.en.html['picks.film.actions'];
  } },
  { name: 'KO YouTube link stripped', mutate: s => {
    s.dict.ko.html['picks.film.actions'] = s.dict.ko.html['picks.film.actions']
      .replace(YOUTUBE_LINK, 'https://www.netflix.com/');
  } },
  { name: 'Korean Netflix note reverted to machine-translated search wording', mutate: s => {
    s.dict.ko.html['picks.film.actions'] = s.dict.ko.html['picks.film.actions']
      .replace('중국 본토 시청자는 <a href="' + AFF_LINK + '" target="_blank" rel="noopener noreferrer">여기</a>를 눌러 Netflix에 접속하세요.', 'Netflix에서 제목을 검색해 보세요. 정식 서비스로 응원해 주세요');
  } },
  { name: 'English Netflix note link stripped of the aff entry', mutate: s => {
    s.dict.en.html['picks.film.actions'] = s.dict.en.html['picks.film.actions']
      .replace(AFF_LINK, 'https://nfshare.cn/');
  } },
  { name: 'Japanese Netflix note reverted to machine-translated search wording', mutate: s => {
    s.dict.jp.html['picks.film.actions'] = s.dict.jp.html['picks.film.actions']
      .replace('中国大陸からご覧になる場合は、<a href="' + AFF_LINK + '" target="_blank" rel="noopener noreferrer">こちら</a>から Netflix にアクセスできます。', 'Netflix で作品名を検索してご覧ください。正版で応援しましょう');
  } },
  { name: 'invitation code stripped from Chinese page', mutate: s => {
    s.source = s.source.replace(/5rfpUarUEd/g, '');
  } },
  { name: 'picks section removed from Chinese source', mutate: s => {
    s.source = s.source.replace(/<section class="section picks" id="picks">[\s\S]*?<\/section>/, '');
  } },
  { name: 'English picks heading machine-translated', mutate: s => {
    s.dict.en.html['picks.head'] = 'Webmaster recommend';
  } },
  { name: 'withdrawn Korean music card reintroduced to Chinese source', mutate: s => {
    s.source += '<article class="pick-card pick-card-soon"><p data-i18n="picks.music.soon">此专区正在建设中，请稍安勿躁</p></article>';
  } },
  /* 音乐区（2026-11-22）：《请开门》卡漂移 / 通道错区 / 结构回退 */
  { name: 'music MV thumbnail reference stripped', mutate: s => {
    s.source = s.source.replace('src="assets/door-mv-thumb.jpg"', '');
  } },
  { name: 'music MV thumbnail file marked missing', mutate: s => { s.musicImageExists = false; } },
  { name: 'music card reverted to special stacked layout', mutate: s => {
    s.source = s.source.replace(/(data-i18n="picks\.music1\.label"[^>]*>[\s\S]*?<\/p>\s*)<div class="pick-poster-row">/,
      '$1<div class="pick-poster-row pick-poster-row-feature">');
  } },
  { name: 'Chinese page MV button swapped to YouTube (region violation)', mutate: s => {
    s.source = s.source.replace(QQ_MV_LINK, YT_MV_LINK_WATCH);
  } },
  { name: 'English page MV button swapped to QQ Music (region violation)', mutate: s => {
    s.dict.en.html['picks.music1.actions'] =
      '<a class="pick-link pick-link-featured" href="' + QQ_MV_LINK + '" target="_blank" rel="noopener noreferrer">Watch the MV on QQ Music</a>';
  } },
  { name: 'English ytnote link stripped (aff-style drift)', mutate: s => {
    s.dict.en.html['picks.music1.ytnote'] =
      'Viewers outside mainland China: <a href="https://youtu.be/dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer">watch the MV</a>.';
  } },
  { name: 'Japanese music image credit left in Chinese', mutate: s => {
    s.dict.jp.html['picks.music1.imageCredit'] = MUSIC_CREDIT.zh;
  } },
  { name: 'Korean music imageAlt removed', mutate: s => {
    delete s.dict.ko.attr['picks.music1.imageAlt'];
  } },
  { name: 'music label year drifted', mutate: s => {
    s.source = s.source.replace('data-i18n="picks.music1.label">韩国音乐 · 2013', 'data-i18n="picks.music1.label">韩国音乐 · 2015');
  } },
  { name: 'nav dropdown left open by default in CSS', mutate: s => {
    s.source = s.source.replace(/<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.music1\.label">[\s\S]*?<\/article>/, '');
  } },
  { name: 'withdrawn music placeholder reintroduced to English page', mutate: s => {
    s.pages.en = s.pages.en.replace('id="picks"', 'id="picks" data-marker="picks.music.soon"');
  } },
  { name: 'narrow-viewport guard removed', mutate: s => {
    s.css = s.css.replace(/@media \(max-width: 360px\) \{[\s\S]*?\n\}/, '');
  } },
  { name: 'picks preview image removed from source', mutate: s => {
    s.source = s.source.replace('src="assets/oh-my-gran-poster.jpg"', '');
  } },
  { name: 'picks image credit left in Chinese', mutate: s => {
    s.dict.en.html['picks.film.imageCredit'] = PICKS_CREDIT.zh;
  } },
  { name: 'picks poster reverted to 16:9 still aspect-ratio', mutate: s => {
    s.css = s.css.replace('aspect-ratio: auto; object-fit: cover; object-position: top center;',
      'aspect-ratio: 16 / 9; object-fit: cover; object-position: top center;');
  } },
  { name: 'Chinese title reverted to the old literary wording', mutate: s => {
    s.source = s.source.replace(SEO_TITLE_KEYWORD.zh, SEO_STALE_TITLE.zh);
  } },
  { name: 'English description loses the why-like-Korea keyword', mutate: s => {
    s.dict.en.attr['meta.description'] = s.dict.en.attr['meta.description']
      .replace(SEO_DESC_KEYWORD.en, 'A TikTok share');
  } },
  { name: 'Japanese SEO keyword stripped from title', mutate: s => {
    s.dict.jp.html['meta.title'] = '韓国が好きなら、理由も欲しい';
  } },
  { name: 'Korean JSON-LD given the wrong language', mutate: s => {
    s.dict.ko.html['meta.jsonld'] = s.dict.ko.html['meta.jsonld'].replace('"inLanguage":"ko"', '"inLanguage":"ja"');
  } },
  { name: 'English JSON-LD url points at the Chinese root', mutate: s => {
    s.dict.en.html['meta.jsonld'] = s.dict.en.html['meta.jsonld'].replace(SITE + 'en/', SITE);
  } },
  { name: 'JSON-LD removed from Chinese source', mutate: s => {
    s.source = s.source.replace(/<script type="application\/ld\+json"[\s\S]*?<\/script>/, '');
  } },
  { name: 'sitemap link dropped from English page', mutate: s => {
    s.pages.en = s.pages.en.replace(/<link rel="sitemap"[^>]*>/, '');
  } },
  { name: 'sitemap loses the Korean URL', mutate: s => {
    s.sitemap = s.sitemap.replace('<loc>' + SITE + 'ko/</loc>', '');
  } },
  { name: 'sitemap loses x-default hreflang', mutate: s => {
    s.sitemap = s.sitemap.replace(/<xhtml:link rel="alternate" hreflang="x-default"[^>]*>/g, '');
  } },
  { name: 'robots.txt loses the sitemap directive', mutate: s => {
    s.robots = 'User-agent: *\nAllow: /\n';
  } },
  { name: 'sitemap.xml deleted', mutate: s => { s.sitemap = ''; } },
  { name: 'drama timeline card removed from Chinese source', mutate: s => {
    s.source = s.source.replace(/<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.drama1\.label">[\s\S]*?<\/article>/, '');
  } },
  { name: 'drama timeline reversed (oldest first)', mutate: s => {
    const block = s.source.match(/data-i18n="picks\.drama1\.label"[\s\S]*?data-i18n="picks\.drama5\.label"/);
    if (block) {
      const labels = [...block[0].matchAll(/data-i18n="picks\.drama[1-5]\.label"/g)].map(m => m[0]);
      let i = 0;
      s.source = s.source.replace(block[0], block[0].replace(/data-i18n="picks\.drama[1-5]\.label"/g, () => labels[labels.length - 1 - i++]));
    }
  } },
  { name: 'drama poster reference stripped', mutate: s => {
    s.source = s.source.replace('src="assets/doctor-cha-poster.jpg"', '');
  } },
  { name: 'drama poster asset marked missing', mutate: s => { s.dramaImages.drama3 = false; } },
  { name: 'drama label year drifted', mutate: s => {
    s.source = s.source.replace('data-i18n="picks.drama1.label">剧集 · 2023', 'data-i18n="picks.drama1.label">剧集 · 2022');
  } },
  { name: 'drama buy button added where no channel exists (KO)', mutate: s => {
    s.dict.ko.html['picks.drama1.actions'] = '<a class="pick-link pick-link-featured" href="' + AFF_LINK + '" target="_blank">buy</a>' + s.dict.ko.html['picks.drama1.actions'];
  } },
  { name: 'drama localized Netflix note reverted to Chinese', mutate: s => {
    s.dict.en.html['picks.drama2.actions'] = s.dict.en.html['picks.drama2.actions'].replace(DRAMA_NOTE.en, DRAMA_NOTE.zh);
  } },
  { name: 'drama EN US buy link stripped', mutate: s => {
    s.dict.en.html['picks.drama4.actions'] = s.dict.en.html['picks.drama4.actions'].replace(DRAMA_AMAZON_US, 'https://nfshare.cn/');
  } },
  { name: 'drama JP star buy link pointed at US', mutate: s => {
    s.dict.jp.html['picks.drama3.actions'] = s.dict.jp.html['picks.drama3.actions'].replace(DRAMA_AMAZON_JP_STAR, DRAMA_AMAZON_US);
  } },
  { name: 'drama JP heirs buy link swapped to star gti', mutate: s => {
    s.dict.jp.html['picks.drama4.actions'] = s.dict.jp.html['picks.drama4.actions'].replace(DRAMA_AMAZON_JP_HEIRS, DRAMA_AMAZON_JP_STAR);
  } },
  { name: 'drama Chinese source Netflix link swapped to homepage', mutate: s => {
    s.source = s.source.replace('https://www.netflix.com/title/81682438', 'https://www.netflix.com/');
  } },
  { name: 'drama aff entry removed from Japanese note', mutate: s => {
    s.dict.jp.html['picks.drama5.actions'] = s.dict.jp.html['picks.drama5.actions'].replace(AFF_LINK, 'https://nfshare.cn/');
  } },
  { name: 'drama HK-region aff button stripped from Chinese source', mutate: s => {
    s.source = s.source.replace(/data-i18n="picks\.drama3\.actions">([\s\S]*?)<\/div>/,
      (m, inner) => 'data-i18n="picks.drama3.actions">' + inner.replace(/<a class="pick-link pick-link-featured"[^>]*>[\s\S]*?<\/a>/, '') + '</div>');
  } },
  { name: 'drama imageAlt left untranslated in English', mutate: s => {
    s.dict.en.attr['picks.drama1.imageAlt'] = '《车贞淑医生》海报：严正花饰演的车贞淑';
  } },
  { name: 'poster aspect-ratio guard removed', mutate: s => {
    s.css = s.css.replace('aspect-ratio: auto; object-fit: cover;', 'aspect-ratio: 16 / 9; object-fit: cover;');
  } },
  /* 订阅制渠道（2026-11-22）：漂移 / 指向 Netflix / 重复 / 挂到无渠道区 / 被挤到购买按钮下面 */
  { name: 'drama EN subscription link drifted off Kocowa', mutate: s => {
    s.pages.en = s.pages.en.replace('https://watch.amazon.com/detail?gti=amzn1.dv.gti.b8608d49-3ed5-4ed9-9655-fbd806b49fce', 'https://www.viki.com/');
  } },
  { name: 'drama JP subscription button pointed at Netflix', mutate: s => {
    s.pages.jp = s.pages.jp.replace('https://video.unext.jp/episode/SID0003058/ED00073535', 'https://www.tving.com/contents/P001446333');
  } },
  { name: 'drama KO subscription button duplicated', mutate: s => {
    const anchor = '<a class="pick-link pick-link-sub" href="https://www.tving.com/contents/P001710496" target="_blank" rel="noopener noreferrer">TVING에서 보기 (정액제)</a>';
    s.pages.ko = s.pages.ko.replace(anchor, anchor + anchor);
  } },
  { name: 'drama EN subscription button added to a Netflix-only card', mutate: s => {
    s.pages.en = s.pages.en.replace(/(data-i18n="picks\.drama1\.actions">)/,
      '$1<a class="pick-link pick-link-sub" href="https://www.viki.com/tv/12699c-heirs" target="_blank" rel="noopener noreferrer">Watch on Viki (subscription)</a>');
  } },
  { name: 'drama EN subscription button pushed below the buy button', mutate: s => {
    s.pages.en = s.pages.en.replace(
      /(<a class="pick-link pick-link-sub"[^>]*>[^<]*<\/a>)(<a class="pick-link pick-link-featured"[^>]*>[^<]*<\/a>)/,
      '$2$1');
  } },
  /* 二级菜单 / 占位 / 两栏布局（2026-11-22） */
  { name: 'nav dropdown K-pop item points to a dead anchor', mutate: s => {
    s.pages.en = s.pages.en.replace('href="#picks-kpop"', 'href="#picks-nowhere"');
  } },
  { name: 'section subhead reverted to Chinese on Japanese page', mutate: s => {
    s.pages.jp = s.pages.jp.replace(/(data-i18n="picks\.subhead">)[^<]*(<\/p>)/, '$1' + NAV_SUB.zh.drama + '$2');
  } },
  { name: 'nav dropdown left open by default in CSS', mutate: s => {
    s.css = s.css.replace('display: none; position: absolute;', 'display: block; position: absolute;');
  } },
  { name: 'film card forced back into special stacked layout', mutate: s => {
    s.source = s.source.replace(/(data-i18n="picks\.film\.label"[^>]*>[\s\S]*?<\/p>\s*)<div class="pick-poster-row">/,
      '$1<div class="pick-poster-row pick-poster-row-feature">');
  } },
  { name: 'film card image reverted to plain still class', mutate: s => {
    s.source = s.source.replace('class="pick-image pick-image-poster" src="assets/oh-my-gran-poster.jpg"',
      'class="pick-image" src="assets/oh-my-gran-poster.jpg"');
  } },
  { name: 'special film-card layout CSS reintroduced', mutate: s => {
    s.css = s.css.replace('.pick-poster-body .pick-title { margin-top: 0; }',
      '.pick-poster-body .pick-title { margin-top: 0; }\n.pick-card-feature { grid-column: 1 / -1; order: -1; }');
  } },
  { name: 'picks grid reverted to per-card height (blank gap returns)', mutate: s => {
    s.css = s.css.replace('.picks-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }',
      '.picks-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; align-items: start; }');
  } },
  { name: 'poster row no longer fills card height', mutate: s => {
    s.css = s.css.replace('gap: 18px; flex: 1; }', 'gap: 18px; }');
  } },
  { name: 'card actions no longer stick to the bottom', mutate: s => {
    s.css = s.css.replace('.pick-poster-body .pick-actions { margin-top: auto; }', '');
  } },
  /* 游戏区（2026-11-23） */
  { name: 'PC games anchor removed from nav', mutate: s => {
    s.pages.en = s.pages.en.replace('href="#picks-pc-games"', 'href="#picks-nowhere"');
  } },
  { name: 'mobile games anchor removed from Chinese source', mutate: s => {
    s.source = s.source.replace('id="picks-mobile-games"', '');
  } },
  { name: 'game card missing from Chinese source', mutate: s => {
    s.source = s.source.replace(/<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.nikke\.label">[\s\S]*?<\/article>/, '');
  } },
  { name: 'PC games order reversed (newest not first)', mutate: s => {
    s.source = s.source.replace(
      /(<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.sololeveling\.label">[\s\S]*?<\/article>)(\s*)(<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.stellarblade\.label">[\s\S]*?<\/article>)/,
      '$3$2$1');
  } },
  { name: 'new PC game card removed from Chinese source', mutate: s => {
    s.source = s.source.replace(/<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.blessunleashed\.label">[\s\S]*?<\/article>/, '');
  } },
  { name: 'new PC game Steam link stripped', mutate: s => {
    s.dict.en.html['picks.sololeveling.actions'] = '<a class="pick-link pick-link-featured" href="https://example.com/">Steam</a>';
  } },
  { name: 'new PC game poster marked missing', mutate: s => { s.gameImages.blessunleashed = false; } },
  { name: 'PC platform button uses wrong region prefix', mutate: s => {
    s.dict.en.html['picks.liesofp.actions'] = s.dict.en.html['picks.liesofp.actions']
      .replace('store.playstation.com/en-us/', 'store.playstation.com/zh-hant-hk/');
  } },
  { name: 'PC platform button cross-region leak', mutate: s => {
    s.dict.jp.html['picks.pubg.actions'] = s.dict.jp.html['picks.pubg.actions']
      .replace('www.xbox.com/ja-JP/', 'www.xbox.com/en-US/');
  } },
  { name: 'PS button added to a game with no PS version', mutate: s => {
    s.dict.zh === undefined || (s.source = s.source.replace(
      'data-i18n="picks.eternalreturn.actions">',
      'data-i18n="picks.eternalreturn.actions">'));
    s.dict.en.html['picks.eternalreturn.actions'] += '<a class="pick-link pick-link-secondary" href="https://store.playstation.com/en-us/concept/10006052">PlayStation</a>';
  } },
  { name: 'PS button missing from a game that has a PS version', mutate: s => {
    const tag = '<a class="pick-link pick-link-secondary" href="https://store.playstation.com/ko-kr/concept/10006891" target="_blank" rel="noopener noreferrer">PlayStation</a>';
    s.dict.ko.html['picks.stellarblade.actions'] = s.dict.ko.html['picks.stellarblade.actions'].replace(tag, '');
    s.pages.ko = s.pages.ko.replace(tag, '');
  } },
  { name: 'game poster asset marked missing', mutate: s => { s.gameImages.liesofp = false; } },
  { name: 'game poster reference stripped', mutate: s => {
    s.source = s.source.replace('src="assets/browndust-poster.jpg"', '');
  } },
  { name: 'game card forced into special layout', mutate: s => {
    s.source = s.source.replace(/(data-i18n="picks\.pubg\.label"[^>]*>[\s\S]*?<\/p>\s*)<div class="pick-poster-row">/,
      '$1<div class="pick-poster-row pick-poster-row-feature">');
  } },
  { name: 'PC game Steam link stripped', mutate: s => {
    s.dict.en.html['picks.stellarblade.actions'] = '<a class="pick-link pick-link-featured" href="https://example.com/">Steam</a>';
  } },
  { name: 'mobile game Google Play channel stripped', mutate: s => {
    s.dict.ko.html['picks.browndust.actions'] = s.dict.ko.html['picks.browndust.actions'].replace(/https:\/\/play\.google\.com\/store\/apps\/details[^"]*/, 'https://example.com/');
  } },
  { name: 'mobile game QooApp channel stripped from Chinese source', mutate: s => {
    s.source = s.source.replace(/data-i18n="picks\.nikke\.actions">[\s\S]*?qoo-app\.com[^"]*"[^>]*>[^<]*<\/a>/,
      'data-i18n="picks.nikke.actions">');
  } },
  { name: 'game imageAlt left untranslated in Japanese', mutate: s => {
    s.dict.jp.attr['picks.liesofp.imageAlt'] = 'Lies of P 游戏海报';
  } },
  { name: 'game imageCredit node deleted from dictionary', mutate: s => {
    delete s.dict.en.html['picks.eternalreturn.imageCredit'];
  } },
  { name: 'game translated page missing mobile games anchor', mutate: s => {
    s.pages.jp = s.pages.jp.replace('id="picks-mobile-games"', '');
  } },
  /* 链游平台（2026-11-23） */
  { name: 'chain platforms anchor removed from Chinese source', mutate: s => {
    s.source = s.source.replace('id="picks-chain-games"', '');
  } },
  { name: 'chain risk notice deleted from Chinese source', mutate: s => {
    s.source = s.source.replace(/data-i18n="picks\.chain\.notice">[^<]*<\/p>/, '');
  } },
  { name: 'chain card missing from Chinese source', mutate: s => {
    s.source = s.source.replace(/<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.msu\.label">[\s\S]*?<\/article>/, '');
  } },
  { name: 'chain poster asset marked missing', mutate: s => { s.chainImages.one = false; } },
  { name: 'chain poster reference stripped from translated page', mutate: s => {
    s.pages.en = s.pages.en.replace('src="../assets/one-chain.jpg"', '');
  } },
  { name: 'chain card forced into special layout', mutate: s => {
    s.source = s.source.replace(/(data-i18n="picks\.one\.label"[^>]*>[\s\S]*?<\/p>\s*)<div class="pick-poster-row">/,
      '$1<div class="pick-poster-row pick-poster-row-feature">');
  } },
  { name: 'chain official link swapped to a game store', mutate: s => {
    s.dict.ko.html['picks.one.actions'] = s.dict.ko.html['picks.one.actions'].replace('to.nexus', 'apps.apple.com');
  } },
  { name: 'chain download button added to Chinese card', mutate: s => {
    s.source = s.source.replace(/(data-i18n="picks\.msu\.actions">)/,
      '$1<a class="pick-link pick-link-secondary" href="https://play.google.com/store/apps/details?id=x">Download</a>');
  } },
  { name: 'chain imageAlt left untranslated in English', mutate: s => {
    s.dict.en.attr['picks.one.imageAlt'] = 'ONE 官方主视觉（未翻译）';
  } },
  { name: 'chain imageCredit node deleted from Japanese', mutate: s => {
    delete s.dict.jp.html['picks.one.imageCredit'];
  } },
  { name: 'chain credit note removed from Chinese source', mutate: s => {
    s.source = s.source.replace(/data-i18n="picks\.chain\.credit">[^<]*<\/p>/, '');
  } },
  { name: 'chain credit text reverted to generic', mutate: s => {
    s.source = s.source.replace(CHAIN_CREDIT_ZH, '仅仅推荐');
  } },
  { name: 'chain credit node deleted from English dict', mutate: s => {
    delete s.dict.en.html['picks.chain.credit'];
  } },
  { name: 'chain fifth card missing from Chinese source', mutate: s => {
    s.source = s.source.replace(/<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.planetarium\.label">[\s\S]*?<\/article>/, '');
  } },
  { name: 'health badge removed from Chinese source', mutate: s => {
    s.source = s.source.replace(/<span class="pick-health pick-health-\w+" data-i18n="picks\.one\.health">[^<]*<\/span>/, '');
  } },
  { name: 'health badge class downgraded good to fair', mutate: s => {
    s.source = s.source.replace('class="pick-health pick-health-good" data-i18n="picks.msu.health"', 'class="pick-health pick-health-fair" data-i18n="picks.msu.health"');
  } },
  { name: 'health badge text drifted in Chinese source', mutate: s => {
    s.source = s.source.replace('data-i18n="picks.msu.health">健康<', 'data-i18n="picks.msu.health">尚可<');
  } },
  { name: 'health legend removed from Chinese source', mutate: s => {
    s.source = s.source.replace(/<p class="picks-chain-legend"[^>]*>[^<]*<\/p>/, '');
  } },
  { name: 'health legend left untranslated in English', mutate: s => {
    s.dict.en.html['picks.chain.legend'] = '标记说明：健康';
  } },
  { name: 'health badge left untranslated in English', mutate: s => {
    s.dict.en.html['picks.msu.health'] = '健康';
  } },
  { name: 'health badge node deleted from Japanese dict', mutate: s => {
    delete s.dict.jp.html['picks.planetarium.health'];
  } },
  { name: 'Yooldo card reintroduced into Chinese source', mutate: s => {
    s.source = s.source.replace('id="picks-chain-games"', 'id="picks-chain-games" data-yooldo="picks.yooldo.label"');
  } },
  { name: 'coming-soon card reintroduced into English page', mutate: s => {
    s.pages.en = s.pages.en.replace('id="picks-chain-games"', 'id="picks-chain-games" data-soon="picks.chain.soon.label"');
  } },
  { name: 'health badge green style stripped', mutate: s => {
    s.css = s.css.replace('.pick-health-good', '.pick-health-nogood');
  } },
  { name: 'Korean NFT restriction note reverted to generic', mutate: s => {
    s.dict.ko.html['picks.msu.note'] = '플랫폼만 소개하며 개별 게임은 다루지 않습니다.';
  } },
  { name: 'accelerators anchor removed from Chinese source', mutate: s => {
    s.source = s.source.replace('id="picks-accelerators"', '');
  } },
  { name: 'ETalien promo code 574567 scrubbed', mutate: s => {
    s.source = s.source.split('574567').join('');
  } },
  { name: 'Geili invite code link replaced with bare homepage', mutate: s => {
    s.source = s.source.split('https://www.geilijiasu.com/fission/accept?inviteCode=9ydA8H').join('https://www.geilijiasu.com/');
    s.dict.en.html['picks.geili.actions'] = s.dict.en.html['picks.geili.actions'].replace(/https:\/\/www\.geilijiasu\.com\/fission\/accept\?inviteCode=9ydA8H/, 'https://www.geilijiasu.com/');
  } },
  { name: 'accelerator poster removed from Chinese source', mutate: s => {
    s.source = s.source.replace('src="assets/etalien-accelerator.jpg"', '');
  } },
  { name: 'accelerator card switched to special feature layout', mutate: s => {
    s.source = s.source.replace(/(data-i18n="picks\.geili\.label">[\s\S]{0,80}?)<div class="pick-poster-row">/, '$1<div class="pick-poster-row-feature">');
  } },
  { name: 'accelerator imageCredit deleted from Japanese', mutate: s => {
    delete s.dict.jp.html['picks.etalien.imageCredit'];
  } },
  { name: 'accelerator notice deleted from Korean', mutate: s => {
    delete s.dict.ko.html['picks.accelerator.notice'];
  } },
  { name: 'a fixed card loses its poster in source', mutate: s => {
    s.source = s.source.replace('src="assets/bnb-poster.jpg"', 'src="assets/missing.jpg"');
  } },
  { name: 'a fixed card label key removed from source', mutate: s => {
    s.source = s.source.replace('data-i18n="picks.drama9.label"', 'data-i18n="picks.drama0.label"');
  } },
  { name: 'a fixed card translation removed from Japanese', mutate: s => {
    delete s.dict.jp.html['picks.drama11.title'];
  } },
  { name: 'a fixed card imageAlt removed from Korean', mutate: s => {
    delete s.dict.ko.attr['picks.kart.imageAlt'];
  } },
  { name: 'data-zh-only marker reintroduced into source', mutate: s => {
    s.source = s.source.replace('<article class="pick-card">', '<article class="pick-card" data-zh-only>');
  } },
  { name: 'a fixed card poster missing from English page', mutate: s => {
    s.pages.en = s.pages.en.replace('assets/rbeat-poster.jpg', 'assets/gone.jpg');
  } },
  { name: 'beloved eundong poster removed from Korean page', mutate: s => {
    s.pages.ko = s.pages.ko.replace('assets/beloved-eundong-poster.jpg', 'assets/gone.jpg');
  } },
  { name: 'dear my friends title removed from dictionary', mutate: s => {
    delete s.dict.en.html['picks.drama13.title'];
  } },
  { name: 'kpop card removed from Chinese source', mutate: s => {
    s.source = s.source.replace(/<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.minty\.label">[\s\S]*?<\/article>/, '');
  } },
  { name: 'kpop Chinese page uses YouTube', mutate: s => {
    s.source = s.source.replace(KPOP_ZH_LINK.minty, 'https://youtu.be/6rzemizJoNQ');
  } },
  { name: 'kpop foreign page uses QQ Music', mutate: s => {
    s.dict.en.html['picks.seoeve.actions'] = '<a class="pick-link pick-link-featured" href="https://y.qq.com/n/m/detail/mv/index.html?vid=004AWNv33sYmI4" target="_blank" rel="noopener noreferrer">QQ</a>';
  } },
  { name: 'kpop thumbnail missing from assets', mutate: s => { s.kpopImages.ussoboy = false; } },
  { name: 'kpop headsub line removed from English', mutate: s => { delete s.dict.en.html['picks.headsub']; } },
  { name: 'nav drama anchor reverted to whole picks section', mutate: s => {
    s.source = s.source.replace('<a href="#picks-dramas" data-i18n="nav.picks.drama">', '<a href="#picks" data-i18n="nav.picks.drama">');
  } },
  { name: 'nav drama anchor drifted on English page', mutate: s => {
    s.pages.en = s.pages.en.replace('href="#picks-dramas" data-i18n="nav.picks.drama"', 'href="#picks" data-i18n="nav.picks.drama"');
  } },
  { name: 'legacy searchGame box reintroduced', mutate: s => {
    s.source = s.source.replace('id="searchPC"', 'id="searchGame"');
  } },
  { name: 'searchPC scope widened to all game grids', mutate: s => {
    s.appJs = s.appJs.replace("{ box: 'searchPC', containers: ['picks-pc-games'] }", "{ box: 'searchPC', containers: ['picks-pc-games', 'picks-mobile-games'] }");
  } },
  { name: 'searchMobile input missing from source', mutate: s => {
    s.source = s.source.replace(/<input class="picks-search" id="searchMobile"[^>]*>/, '');
  } },
  { name: 'drama order reversed (oldest first)', mutate: s => {
    const gi = s.source.indexOf('id="picks-dramas"');
    const gEnd = s.source.indexOf('id="searchKpop"', gi);
    const arts = [...s.source.slice(gi, gEnd).matchAll(/        <article class="pick-card">[\s\S]*?        <\/article>/g)].map(m => m[0]);
    if (arts.length >= 2) {
      const rev = arts.slice().reverse();
      let k = 0;
      s.source = s.source.slice(0, gi) + s.source.slice(gi, gEnd).replace(/        <article class="pick-card">[\s\S]*?        <\/article>/g, () => rev[k++]) + s.source.slice(gEnd);
    }
  } },
  { name: 'music cards not in release-date order', mutate: s => {
    const gi = s.source.indexOf('id="picks-kpop"');
    const gEnd = s.source.indexOf('picks-yt-note', gi);
    const arts = [...s.source.slice(gi, gEnd).matchAll(/        <article class="pick-card">[\s\S]*?        <\/article>/g)].map(m => m[0]);
    if (arts.length >= 2) {
      const rev = arts.slice().reverse();
      let k = 0;
      s.source = s.source.slice(0, gi) + s.source.slice(gi, gEnd).replace(/        <article class="pick-card">[\s\S]*?        <\/article>/g, () => rev[k++]) + s.source.slice(gEnd);
    }
  } },
  { name: 'a PC game label year drifted to wrong year', mutate: s => {
    s.source = s.source.replace('data-i18n="picks.kart.label">韩国 · Nexon · 2006<', 'data-i18n="picks.kart.label">韩国 · Nexon · 2016<');
  } }
,
  { name: 'misskorea Chinese link swapped to YouTube', mutate: s => {
    s.source = s.source.replace('https://i.y.qq.com/v8/playsong.html?songid=204137216#webchat_redirect', 'https://youtu.be/iB0FLshLbLk');
  } },
  { name: 'misskorea English link leaked back to QQ Music', mutate: s => {
    s.pages.en = s.pages.en.replace('href="https://youtu.be/iB0FLshLbLk"', 'href="https://y.qq.com/n/m/detail/mv/index.html?vid=204137216"');
  } },
  { name: 'study card moved before Open the Door (release order drift)', mutate: s => {
    const re = /(<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.music1\.label">[\s\S]*?<\/article>)(\s*)(<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.study\.label">[\s\S]*?<\/article>)/;
    if (re.test(s.source)) s.source = s.source.replace(re, (_m, a, sp, b) => b + sp + a);
  } },
  { name: 'not-Lee-Hyori disambiguation scrubbed from Korean page', mutate: s => {
    s.pages.ko = s.pages.ko.replace('이효리가 아닙니다', '다른 가수입니다');
  } },
  { name: 'exact 2013-07-11 release date scrubbed from all four pages', mutate: s => {
    s.source = s.source.replace('2013-07-11', '2013-07-10');
    for (const l of ['en','jp','ko']) s.pages[l] = s.pages[l].replace('2013-07-11', '2013-07-10');
  } },
  { name: 'DPRK resource clue injected into Chinese study card', mutate: s => {
    s.source = s.source.replace('data-i18n="picks.study.note">', 'data-i18n="picks.study.note">북한 ');
  } },
  { name: 'new study poster marked missing', mutate: s => {
    s.kpopImages.study = false;
  } },
  { name: 'film-note section removed from Chinese source', mutate: s => {
    s.source = s.source.replace(FILM_SECTION, '');
  } },
  { name: 'Gwangju history scrubbed from English film record', mutate: s => {
    const old = s.dict.en.html['film.history.p1'];
    s.dict.en.html['film.history.p1'] = 'A film about a long journey.';
    s.pages.en = s.pages.en.replace(old, 'A film about a long journey.');
  } },
  { name: 'Gwangju marker removed from Japanese film record', mutate: s => {
    s.pages.jp = s.pages.jp.replace('1980年5月18日', 'その頃');
  } },
  { name: 'Korean death-toll estimate deleted', mutate: s => {
    s.dict.ko.html['film.history.p1'] = s.dict.ko.html['film.history.p1'].split('2,500').join('');
    s.pages.ko = s.pages.ko.split('2,500').join('');
  } },
  { name: 'one external source link dropped from Japanese page', mutate: s => {
    s.pages.jp = s.pages.jp.replace('href="' + FILM_SOURCE_LINKS[2] + '"', 'href="#"');
  } },
  { name: 'nav film link drifted on Korean page', mutate: s => {
    s.pages.ko = s.pages.ko.replace('<a href="#film-note"', '<a href="#picks"');
  } },
  { name: 'pirate listing domain injected into Chinese film record', mutate: s => {
    s.source = s.source.replace('data-i18n="film.sourcesNote">', 'data-i18n="film.sourcesNote">ncat30.com ');
  } },
  { name: 'film source key deleted from English dictionary', mutate: s => {
    delete s.dict.en.html['film.src5'];
  } },
  { name: 'dead Viki link restored on English drama card', mutate: s => {
    s.dict.en.html['picks.drama3.actions'] = s.dict.en.html['picks.drama3.actions']
      .replace('https://watch.amazon.com/detail?gti=amzn1.dv.gti.b8608d49-3ed5-4ed9-9655-fbd806b49fce', 'https://www.viki.com/tv/20503c-my-love-from-the-star');
    s.pages.en = s.pages.en.replace('https://watch.amazon.com/detail?gti=amzn1.dv.gti.b8608d49-3ed5-4ed9-9655-fbd806b49fce', 'https://www.viki.com/tv/20503c-my-love-from-the-star');
  } },
  { name: 'Netflix deep link swapped to netflix homepage on English page', mutate: s => {
    s.pages.en = s.pages.en.replace('https://www.netflix.com/title/82024852', 'https://www.netflix.com/');
  } },
  { name: 'Netflix title ID tampered on English drama9', mutate: s => {
    s.pages.en = s.pages.en.replace('https://www.netflix.com/title/82024852', 'https://www.netflix.com/title/00000000');
    s.dict.en.html['picks.drama9.actions'] = s.dict.en.html['picks.drama9.actions'].replace('https://www.netflix.com/title/82024852', 'https://www.netflix.com/title/00000000');
  } },
  { name: 'Netflix deep link injected into Japanese drama3 (no JP license)', mutate: s => {
    s.pages.jp = s.pages.jp.replace('data-i18n="picks.drama3.actions">', 'data-i18n="picks.drama3.actions"><a class="pick-link pick-link-sub" href="https://www.netflix.com/title/80025266">x</a>');
    s.dict.jp.html['picks.drama3.actions'] = s.dict.jp.html['picks.drama3.actions']
      .replace('data-i18n', 'data-i18n') + '<a class="pick-link pick-link-sub" href="https://www.netflix.com/title/80025266">x</a>';
  } },
  { name: 'English Death Game Prime subscription button removed', mutate: s => {
    s.pages.en = s.pages.en.replace('https://watch.amazon.com/detail?gti=amzn1.dv.gti.a3b03bc3-0b7d-49e5-8eb1-6d80ac89dd13', 'https://www.netflix.com/title/99999999');
  } },
  { name: 'no-licensed-source wording scrubbed from Korean page', mutate: s => {
    s.pages.ko = s.pages.ko.replace(SUB_UNAVAILABLE.ko, '');
  } },
  { name: 'Audition English page switched to CN server', mutate: s => {
    s.pages.en = s.pages.en.replace(AUDITION_SERVER.en, AUDITION_SERVER.zh);
  } },
  { name: 'Audition Korean page switched to TW server', mutate: s => {
    s.pages.ko = s.pages.ko.replace(AUDITION_SERVER.ko, AUDITION_SERVER.en);
  } },
  /* 2026-11-24 站长质疑《拥抱太阳的月亮》2012 年份来自盗版站，要求以 Netflix 为准。
     真浏览器打开 Netflix 官方条目 title/80031790：中文界面「拥抱太阳的月亮 2012 TV-14」，
     英文界面「The Moon Embracing the Sun 2012 20 Episodes」；维基/MBC 首播 2012-01-04。
     结论：2012 正确且与盗版站无关。故障注入确认改成别的年份会判红。 */
  { name: 'Moon Embracing the Sun year tampered from Netflix-verified 2012', mutate: s => {
    s.source = s.source.replace('data-i18n="picks.drama6.label">剧集 · 2012', 'data-i18n="picks.drama6.label">剧集 · 2013');
    s.pages.en = s.pages.en.replace('picks.drama6.label">TV series · 2012', 'picks.drama6.label">TV series · 2013');
  } },
  /* 2026-11-24 剑灵/天堂2：地区官网与同年精确日期故障注入。 */
  { name: 'Blade & Soul zh card switched from TW official site to NA site', mutate: s => {
    s.source = s.source.replace('href="https://tw.ncsoft.com/bns/"', 'href="https://www.bladeandsoul.com/"');
  } },
  { name: 'Lineage II en card switched from NA site to TW site', mutate: s => {
    s.pages.en = s.pages.en.replace('https://www.lineage2.com/', 'https://tw.ncsoft.com/lineage2/');
  } },
  { name: 'Blade & Soul ko card switched to NA site', mutate: s => {
    s.pages.ko = s.pages.ko.replace('https://bns.plaync.com/', 'https://www.bladeandsoul.com/');
  } },
  { name: 'Blade & Soul console button injected', mutate: s => {
    s.dict.en.html['picks.bladeandsoul.actions'] += '<a href="https://www.xbox.com/en-US/games/store/x/1">Xbox</a>';
    s.pages.en = s.pages.en.replace('href="https://www.bladeandsoul.com/" target="_blank" rel="noopener noreferrer">NA official site</a>',
      'href="https://www.bladeandsoul.com/" target="_blank" rel="noopener noreferrer">NA official site</a><a href="https://www.xbox.com/en-US/games/store/x/1">Xbox</a>');
  } },
  { name: 'Lineage II poster reference broken', mutate: s => {
    s.source = s.source.replace('src="assets/lineage2-poster.jpg"', 'src="assets/missing-poster.jpg"');
  } },
  { name: 'Lineage II moved after Crazy Arcade despite later 2003 release', mutate: s => {
    const re = /(<article class="pick-card">\s*<p class="pick-card-label" data-i18n="picks\.(lineage2|bnb)\.label">[\s\S]*?<\/article>)/g;
    const blocks = [...s.source.matchAll(re)].map(m => m[1]);
    if (blocks.length === 2) {
      s.source = s.source.replace(blocks[0], '@@SWAP@@')
        .replace(blocks[1], blocks[0])
        .replace('@@SWAP@@', blocks[1]);
    }
  } },
  { name: 'Lineage II note deleted from Japanese dictionary', mutate: s => {
    delete s.dict.jp.html['picks.lineage2.note'];
  } },
  /* 2026-11-24 四语按区 Netflix：地区串链 / 条目 ID 篡改 / 中文泛链 / 韩文无授权区注入。 */
  { name: 'zh Netflix title ID tampered', mutate: s => {
    s.source = s.source.replace('https://www.netflix.com/title/81682438', 'https://www.netflix.com/title/00000000');
  } },
  { name: 'jp Netflix title ID tampered', mutate: s => {
    s.pages.jp = s.pages.jp.replace('https://www.netflix.com/title/81033650', 'https://www.netflix.com/title/00000000');
    s.dict.jp.html['picks.drama4.actions'] = s.dict.jp.html['picks.drama4.actions'].replace('https://www.netflix.com/title/81033650', 'https://www.netflix.com/title/00000000');
  } },
  { name: 'ko Netflix button removed from licensed card', mutate: s => {
    s.pages.ko = s.pages.ko.replace('<a class="pick-link pick-link-sub" href="https://www.netflix.com/title/81422314"', '<a class="pick-link pick-link-sub" href="https://www.tving.com/contents/REM"');
    s.dict.ko.html['picks.drama7.actions'] = s.dict.ko.html['picks.drama7.actions'].replace('https://www.netflix.com/title/81422314', 'https://www.tving.com/contents/REM');
  } },
  { name: 'ko Netflix injected into unlicensed drama6', mutate: s => {
    s.pages.ko = s.pages.ko.replace('data-i18n="picks.drama6.actions">', 'data-i18n="picks.drama6.actions"><a class="pick-link pick-link-sub" href="https://www.netflix.com/title/80031790">x</a>');
    s.dict.ko.html['picks.drama6.actions'] = s.dict.ko.html['picks.drama6.actions'] + '<a class="pick-link pick-link-sub" href="https://www.netflix.com/title/80031790">x</a>';
  } },
  { name: 'zh Netflix button text drifted', mutate: s => {
    s.source = s.source.replace('在 Netflix 观看（订阅）', 'Netflix 搜索片名');
  } },
  { name: 'en Netflix button moved below aff note', mutate: s => {
    s.pages.en = s.pages.en.replace('data-i18n="picks.drama6.actions"><a class="pick-link pick-link-sub" href="https://www.netflix.com/title/80031790" target="_blank" rel="noopener noreferrer">Watch on Netflix (subscription)</a>', 'data-i18n="picks.drama6.actions">');
    s.dict.en.html['picks.drama6.actions'] = s.dict.en.html['picks.drama6.actions'].replace('<a class="pick-link pick-link-sub" href="https://www.netflix.com/title/80031790" target="_blank" rel="noopener noreferrer">Watch on Netflix (subscription)</a>', '');
  } },
  { name: 'zh film Catchplay subscription button removed', mutate: s => {
    const u = 'https://www.catchplay.com/tw/video/3ec4e52d-46b6-4b5e-aca4-f06ff0b46d45';
    s.source = s.source.replace('<a class="pick-link pick-link-sub" href="' + u + '" target="_blank" rel="noopener noreferrer">在 Catchplay 观看（订阅·台湾）</a>', '');
  } },
  { name: 'zh film Catchplay URL tampered', mutate: s => {
    s.source = s.source.replace('https://www.catchplay.com/tw/video/3ec4e52d-46b6-4b5e-aca4-f06ff0b46d45', 'https://www.catchplay.com/tw/video/00000000');
  } },
  { name: 'jp drama6 U-NEXT button removed', mutate: s => {
    s.pages.jp = s.pages.jp.replace('<a class="pick-link pick-link-sub" href="https://video.unext.jp/episode/SID0003538/ED00032550" target="_blank" rel="noopener noreferrer">U-NEXT で見る（定額制）</a>', '');
    s.dict.jp.html['picks.drama6.actions'] = s.dict.jp.html['picks.drama6.actions'].replace('<a class="pick-link pick-link-sub" href="https://video.unext.jp/episode/SID0003538/ED00032550" target="_blank" rel="noopener noreferrer">U-NEXT で見る（定額制）</a>', '');
  } },
  { name: 'ko drama13 TVING label drifted', mutate: s => {
    s.pages.ko = s.pages.ko.replace('TVING에서 보기 (정액제)', 'TVING에서 찾기');
    s.dict.ko.html['picks.drama13.actions'] = s.dict.ko.html['picks.drama13.actions'].replace('TVING에서 보기 (정액제)', 'TVING에서 찾기');
  } },
];
let caught = 0;
for (const fault of faults) {
  const broken = clone(state);
  fault.mutate(broken);
  const errs = verify(broken);
  if (errs.length > 0) caught += 1;
  else console.error('  ! self-test missed: ' + fault.name);
}
console.log('SELF-TEST ' + caught + '/' + faults.length + ' injected faults rejected');
if (caught !== faults.length) process.exit(1);
