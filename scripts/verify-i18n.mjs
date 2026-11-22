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
  '../assets/clipping-hkcd.jpg'
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
/* 站长推荐（2026-11-22 指令）：片名线索来自盗版站，但该域名绝不能出现在页面上；
   引导去 Netflix 支持正版，中国大陆链接的邀请码必须逐字保留。 */
const FORBIDDEN_PIRATE_DOMAINS = ['ncat30.com'];
const PICKS_LINKS = ['https://www.netflix.com/', 'https://nfshare.cn/?sid=5rfpUarUEd'];
const PICKS_HEAD = {
  zh: '站长推荐', en: 'Picks from the webmaster', jp: '運営のおすすめ', ko: '운영자 추천'
};
const MUSIC_SOON = {
  zh: '此专区正在建设中，请稍安勿躁',
  en: 'This section is under construction. Please stay tuned.',
  jp: 'このコーナーは準備中です。しばらくお待ちください。',
  ko: '이 코너는 준비 중입니다. 조금만 기다려 주세요.'
};
const PICKS_ZH_NODES = {
  'picks.head': '站长推荐',
  'picks.film.title': '《哦！文姬》',
  'picks.music.soon': '此专区正在建设中，请稍安勿躁'
};

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
  for (const link of PICKS_LINKS) {
    if (!source.includes(link)) errors.push('zh: picks link missing -> ' + link);
  }
  for (const dom of FORBIDDEN_PIRATE_DOMAINS) {
    if (source.includes(dom)) errors.push('zh: 盗版站域名不得出现 -> ' + dom);
  }
  for (const [key, expected] of Object.entries(PICKS_ZH_NODES)) {
    if (zhNodes[key] !== expected) errors.push('zh: picks node wrong -> ' + key);
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

    /* 站长推荐：四语链接一致，盗版域名禁入，标题与占位句逐字锁定 */
    if (!page.includes('<section class="section picks" id="picks">')) {
      errors.push(lang + ': picks section missing');
    }
    for (const link of PICKS_LINKS) {
      if (!page.includes(link)) errors.push(lang + ': picks link missing -> ' + link);
    }
    for (const dom of FORBIDDEN_PIRATE_DOMAINS) {
      if (page.includes(dom)) errors.push(lang + ': 盗版站域名不得出现 -> ' + dom);
    }
    if ((nodes['picks.head'] || '') !== PICKS_HEAD[lang]) errors.push(lang + ': picks heading drift');
    if ((nodes['picks.music.soon'] || '') !== MUSIC_SOON[lang]) errors.push(lang + ': music placeholder drift');

    /* no Chinese body copy left behind */
    for (const marker of CHINESE_MARKERS) {
      if (page.includes(marker)) errors.push(lang + ': untranslated Chinese left in page -> ' + marker);
    }
  }

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
  assetExists: fs.existsSync(path.join(ROOT, 'assets/clipping-hkcd.jpg'))
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
    s.source = s.source.replace('https://www.netflix.com/', 'https://www.ncat30.com/detail/30464.html');
  } },
  { name: 'invitation code stripped from China link', mutate: s => {
    s.pages.en = s.pages.en.replace('https://nfshare.cn/?sid=5rfpUarUEd', 'https://nfshare.cn/');
  } },
  { name: 'Chinese music placeholder removed', mutate: s => {
    s.source = s.source.replace('此专区正在建设中，请稍安勿躁', '');
  } },
  { name: 'English picks heading machine-translated', mutate: s => {
    s.dict.en.html['picks.head'] = 'Webmaster recommend';
  } },
  { name: 'Korean music placeholder left in Chinese', mutate: s => {
    s.dict.ko.html['picks.music.soon'] = '此专区正在建设中，请稍安勿躁';
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
