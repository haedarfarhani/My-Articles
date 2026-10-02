/* ============================================================
   Libraries page — search + category filter (client-side)
   ============================================================ */
(function () {
  'use strict';

  function init() {
    const searchInput = document.getElementById('library-search');
    const filterButtons = document.querySelectorAll('.library-filter-btn');
    const cards = document.querySelectorAll('.library-card');
    const emptyState = document.getElementById('library-empty');
    const countEl = document.getElementById('libraries-count');
    if (!cards.length) return;

    let currentFilter = 'all';
    let query = '';

    const faDigits = '۰۱۲۳۴۵۶۷۸۹';
    const toFa = (n) => String(n).replace(/\d/g, (d) => faDigits[d]);

    function apply() {
      let visible = 0;
      cards.forEach((card) => {
        const cat = (card.getAttribute('data-category') || '').toLowerCase();
        const title = (card.querySelector('.library-title')?.textContent || '').toLowerCase();
        const desc = (card.querySelector('.library-desc')?.textContent || '').toLowerCase();
        const matchCat = currentFilter === 'all' || cat.includes(currentFilter);
        const matchQuery = !query || title.includes(query) || desc.includes(query);
        const show = matchCat && matchQuery;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (emptyState) emptyState.style.display = visible === 0 ? 'block' : 'none';
      if (countEl) countEl.textContent = toFa(visible) + ' مورد';
    }

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        apply();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        query = e.target.value.trim().toLowerCase();
        apply();
      });
    }

    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
