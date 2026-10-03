/* ============================================================
   Main UI — navigation, mobile menu, back-to-top, toast, misc
   ============================================================ */
(function () {
  'use strict';

  const HF = (window.HF = window.HF || {});

  /* ---------- Toast ---------- */
  function showToast(message, type) {
    type = type || 'info';
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.background =
      type === 'success' ? 'var(--color-success)' :
      type === 'error' ? 'var(--color-danger)' :
      'var(--color-primary)';
    toast.classList.add('show');
    clearTimeout(window.__hf_toast_timer);
    window.__hf_toast_timer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  /* ---------- Sticky nav shadow ---------- */
  function initNavShadow() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu - Hamburger Menu ---------- */
  function initMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    if (!toggle || !menu) return;

    const close = () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      // Restore body scroll
      document.body.style.overflow = '';
    };

    const open = () => {
      menu.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menu.classList.contains('open')) {
        close();
      } else {
        open();
      }
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  }

  /* ---------- Active nav link ---------- */
  function initActiveLink() {
    const section = document.body.getAttribute('data-section');
    if (!section) return;
    document.querySelectorAll('.nav-link[data-section]').forEach((link) => {
      if (link.getAttribute('data-section') === section) link.classList.add('active');
    });
  }

  /* ---------- Back to top ---------- */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    const onScroll = () => btn.classList.toggle('visible', window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Copy to clipboard (generic) ---------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? resolve() : reject();
      } catch (err) {
        reject(err);
      }
      document.body.removeChild(ta);
    });
  }

  /* ---------- Skill bars - with IntersectionObserver ---------- */
  function initSkillBars() {
    const bars = document.querySelectorAll('.skill-fill[data-level]');
    if (!bars.length) return;
    const fill = (el) => { el.style.width = (parseInt(el.dataset.level, 10) || 0) + '%'; };
    if (!('IntersectionObserver' in window)) {
      bars.forEach(fill);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          fill(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -50px 0px' });
    bars.forEach((bar) => io.observe(bar));
  }

  /* ---------- Lazy Loading Images ---------- */
  function initLazyImages() {
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    if (!images.length || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          io.unobserve(img);
        }
      });
    }, { rootMargin: '50px' });

    images.forEach((img) => io.observe(img));
  }

  /* ---------- Year stamp ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });
  }

  HF.toast = showToast;
  HF.copy = copyText;

  function initAll() {
    initNavShadow();
    initMobileMenu();
    initActiveLink();
    initBackToTop();
    initYear();
    initSkillBars();
    initLazyImages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
