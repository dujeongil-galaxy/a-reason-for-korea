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
const LANGS = ['en', 'ja', 'ko'];
const HTML_LANG = { en: 'en', ja: 'ja', ko: 'ko', zh: 'zh-CN' };
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
  'https://gd.people.com.cn/n/2014/0703/c123932-21570067-3.html',
  'https://news.sxrb.com/sxxww/xwpd/gjxw/3941327.shtml',
  'https://news.ifeng.com/c/7fk6pvzKGtR'
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

function assetRefs(html) {
  return [...html.matchAll(/\b(?:href|src)="([^"]*(?:assets\/|favicon\.svg)[^"]*)"/g)].map(m => m[1]);
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
    const boundary = (d.html || {})['archive.boundary'];
    if (!boundary || !page.includes(boundary)) {
      errors.push(lang + ': archive boundary statement missing or altered');
    }

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
  { name: 'missing translation key', mutate: s => { delete s.dict.ja.html['r3.title']; } },
  { name: 'Chinese leftover in translated page', mutate: s => {
    s.pages.en = s.pages.en.replace('Four reasons, one line I will not cross', '四个理由，一条底线');
  } },
  { name: 'wrong html lang', mutate: s => {
    s.pages.ko = s.pages.ko.replace('<html lang="ko">', '<html lang="zh-CN">');
  } },
  { name: 'unprefixed asset path', mutate: s => {
    s.pages.ja = s.pages.ja.replace('../assets/app.js', 'assets/app.js');
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
    s.pages.ja = s.pages.ja.replace(s.dict.ja.html['archive.boundary'], '');
  } },
  { name: 'archived report link removed', mutate: s => {
    s.pages.ko = s.pages.ko.replace(ARCHIVE_LINKS[1], '');
  } },
  { name: 'clipping image path not relativised', mutate: s => {
    s.pages.en = s.pages.en.replace('../assets/clipping-hkcd.jpg', 'assets/clipping-hkcd.jpg');
  } },
  { name: 'image alt left untranslated', mutate: s => {
    s.pages.en = s.pages.en.replace(s.dict.en.attr['archive.imgAlt'], '一张香港商报网的网页截图');
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
