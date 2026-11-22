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
  '../assets/clipping-hkcd.jpg', '../assets/oh-my-gran-still.jpg'
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
/* 外文页按钮文案禁止直译中文语境的「港区」划分；中文源保留原始口径不受此限 */
const FORBIDDEN_REGION_CALQUES = ['Hong Kong, China', '중국 홍콩', '香港地区', '香港地域'];
const PICKS_HEAD = {
  zh: '站长推荐', en: 'Picks from the webmaster', jp: '運営のおすすめ', ko: '운영자 추천'
};
const MUSIC_SOON = {
  zh: '此专区正在建设中，请稍安勿躁',
  en: 'This section is under construction. Please stay tuned.',
  jp: 'このコーナーは準備中です。しばらくお待ちください。',
  ko: '이 코너는 준비 중입니다. 조금만 기다려 주세요.'
};
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
  'picks.film.title': '《哦！文姬》',
  'picks.music.soon': '此专区正在建设中，请稍安勿躁'
};
/* 推荐必须带预览图（站长 2026-11-22 规则）：本地图片 + 四语 alt + 来源说明。 */
const PICKS_IMAGE = 'assets/oh-my-gran-still.jpg';
const PICKS_CREDIT = {
  zh: '剧照：《哦！文姬》片方宣传物料（经 Letterboxd 收录）',
  en: 'Still from Oh! My Gran (promotional material, via Letterboxd)',
  jp: '『오! 문희』の劇中写真（報道用素材・Letterboxd 掲載）',
  ko: '『오! 문희』 스틸컷(홍보용 자료, Letterboxd 수록)'
};

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
  for (const link of [...YOUTUBE_DOMAINS, FORBIDDEN_NETFLIX_LINK]) {
    if (source.includes(link)) errors.push('zh: 中文按港区，购买链接 forbidden -> ' + link);
  }
  for (const dom of FORBIDDEN_PIRATE_DOMAINS) {
    if (source.includes(dom)) errors.push('zh: 盗版站域名不得出现 -> ' + dom);
  }
  for (const [key, expected] of Object.entries(PICKS_ZH_NODES)) {
    if (zhNodes[key] !== expected) errors.push('zh: picks node wrong -> ' + key);
  }
  if (!assetRefs(source).includes(PICKS_IMAGE)) errors.push('zh: picks preview image not referenced');
  if (!state.picksImageExists) errors.push('picks: preview image file missing from assets/');
  /* HTML 的 width/height 属性会压过 aspect-ratio，必须有 height:auto 才是 16:9 */
  if (!/\.pick-image\s*\{[^}]*height:\s*auto/.test(state.css)) {
    errors.push('zh: picks image missing height:auto (HTML height attribute wins)');
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
    errors.push('zh: poster images must keep native aspect-ratio');
  }
  if (!state.css.includes('@media (max-width: 420px)')) {
    errors.push('zh: poster row narrow-viewport guard missing');
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
    if (page.includes(FORBIDDEN_NETFLIX_LINK)) errors.push(lang + ': Netflix link forbidden -> ' + FORBIDDEN_NETFLIX_LINK);
    for (const dom of FORBIDDEN_PIRATE_DOMAINS) {
      if (page.includes(dom)) errors.push(lang + ': 盗版站域名不得出现 -> ' + dom);
    }
    if ((nodes['picks.head'] || '') !== PICKS_HEAD[lang]) errors.push(lang + ': picks heading drift');
    if ((nodes['picks.music.soon'] || '') !== MUSIC_SOON[lang]) errors.push(lang + ': music placeholder drift');
    if ((nodes['picks.film.imageCredit'] || '') !== PICKS_CREDIT[lang]) {
      errors.push(lang + ': picks image credit drift');
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
      if (actions.includes(FORBIDDEN_NETFLIX_LINK)) errors.push(lang + ': ' + slug + ' Netflix link forbidden');
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
  assetExists: fs.existsSync(path.join(ROOT, 'assets/clipping-hkcd.jpg')),
  picksImageExists: fs.existsSync(path.join(ROOT, 'assets/oh-my-gran-still.jpg')),
  dramaImages: Object.fromEntries(DRAMA_SLUGS.map(slug => [slug,
    fs.existsSync(path.join(ROOT, DRAMA_IMAGE[slug]))])),
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
  { name: 'Netflix red bold note styling stripped', mutate: s => {
    s.css = s.css.replace('color: #C5221F; font-weight: 700;', 'color: var(--ink-soft); font-weight: 400;');
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
    s.source = s.source.replace('5rfpUarUEd', '');
  } },
  { name: 'Chinese music placeholder removed', mutate: s => {
    s.source = s.source.replace('此专区正在建设中，请稍安勿躁', '');
  } },
  { name: 'English picks heading machine-translated', mutate: s => {
    s.dict.en.html['picks.head'] = 'Webmaster recommend';
  } },
  { name: 'Korean music placeholder left in Chinese', mutate: s => {
    s.dict.ko.html['picks.music.soon'] = '此专区正在建设中，请稍安勿躁';
  } },
  { name: 'narrow-viewport guard removed', mutate: s => {
    s.css = s.css.replace(/@media \(max-width: 360px\) \{[\s\S]*?\n\}/, '');
  } },
  { name: 'picks preview image removed from source', mutate: s => {
    s.source = s.source.replace('src="assets/oh-my-gran-still.jpg"', '');
  } },
  { name: 'picks image credit left in Chinese', mutate: s => {
    s.dict.en.html['picks.film.imageCredit'] = PICKS_CREDIT.zh;
  } },
  { name: 'picks image height:auto removed', mutate: s => {
    s.css = s.css.replace('width: 100%; height: auto; aspect-ratio: 16 / 9', 'width: 100%; aspect-ratio: 16 / 9');
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
  { name: 'drama Chinese source given a Netflix link', mutate: s => {
    s.source = s.source.replace(/data-i18n="picks\.drama1\.actions"><a class="pick-link pick-link-featured" href="[^"]*nfshare[^"]*"/,
      'data-i18n="picks.drama1.actions"><a class="pick-link pick-link-featured" href="https://www.netflix.com/title/x"');
  } },
  { name: 'drama aff entry removed from Japanese note', mutate: s => {
    s.dict.jp.html['picks.drama5.actions'] = s.dict.jp.html['picks.drama5.actions'].replace(AFF_LINK, 'https://nfshare.cn/');
  } },
  { name: 'drama HK-region aff button stripped from Chinese source', mutate: s => {
    s.source = s.source.replace(/data-i18n="picks\.drama3\.actions"><a class="pick-link pick-link-featured"[\s\S]*?<\/a>/,
      'data-i18n="picks.drama3.actions">');
  } },
  { name: 'drama imageAlt left untranslated in English', mutate: s => {
    s.dict.en.attr['picks.drama1.imageAlt'] = '《车贞淑医生》海报：严正花饰演的车贞淑';
  } },
  { name: 'poster native aspect-ratio guard removed', mutate: s => {
    s.css = s.css.replace('.pick-image-poster { width: 100%; height: auto; aspect-ratio: auto; object-fit: contain; }', '');
  } }
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
