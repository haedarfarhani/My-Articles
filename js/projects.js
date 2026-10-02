/* ============================================================
   Projects page — category filter (client-side)
   ============================================================ */
(function () {
  'use strict';

  function init() {
    const filterButtons = document.querySelectorAll('.project-filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    const countEl = document.getElementById('projects-count');

    if (!projectCards.length) return;

    let currentFilter = 'all';

    const faDigits = '۰۱۲۳۴۵۶۷۸۹';
    const toFa = (n) => String(n).replace(/\d/g, (d) => faDigits[d]);

    function filterProjects() {
      let visibleCount = 0;
      projectCards.forEach((card) => {
        const tech = (card.getAttribute('data-tech') || '').toLowerCase();
        const matches = (currentFilter === 'all') || tech.includes(currentFilter);
        card.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
      });
      if (countEl) countEl.textContent = toFa(visibleCount) + ' پروژه';
    }

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        filterProjects();
      });
    });

    filterProjects();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();