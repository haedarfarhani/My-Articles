/* ============================================================
   Article comments — list + submit form
   Talks to Back4App Cloud Functions over REST (window.HF_PARSE):
     POST /functions/getComments
     POST /functions/createComment
   Injects its own markup right before the article end box.
   ============================================================ */
(function () {
  'use strict';

  const HF = (window.HF = window.HF || {});
  const CFG = window.HF_PARSE || {};
  const PAGE_SIZE = 20;
  const fa = (n) => Number(n).toLocaleString('fa-IR');

  function toast(msg, type) {
    if (HF.toast) HF.toast(msg, type);
  }

  /* ---------- Article id: <body data-article-id> or file name ---------- */
  function articleId() {
    const explicit = document.body.getAttribute('data-article-id');
    if (explicit) return explicit.trim();
    const file = (window.location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
    return file || 'unknown';
  }

  /* ---------- REST call ---------- */
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

  /* ---------- Markup ---------- */
  function buildSection(root) {
    const section = document.createElement('section');
    section.className = 'comments-section';
    section.id = 'article-comments';
    section.setAttribute('aria-labelledby', 'comments-title');

    section.innerHTML = [
      '<div class="comments-head">',
      '  <h2 class="comments-title" id="comments-title">نظرات</h2>',
      '  <span class="comments-count" data-comments-count>—</span>',
      '</div>',
      '',
      '<form class="comment-form" data-comment-form novalidate>',
      '  <div class="form-row">',
      '    <div class="form-group">',
      '      <label class="form-label" for="cm-name">نام *</label>',
      '      <input class="form-input" id="cm-name" name="name" type="text" maxlength="100"',
      '             placeholder="نام شما" autocomplete="name" required>',
      '    </div>',
      '    <div class="form-group">',
      '      <label class="form-label" for="cm-email">ایمیل (اختیاری، منتشر نمی‌شود)</label>',
      '      <input class="form-input" id="cm-email" name="email" type="email" maxlength="150"',
      '             placeholder="you@example.com" autocomplete="email">',
      '    </div>',
      '  </div>',
      '',
      '  <div class="form-group">',
      '    <label class="form-label" for="cm-content">نظر شما *</label>',
      '    <textarea class="form-textarea" id="cm-content" name="content" maxlength="3000"',
      '              placeholder="نظر، نقد یا پرسش خود درباره این مقاله بنویسید..." required></textarea>',
      '  </div>',
      '',
      '  <div class="comment-hp" aria-hidden="true">',
      '    <label for="cm-website">این فیلد را خالی بگذارید</label>',
      '    <input id="cm-website" name="website" type="text" tabindex="-1" autocomplete="off">',
      '  </div>',
      '',
      '  <div class="form-actions">',
      '    <button class="comment-submit" type="submit">ارسال نظر</button>',
      '    <span class="comment-note">نظر پس از بررسی نمایش داده می‌شود.</span>',
      '  </div>',
      '  <p class="comment-status" data-comment-status role="status"></p>',
      '</form>',
      '',
      '<div class="comments-list" data-comments-list>',
      '  <p class="comments-state" data-comments-state>در حال بارگذاری نظرات…</p>',
      '</div>',
      '',
      '<button class="comments-more" type="button" data-comments-more hidden>نمایش نظرات بیشتر</button>'
    ].join('\n');

    root.appendChild(section);
    return section;
  }

  /* ---------- CTA at the top of the article ---------- */
  function buildCta() {
    const wrap = document.createElement('div');
    wrap.className = 'comment-cta';
    wrap.id = 'comment-cta';

    wrap.innerHTML = [
      '<div class="comment-cta-text">',
      '  <span class="comment-cta-title">نظر یا پرسشی دارید؟</span>',
      '  <span class="comment-cta-sub" data-cta-sub>تجربه و نقدتان را با من و بقیه‌ی خواننده‌ها در میان بگذارید.</span>',
      '</div>',
      '<button class="comment-cta-btn" type="button" data-comment-cta-btn>',
      '  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"',
      '       stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
      '    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
      '  </svg>',
      '  <span>ثبت نظر</span>',
      '  <span class="comment-cta-badge" data-cta-count hidden></span>',
      '</button>'
    ].join('\n');

    return wrap;
  }

  function mountCta(article, section) {
    const hero = article.querySelector('.article-hero');
    const cta = buildCta();

    if (hero) hero.insertAdjacentElement('afterend', cta);
    else article.insertBefore(cta, article.firstChild);

    const btn = cta.querySelector('[data-comment-cta-btn]');
    btn.addEventListener('click', function () {
      scrollToComments(section);
      const nameEl = section.querySelector('#cm-name');
      if (nameEl) setTimeout(function () { nameEl.focus({ preventScroll: true }); }, 420);
    });

    return cta;
  }

  function scrollToComments(section) {
    const reduce = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = section.getBoundingClientRect().top + window.pageYOffset - 90;

    if ('scrollBehavior' in document.documentElement.style && !reduce) {
      window.scrollTo({ top: top, behavior: 'smooth' });
      return;
    }
    window.scrollTo(0, top);
  }

  /* ---------- Render ---------- */
  function faDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    try {
      return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return d.toISOString().slice(0, 10);
    }
  }

  function commentNode(c) {
    const item = document.createElement('article');
    item.className = 'comment-item';

    const avatar = document.createElement('div');
    avatar.className = 'comment-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = (c.name || '؟').trim().charAt(0) || '؟';

    const body = document.createElement('div');
    body.className = 'comment-body';

    const meta = document.createElement('div');
    meta.className = 'comment-meta';

    const name = document.createElement('span');
    name.className = 'comment-name';
    name.textContent = c.name;

    const date = document.createElement('time');
    date.className = 'comment-date';
    date.dateTime = c.createdAt || '';
    date.textContent = faDate(c.createdAt);

    const text = document.createElement('p');
    text.className = 'comment-text';
    text.textContent = c.content;

    meta.appendChild(name);
    meta.appendChild(date);
    body.appendChild(meta);
    body.appendChild(text);

    item.appendChild(avatar);
    item.appendChild(body);
    return item;
  }

  function setState(list, message) {
    list.innerHTML = '';
    if (!message) return;
    const p = document.createElement('p');
    p.className = 'comments-state';
    p.textContent = message;
    list.appendChild(p);
  }

  /* ---------- Init ---------- */
  function init() {
    const article = document.querySelector('.blog-article');
    if (!article) return;

    const anchor = article.querySelector('.article-end-box');
    const section = buildSection(document.createDocumentFragment());

    if (anchor) article.insertBefore(section, anchor);
    else article.appendChild(section);

    const cta = mountCta(article, section);

    const list = section.querySelector('[data-comments-list]');
    const countEl = section.querySelector('[data-comments-count]');
    const moreBtn = section.querySelector('[data-comments-more]');
    const form = section.querySelector('[data-comment-form]');
    const statusEl = section.querySelector('[data-comment-status]');
    const contentEl = section.querySelector('#cm-content');
    const submitBtn = form.querySelector('button[type="submit"]');
    const ctaCount = cta.querySelector('[data-cta-count]');
    const ctaSub = cta.querySelector('[data-cta-sub]');

    const id = articleId();
    let skip = 0;
    let total = 0;
    let loading = false;

    function updateCount() {
      countEl.textContent = total > 0 ? fa(total) + ' نظر' : 'هنوز نظری نیست';

      ctaCount.textContent = fa(total);
      ctaCount.hidden = total === 0;
      ctaSub.textContent = total > 0
        ? 'تا الان ' + fa(total) + ' دیدگاه ثبت شده؛ نظر شما هم اضافه شود.'
        : 'تجربه و نقدتان را با من و بقیه‌ی خواننده‌ها در میان بگذارید.';
    }

    function load(append) {
      if (loading) return;
      loading = true;
      if (!append) setState(list, 'در حال بارگذاری نظرات…');

      callFunction('getComments', { articleId: id, limit: PAGE_SIZE, skip: skip })
        .then(function (res) {
          const data = res.data || [];
          total = (res.pagination && res.pagination.total) || 0;
          skip += data.length;

          if (append) {
            const frag = document.createDocumentFragment();
            data.forEach(function (c) { frag.appendChild(commentNode(c)); });
            list.appendChild(frag);
          } else if (data.length) {
            list.innerHTML = '';
            const frag = document.createDocumentFragment();
            data.forEach(function (c) { frag.appendChild(commentNode(c)); });
            list.appendChild(frag);
          } else {
            setState(list, 'هنوز نظری برای این مقاله ثبت نشده؛ اولین نفر باشید.');
          }

          moreBtn.hidden = !(res.pagination && res.pagination.hasMore);
          updateCount();
        })
        .catch(function (err) {
          if (!append) setState(list, 'بارگذاری نظرات ممکن نشد: ' + (err.message || 'خطای نامشخص'));
          else toast('بارگذاری توضیح داده نشد.', 'error');
        })
        .then(function () { loading = false; });
    }

    moreBtn.addEventListener('click', function () { load(true); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const nameEl = form.querySelector('#cm-name');
      const emailEl = form.querySelector('#cm-email');
      const name = nameEl.value.trim();
      const email = emailEl.value.trim();
      const content = contentEl.value.trim();

      if (!name || content.length < 3) {
        statusEl.textContent = 'نام و متن نظر را کامل وارد کنید.';
        statusEl.className = 'comment-status is-error';
        return;
      }

      submitBtn.disabled = true;
      statusEl.textContent = 'در حال ارسال…';
      statusEl.className = 'comment-status';

      callFunction('createComment', {
        articleId: id,
        name: name,
        email: email,
        content: content,
        website: form.querySelector('#cm-website').value
      })
        .then(function (res) {
          statusEl.textContent = (res && res.message) || 'نظر شما ثبت شد.';
          statusEl.className = 'comment-status is-success';
          form.reset();
          toast('نظر ثبت شد و پس از بررسی نمایش داده می‌شود.', 'success');
          skip = 0;
          load(false);
        })
        .catch(function (err) {
          statusEl.textContent = err.message || 'ارسال نظر ناموفق بود.';
          statusEl.className = 'comment-status is-error';
        })
        .then(function () { submitBtn.disabled = false; });
    });

    updateCount();
    load(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();