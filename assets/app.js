/* ============================================================
   哈韩，也要有一个理由 — interactions
   No network calls. No tracking. Everything stays in this page.
   ============================================================ */
(function () {
  'use strict';

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
    if (lampButtonText) { lampButtonText.textContent = count > 0 ? '再留一盏灯' : '留一盏灯'; }
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
  var fallbackText = '我喜欢这里，因为它让善意有落脚的地方。';

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
      var full = text + '\n—— 哈韩，也要有一个理由 · 这个世界不能没有小猫';
      copyToClipboard(full).then(function () {
        if (copyStatus) { copyStatus.textContent = '已复制，可以贴给朋友了。'; }
      }).catch(function () {
        if (copyStatus) { copyStatus.textContent = '复制没成功，可以直接选中卡片文字。'; }
      });
    });
  }
})();
