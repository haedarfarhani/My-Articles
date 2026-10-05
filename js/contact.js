/* ============================================================
   Contact page — sends the message to Back4App Cloud Code
   POST /functions/submitContactMessage
   The clipboard button stays as an offline fallback.
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

    const nameEl = form.querySelector('#cf-name');
    const emailEl = form.querySelector('#cf-email');
    const topicEl = form.querySelector('#cf-topic');
    const messageEl = form.querySelector('#cf-message');

    function toast(msg, type) {
      if (HF.toast) HF.toast(msg, type);
    }

    function setStatus(text, type) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = 'contact-status' + (type ? ' is-' + type : '');
    }

    function field(name) {
      const el = form.querySelector(name);
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

    function callFunction(name, params) {
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
          return r.json().catch(function () {
            throw new Error('پاسخ سرور قابل خواندن نبود.');
          });
        })
        .then(function (data) {
          if (data && data.error) throw new Error(data.error);
          return data.result || {};
        });
    }

    function copyFallback() {
      const done = () => toast('پیام کپی شد؛ آن را از طریق کانال تماس بفرستید ✓', 'success');
      const failed = () => toast('کپی انجام نشد؛ متن را دستی کپی کنید.', 'error');
      const text = composeText();

      if (HF.copy) HF.copy(text).then(done).catch(failed);
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(failed);
      else failed();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = field('#cf-name');
      const message = field('#cf-message');

      if (!name || message.length < 5) {
        setStatus('نام و متن پیام را کامل وارد کنید.', 'error');
        toast('نام و متن پیام را کامل وارد کنید.', 'error');
        return;
      }

      sendBtn.disabled = true;
      setStatus('در حال ارسال…', '');

      callFunction('submitContactMessage', {
        name: name,
        email: field('#cf-email'),
        subject: field('#cf-topic'),
        message: message,
        website: field('#cf-website')
      })
        .then(function (res) {
          setStatus((res && res.message) || 'پیام شما با موفقیت ارسال شد.', 'success');
          toast('پیام شما ارسال شد ✓', 'success');
          form.reset();
          setTimeout(function () {
            if (statusEl) statusEl.textContent = '';
          }, 6000);
        })
        .catch(function (err) {
          const msg = err.message || 'ارسال پیام ناموفق بود.';
          setStatus(msg + ' (می‌توانید از دکمه «کپی متن» استفاده کنید.)', 'error');
          toast(msg, 'error');
        })
        .then(function () { sendBtn.disabled = false; });
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!field('#cf-name') || !field('#cf-message')) {
          toast('برای کپی، نام و متن پیام را وارد کنید.', 'error');
          return;
        }
        copyFallback();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();