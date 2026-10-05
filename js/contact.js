/* ============================================================
   Contact page — sends the message to Back4App Cloud Code
   POST /functions/submitContactMessage
   Shows a VPN notice because the server is unreachable from Iran
   without one; the clipboard button stays as an offline fallback.
   ============================================================ */
(function () {
  'use strict';

  const HF = (window.HF = window.HF || {});
  const CFG = window.HF_PARSE || {};

  function init() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const sendBtn = form.querySelector('[data-contact-send]');
    const copyBtn = form.querySelector('[data-contact-copy]');
    const statusEl = form.querySelector('[data-contact-status]');
    const slot = form.querySelector('[data-net-slot]');

    function toast(msg, type) {
      if (HF.toast) HF.toast(msg, type);
    }

    function setStatus(text, type) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = 'contact-status' + (type ? ' is-' + type : '');
    }

    function field(selector) {
      const el = form.querySelector(selector);
      return el ? el.value.trim() : '';
    }

    function composeText() {
      return [
        'نام: ' + field('#cf-name'),
        field('#cf-email') ? 'ایمیل: ' + field('#cf-email') : '',
        field('#cf-topic') ? 'موضوع: ' + field('#cf-topic') : '',
        '',
        field('#cf-message')
      ].filter(Boolean).join('\n');
    }

    let lastSubmit = null;

    const notice = HF.net
      ? HF.net.buildNotice({
          title: 'برای ارسال پیام، VPN باید روشن باشد',
          text: 'سرور سایت از داخل ایران پاسخ نمی‌دهد. قبل از ارسال، VPN را روشن کنید. ' +
                'اگر VPN از قبل روشن بود، یک بار صفحه را تازه کنید.',
          retry: function () { if (lastSubmit) lastSubmit(); }
        })
      : null;

    if (notice && slot) slot.appendChild(notice.el);

    function callFunction(name, params) {
      if (HF.net) return HF.net.callFunction(name, params);
      return Promise.reject(new Error('ماژول شبکه بارگذاری نشده است.'));
    }

    function copyFallback() {
      const done = () => toast('پیام کپی شد؛ آن را از طریق کانال تماس بفرستید ✓', 'success');
      const failed = () => toast('کپی انجام نشد؛ متن را دستی کپی کنید.', 'error');
      const text = composeText();

      if (HF.copy) HF.copy(text).then(done).catch(failed);
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(failed);
      else failed();
    }

    function valid() {
      if (!field('#cf-name') || field('#cf-message').length < 5) {
        setStatus('نام و متن پیام را کامل وارد کنید.', 'error');
        toast('نام و متن پیام را کامل وارد کنید.', 'error');
        return false;
      }
      return true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid()) return;

      const payload = {
        name: field('#cf-name'),
        email: field('#cf-email'),
        subject: field('#cf-topic'),
        message: field('#cf-message'),
        website: field('#cf-website')
      };

      function send() {
        sendBtn.disabled = true;
        setStatus('در حال ارسال…', '');

        return callFunction('submitContactMessage', payload)
          .then(function (res) {
            setStatus((res && res.message) || 'پیام شما با موفقیت ارسال شد.', 'success');
            toast('پیام شما ارسال شد ✓', 'success');
            form.reset();
            if (notice) notice.markOk();
            setTimeout(function () {
              if (statusEl) statusEl.textContent = '';
            }, 6000);
          })
          .catch(function (err) {
            if (HF.net && HF.net.isBlocked(err)) {
              if (notice) notice.escalate();
              setStatus('ارسال انجام نشد؛ VPN را روشن کنید و دوباره تلاش کنید.', 'error');
              toast('ارسال انجام نشد؛ VPN خاموش است.', 'error');
            } else {
              const msg = err.message || 'ارسال پیام ناموفق بود.';
              setStatus(msg + ' (می‌توانید از دکمه «کپی متن پیام» استفاده کنید.)', 'error');
              toast(msg, 'error');
            }
          })
          .then(function () { sendBtn.disabled = false; });
      }

      lastSubmit = send;
      send();
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!valid()) return;
        copyFallback();
      });
    }

    /* Probe once on load so the reader learns the state before trying */
    if (HF.net && notice) {
      HF.net.probe().then(function (reachable) {
        if (reachable) notice.markOk();
        else notice.escalate();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();