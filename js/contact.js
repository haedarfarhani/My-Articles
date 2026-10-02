/* ============================================================
   Contact page — compose the message and copy it to clipboard
   (static site: no backend, so we prepare the text for the user)
   ============================================================ */
(function () {
  'use strict';

  const HF = window.HF || {};

  function init() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const toast = (msg, type) => (HF.toast ? HF.toast(msg, type) : alert(msg));

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (form.querySelector('#cf-name') || {}).value || '';
      const email = (form.querySelector('#cf-email') || {}).value || '';
      const topic = (form.querySelector('#cf-topic') || {}).value || '';
      const message = (form.querySelector('#cf-message') || {}).value || '';

      if (!name.trim() || !message.trim()) {
        toast('لطفاً نام و متن پیام را وارد کنید.', 'error');
        return;
      }

      const text = [
        'نام: ' + name.trim(),
        email.trim() ? 'ایمیل: ' + email.trim() : '',
        topic.trim() ? 'موضوع: ' + topic.trim() : '',
        '',
        message.trim()
      ].filter(Boolean).join('\n');

      const done = () => toast('پیام کپی شد؛ آن را از طریق کانال تماس بفرستید ✓', 'success');
      const fail = () => toast('کپی انجام نشد؛ متن را دستی کپی کنید.', 'error');

      if (HF.copy) HF.copy(text).then(done).catch(fail);
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(fail);
      else fail();

      form.reset();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
