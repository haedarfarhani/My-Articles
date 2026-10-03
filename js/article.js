/* ============================================================
   Article page — progress bar, code blocks, TOC spy, share,
   mobile drawer, back-to-top
   ============================================================ */
(function () {
  'use strict';

  const HF = (window.HF = window.HF || {});

  /* ---------- Toast ---------- */
  function toast(msg) {
    if (HF.toast) return HF.toast(msg);
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------- Reading progress ---------- */
  function initScrollWidgets() {
    const bar = document.getElementById('reading-progress');
    if (!bar) return;
    const target = document.querySelector('.blog-article') || document.body;

    const onScroll = () => {
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const ratio = total > 0 ? -rect.top / total : 0;
      bar.style.width = Math.max(0, Math.min(1, ratio)) * 100 + '%';
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ---------- زبان کد: از data-lang خود بلوک (java، kotlin، logcat، ...) ---------- */
  const CODE_LANG_LABELS = {
    java: 'Java',
    kotlin: 'Kotlin',
    xml: 'XML',
    gradle: 'Gradle',
    groovy: 'Groovy',
    logcat: 'LogCat',
    bash: 'Bash',
    shell: 'Shell',
    json: 'JSON',
    txt: 'Text',
    text: 'Text',
  };

  function codeLangLabel(pre) {
    const raw = ((pre.dataset && pre.dataset.lang) || 'kotlin').toLowerCase();
    if (CODE_LANG_LABELS[raw]) return CODE_LANG_LABELS[raw];
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  /* ---------- Code blocks: header + copy ---------- */
  function initCodeBlocks() {
    const blocks = document.querySelectorAll('.kl-article pre.kl-code');
    blocks.forEach((pre) => {
      if (pre.parentElement.classList.contains('code-block-wrapper')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';

      const header = document.createElement('div');
      header.className = 'code-block-header';
      header.innerHTML =
        '<div class="code-block-dots">' +
        '<span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>' +
        '</div>' +
        '<div class="code-block-meta">' +
        '<span class="code-lang-tag">' + codeLangLabel(pre) + '</span>' +
        '<button class="btn-copy-code" type="button" title="کپی کد">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
        '<span>کپی</span></button></div>';

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);

      const btn = header.querySelector('.btn-copy-code');
      btn.addEventListener('click', () => {
        const text = pre.innerText;
        const done = () => {
          btn.innerHTML =
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
            '<span style="color:#10B981">کپی شد!</span>';
          toast('کد کپی شد ✓');
          setTimeout(() => {
            btn.innerHTML =
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
              '<span>کپی</span>';
          }, 2000);
        };
        if (HF.copy) HF.copy(text).then(done).catch(() => toast('کپی انجام نشد', 'error'));
        else if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(() => toast('کپی انجام نشد', 'error'));
      });
    });
  }

  /* ---------- TOC scroll spy ---------- */
  function initTocSpy() {
    const sections = document.querySelectorAll('.kl-article section[id]');
    const links = document.querySelectorAll('.toc-link[data-target], .inline-toc-item a[href^="#"]');
    if (!sections.length || !links.length) return;

    const activate = (id) => {
      links.forEach((link) => {
        const target = link.dataset.target || (link.getAttribute('href') || '').replace('#', '');
        link.classList.toggle('active', target === id);
        if (target === id && link.classList.contains('toc-link') && link.closest('.toc-scroll-container')) {
          try { link.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* noop */ }
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && activate(entry.target.id)),
      { root: null, rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    sections.forEach((sec) => observer.observe(sec));
  }

  /* ---------- Share ---------- */
  function initShare() {
    const copy = () => {
      const url = window.location.href;
      const done = () => toast('لینک مقاله کپی شد ✓', 'success');
      if (HF.copy) HF.copy(url).then(done).catch(() => toast('امکان کپی لینک نیست', 'error'));
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(() => toast('امکان کپی لینک نیست', 'error'));
    };

    ['btn-share', 'sidebar-share-btn'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', copy);
    });
  }

  /* ---------- Mobile TOC drawer ---------- */
  function initDrawer() {
    const openBtn = document.getElementById('btn-toc-toggle');
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const closeBtn = document.getElementById('btn-close-drawer');
    if (!openBtn || !drawer) return;

    const open = () => {
      drawer.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      drawer.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    };

    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);
    document.querySelectorAll('#drawer-toc .toc-link').forEach((l) => l.addEventListener('click', close));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  }

  function initAll() {
    initScrollWidgets();
    initCodeBlocks();
    initTocSpy();
    initShare();
    initDrawer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
