/* ============================================================
   Page views — https://page-views-api.ratneshc.com
   • list pages: fills [data-pv] badges + total stat
   • article pages: tracks the visit and fills #pv-num / #pv-badge
   No cookies, no IPs, unique visitor counted per 30 minutes.
   ============================================================ */
(function () {
  'use strict';

  const PV_SITE = 'haedarfarhani.github.io';
  const PV_PREFIX = '/My-Articles/';
  const PV_API = 'https://page-views-api.ratneshc.com/api/v1';
  const fa = (n) => Number(n).toLocaleString('fa-IR');

  /* Normalise the current URL to the path the API expects */
  function currentPath() {
    const path = window.location.pathname || '/';
    const at = path.indexOf(PV_PREFIX);
    if (at !== -1) return path.slice(at);
    return PV_PREFIX + path.replace(/^\/+/, '');
  }

  function api(suffix, params) {
    const query = Object.keys(params)
      .map((k) => k + '=' + encodeURIComponent(params[k]))
      .join('&');
    return fetch(PV_API + suffix + '?' + query);
  }

  function init() {
    /* --- Single article page: track + show badge --- */
    const num = document.getElementById('pv-num');
    if (num) {
      const params = { site: PV_SITE, path: currentPath() };
      if (window.location.hostname === PV_SITE) {
        api('/track', params).catch(() => {});
      }
      api('/views', params)
        .then((r) => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then((d) => { num.textContent = fa(Number(d.views) || 0); })
        .catch(() => {
          const badge = document.getElementById('pv-badge');
          if (badge) badge.style.display = 'none';
        });
      return;
    }

    /* --- List page: fill every card badge + total --- */
    const cards = Array.from(document.querySelectorAll('[data-pv]'));
    if (!cards.length) return;

    const statViews = document.getElementById('stat-views');
    const statCard = document.getElementById('stat-views-card');
    let total = 0;
    let ok = 0;

    Promise.all(
      cards.map((el) =>
        api('/views', { site: PV_SITE, path: PV_PREFIX + el.dataset.pv })
          .then((r) => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          })
          .then((d) => {
            const views = Number(d.views) || 0;
            total += views;
            ok++;
            el.textContent = '👁 ' + fa(views);
          })
          .catch(() => { el.style.display = 'none'; })
      )
    ).then(() => {
      if (!statViews || !statCard) return;
      if (ok === 0) statCard.style.display = 'none';
      else statViews.textContent = fa(total);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
