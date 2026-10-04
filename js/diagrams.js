/* ============================================================
   diagrams.js — راه‌اندازی انیمیشن شکل‌ها و نمودارهای SVG
   ------------------------------------------------------------
   ۱) کلاس kl-motion را روی <html> می‌گذارد تا انیمیشن‌ها مسلط شوند
      (اگر JS اجرا نشود، شکل‌ها در حالت عادی و خوانا می‌مانند).
   ۲) با IntersectionObserver، وقتی شکل وارد دید می‌شود کلاس kl-in
      را می‌گذارد تا انیمیشن‌ها اجرا شوند.
   ۳) شمارنده‌های عددی (data-count) را از صفر شمارش می‌کند.
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- شمارش اعداد فارسی ---------- */
  const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  function toFa(value) {
    return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
  }

  function formatNumber(value, decimals) {
    const fixed = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
    return toFa(fixed.replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));
  }

  /* ---------- ۱) اعلان پشتیبانی از انیمیشن ---------- */
  function markMotion() {
    if (reduceMotion) return;
    document.documentElement.classList.add('kl-motion');
  }

  /* ---------- ۲) اجرای انیمیشن شکل‌ها هنگام ورود به دید ---------- */
  function runOnce(el, fn) {
    if (el.dataset.klPlayed === '1') return;
    el.dataset.klPlayed = '1';
    fn(el);
  }

  function initFigureObserver() {
    const figures = document.querySelectorAll('.kl-article figure.kl-fig');
    if (!figures.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      figures.forEach((fig) => fig.classList.add('kl-in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runOnce(entry.target, (fig) => fig.classList.add('kl-in'));
          observer.unobserve(fig);
        });
      },
      { root: null, rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    figures.forEach((fig) => observer.observe(fig));
  }

  /* ---------- ۳) شمارنده‌ی اعداد ---------- */
  function animateCount(el) {
    const raw = el.getAttribute('data-count') || '0';
    const target = parseFloat(raw);
    if (isNaN(target)) return;

    const decimals = (raw.split('.')[1] || '').length;
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const duration = parseInt(el.getAttribute('data-duration') || '1400', 10);

    if (reduceMotion) {
      el.textContent = prefix + formatNumber(target, decimals) + suffix;
      return;
    }

    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + formatNumber(target * eased, decimals) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = prefix + formatNumber(target, decimals) + suffix;
    };
    requestAnimationFrame(step);
  }

  function initCounters() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;

    /* شمارنده‌های داخل شکل، با ورود شکل فعال می‌شوند */
    const inFigures = [];
    nums.forEach((el) => {
      if (el.closest('figure.kl-fig')) inFigures.push(el);
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      nums.forEach((el) => animateCount(el));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runOnce(entry.target, animateCount);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    inFigures.forEach((el) => io.observe(el));

    /* شمارنده‌های بیرون از شکل (کارت‌های آمار) */
    const outside = [];
    nums.forEach((el) => {
      if (!el.closest('figure.kl-fig')) outside.push(el);
    });

    if (outside.length) {
      const io2 = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            runOnce(entry.target, animateCount);
            io2.unobserve(entry.target);
          });
        },
        { threshold: 0.3 }
      );
      outside.forEach((el) => io2.observe(el));
    }
  }

  /* ---------- ۴) ذره‌های SMIL: تکرار بی‌نهایت ---------- */
  /* <animateMotion repeatCount="indefinite"> به‌صورت خودکار کار می‌کند،
     فقط اگر کاربر کاهش حرکت خواسته باشد آن‌ها را متوقف می‌کنیم. */
  function freezeParticles() {
    if (!reduceMotion) return;
    document.querySelectorAll('.kl-article figure.kl-fig animateMotion').forEach((node) => {
      node.setAttribute('repeatCount', '0');
    });
  }

  /* ---------- راه‌اندازی ---------- */
  function initAll() {
    freezeParticles();
    initFigureObserver();
    initCounters();
  }

  /* کلاس kl-motion باید تا حد ممکن زود اعمال شود تا شکل‌های بالای صفحه
     یک فریم «پرش» نداشته باشند. */
  markMotion();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();