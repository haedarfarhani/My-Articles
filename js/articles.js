/* ============================================================
   Articles listing — search + topic filter + sorting
   • search: Persian/Arabic-insensitive, multi-token, client-side
   • filter: data-tags on each .post-card (deep-link via #hash)
   • sort:   newest / oldest / shortest
   • keys:   "/" focuses search, Esc clears it
   ============================================================ */
(function () {
  'use strict';

  const faDigits = '۰۱۲۳۴۵۶۷۸۹';
  const toFa = (n) => String(n).replace(/\d/g, (d) => faDigits[d]);
  const plural = (n) => (n > 1 ? 'مقاله' : 'مقاله');

  /* یکسان‌سازی ی/ك عربی، اعراب و نیم‌فاصله — تا جستجو
     با «همزمانی»، «هم‌زمانی» و «هم زمانی» یک نتیجه بدهد */
  function normalize(text) {
    return (text || '')
      .toLowerCase()
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[‌‍‎‏]/g, '')
      .replace(/[ً-ْٰ]/g, '')
      .replace(/[^\p{L}\p{N}\s+#.]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function init() {
    const grid = document.getElementById('articles-grid');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const sortSelect = document.getElementById('sort-select');
    const toolbar = document.getElementById('articles-toolbar');
    const summary = document.getElementById('posts-summary');
    const emptyState = document.getElementById('empty-state');
    const resetBtn = document.getElementById('reset-filters');
    const chips = Array.from(document.querySelectorAll('.tag-btn[data-filter]'));
    const cards = Array.from(document.querySelectorAll('.post-card'));

    if (!grid || !cards.length) return;

    const empty = emptyState || null;

    /* ---------- index each card ---------- */
    const items = cards.map((el) => {
      const tags = (el.dataset.tags || '').split(/\s+/).filter(Boolean);
      return {
        el,
        tags,
        order: Number(el.dataset.order) || 0,
        minutes: Number(el.dataset.minutes) || 0,
        haystack: normalize(
          [
            el.querySelector('.post-title'),
            el.querySelector('.post-excerpt'),
            el.querySelector('.post-tags'),
          ]
            .map((n) => (n ? n.textContent : ''))
            .join(' ')
        ),
      };
    });

    /* ---------- topic counts on the chips ---------- */
    chips.forEach((chip) => {
      const key = chip.dataset.filter;
      const count = key === 'all' ? items.length : items.filter((i) => i.tags.includes(key)).length;
      const slot = chip.querySelector('.chip-count');
      if (slot) slot.textContent = toFa(count);
      chip.dataset.count = String(count);
    });

    const labelOf = (key) => {
      const chip = chips.find((c) => c.dataset.filter === key);
      return chip ? chip.dataset.label || '' : '';
    };

    /* ---------- state ---------- */
    let filter = 'all';
    let tokens = [];
    let sortMode = 'newest';

    const sorters = {
      newest: (a, b) => b.order - a.order,
      oldest: (a, b) => a.order - b.order,
      shortest: (a, b) => a.minutes - b.minutes || b.order - a.order,
    };

    /* ---------- render ---------- */
    function render() {
      let visible = 0;

      items.forEach((item) => {
        const matchFilter = filter === 'all' || item.tags.includes(filter);
        const matchQuery = tokens.length === 0 || tokens.every((t) => item.haystack.includes(t));
        const show = matchFilter && matchQuery;

        item.el.style.display = show ? '' : 'none';
        if (show) visible++;
      });

      /* چیدمان مجدد بر اساس مرتب‌سازی انتخابی */
      const sorted = items.slice().sort(sorters[sortMode] || sorters.newest);
      sorted.forEach((item) => {
        grid.insertBefore(item.el, empty);
      });

      if (empty) empty.classList.toggle('show', visible === 0);

      if (searchClear) searchClear.hidden = !searchInput || !searchInput.value;

      if (summary) {
        const count = toFa(visible);
        const topic = filter === 'all' ? '' : ' در «' + labelOf(filter) + '»';
        if (visible === 0) {
          summary.textContent = 'نتیجه‌ای یافت نشد';
        } else if (tokens.length) {
          summary.innerHTML = '<strong>' + count + '</strong> نتیجه برای «' + escapeHtml(searchInput.value.trim()) + '»' + topic;
        } else if (filter === 'all') {
          summary.innerHTML = 'همهٔ <strong>' + count + '</strong> ' + plural(visible);
        } else {
          summary.innerHTML = '<strong>' + count + '</strong> ' + plural(visible) + topic;
        }
      }
    }

    function escapeHtml(s) {
      return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    function setFilter(key, updateHash) {
      filter = key;
      chips.forEach((chip) => {
        const on = chip.dataset.filter === key;
        chip.classList.toggle('active', on);
        chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (updateHash !== false) {
        const hash = key === 'all' ? '' : '#' + key;
        history.replaceState(null, '', location.pathname + location.search + hash);
      }
      render();
    }

    function clearAll() {
      if (searchInput) searchInput.value = '';
      tokens = [];
      if (sortSelect) sortSelect.value = 'newest';
      sortMode = 'newest';
      setFilter('all');
    }

    /* ---------- events ---------- */
    chips.forEach((chip) => {
      chip.addEventListener('click', () => setFilter(chip.dataset.filter));
    });

    let debounce;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          tokens = normalize(e.target.value).split(' ').filter(Boolean);
          render();
        }, 120);
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        tokens = [];
        render();
        searchInput.focus();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortMode = e.target.value;
        render();
      });
    }

    if (resetBtn) resetBtn.addEventListener('click', clearAll);

    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        tokens = [];
        render();
        searchInput.blur();
      }
    });

    /* سایه‌ی نوار ابزار هنگام چسبیدن به بالا */
    if (toolbar) {
      const sentinel = document.createElement('div');
      toolbar.parentNode.insertBefore(sentinel, toolbar);
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(([entry]) => {
          toolbar.classList.toggle('is-stuck', !entry.isIntersecting);
        });
        io.observe(sentinel);
      }
    }

    /* deep link: articles/#kotlin */
    const hash = decodeURIComponent(location.hash.replace('#', '')).toLowerCase();
    if (hash && chips.some((c) => c.dataset.filter === hash)) setFilter(hash, false);

    /* لینک‌های داخلی (پاورقی/نشانی) بدون بارگذاری مجدد هم کار کنند */
    window.addEventListener('hashchange', () => {
      const key = decodeURIComponent(location.hash.replace('#', '')).toLowerCase();
      if (key && chips.some((c) => c.dataset.filter === key)) setFilter(key, false);
      else if (!key && filter !== 'all') setFilter('all', false);
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
