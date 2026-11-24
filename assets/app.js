/* ============================================================
   哈韩，也要有一个理由 — interactions (4 languages)

   Page copy for every language is baked into that language's static
   HTML by scripts/build-i18n.mjs. This file only handles:
     - scroll reveal
     - the lamp counter
     - the "write your own reason" card
   Runtime strings come from window.SITE_I18N[body[data-lang]].js.

   No network calls. No tracking. User input goes through textContent.
   ============================================================ */
(function () {
  'use strict';

  var lang = document.body.getAttribute('data-lang') || 'zh';
  var all = window.SITE_I18N || {};
  var strings = (all[lang] && all[lang].js) || (all.zh && all.zh.js) || {};
  function t(key, fallback) {
    return Object.prototype.hasOwnProperty.call(strings, key) ? strings[key] : fallback;
  }

  /* ---- scroll reveal (progressive enhancement, never hides content) ---- */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var hasObserver = 'IntersectionObserver' in window;
  var observer = null;

  if (hasObserver) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pending');
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }

  revealItems.forEach(function (el) {
    var belowFold = el.getBoundingClientRect().top > window.innerHeight * 0.92;
    if (hasObserver && belowFold) {
      el.classList.add('pending');
      observer.observe(el);
    } else {
      el.classList.add('is-visible');
    }
  });

  /* Fail-safe: if the observer never fires, show everything after 2.5s. */
  window.setTimeout(function () {
    revealItems.forEach(function (el) {
      el.classList.remove('pending');
      el.classList.add('is-visible');
    });
  }, 2500);

  /* ---- a small lamp, stored only in this browser ---- */
  var STORE_KEY = 'a-reason-lamp-count';
  var lampArt = document.getElementById('lampArt');
  var lampButton = document.getElementById('lampButton');
  var lampButtonText = document.getElementById('lampButtonText');
  var lampCountEl = document.getElementById('lampCount');
  var lampOffText = lampButtonText ? lampButtonText.textContent : ''; /* already localised in HTML */
  var count = 0;

  try {
    var saved = window.localStorage.getItem(STORE_KEY);
    if (saved !== null) {
      var parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0) { count = parsed; }
    }
  } catch (e) {
    /* storage may be blocked; the button still works for this visit */
  }

  function renderLamp() {
    if (lampCountEl) { lampCountEl.textContent = String(count); }
    if (count > 0 && lampArt) { lampArt.classList.add('is-lit'); }
    if (count > 0 && lampButton) { lampButton.classList.add('is-on'); }
    if (lampButtonText) {
      lampButtonText.textContent = count > 0 ? t('lamp.on', '再留一盏灯') : lampOffText;
    }
  }

  renderLamp();

  if (lampButton) {
    lampButton.addEventListener('click', function () {
      count += 1;
      try { window.localStorage.setItem(STORE_KEY, String(count)); } catch (e) { /* ignore */ }
      renderLamp();
      if (lampArt) {
        lampArt.classList.remove('is-lit');
        /* restart the gentle blink animation */
        void lampArt.offsetWidth;
        lampArt.classList.add('is-lit');
      }
    });
  }

  /* ---- write your own reason ---- */
  var input = document.getElementById('myReason');
  var makeCard = document.getElementById('makeCard');
  var cardArea = document.getElementById('cardArea');
  var cardText = document.getElementById('cardText');
  var copyCard = document.getElementById('copyCard');
  var copyStatus = document.getElementById('copyStatus');
  var fallbackText = t('card.fallback', '我喜欢这里，因为它让善意有落脚的地方。');

  function buildCard() {
    if (!input || !cardText || !cardArea) { return; }
    var value = input.value.trim() || fallbackText;
    cardText.textContent = value;               /* textContent keeps user input inert */
    cardArea.hidden = false;
    if (copyStatus) { copyStatus.textContent = ''; }
  }

  if (makeCard) { makeCard.addEventListener('click', buildCard); }
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); buildCard(); }
    });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('copy failed'));
      } catch (err) {
        document.body.removeChild(ta);
        reject(err);
      }
    });
  }

  if (copyCard) {
    copyCard.addEventListener('click', function () {
      var text = (cardText && cardText.textContent) || '';
      var full = text + t('copy.suffix', '\n—— 哈韩，也要有一个理由 · 这个世界不能没有小猫');
      copyToClipboard(full).then(function () {
        if (copyStatus) { copyStatus.textContent = t('copy.ok', '已复制，可以贴给朋友了。'); }
      }).catch(function () {
        if (copyStatus) { copyStatus.textContent = t('copy.fail', '复制没成功，可以直接选中卡片文字。'); }
      });
    });
  }

  /* ---- 分区搜索（看韩剧 / 听K-POP / 游戏）；中文支持拼音与首字母模糊 ---- */
  (function () {
    var PY = window.SXG_PINYIN || {};
    var isZh = (lang === 'zh');
    function pyOf(s) {
      var full = '', ini = '';
      for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i), p = PY[ch];
        if (p) { full += p; ini += p.charAt(0); }
        else { var lc = ch.toLowerCase(); if ((lc >= 'a' && lc <= 'z') || (lc >= '0' && lc <= '9')) { full += lc; ini += lc; } }
      }
      return { full: full, ini: ini };
    }
    var SCOPES = [
      { box: 'searchDrama', containers: ['picks-dramas'] },
      { box: 'searchKpop', containers: ['picks-kpop'] },
      { box: 'searchPC', containers: ['picks-pc-games'] },
      { box: 'searchMobile', containers: ['picks-mobile-games'] }
    ];
    SCOPES.forEach(function (sc) {
      var inp = document.getElementById(sc.box);
      if (!inp) return;
      var cards = [];
      sc.containers.forEach(function (id) {
        var c = document.getElementById(id);
        if (c) cards = cards.concat(Array.prototype.slice.call(c.querySelectorAll('.pick-card')));
      });
      var meta = cards.map(function (card) {
        var text = card.textContent || '';
        var raw = text.toLowerCase().replace(/\s+/g, '');
        var p = isZh ? pyOf(text) : null;
        return { card: card, raw: raw, full: p ? p.full : '', ini: p ? p.ini : '' };
      });
      inp.addEventListener('input', function () {
        var q = inp.value.trim().toLowerCase();
        var qn = q.replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
        meta.forEach(function (o) {
          var hit = !qn || o.raw.indexOf(qn) >= 0 || (isZh && (o.full.indexOf(qn) >= 0 || o.ini.indexOf(qn) >= 0));
          o.card.style.display = hit ? '' : 'none';
        });
      });
    });
  })();
})();
