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

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    if (!toggle || !menu) return;

    const close = () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
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

  /* ---------- Skill bars ---------- */
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
    }, { threshold: 0.4 });
    bars.forEach((bar) => io.observe(bar));
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
