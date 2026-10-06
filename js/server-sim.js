/* ==========================================================================
   server-sim.js — شبیه‌ساز تعاملی معماری Production
   --------------------------------------------------------------------------
   فقط در صفحه‌ی articles/server-architecture.html استفاده می‌شود.
   دو قابلیت مستقل دارد:
     ۱) انتخاب گره در شکل معماری و نمایش نقش/پورت/پروتکل/مسئولیت‌ها
     ۲) شبیه‌سازی خرابی گره‌ها و رفتار Failover
   بدون هیچ وابستگی خارجی. اگر جاوااسکریپت اجرا نشود، شکل و متن‌ها خوانا می‌مانند.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* ۱) داده‌ی گره‌ها                                                     */
  /* ------------------------------------------------------------------ */
  var NODES = {
    client: {
      name: 'Client',
      role: 'Browser / Mobile App',
      port: '—',
      protocol: 'HTTPS',
      network: 'Public',
      resp: ['User Agent', 'HTTP Cache', 'Connection Reuse'],
      fail: ['بدون کلاینت هیچ ترافیکی وجود ندارد']
    },
    nginx: {
      name: 'NGINX',
      role: 'Reverse Proxy · TLS Termination',
      port: '80 / 443',
      protocol: 'HTTPS → HTTP',
      network: 'Public ↔ Private',
      resp: ['TLS Termination', 'Routing', 'Load Balancing', 'Caching', 'Rate Limiting', 'Security Headers'],
      fail: ['قطع کامل ورودی سرویس', 'نیازمند DNS Failover یا Floating IP']
    },
    lb: {
      name: 'Load Balancer',
      role: 'Traffic Distribution',
      port: '8080',
      protocol: 'HTTP',
      network: 'Private',
      resp: ['Round Robin', 'Health Check', 'Failover', 'Sticky Session'],
      fail: ['اگر تنها باشد، نقطه‌ی شکست تک است']
    },
    backend1: {
      name: 'Backend 1',
      role: 'Application Server',
      port: ':8080',
      protocol: 'HTTP (Internal)',
      network: 'Private',
      resp: ['Business Logic', 'Session Handling', 'Database Access'],
      fail: ['Health Check آن را از چرخه حذف می‌کند', 'ترافیک به Backend 2 و 3 منتقل می‌شود']
    },
    backend2: {
      name: 'Backend 2',
      role: 'Application Server',
      port: ':8081',
      protocol: 'HTTP (Internal)',
      network: 'Private',
      resp: ['Business Logic', 'Session Handling', 'Database Access'],
      fail: ['Health Check آن را از چرخه حذف می‌کند', 'ترافیک بین گره‌های سالم پخش می‌شود']
    },
    backend3: {
      name: 'Backend 3',
      role: 'Application Server',
      port: ':8082',
      protocol: 'HTTP (Internal)',
      network: 'Private',
      resp: ['Business Logic', 'Session Handling', 'Database Access'],
      fail: ['Health Check آن را از چرخه حذف می‌کند', 'ترافیک بین گره‌های سالم پخش می‌شود']
    },
    redis: {
      name: 'Redis',
      role: 'Cache · Session · Queue',
      port: ':6379',
      protocol: 'RESP',
      network: 'Private',
      resp: ['Caching', 'Session Store', 'Message Queue'],
      fail: ['Cache Miss و افت کارایی', 'افزایش فشار روی PostgreSQL']
    },
    postgres: {
      name: 'PostgreSQL',
      role: 'Primary Data Store',
      port: ':5432',
      protocol: 'PostgreSQL Wire',
      network: 'Private',
      resp: ['Persistent Data', 'Transactions', 'Primary / Replica'],
      fail: ['Connection Timeout', 'Retry با Backoff', 'Circuit Breaker و Graceful Degradation']
    }
  };

  /* ------------------------------------------------------------------ */
  /* ۲) شبیه‌ساز انتخاب گره                                              */
  /* ------------------------------------------------------------------ */
  function initSimulator() {
    var root = document.querySelector('[data-sim]');
    if (!root) return;

    var nodes = root.querySelectorAll('.sa-node');
    var empty = root.querySelector('[data-sim-empty]');
    var detail = root.querySelector('[data-sim-detail]');
    if (!nodes.length || !detail) return;

    var out = {
      name: detail.querySelector('[data-sim-name]'),
      role: detail.querySelector('[data-sim-role]'),
      port: detail.querySelector('[data-sim-port]'),
      protocol: detail.querySelector('[data-sim-protocol]'),
      network: detail.querySelector('[data-sim-network]'),
      resp: detail.querySelector('[data-sim-resp]'),
      fail: detail.querySelector('[data-sim-fail]')
    };

    function fillList(el, items) {
      if (!el) return;
      el.innerHTML = '';
      (items || []).forEach(function (t) {
        var li = document.createElement('li');
        li.textContent = t;
        el.appendChild(li);
      });
    }

    function select(id) {
      var data = NODES[id];
      if (!data) return;

      nodes.forEach(function (g) {
        var on = g.getAttribute('data-node') === id;
        g.classList.toggle('is-active', on);
        g.classList.toggle('is-dim', !on && id !== 'client');
      });

      if (out.name) out.name.textContent = data.name;
      if (out.role) out.role.textContent = data.role;
      if (out.port) out.port.textContent = data.port;
      if (out.protocol) out.protocol.textContent = data.protocol;
      if (out.network) out.network.textContent = data.network;
      fillList(out.resp, data.resp);
      fillList(out.fail, data.fail);

      if (empty) empty.hidden = true;
      detail.hidden = false;
    }

    nodes.forEach(function (g) {
      var id = g.getAttribute('data-node');
      g.addEventListener('click', function () { select(id); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          select(id);
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* ۳) شبیه‌سازی خرابی و Failover                                       */
  /* ------------------------------------------------------------------ */
  function initFailover() {
    var root = document.querySelector('[data-fail]');
    if (!root) return;

    var buttons = root.querySelectorAll('[data-fail-toggle]');
    var resetBtn = root.querySelector('[data-fail-reset]');
    var log = root.querySelector('[data-fail-log]');
    var boxes = root.querySelectorAll('[data-fail-node]');
    var state = { backend1: false, postgres: false };

    function boxFor(id) {
      var found = null;
      boxes.forEach(function (b) {
        if (b.getAttribute('data-fail-node') === id) found = b;
      });
      return found;
    }

    function line(text, kind) {
      var p = document.createElement('p');
      p.className = 'sa-fail-line sa-fail-line-' + (kind || 'ok');
      p.textContent = text;
      return p;
    }

    function render() {
      boxes.forEach(function (b) {
        b.classList.remove('is-down', 'is-rerouted');
      });
      buttons.forEach(function (btn) {
        var id = btn.getAttribute('data-fail-toggle');
        btn.classList.toggle('is-active', !!state[id]);
        if (state[id]) {
          btn.textContent = btn.textContent.replace('❌', '✅');
        } else {
          btn.textContent = btn.textContent.replace('✅', '❌');
        }
      });

      var lines = [];
      var backendDown = state.backend1;
      var dbDown = state.postgres;

      var b1 = boxFor('backend1');
      if (b1) b1.classList.toggle('is-down', backendDown);
      if (backendDown) {
        ['backend2', 'backend3'].forEach(function (id) {
          var box = boxFor(id);
          if (box) box.classList.add('is-rerouted');
        });
      }

      var pg = boxFor('postgres');
      if (pg) pg.classList.toggle('is-down', dbDown);

      if (!backendDown && !dbDown) {
        lines.push(line('وضعیت: همه‌ی گره‌ها سالم هستند. Load Balancer ترافیک را بین سه Backend پخش می‌کند.', 'ok'));
      }
      if (backendDown) {
        lines.push(line('Backend 1 از دست رفت؛ Health Check آن را از گردش خارج کرد و ترافیک بین Backend 2 و Backend 3 پخش شد.', 'warn'));
        lines.push(line('در این حالت هیچ درخواستی از دست نمی‌رود؛ به شرطی که ظرفیت دو گره‌ی باقی‌مانده کافی باشد.', 'ok'));
      }
      if (dbDown) {
        lines.push(line('PostgreSQL در دسترس نیست؛ Connectionها Timeout می‌شوند و برنامه باید Retry و Circuit Breaker داشته باشد.', 'bad'));
        lines.push(line('راه‌حل Production: Replica خواندنی، Failover خودکار و Graceful Degradation در سطح برنامه.', 'warn'));
      }
      if (backendDown && dbDown) {
        lines.push(line('ترکیب این دو خرابی نشان می‌دهد چرا لایه‌بندی و جداسازی مسئولیت‌ها حیاتی است: خرابی دیتابیس با افزودن Backend جبران نمی‌شود.', 'bad'));
      }

      if (log) {
        log.innerHTML = '';
        lines.forEach(function (p) { log.appendChild(p); });
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-fail-toggle');
        if (!(id in state)) return;
        state[id] = !state[id];
        render();
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.backend1 = false;
        state.postgres = false;
        render();
      });
    }

    render();
  }

  /* ------------------------------------------------------------------ */
  /* ۴) راه‌اندازی                                                        */
  /* ------------------------------------------------------------------ */
  function boot() {
    initSimulator();
    initFailover();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
