/* ============================================================
   API Knowledge Base — interactive demos
   ------------------------------------------------------------
   Zero dependencies. Plain DOM + CSS.

   Every demo is opt-in: markup declares
   <div class="ax-demo" data-demo="rest"> and this module wires
   the controls that already exist inside it. Nothing is
   injected except generated output, so the demos degrade to
   readable static content if JS is off.

   Honours prefers-reduced-motion: simulated "live" streams
   still step through, but do not animate the log entries.
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  /* Escape before we ever put user-entered text into innerHTML. */
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- shared: append a line to a log stream ---------- */
  function logLine(log, dir, text) {
    if (!log) return;
    const row = document.createElement('div');
    row.className = 'ax-log-line';
    const tag = document.createElement('span');
    tag.className = 'ax-log-dir ax-log-dir--' + dir;
    tag.textContent = dir === 'out' ? '→' : dir === 'in' ? '←' : dir === 'err' ? '✕' : '•';
    const body = document.createElement('span');
    body.className = 'ax-log-text';
    body.textContent = text;
    row.appendChild(tag);
    row.appendChild(body);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    return row;
  }

  function clearLog(log) {
    if (log) log.innerHTML = '';
  }

  /* Run a list of steps with pauses. Returns a cancel handle. */
  function play(log, steps, done) {
    let i = 0;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      if (i >= steps.length) {
        if (done) done();
        return;
      }
      const s = steps[i++];
      logLine(log, s[0], s[1]);
      setTimeout(tick, reduceMotion ? 260 : s[2] || 700);
    };
    tick();
    return () => { stopped = true; };
  }

  /* ============================================================
     1. REST — method / path builder
     ============================================================ */
  const REST_SPEC = {
    GET: {
      safe: true, idempotent: true, body: false,
      desc: 'خواندن یک منبع. نباید تغییری در وضعیت سرور ایجاد کند.',
      res: '200 OK',
      payload: [
        ['id', 42], ['name', 'Ali'], ['email', 'ali@example.com'], ['roles', '["user"]']
      ]
    },
    POST: {
      safe: false, idempotent: false, body: true,
      desc: 'ساختن یک منبع زیر مجموعه یا یک عملیات غیرایدمپوتنت. تکرارش اثر جانبی تکراری می‌سازد.',
      res: '201 Created',
      payload: [['id', 43], ['name', 'Sara'], ['email', 'sara@example.com']]
    },
    PUT: {
      safe: false, idempotent: true, body: true,
      desc: 'جایگزینی کامل منبع. تکرارش همان وضعیت نهایی را می‌سازد.',
      res: '200 OK',
      payload: ['id', 42], ['name', 'Ali Rezaei'], ['email', 'ali@example.com']
    },
    PATCH: {
      safe: false, idempotent: true, body: true,
      desc: 'تغییر جزئی. فقط فیلدهای ارسالی عوض می‌شوند.',
      res: '200 OK',
      payload: ['name', 'Ali R.']
    },
    DELETE: {
      safe: false, idempotent: true, body: false,
      desc: 'حذف منبع. تکرارش باید بی‌اثر باشد (نه خطا).',
      res: '204 No Content',
      payload: null
    }
  };

  function initRest(demo) {
    const out = $('[data-rest-out]', demo);
    const pathInput = $('[data-rest-path]', demo);
    const caption = $('[data-rest-caption]', demo);
    const buttons = $$('[data-method]', demo);
    if (!out || !buttons.length) return;

    let method = 'GET';

    function render() {
      const spec = REST_SPEC[method];
      const path = (pathInput && pathInput.value.trim()) || '/api/users';

      const lines = [];
      lines.push(method + ' ' + path + ' HTTP/1.1');
      lines.push('Host: api.example.com');
      if (method !== 'GET' && method !== 'DELETE') {
        lines.push('Content-Type: application/json');
      }
      if (method === 'DELETE') {
        lines.push('Content-Type: application/json');
      }
      lines.push('Accept: application/json');
      lines.push('Authorization: Bearer <token>');
      if (method !== 'GET' && method !== 'DELETE') {
        lines.push('Idempotency-Key: 8f2a...c41d');
        lines.push('');
        lines.push(JSON.stringify(Object.fromEntries(spec.payload || []), null, 2));
      }
      lines.push('');
      lines.push('— HTTP/1.1 ' + spec.res);
      if (spec.payload && method !== 'GET') {
        lines.push('Content-Type: application/json');
        lines.push('');
        lines.push(JSON.stringify(Object.fromEntries(spec.payload), null, 2));
      } else if (method !== 'DELETE') {
        lines.push('Content-Type: application/json');
        lines.push('');
        lines.push(JSON.stringify(Object.fromEntries(spec.payload), null, 2));
      } else {
        lines.push('');
        lines.push('(بدون بدنه)');
      }

      out.textContent = lines.join('\n');

      const flags = [];
      flags.push(spec.idempotent ? 'idempotent' : 'غیرایدمپوتنت');
      flags.push(spec.safe ? 'safe' : 'ناامن');
      if (caption) {
        caption.innerHTML =
          '<strong>' + esc(method) + '</strong> — ' + esc(spec.desc) +
          ' <span class="ax-badge ax-badge--pattern">' + flags.join(' · ') + '</span>';
      }

      buttons.forEach((b) => b.setAttribute('aria-pressed', b.dataset.method === method ? 'true' : 'false'));
    }

    buttons.forEach((b) => b.addEventListener('click', () => { method = b.dataset.method; render(); }));
    if (pathInput) pathInput.addEventListener('input', render);
    render();
  }

  /* ============================================================
     2. GraphQL — field selection builds the query
     ============================================================ */
  const GQL_SCHEMA = {
    id:       { type: 'ID!',    sample: '"42"' },
    name:     { type: 'String!', sample: '"Ali"' },
    email:    { type: 'String',  sample: '"ali@example.com"' },
    age:      { type: 'Int',     sample: '29' },
    orders: {
      type: '[Order!]!', sample: '…',
      children: {
        id:    { type: 'ID!',     sample: '9001' },
        total: { type: 'Float!',  sample: '1450000' },
        status:{ type: 'String!', sample: '"SHIPPED"' }
      }
    }
  };

  function initGraphql(demo) {
    const out = $('[data-graphql-out]', demo);
    const boxes = $$('[data-graphql-fields] input[type=checkbox]', demo);
    const reset = $('[data-graphql-reset]', demo);
    const note = $('[data-graphql-note]', demo);
    if (!out || !boxes.length) return;

    function selected() {
      return boxes.filter((b) => b.checked).map((b) => b.dataset.field);
    }

    function render() {
      const fields = selected();
      $$('.ax-check', demo).forEach((c) => c.classList.toggle('is-on', c.querySelector('input').checked));

      if (!fields.length) {
        out.textContent = '// هیچ فیلدی انتخاب نشده — کوئری خالی است\n// حداقل یک فیلد لازم است.';
        if (note) note.textContent = 'کوئری خالی خطای اعتبارسنجی می‌گیرد.';
        return;
      }

      const lines = ['query GetUser {', '  user(id: "42") {'];
      fields.forEach((f) => {
        const def = GQL_SCHEMA[f];
        if (!def) return;
        lines.push('    ' + f);
        if (def.children) {
          Object.keys(def.children).forEach((c) => lines.push('      ' + c));
        }
      });
      lines.push('  }', '}');
      out.textContent = lines.join('\n');

      /* Build the matching response so over/under-fetching is visible. */
      const resp = ['{', '  "data": {', '    "user": {'];
      fields.forEach((f) => {
        const def = GQL_SCHEMA[f];
        if (!def) return;
        if (def.children) {
          resp.push('      "' + f + '": [');
          Object.keys(def.children).forEach((c, i) => {
            resp.push('        { "' + c + '": ' + def.children[c].sample + ' }' + (i < Object.keys(def.children).length - 1 ? ',' : ''));
          });
          resp.push('      ]');
        } else {
          resp.push('      "' + f + '": ' + def.sample);
        }
      });
      resp.push('    }', '  }', '}');

      const bytes = out.textContent.length + resp.join('\n').length;
      if (note) {
        note.innerHTML =
          '<strong>' + fields.length + '</strong> فیلد انتخاب شده؛ پاسخ تقریباً <strong>' +
          bytes + '</strong> بایت. ' +
          'همین است که <code>under-fetching</code> را ممکن و <code>over-fetching</code> را پرهزینه می‌کند.';
      }
    }

    boxes.forEach((b) => b.addEventListener('change', render));
    if (reset) reset.addEventListener('click', () => {
      boxes.forEach((b, i) => { b.checked = i < 2; });
      render();
    });
    render();
  }

  /* ============================================================
     3. WebSocket — two-way conversation
     ============================================================ */
  function initWebsocket(demo) {
    const log = $('[data-ws-log]', demo);
    const send = $('[data-ws-send]', demo);
    const connect = $('[data-ws-connect]', demo);
    const clear = $('[data-ws-clear]', demo);
    if (!log) return;

    let cancel = null;

    function handshake() {
      logLine(log, 'sys', 'GET /ws/chat HTTP/1.1');
      logLine(log, 'sys', 'Upgrade: websocket');
      logLine(log, 'sys', 'Connection: Upgrade');
      logLine(log, 'sys', 'Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=');
      logLine(log, 'sys', '101 Switching Protocols — اتصال یک‌طرفه بسته شد');
      logLine(log, 'sys', 'اتصال پایدار؛ از این به بعد frame‌ها دوطرفه‌اند');
    }

    function bubble() {
      logLine(log, 'out', '{"type":"typing"}');
      setTimeout(() => {
        if (cancel === null) return;
        logLine(log, 'in', '{"type":"message","from":"support","text":"سلام، چطور می‌تونم کمک کنم؟"}');
      }, 800);
    }

    if (connect) connect.addEventListener('click', () => {
      clearLog(log);
      handshake();
      bubble();
    });

    if (send) send.addEventListener('click', () => {
      const text = (send.parentElement && send.parentElement.querySelector('input') || {}).value;
      logLine(log, 'out', '{"type":"message","text":"' + (text ? esc(text) : 'سلام') + '"}');
      cancel = 1;
      bubble();
    });

    if (clear) clear.addEventListener('click', () => clearLog(log));
  }

  /* ============================================================
     4. Webhook — trigger an event and watch delivery
     ============================================================ */
  function initWebhook(demo) {
    const log = $('[data-hook-log]', demo);
    const btn = $('[data-hook-trigger]', demo);
    const reset = $('[data-hook-reset]', demo);
    if (!log || !btn) return;

    btn.addEventListener('click', () => {
      clearLog(log);
      const evt = 'evt_' + Math.random().toString(16).slice(2, 10);
      play(log, [
        ['sys', 'رویداد در ارائه‌دهنده رخ داد: payment.succeeded', 520],
        ['sys', 'ساخت امضای HMAC-SHA256 با کلید سرور (shared secret)', 520],
        ['out', 'POST https://merchant.example.com/hooks/payment HTTP/1.1', 620],
        ['out', 'X-Webhook-Signature: sha256=3f9a1c...b70e', 420],
        ['out', 'X-Webhook-Id: ' + evt, 420],
        ['out', '{"event":"payment.succeeded","amount":1450000}', 620],
        ['sys', 'مصرف‌کننده امضا را با ثابت زمانی مقایسه می‌کند', 520],
        ['sys', '✓ امضا معتبر — پردازش انجام شد', 520],
        ['in', 'HTTP/1.1 200 OK (در کمتر از ۵ ثانیه)', 480],
        ['sys', 'ارسال‌کننده پاسخ ۲xx را دریافت کرد ⇒ تلاش مجدد نمی‌کند', 520]
      ]);
    });

    if (reset) reset.addEventListener('click', () => clearLog(log));
    logLine(log, 'sys', 'برای شروع دکمه‌ی «رویداد را فعال کن» را بزنید.');
  }

  /* ============================================================
     5. SSE — server pushes a stream of events
     ============================================================ */
  function initSse(demo) {
    const log = $('[data-sse-log]', demo);
    const btn = $('[data-sse-start]', demo);
    const reset = $('[data-sse-reset]', demo);
    if (!log || !btn) return;

    btn.addEventListener('click', () => {
      clearLog(log);
      const steps = [
        ['sys', 'GET /events HTTP/1.1   (Accept: text/event-stream)'],
        ['in',  'HTTP/1.1 200 OK'],
        ['in',  'Content-Type: text/event-stream'],
        ['in',  'Cache-Control: no-cache'],
        ['sys', 'اتصال باز می‌ماند؛ سرور رویدادها را هر وقت آماده شد می‌فرستد'],
        ['in',  'id: 101\nevent: progress\ndata: {"done":10}'],
        ['in',  'id: 102\nevent: progress\ndata: {"done":45}'],
        ['in',  'id: 103\nevent: progress\ndata: {"done":80}'],
        ['in',  'id: 104\nevent: done\ndata: {"answer":"چند جمله درباره‌ی API"}'],
        ['sys', 'سرور اتصال را می‌بندد ⇒ مرورگر پس از «retry» دوباره وصل می‌شود']
      ].map((s) => [s[0], s[1]]);
      play(log, steps);
    });

    if (reset) reset.addEventListener('click', () => clearLog(log));
    logLine(log, 'sys', 'جریان یک‌طرفه است: فقط سرور می‌فرستد.');
  }

  /* ============================================================
     6. MQTT — publish / subscribe by topic
     ============================================================ */
  const MQTT_TOPICS = {
    'sensors/temperature':  { qos: 1, sub: 'dashboard' },
    'sensors/humidity':     { qos: 0, sub: 'dashboard' },
    'devices/+/status':     { qos: 1, sub: 'fleet-manager' },
    'alerts/+/critical':    { qos: 2, sub: 'oncall' }
  };

  function initMqtt(demo) {
    const log = $('[data-mqtt-log]', demo);
    const list = $('[data-mqtt-topics]', demo);
    const payload = $('[data-mqtt-payload]', demo);
    const pub = $('[data-mqtt-pub]', demo);
    if (!log || !list || !pub) return;

    function paint(hot) {
      $$('[data-topic]', list).forEach((row) => {
        row.classList.toggle('is-hot', row.dataset.topic === hot);
      });
    }

    function publish() {
      const topic = pub.dataset.topic;
      const def = MQTT_TOPICS[topic] || { qos: 1, sub: '—' };
      const value = (payload && payload.value) || '{"t":23.4,"unit":"C"}';

      paint(topic);
      logLine(log, 'sys', 'PUBLISH  topic=' + topic + '  qos=' + def.qos);
      logLine(log, 'out', value);
      logLine(log, 'in', 'subscriber "' + def.sub + '" دریافت کرد (قفل پیام QoS ' + def.qos + ')');

      /* wildcard subscriber also matches */
      if (topic.indexOf('+') !== -1) {
        logLine(log, 'sys', 'توجه: الگوی wildcard هم با این topic مطابقت کرد.');
      }
      setTimeout(() => paint(''), 900);
    }

    pub.addEventListener('click', publish);
    const reset = $('[data-mqtt-reset]', demo);
    if (reset) reset.addEventListener('click', () => { clearLog(log); paint(''); });

    logLine(log, 'sys', 'یک topic را انتخاب و «انتشار» را بزنید.');
  }

  /* ============================================================
     7. Decision tree — rendered from data, no markup needed
     ============================================================ */
  const DECISION_TREE = {
    id: 'realtime',
    question: 'آیا به ارتباط بلادرنگ (Real-time) نیاز دارید؟',
    branches: [
      { cond: 'بله', next: 'two-way' },
      { cond: 'نه', next: 'public' }
    ]
  };

  const DECISION_NODES = {
    'two-way': {
      question: 'ارتباط باید دوطرفه باشد؟',
      branches: [
        { cond: 'بله — کلاینت هم مدام داده می‌فرستد', result: {
          tech: 'WebSocket',
          cat: 'پروتکل ارتباط دوطرفه',
          desc: 'یک اتصال پایدار و full-duplex. مناسب چت، بازی چندنفره و ویرایشگر مشترک.',
          href: 'websocket.html'
        } },
        { cond: 'نه — فقط سرور باید خبر بدهد', result: {
          tech: 'SSE',
          cat: 'مکانیزم استریم یک‌طرفه روی HTTP',
          desc: 'ساده‌تر از WebSocket و از همان HTTP استفاده می‌کند؛ برای اعلان و استریم پاسخ مناسب است.',
          href: 'sse.html'
        } }
      ]
    },
    'public': {
      question: 'این API برای چه مصرفی است؟',
      branches: [
        { cond: 'API عمومی روی وب', next: 'public-web' },
        { cond: 'ارتباط داخلی بین سرویس‌ها', next: 'internal' },
        { cond: 'اعلام رویداد به سیستم بیرونی', result: {
          tech: 'Webhook',
          cat: 'الگوی اعلام رویداد / callback',
          desc: 'پس از رخ دادن رویداد، ارائه‌دهنده یک POST به سیستم شما می‌فرستد.',
          href: 'webhook.html'
        } },
        { cond: 'یکپارچه‌سازی سازمانی با قرارداد پایدار', result: {
          tech: 'SOAP',
          cat: 'پروتکل پیام با قرارداد رسمی',
          desc: 'وقتی قرارداد، امنیت سطح سرویس و تراکنش توزیع‌شده بخشی از نیاز است.',
          href: 'soap.html'
        } },
        { cond: 'دستگاه‌های IoT با پهنای باند کم', result: {
          tech: 'MQTT',
          cat: 'پروتکل سبک Pub/Sub',
          desc: 'مدل سررسید-کم، مصرف برق پایین و سطوح تحویل QoS.',
          href: 'mqtt.html'
        } }
      ]
    },
    'public-web': {
      question: 'کلاینت چه چیزی لازم دارد؟',
      branches: [
        { cond: 'منابع ساده و پراکنده', result: {
          tech: 'REST',
          cat: 'سبک معماری',
          desc: 'پیش‌فرض پیشنهادی برای API عمومی: کش‌پذیر، ابزارمحور و مستندپذیر.',
          href: 'rest.html'
        } },
        { cond: 'کلاینت هر بار فیلدهای متفاوتی می‌خواهد', result: {
          tech: 'GraphQL',
          cat: 'زبان کوئری + runtime',
          desc: 'وقتی over-fetching و under-fetching واقعی و آزاردهنده است.',
          href: 'graphql.html'
        } },
        { cond: 'دسترسی استانداردشده به داده‌ی موجود', result: {
          tech: 'OData',
          cat: 'پروتکل دسترسی داده روی HTTP',
          desc: 'وقتی مصرف‌کننده‌ها و کوئری‌های استاندارد ($filter/$expand) مهم‌اند.',
          href: 'odata.html'
        } }
      ]
    },
    'internal': {
      question: 'می‌خواهید چه چیزی برایتان اولویت دارد؟',
      branches: [
        { cond: 'تأخیر کم و قرارداد محکم بین سرویس‌ها', result: {
          tech: 'gRPC',
          cat: 'فریم‌ورک RPC',
          desc: 'کد تولیدی، HTTP/2 و Protobuf. مناسب ارتباط داخلی با نوع‌های روشن.',
          href: 'grpc.html'
        } },
        { cond: 'پیوند کم‌هزینه با سیستم‌های قدیمی', result: {
          tech: 'JSON-RPC یا XML-RPC',
          cat: 'پروتکل RPC',
          desc: 'وقتی فقط یک متد را روی یک پورت صدا می‌زنید و مدل داده بزرگی ندارید.',
          href: 'json-rpc.html'
        } },
        { cond: 'واگذاری کار و تحمل تأخیر', result: {
          tech: 'معماری رویدادمحور',
          cat: 'الگوی معماری',
          desc: 'تولیدکننده، پیام‌رسان و مصرف‌کننده؛ سازگاری نهایی به‌جای تراکنش توزیع‌شده.',
          href: 'event-driven-apis.html'
        } }
      ]
    }
  };

  function renderTreeNode(tree, id) {
    const node = id === DECISION_TREE.id ? DECISION_TREE : DECISION_NODES[id];
    if (!node) return;

    if (node.result) {
      tree.innerHTML =
        '<div class="ax-tree-result">' +
          '<span class="ax-tree-result-icon" aria-hidden="true">✅</span>' +
          '<div class="ax-tree-result-body">' +
            '<strong>' + esc(node.result.tech) + '</strong>' +
            '<span>' + esc(node.result.desc) + '</span>' +
            '<p style="margin:7px 0 0"><span class="ax-badge ax-badge--pattern">' + esc(node.result.cat) + '</span> ' +
            '<a href="' + esc(node.result.href) + '">مطالعه‌ی کامل ←</a></p>' +
          '</div>' +
        '</div>' +
        '<button class="ax-tree-reset" type="button" data-tree-reset>شروع دوباره</button>';
      const r = $('[data-tree-reset]', tree);
      if (r) r.addEventListener('click', () => renderTreeNode(tree, DECISION_TREE.id));
      return;
    }

    tree.innerHTML =
      '<div class="ax-tree-question">' + esc(node.question) + '</div>' +
      '<div class="ax-tree-branches">' +
        node.branches.map((b) =>
          '<button class="ax-tree-branch" type="button" data-tree-goto="' + esc(b.next || '') + '">' +
            '<span class="ax-tree-cond">' + esc(b.cond) + '</span>' +
            '<span class="ax-tree-arrow" aria-hidden="true">←</span>' +
          '</button>'
        ).join('') +
      '</div>' +
      '<button class="ax-tree-reset" type="button" data-tree-reset>بازگشت به سؤال اول</button>';

    $$('[data-tree-goto]', tree).forEach((btn) => {
      btn.addEventListener('click', () => renderTreeNode(tree, btn.dataset.treeGoto));
    });
    const r = $('[data-tree-reset]', tree);
    if (r) r.addEventListener('click', () => renderTreeNode(tree, DECISION_TREE.id));
  }

  function initTree(tree) {
    renderTreeNode(tree, DECISION_TREE.id);
  }

  /* ============================================================
     8. Hub search — Persian/Arabic insensitive
     ============================================================ */
  const faDigits = '۰۱۲۳۴۵۶۷۸۹';
  const toFa = (n) => String(n).replace(/\d/g, (d) => faDigits[d]);

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

  function initHubSearch(root) {
    const input = $('[data-hub-input]', root);
    const cards = $$('[data-hub-card]', root);
    const count = $('[data-hub-count]', root);
    const empty = $('[data-hub-empty]', root);
    const groups = $$('[data-hub-group]', root);
    if (!input || !cards.length) return;

    const items = cards.map((el) => ({
      el,
      hay: normalize(el.dataset.title + ' ' + el.dataset.desc + ' ' + el.dataset.tags + ' ' + el.dataset.cat)
    }));

    function render() {
      const tokens = normalize(input.value).split(' ').filter(Boolean);
      let visible = 0;

      items.forEach((it) => {
        const ok = tokens.length === 0 || tokens.every((t) => it.hay.includes(t));
        it.el.style.display = ok ? '' : 'none';
        if (ok) visible++;
      });

      groups.forEach((g) => {
        const any = $$('[data-hub-card]', g).some((c) => c.style.display !== 'none');
        g.style.display = any ? '' : 'none';
      });

      if (count) {
        count.innerHTML = '<strong>' + toFa(visible) + '</strong> از ' + toFa(items.length) + ' مقاله';
      }
      if (empty) empty.classList.toggle('show', visible === 0);
    }

    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(render, 110);
    });

    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
      if (e.key === '/' && !typing) { e.preventDefault(); input.focus(); input.select(); }
      else if (e.key === 'Escape' && document.activeElement === input) { input.value = ''; render(); input.blur(); }
    });

    render();
  }

  /* ============================================================
     Boot
     ============================================================ */
  function initAll() {
    $$('.ax-demo[data-demo]').forEach((demo) => {
      const kind = demo.dataset.demo;
      if (kind === 'rest') initRest(demo);
      else if (kind === 'graphql') initGraphql(demo);
      else if (kind === 'websocket') initWebsocket(demo);
      else if (kind === 'webhook') initWebhook(demo);
      else if (kind === 'sse') initSse(demo);
      else if (kind === 'mqtt') initMqtt(demo);
    });

    $$('[data-tree]').forEach(initTree);
    $$('[data-hub-search]').forEach(initHubSearch);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();