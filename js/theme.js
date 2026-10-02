/* ============================================================
   Theme — light/dark with localStorage + OS preference
   The first-paint switch lives inline in <head> (no FOUC);
   this module only keeps icons and the toggle in sync.
   ============================================================ */
(function () {
  'use strict';

  const STORAGE_KEY = 'hf_theme';
  const LEGACY_KEYS = ['blog_theme'];
  const htmlEl = document.documentElement;

  function readStored() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    for (const key of LEGACY_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy === 'light' || legacy === 'dark') {
        localStorage.setItem(STORAGE_KEY, legacy);
        return legacy;
      }
    }
    return null;
  }

  function systemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function updateIcons(theme) {
    const sun = document.getElementById('theme-icon-sun');
    const moon = document.getElementById('theme-icon-moon');
    if (!sun || !moon) return;
    sun.style.display = theme === 'dark' ? 'block' : 'none';
    moon.style.display = theme === 'dark' ? 'none' : 'block';
  }

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    updateIcons(theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0B1A18' : '#F0FDFA');
  }

  function init() {
    applyTheme(readStored() || htmlEl.getAttribute('data-theme') || systemTheme());

    const btn = document.getElementById('btn-theme');
    if (btn) {
      btn.addEventListener('click', () => {
        const next = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* private mode */ }
      });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (readStored()) return;
      applyTheme(e.matches ? 'dark' : 'light');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
