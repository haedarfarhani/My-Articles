/* ============================================================
   Articles page — search + tag filter (client-side)
   ============================================================ */
(function () {
  'use strict';

  function init() {
    const searchInput = document.getElementById('search-input');
    const tagButtons = document.querySelectorAll('.tag-btn');
    const articleCards = document.querySelectorAll('.article-card');
    const emptyState = document.getElementById('empty-state');
    const countEl = document.getElementById('articles-count');

    if (!articleCards.length) return;

    let currentFilter = 'all';
    let searchQuery = '';

    const faDigits = '۰۱۲۳۴۵۶۷۸۹';
    const toFa = (n) => String(n).replace(/\d/g, (d) => faDigits[d]);

    function filterArticles() {
      let visibleCount = 0;
      articleCards.forEach((card) => {
        const tags = (card.getAttribute('data-tags') || '').toLowerCase();
        const title = (card.querySelector('.card-title')?.innerText || '').toLowerCase();
        const excerpt = (card.querySelector('.card-excerpt')?.innerText || '').toLowerCase();

        const matchesTag = (currentFilter === 'all') || tags.includes(currentFilter);
        const matchesSearch = !searchQuery || title.includes(searchQuery) || excerpt.includes(searchQuery);

        if (matchesTag && matchesSearch) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (emptyState) emptyState.style.display = (visibleCount === 0) ? 'block' : 'none';
      if (countEl) countEl.textContent = toFa(visibleCount) + ' مقاله';
    }

    tagButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        tagButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        filterArticles();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        filterArticles();
      });
    }

    /* Deep link: articles/#kotlin activates that tag filter */
    const hash = decodeURIComponent(window.location.hash.replace('#', '')).toLowerCase();
    if (hash) {
      const match = Array.from(tagButtons).find((b) => b.getAttribute('data-filter') === hash);
      if (match) {
        tagButtons.forEach((b) => b.classList.remove('active'));
        match.classList.add('active');
        currentFilter = hash;
      }
    }

    filterArticles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();