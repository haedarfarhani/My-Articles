/* ============================================================
   Network guard — VPN notice for the comment form and contact form
   ------------------------------------------------------------
   A browser cannot detect whether a VPN is running, so we do not
   pretend to. Instead we classify the failure itself, because that
   is what a blocked request actually looks like:
     • fetch() rejects with a TypeError when the request never
       completes (offline, DNS, TLS, CORS, or an upstream geo-block)
     • HTTP 403 / 503 from Back4App when the app blocks the region
   Shared by js/comments.js and js/contact.js via window.HF.net.
   ============================================================ */
(function () {
  'use strict';

  const HF = (window.HF = window.HF || {});

  const BLOCKED_STATUS = [0, 401, 403, 405, 406, 451, 503];
  const PROBE_TIMEOUT_MS = 7000;

  const ICON_SHIELD =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>';

  const ICON_OFF =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="1" y1="1" xline2="23" y2="23"></line>' +
    '<path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>' +
    '<path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>' +
    '<path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>' +
    '<path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>' +
    '<path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>' +
    '<line x1="12" y1="20" x2="12.01" y2="20"></line></svg>';

  /* ---------- Is this failure a blocked/geo-restricted request? ---------- */
  function isBlocked(err) {
    if (!err) return false;
    if (err.blocked === true) return true;
    if (err.status && BLOCKED_STATUS.indexOf(err.status) !== -1) return true;
    return err.name === 'TypeError';
  }

  /* ---------- Cloud Function call with status-aware errors ---------- */
  function callFunction(name, params) {
    const CFG = window.HF_PARSE || {};

    if (!CFG.server || !CFG.appId) {
      return Promise.reject(new Error('پیکربندی Back4App کامل نیست (js/parse-config.js).'));
    }

    return fetch(CFG.server + '/functions/' + name, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': CFG.appId,
        'X-Parse-Javascript-Key': CFG.jsKey || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params || {})
    })
      .then(function (r) {
        return r.json()
          .catch(function () {
            const e = new Error('پاسخ سرور قابل خواندن نبود.');
            e.status = r.status;
            throw e;
          })
          .then(function (data) {
            if (data && data.error) {
              const e = new Error(data.error);
              e.status = r.status;
              throw e;
            }
            return data.result || {};
          });
      });
  }

  /* ---------- Reachability probe ---------- */
  function probe() {
    const CFG = window.HF_PARSE || {};
    if (!CFG.server) return Promise.resolve(false);

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller
      ? setTimeout(function () { controller.abort(); }, PROBE_TIMEOUT_MS)
      : null;

    return fetch(CFG.server + '/health', {
      method: 'GET',
      cache: 'no-store',
      signal: controller ? controller.signal : undefined
    })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; })
      .then(function (ok) {
        if (timer) clearTimeout(timer);
        return ok;
      });
  }

  /* ---------- Notice ---------- */
  function buildNotice(opts) {
    const options = opts || {};

    const el = document.createElement('div');
    el.className = 'net-note';
    el.setAttribute('data-net-note', '');
    el.setAttribute('role', 'status');

    el.innerHTML = [
      '<span class="net-note-icon" data-net-icon aria-hidden="true">' + ICON_SHIELD + '</span>',
      '<div class="net-note-body">',
      '  <strong class="net-note-title" data-net-title></strong>',
      '  <span class="net-note-text" data-net-text></span>',
      '</div>',
      '<div class="net-note-actions">',
      '  <button class="net-note-btn" type="button" data-net-test>بررسی اتصال</button>',
      '  <button class="net-note-btn is-strong" type="button" data-net-retry hidden>تلاش دوباره</button>',
      '</div>'
    ].join('\n');

    const icon = el.querySelector('[data-net-icon]');
    const title = el.querySelector('[data-net-title]');
    const text = el.querySelector('[data-net-text]');
    const testBtn = el.querySelector('[data-net-test]');
    const retryBtn = el.querySelector('[data-net-retry]');

    let state = 'info';

    function paint(next) {
      state = next;
      el.classList.toggle('is-error', next === 'error');
      el.classList.toggle('is-ok', next === 'ok');

      if (next === 'error') {
        icon.innerHTML = ICON_OFF;
        title.textContent = 'ارسال انجام نشد؛ به‌نظر می‌رسد VPN خاموش است';
        text.textContent =
          'درخواست شما به سرور نرسید. معمولاً یعنی VPN خاموش است یا اتصالش قطع شده. ' +
          'VPN را روشن کنید و دوباره تلاش کنید.';
        retryBtn.hidden = false;
        return;
      }

      if (next === 'ok') {
        icon.innerHTML = ICON_SHIELD;
        title.textContent = 'اتصال برقرار است (VPN فعال)';
        text.textContent =
          'ارتباط با سرور برقرار است و می‌توانید نظر یا پیام خود را ارسال کنید. ' +
          'توجه داشته باشید این ارتباط بدون VPN برقرار نمی‌شود.';
        retryBtn.hidden = !options.retry;
        return;
      }

      icon.innerHTML = ICON_SHIELD;
      title.textContent = options.title || 'برای ارسال، VPN باید روشن باشد';
      text.textContent = options.text ||
        'سرور سایت از داخل ایران پاسخ نمی‌دهد. قبل از ارسال، VPN را روشن کنید. ' +
        'اگر VPN از قبل روشن بود، یک بار صفحه را تازه کنید.';
      retryBtn.hidden = true;
    }

    testBtn.addEventListener('click', function () {
      testBtn.disabled = true;
      title.textContent = 'در حال بررسی اتصال…';

      probe().then(function (ok) {
        testBtn.disabled = false;
        if (ok) {
          paint('ok');
        } else if (state !== 'error') {
          paint('error');
        }
      });
    });

    if (options.retry) {
      retryBtn.addEventListener('click', function () { options.retry(); });
    }

    paint('info');

    return {
      el: el,
      /* A confirmed blocked request always wins, even if the last check was OK */
      escalate: function () { paint('error'); },
      markOk: function () { paint('ok'); }
    };
  }

  HF.net = {
    isBlocked: isBlocked,
    callFunction: callFunction,
    probe: probe,
    buildNotice: buildNotice
  };
})();