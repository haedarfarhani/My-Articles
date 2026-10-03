/**
 * rx-stream-animations.js — موتور انیمیشن‌های دیاگرام ماربل (Marble Diagram)
 *
 * قرارداد استفاده در HTML:
 *   <figure class="rx-anim" data-rx="map" aria-label="انیمیشن عملگر map">
 *     <figcaption>توضیح فارسی…</figcaption>
 *   </figure>
 *
 * امکانات:
 *   • شروع خودکار هنگام دیده‌شدن (IntersectionObserver)
 *   • دکمه‌های پخش/توقف و شروع دوباره + انتخاب سرعت (0.5× / 1× / 2×)
 *   • خط‌کش زمان و نشانگر زنده (Playhead) برای عملگرهای زمانی
 *   • توقف خودکار خارج از دید، حالت ایستا برای prefers-reduced-motion
 *   • برچسب‌های aria فارسی و کامنت‌های فارسی؛ بدون وابستگی به هیچ کتابخانه‌ای
 *
 * قرارداد ReactiveX: ماربل دایره = onNext، خط عمودی | = onComplete،
 * دایره‌ی قرمز × = onError. محور زمان همیشه از چپ به راست است (LTR).
 */
(function () {
  'use strict';

  /* مدت واقعیِ یک «واحد زمان» در سرعت ۱× (میلی‌ثانیه) */
  var UNIT_MS = 850;

  /* نمادها (SVG درون دکمه‌های کنترل) */
  var ICON_PLAY =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>';
  var ICON_PAUSE =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>';
  var ICON_RESTART =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"></path><polyline points="21 3 21 9 15 9"></polyline></svg>';

  /* ==========================================================================
     کاتالوگ عملگرها
     هر ورودی:
       title : عنوان فارسی
       op    : نام عملگر/عبارت داخل جعبه (LTR)
       tracks: آرایه‌ی ردیف‌ها. هر ردیف:
               { label, role: 'source'|'out'|'op', color?: 'info'|'warning',
                 events: [[t, value, kind?]] }
               kind: 'complete' | 'error' | 'drop' (پیش‌فرض onNext)
     ========================================================================== */
  var CATALOG = {
    /* ---------- ساخت و انتشار جریان ---------- */
    lifecycle: {
      title: 'چرخه‌ی حیات Observable: onNext، onComplete و onError',
      op: null,
      tracks: [
        {
          label: 'myObservable.subscribe(observer)',
          role: 'source',
          events: [
            [0.5, 'A'],
            [1.5, 'B'],
            [2.5, 'C'],
            [3.5, '', 'complete'],
          ],
        },
      ],
      caption:
        'جریان مقدارها را یکی‌یکی می‌فرستد (onNext) و در پایان با onComplete بسته می‌شود؛ پس از آن هیچ رویدادی نمی‌رسد.',
    },

    just: {
      title: 'just — انتشار چند مقدار ثابت',
      op: 'just("Hello", "World")',
      tracks: [
        {
          label: 'Observable.just(...)',
          role: 'source',
          events: [
            [0.5, 'Hello'],
            [1.4, 'World'],
            [2.4, '', 'complete'],
          ],
        },
      ],
      caption:
        'just مقادیر داده‌شده را به‌ترتیب منتشر می‌کند و بلافاصله onComplete می‌فرستد. («Hello» به‌دلیل عرض، کوچک‌تر نمایش داده شده است.)',
    },

    from: {
      title: 'from — تبدیل آرایه/لیست به جریان',
      op: 'fromArray(1, 2, 3)',
      tracks: [
        {
          label: 'Observable.from(...)',
          role: 'source',
          events: [
            [0.5, '1'],
            [1.2, '2'],
            [1.9, '3'],
            [2.7, '', 'complete'],
          ],
        },
      ],
      caption: 'هر آیتم آرایه به‌صورت یک onNext منتشر می‌شود؛ سپس onComplete.',
    },

    range: {
      title: 'range — تولید یک بازه‌ی عددی',
      op: 'range(1, 5)',
      tracks: [
        {
          label: 'Observable.range(1, 5)',
          role: 'source',
          events: [
            [0.4, '1'],
            [0.9, '2'],
            [1.4, '3'],
            [1.9, '4'],
            [2.4, '5'],
            [3.0, '', 'complete'],
          ],
        },
      ],
      caption: 'range(start, count) پنج مقدار پشت‌سرهم می‌فرستد و تمام می‌شود.',
    },

    repeat: {
      title: 'repeat — تکرار جریان',
      op: 'range(1, 3).repeat(2)',
      tracks: [
        {
          label: 'source',
          role: 'source',
          events: [
            [0.4, '1'],
            [0.9, '2'],
            [1.4, '3'],
            [2.2, '1'],
            [2.7, '2'],
            [3.2, '3'],
            [3.9, '', 'complete'],
          ],
        },
      ],
      caption:
        'repeat(2) کل جریان را دوبار از سر می‌گیرد. اگر بدون آرگومان صدا شود، جریان برای همیشه تکرار می‌شود و هرگز complete نمی‌شود.',
    },

    interval: {
      title: 'interval — انتشار دوره‌ای بی‌نهایت',
      op: 'interval(1000)',
      tracks: [
        {
          label: 'Observable.interval(1s)',
          role: 'source',
          events: [
            [1, '0'],
            [2, '1'],
            [3, '2'],
            [4, '3'],
            [5, '4'],
          ],
        },
      ],
      caption:
        'interval هر ثانیه یک عدد صفر‌محور می‌فرستد و هرگز complete نمی‌شود؛ برای محدودکردن از take(n) استفاده کنید.',
    },

    timer: {
      title: 'timer — یک مقدار پس از تأخیر',
      op: 'timer(2000)',
      tracks: [
        {
          label: 'Observable.timer(2s)',
          role: 'source',
          events: [
            [2, '0'],
            [2.7, '', 'complete'],
          ],
        },
      ],
      caption: 'timer پس از تأخیر مشخص‌شده یک مقدار منتشر می‌کند و جریان را می‌بندد.',
    },

    /* ---------- تبدیل (Transformation) ---------- */
    map: {
      title: 'map — تبدیل هر المان',
      op: 'map(x -> x * 2)',
      tracks: [
        {
          label: 'ObservableSource',
          role: 'source',
          events: [
            [0.5, '1'],
            [1.5, '2'],
            [2.5, '3'],
            [3.5, '', 'complete'],
          ],
        },
        { label: 'map(x * 2)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [0.5, '2'],
            [1.5, '4'],
            [2.5, '6'],
            [3.5, '', 'complete'],
          ],
        },
      ],
      caption:
        'map روی هر مقدار اعمال می‌شود و در همان لحظه‌ی انتشار، مقدار جدید به پایین می‌رود؛ زمان‌بندی جریان عوض نمی‌شود.',
    },

    filter: {
      title: 'filter — عبور فقط المان‌های شرطی',
      op: 'filter(x -> x % 2 == 0)',
      tracks: [
        {
          label: 'source: 1, 2, 3, 4',
          role: 'source',
          events: [
            [0.5, '1'],
            [1.2, '2'],
            [1.9, '3'],
            [2.6, '4'],
            [3.4, '', 'complete'],
          ],
        },
        { label: 'filter(even)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [1.2, '2'],
            [2.6, '4'],
            [3.4, '', 'complete'],
          ],
        },
      ],
      caption:
        'المان‌های ردشده هرگز به Observer نمی‌رسند؛ onComplete و onError همیشه از فیلتر عبور می‌کنند.',
    },

    distinct: {
      title: 'distinct — حذف مقادیر تکراری',
      op: 'distinct()',
      tracks: [
        {
          label: 'source: 1, 2, 1, 3, 2',
          role: 'source',
          events: [
            [0.5, '1'],
            [1.1, '2'],
            [1.7, '1'],
            [2.3, '3'],
            [2.9, '2'],
            [3.6, '', 'complete'],
          ],
        },
        { label: 'distinct()', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [0.5, '1'],
            [1.1, '2'],
            [2.3, '3'],
            [3.6, '', 'complete'],
          ],
        },
      ],
      caption:
        'هر مقدار فقط بار اول منتشر می‌شود؛ تکرارهای بعدی (۱ در t=1.7 و ۲ در t=2.9) حذف می‌شوند.',
    },

    take: {
      title: 'take — فقط n المان اول',
      op: 'take(3)',
      tracks: [
        {
          label: 'source',
          role: 'source',
          events: [
            [0.4, '1'],
            [0.9, '2'],
            [1.4, '3'],
            [1.9, '4'],
            [2.4, '5'],
            [2.9, '', 'complete'],
          ],
        },
        { label: 'take(3)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [0.4, '1'],
            [0.9, '2'],
            [1.4, '3'],
            [1.45, '', 'complete'],
          ],
        },
      ],
      caption:
        'پس از رسیدن المان سوم، خروجی بلافاصله onComplete می‌فرستد و جریان منبع (4 و 5) دیگر اهمیتی ندارد.',
    },

    skip: {
      title: 'skip — نادیده‌گرفتن n المان اول',
      op: 'skip(2)',
      tracks: [
        {
          label: 'source: 1..5',
          role: 'source',
          events: [
            [0.4, '1'],
            [0.9, '2'],
            [1.4, '3'],
            [1.9, '4'],
            [2.4, '5'],
            [2.9, '', 'complete'],
          ],
        },
        { label: 'skip(2)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [1.4, '3'],
            [1.9, '4'],
            [2.4, '5'],
            [2.9, '', 'complete'],
          ],
        },
      ],
      caption: 'دو المان اول در منبع منتشر می‌شوند ولی به Observer نمی‌رسند.',
    },

    takeWhile: {
      title: 'takeWhile — تا وقتی شرط برقرار است',
      op: 'takeWhile(x -> x < 4)',
      tracks: [
        {
          label: 'source: 1..5',
          role: 'source',
          events: [
            [0.4, '1'],
            [0.9, '2'],
            [1.4, '3'],
            [1.9, '4'],
            [2.4, '5'],
          ],
        },
        { label: 'takeWhile(x < 4)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [0.4, '1'],
            [0.9, '2'],
            [1.4, '3'],
            [1.9, '', 'complete'],
          ],
        },
      ],
      caption:
        'به‌محض اینکه اولین مقدار نامطلوب (۴) برسد، جریان خروجی کامل می‌شود؛ مقدار ۴ و ۵ هرگز دیده نمی‌شوند.',
    },

    /* ---------- ترکیب جریان‌ها (Combination) ---------- */
    flatMap: {
      title: 'flatMap — اتصال موازی جریان‌های داخلی',
      op: 'flatMap(id -> fetchDetails(id))',
      tracks: [
        {
          label: 'source: A, B',
          role: 'source',
          events: [
            [0.5, 'A'],
            [1.5, 'B'],
            [2.6, '', 'complete'],
          ],
        },
        { label: 'flatMap(fetch)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [0.9, 'A₁'],
            [1.3, 'A₂'],
            [1.9, 'B₁'],
            [2.3, 'B₂'],
            [2.6, '', 'complete'],
          ],
        },
      ],
      caption:
        'برای هر مقدار منبع، یک جریان داخلی ساخته و نتایج با هم ترکیب می‌شوند؛ ترتیب تضمینی ندارد و خروجی‌ها می‌توانند به‌هم بخورند.',
    },

    concatMap: {
      title: 'concatMap — اتصال ترتیبی جریان‌های داخلی',
      op: 'concatMap(id -> fetchDetails(id))',
      tracks: [
        {
          label: 'source: A, B',
          role: 'source',
          events: [
            [0.5, 'A'],
            [1.5, 'B'],
            [2.7, '', 'complete'],
          ],
        },
        { label: 'concatMap(fetch)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [0.9, 'A₁'],
            [1.4, 'A₂'],
            [1.9, 'B₁'],
            [2.4, 'B₂'],
            [2.7, '', 'complete'],
          ],
        },
      ],
      caption:
        'جریان داخلی بعدی فقط بعد از اتمام قبلی شروع می‌شود؛ خروجی همیشه ترتیبی و قطعی است.',
    },

    switchMap: {
      title: 'switchMap — پرش به جریان داخلیِ آخر',
      op: 'switchMap(id -> fetchDetails(id))',
      tracks: [
        {
          label: 'source: A, B',
          role: 'source',
          events: [
            [0.5, 'A'],
            [1.5, 'B'],
            [2.6, '', 'complete'],
          ],
        },
        { label: 'switchMap(fetch)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [0.9, 'A₁'],
            [1.3, 'A₂'],
            [1.75, 'A₃', 'drop'],
            [1.9, 'B₁'],
            [2.3, 'B₂'],
            [2.6, '', 'complete'],
          ],
        },
      ],
      caption:
        'با رسیدن مقدار جدید، جریان داخلی قبلی لغو و نتایج آن (A₃ با دایره‌ی خاکستری) دور ریخته می‌شود؛ ایده‌آل برای جستجوی زنده.',
    },

    merge: {
      title: 'merge — ادغام موازی چند جریان',
      op: 'sourceA.mergeWith(sourceB)',
      tracks: [
        {
          label: 'sourceA',
          role: 'source',
          color: 'info',
          events: [
            [0.5, 'a₁'],
            [1.5, 'a₂'],
            [2.8, '', 'complete'],
          ],
        },
        {
          label: 'sourceB',
          role: 'source',
          color: 'warning',
          events: [
            [1.0, 'b₁'],
            [2.0, 'b₂'],
            [2.8, '', 'complete'],
          ],
        },
        { label: 'merge(a, b)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [0.5, 'a₁'],
            [1.0, 'b₁'],
            [1.5, 'a₂'],
            [2.0, 'b₂'],
            [2.8, '', 'complete'],
          ],
        },
      ],
      caption:
        'هر دو جریان موازی اندونامیک ادغام می‌شوند؛ ترتیب بر اساس زمان وقوع است و خروجی وقتی هر دو کامل شدند، کامل می‌شود.',
    },

    zip: {
      title: 'zip — جفت‌کردن المان‌های هم‌شماره',
      op: 'zip(sourceB)',
      tracks: [
        {
          label: 'sourceA: 1, 2, 3',
          role: 'source',
          color: 'info',
          events: [
            [0.5, '1'],
            [1.5, '2'],
            [2.5, '3'],
          ],
        },
        {
          label: 'sourceB: a, b',
          role: 'source',
          color: 'warning',
          events: [
            [0.9, 'a'],
            [1.9, 'b'],
            [2.6, '', 'complete'],
          ],
        },
        { label: 'zip(a, b)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [0.9, '1a'],
            [1.9, '2b'],
            [2.7, '', 'complete'],
          ],
        },
      ],
      caption:
        'zip فقط زمانی منتشر می‌کند که هر دو جریان المانِ هم‌شماره داشته باشند؛ «۳» هرگز جفت پیدا نکرد و منتشر نشد.',
    },

    combineLatest: {
      title: 'combineLatest — ترکیب آخرین مقادیر',
      op: 'combineLatestWith(sourceB)',
      tracks: [
        {
          label: 'sourceA: 1, 2',
          role: 'source',
          color: 'info',
          events: [
            [0.5, '1'],
            [1.5, '2'],
            [2.5, '', 'complete'],
          ],
        },
        {
          label: 'sourceB: a',
          role: 'source',
          color: 'warning',
          events: [
            [1.0, 'a'],
            [2.0, '', 'complete'],
          ],
        },
        { label: 'combineLatest(a, b)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [1.0, '1a'],
            [1.5, '2a'],
            [2.5, '', 'complete'],
          ],
        },
      ],
      caption:
        'به‌محض رسیدن هر مقدار جدید، ترکیبِ «آخرین» مقادیر هر دو جریان منتشر می‌شود؛ قبل از رسیدن اولین مقدارِ هر دو، چیزی منتشر نمی‌شود.',
    },

    /* ---------- زمان‌بندی (Timing) ---------- */
    buffer: {
      title: 'buffer — بسته‌بندی المان‌ها در بازه‌های زمانی',
      op: 'buffer(1000)',
      tracks: [
        {
          label: 'source',
          role: 'source',
          events: [
            [0.3, 'A'],
            [0.6, 'B'],
            [0.9, 'C'],
            [1.3, 'D'],
            [1.6, 'E'],
            [1.9, 'F'],
            [2.5, '', 'complete'],
          ],
        },
        { label: 'buffer(1s)', role: 'op' },
        {
          label: 'Observer (List)',
          role: 'out',
          events: [
            [1.0, '[A,B,C]', 'next'],
            [2.0, '[D,E,F]', 'next'],
            [2.5, '', 'complete'],
          ],
        },
      ],
      caption:
        'المان‌های هر بازه‌ی یک‌ثانیه‌ای در یک لیست جمع و به‌صورت یک onNext منتشر می‌شوند.',
    },

    debounce: {
      title: 'debounce — انتشار فقط پس از سکوت جریان',
      op: 'debounce(600)',
      tracks: [
        {
          label: 'source (تایپ کاربر)',
          role: 'source',
          events: [
            [0.3, 'A'],
            [0.6, 'B'],
            [0.9, 'C'],
            [2.2, 'D'],
            [4.0, '', 'complete'],
          ],
        },
        { label: 'debounce(600ms)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [1.5, 'C'],
            [2.8, 'D'],
            [4.0, '', 'complete'],
          ],
        },
      ],
      caption:
        'منتظر آخرین مقدار می‌ماند؛ وقتی ۶۰۰ میلی‌ثانیه هیچ رویدادی نرسید، همان را منتشر می‌کند. ایده‌آل برای جستجوی زنده و جلوگیری از درخواست‌های بی‌مورد.',
    },

    throttleFirst: {
      title: 'throttleFirst — انتشار اولین رویداد هر پنجره',
      op: 'throttleFirst(1000)',
      tracks: [
        {
          label: 'source',
          role: 'source',
          events: [
            [0.2, 'A'],
            [0.6, 'B'],
            [1.2, 'C'],
            [1.8, 'D'],
            [2.4, 'E'],
            [3.2, '', 'complete'],
          ],
        },
        { label: 'throttleFirst(1s)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [0.2, 'A'],
            [1.2, 'C'],
            [2.4, 'E'],
            [3.2, '', 'complete'],
          ],
        },
      ],
      caption:
        'در هر پنجره‌ی یک‌ثانیه‌ای فقط اولین رویداد عبور می‌کند و بقیه نادیده گرفته می‌شوند؛ مناسب جلوگیری از کلیک‌های پشت‌سرهم.',
    },

    throttleLast: {
      title: 'throttleLast (sample) — انتشار آخرین رویداد هر پنجره',
      op: 'sample(1000)',
      tracks: [
        {
          label: 'source',
          role: 'source',
          events: [
            [0.2, 'A'],
            [0.6, 'B'],
            [1.2, 'C'],
            [1.8, 'D'],
            [3.0, '', 'complete'],
          ],
        },
        { label: 'sample(1s)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [1.0, 'B'],
            [2.0, 'D'],
            [3.0, '', 'complete'],
          ],
        },
      ],
      caption:
        'در پایان هر پنجره، آخرین مقدارِ رسیده منتشر می‌شود؛ مناسب گزارش‌دهی دوره‌ای از وضعیت‌های متغیر.',
    },

    /* ---------- Flowable و بک‌پرسچر ---------- */
    flowableBuffer: {
      title: 'Flowable + onBackpressureBuffer — هیچ چیز از دست نمی‌رود',
      op: 'onBackpressureBuffer()',
      tracks: [
        {
          label: 'منبع سریع (6 رویداد)',
          role: 'source',
          events: [
            [0.2, '0'],
            [0.4, '1'],
            [0.6, '2'],
            [0.8, '3'],
            [1.0, '4'],
            [1.2, '5'],
            [1.5, '', 'complete'],
          ],
        },
        { label: 'onBackpressureBuffer()', role: 'op' },
        {
          label: 'Observer کند',
          role: 'out',
          events: [
            [1.8, '0'],
            [2.2, '1'],
            [2.6, '2'],
            [3.0, '3'],
            [3.4, '4'],
            [3.8, '5'],
            [4.2, '', 'complete'],
          ],
        },
      ],
      caption:
        'رویدادهایی که Observer فرصت دریافت نداشته در بافر جمع و بعداً به‌ترتیب تحویل می‌شوند؛ حافظه‌ی بافر را محدود نگه دارید.',
    },

    flowableDrop: {
      title: 'onBackpressureDrop — ریختن رویدادهای اضافه',
      op: 'onBackpressureDrop()',
      tracks: [
        {
          label: 'منبع سریع (دایره‌های خاکستری = ریخته‌شده)',
          role: 'source',
          events: [
            [0.2, '0'],
            [0.4, '1', 'drop'],
            [0.6, '2'],
            [0.8, '3', 'drop'],
            [1.0, '4'],
            [1.2, '5', 'drop'],
            [1.5, '', 'complete'],
          ],
        },
        { label: 'onBackpressureDrop()', role: 'op' },
        {
          label: 'Observer کند',
          role: 'out',
          events: [
            [1.8, '0'],
            [2.4, '2'],
            [3.0, '4'],
            [3.6, '', 'complete'],
          ],
        },
      ],
      caption:
        'وقتی Observer آماده نیست، رویداد جدید بلافاصله ریخته می‌شود؛ برای داده‌های قابل‌تجدید (مثل نمونه‌برداری سنسور) مناسب است.',
    },

    flowableLatest: {
      title: 'onBackpressureLatest — نگه‌داشتن فقط آخرین مقدار',
      op: 'onBackpressureLatest()',
      tracks: [
        {
          label: 'منبع سریع (خاکستری‌ها جایگزین شدند)',
          role: 'source',
          events: [
            [0.2, '0'],
            [0.4, '1', 'drop'],
            [0.6, '2', 'drop'],
            [0.8, '3', 'drop'],
            [1.0, '4', 'drop'],
            [1.2, '5'],
            [1.5, '', 'complete'],
          ],
        },
        { label: 'onBackpressureLatest()', role: 'op' },
        {
          label: 'Observer کند',
          role: 'out',
          events: [
            [1.8, '0'],
            [2.8, '5'],
            [3.6, '', 'complete'],
          ],
        },
      ],
      caption:
        'بافر همیشه فقط یک مقدار (آخرین) را نگه می‌دارد؛ مقادیر میانی با آخرین جایگزین می‌شوند و در نهایت همان آخرین تحویل می‌شود.',
    },

    /* ---------- Subjectها (جریان داغ) ---------- */
    publishSubject: {
      title: 'PublishSubject — انتشار فقط به شنونده‌های فعلی',
      op: 'PublishSubject<String>',
      tracks: [
        {
          label: 'subject (جریان داغ)',
          role: 'source',
          color: 'info',
          events: [
            [0.5, 'A'],
            [1.5, 'B'],
            [2.6, '', 'complete'],
          ],
        },
        {
          label: 'Observer۱ (از ابتدا)',
          role: 'out',
          events: [
            [0.5, 'A'],
            [1.5, 'B'],
            [2.6, '', 'complete'],
          ],
        },
        {
          label: 'Observer۲ (از t=1)',
          role: 'out',
          color: 'warning',
          events: [
            [1.5, 'B'],
            [2.6, '', 'complete'],
          ],
        },
      ],
      caption:
        'Subject هم Observer است هم Observable: شنونده‌ای که دیر برسد، رویدادهای قبلی را از دست می‌دهد.',
    },

    behaviorSubject: {
      title: 'BehaviorSubject — بازپخش آخرین مقدار به شنونده‌ی جدید',
      op: 'BehaviorSubject("A")',
      tracks: [
        {
          label: 'subject (آخرین مقدار: A)',
          role: 'source',
          color: 'info',
          events: [
            [0.5, 'A'],
            [1.5, 'B'],
            [2.6, '', 'complete'],
          ],
        },
        {
          label: 'Observer۱ (از ابتدا)',
          role: 'out',
          events: [
            [0.5, 'A'],
            [1.5, 'B'],
            [2.6, '', 'complete'],
          ],
        },
        {
          label: 'Observer۲ (از t=1)',
          role: 'out',
          color: 'warning',
          events: [
            [1.0, 'A'],
            [1.5, 'B'],
            [2.6, '', 'complete'],
          ],
        },
      ],
      caption:
        'شنونده‌ی جدید بلافاصله آخرین مقدار را می‌گیرد (اینجا «A» در t=1) و سپس رویدادهای بعدی را؛ مناسب حالت فعلی UI.',
    },

    asyncSubject: {
      title: 'AsyncSubject — فقط مقدار نهاییِ هنگام complete',
      op: 'AsyncSubject<String>',
      tracks: [
        {
          label: 'subject',
          role: 'source',
          color: 'info',
          events: [
            [0.5, 'A'],
            [1.5, 'B'],
            [2.5, 'C'],
            [3.0, '', 'complete'],
          ],
        },
        {
          label: 'Observer',
          role: 'out',
          events: [[3.0, 'C'], [3.05, '', 'complete']],
        },
      ],
      caption:
        'تا جریان کامل نشود چیزی منتشر نمی‌شود؛ در لحظه‌ی onComplete فقط آخرین مقدار («C») به شنونده‌ها می‌رسد — مثل نتیجه‌ی یک فراخوانی شبکه.',
    },

    /* ---------- خطا ---------- */
    error: {
      title: 'onError — توقف جریان با خطا',
      op: 'map(x -> x / 0)',
      tracks: [
        {
          label: 'source',
          role: 'source',
          events: [
            [0.5, '1'],
            [1.5, '2'],
            [2.5, '✕', 'error'],
          ],
        },
        { label: 'map (استثنا)', role: 'op' },
        {
          label: 'Observer',
          role: 'out',
          events: [
            [0.5, '2'],
            [1.5, '4'],
            [2.5, '✕', 'error'],
          ],
        },
      ],
      caption:
        'onError جریان را برای همیشه می‌بندد؛ بعد از آن نه onNext دیگری می‌رسد نه onComplete. همیشه onError را در subscribe مدیریت کنید.',
    },
  };

  /* ==========================================================================
     کمکی‌های عمومی
     ========================================================================== */
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function parseEvents(track) {
    /* رویدادها → آرایه‌ی مرتب‌شده با زمان + مقدار مطلق نمایش */
    var list = (track.events || []).map(function (e) {
      return { t: e[0], v: e[1] == null ? '' : String(e[1]), kind: e[2] || 'next' };
    });
    list.sort(function (a, b) {
      return a.t - b.t;
    });
    return list;
  }

  function maxTime(tracks) {
    var m = 0;
    tracks.forEach(function (tr) {
      parseEvents(tr).forEach(function (e) {
        if (e.t > m) m = e.t;
      });
    });
    return m;
  }

  /* ==========================================================================
     نمونه‌ی یک انیمیشن
     ========================================================================== */
  function RxStreamAnim(figure) {
    this.fig = figure;
    this.key = figure.getAttribute('data-rx');
    this.cfg = CATALOG[this.key];
    this.speed = 1;
    this.playing = false;
    this.wantsPlay = false;
    this.done = false;
    this.elapsed = 0; /* زمان سپری‌شده بر حسب میلی‌ثانیه در سرعت ۱× */
    this.rafId = 0;
    this.lastTs = 0;
    this.visible = false;
    this.reduced = false;
    this.marbles = []; /* {el, at} */
    this.obs = null;

    try {
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      this.reduced = false;
    }
  }

  RxStreamAnim.prototype.init = function () {
    if (!this.cfg) {
      if (window.console && console.warn) {
        console.warn('[rx-stream] عملگر ناشناخته:', this.key);
      }
      return false;
    }

    /* محاسبه‌ی بازه‌ی زمانی: بیشینه‌ی رویدادها + کمی فاصله برای پایان خط */
    var tMax = maxTime(this.cfg.tracks);
    this.span = Math.ceil(tMax) + 0.5;
    if (this.span < 1) this.span = 1;
    this.duration = this.span * UNIT_MS; /* مدت در سرعت ۱× */

    this.build();
    this.bindControls();

    if (this.reduced) {
      /* حالت ایستا: نمایش نتیجه‌ی نهایی بدون حرکت */
      this.fig.classList.add('is-reduced');
      this.setElapsed(this.duration);
      this.grid.classList.add('is-static');
    } else {
      this.observeVisibility();
    }
    return true;
  };

  RxStreamAnim.prototype.xPct = function (t) {
    /* موقعیت افقی یک رویداد روی خط زمان (درصد، از چپ) */
    return (t / this.span) * 100;
  };

  /* ---------- ساخت DOM ---------- */
  RxStreamAnim.prototype.build = function () {
    var cfg = this.cfg;
    var fig = this.fig;
    var caption = fig.querySelector('figcaption');

    /* سربرگ */
    var title = el('div', 'rx-anim-title');
    title.appendChild(el('span', null, cfg.title));
    if (cfg.op) title.appendChild(el('span', 'rx-anim-op', cfg.op));
    fig.insertBefore(title, caption);

    /* صحنه (قابل اسکرول افقی) */
    var scroll = el('div', 'rx-stage-scroll');
    var grid = el('div', 'rx-grid');
    scroll.appendChild(grid);
    fig.insertBefore(scroll, caption);
    this.grid = grid;

    /* خط‌کش زمان (همیشه؛ برای عملگرهای زمانی حیاتی است) */
    var rulerRow = el('div', 'rx-row is-ruler');
    rulerRow.appendChild(el('div', 'rx-row-label', null));
    var rulerLine = el('div', 'rx-line');
    rulerLine.appendChild(el('div', 'rx-axis'));
    for (var i = 0; i <= Math.floor(this.span); i++) {
      var tick = el('div', 'rx-tick');
      tick.style.left = this.xPct(i) + '%';
      tick.appendChild(el('span', null, String(i)));
      rulerLine.appendChild(tick);
    }
    rulerRow.appendChild(rulerLine);
    grid.appendChild(rulerRow);

    /* ردیف‌های جریان */
    var self = this;
    var outCount = 0;
    cfg.tracks.forEach(function (track) {
      var row, line, marbles;

      if (track.role === 'op') {
        row = el('div', 'rx-row is-op');
        row.appendChild(el('div', 'rx-row-label', null));
        line = el('div', 'rx-line');
        line.appendChild(el('span', 'rx-op-box', track.label));
        row.appendChild(line);
        grid.appendChild(row);
        return;
      }

      row = el('div', 'rx-row ' + (track.role === 'source' ? 'is-source' : 'is-out'));
      row.appendChild(el('div', 'rx-row-label', track.label));
      line = el('div', 'rx-line');
      row.appendChild(line);
      grid.appendChild(row);

      var colorClass =
        track.color === 'info'
          ? ' c-info'
          : track.color === 'warning'
          ? ' c-warning'
          : track.role === 'out' && outCount > 0
          ? ' c-alt'
          : '';
      if (track.role === 'out') outCount++;

      parseEvents(track).forEach(function (ev) {
        var m = el('span', 'rx-marble' + colorClass);
        m.style.left = self.xPct(ev.t) + '%';

        if (ev.kind === 'complete') {
          m.classList.add('is-complete');
          m.setAttribute('aria-hidden', 'true');
        } else if (ev.kind === 'error') {
          m.classList.add('is-error');
          m.textContent = '✕';
        } else {
          if (ev.kind === 'drop') m.classList.add('is-dropped');
          if (ev.v.length > 3) m.classList.add('is-wide');
          m.textContent = ev.v;
        }

        line.appendChild(m);
        self.marbles.push({ el: m, at: ev.t * UNIT_MS });
      });
    });

    /* نشانگر زنده */
    this.playhead = el('div', 'rx-playhead');
    this.playhead.setAttribute('aria-hidden', 'true');
    grid.appendChild(this.playhead);

    /* کنترل‌ها */
    var controls = el('div', 'rx-controls');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'کنترل‌های انیمیشن');

    this.playBtn = el('button', 'rx-btn rx-btn-play');
    this.playBtn.type = 'button';
    this.playBtn.setAttribute('aria-label', 'پخش انیمیشن');
    this.playBtn.setAttribute('title', 'پخش / توقف');
    this.playBtn.innerHTML = ICON_PLAY;
    controls.appendChild(this.playBtn);

    var restartBtn = el('button', 'rx-btn rx-btn-restart');
    restartBtn.type = 'button';
    restartBtn.setAttribute('aria-label', 'پخش از ابتدا');
    restartBtn.setAttribute('title', 'شروع دوباره');
    restartBtn.innerHTML = ICON_RESTART;
    controls.appendChild(restartBtn);
    this.restartBtn = restartBtn;

    var speedWrap = el('label', 'rx-speed');
    speedWrap.appendChild(el('span', null, 'سرعت'));
    var select = el('select');
    select.setAttribute('aria-label', 'سرعت پخش انیمیشن');
    [
      ['0.5', '0.5×'],
      ['1', '1×'],
      ['2', '2×'],
    ].forEach(function (opt) {
      var o = el('option', null, opt[1]);
      o.value = opt[0];
      if (opt[0] === '1') o.selected = true;
      select.appendChild(o);
    });
    speedWrap.appendChild(select);
    controls.appendChild(speedWrap);
    this.speedSelect = select;

    this.timeEl = el('span', 'rx-time', 't = 0.0s');
    this.timeEl.setAttribute('aria-live', 'off');
    controls.appendChild(this.timeEl);

    fig.insertBefore(controls, caption);

    /* یادداشت حالت کاهش حرکت */
    var note = el('div', 'rx-anim-motion-note', 'به دلیل فعال‌بودن «کاهش حرکت»، انیمیشن به‌صورت ایستا نمایش داده شد.');
    fig.insertBefore(note, caption);
  };

  /* ---------- کنترل‌ها ---------- */
  RxStreamAnim.prototype.bindControls = function () {
    var self = this;

    this.playBtn.addEventListener('click', function () {
      if (self.playing) {
        self.wantsPlay = false;
        self.pause();
      } else {
        if (self.done || self.elapsed >= self.duration) self.restart(true);
        self.wantsPlay = true;
        self.play();
      }
    });

    this.restartBtn.addEventListener('click', function () {
      self.wantsPlay = true;
      self.restart(true);
    });

    this.speedSelect.addEventListener('change', function () {
      var v = parseFloat(self.speedSelect.value);
      self.speed = isNaN(v) || v <= 0 ? 1 : v;
      /* زمان سپری‌شده بر حسب محتواست؛ فقط نرخ پخش عوض می‌شود → پرشی رخ نمی‌دهد */
    });
  };

  /* ---------- پخش / توقف / شروع دوباره ---------- */
  RxStreamAnim.prototype.play = function () {
    if (this.playing) return;
    if (this.done || this.elapsed >= this.duration) this.restart(false);
    this.playing = true;
    this.lastTs = 0;
    this.grid.classList.remove('is-static');
    this.fig.classList.remove('is-paused');
    this.playBtn.classList.add('is-playing');
    this.playBtn.innerHTML = ICON_PAUSE;
    this.playBtn.setAttribute('aria-label', 'توقف انیمیشن');
    var self = this;
    this.rafId = window.requestAnimationFrame(function tick(ts) {
      if (!self.playing) return;
      if (!self.lastTs) self.lastTs = ts;
      var dt = ts - self.lastTs;
      self.lastTs = ts;
      self.elapsed += dt * self.speed;
      if (self.elapsed >= self.duration) {
        self.elapsed = self.duration;
        self.render();
        self.finish();
        return;
      }
      self.render();
      self.rafId = window.requestAnimationFrame(tick);
    });
  };

  RxStreamAnim.prototype.pause = function () {
    if (!this.playing) return;
    this.playing = false;
    window.cancelAnimationFrame(this.rafId);
    this.fig.classList.add('is-paused');
    this.playBtn.classList.remove('is-playing');
    this.playBtn.innerHTML = ICON_PLAY;
    this.playBtn.setAttribute('aria-label', 'پخش انیمیشن');
  };

  RxStreamAnim.prototype.restart = function (autoplay) {
    this.pause();
    this.elapsed = 0;
    this.done = false;
    this.grid.classList.remove('is-static');
    this.marbles.forEach(function (m) {
      m.el.classList.remove('is-shown');
    });
    this.render();
    if (autoplay) this.play();
  };

  RxStreamAnim.prototype.finish = function () {
    this.playing = false;
    this.done = true;
    this.wantsPlay = false;
    window.cancelAnimationFrame(this.rafId);
    this.fig.classList.add('is-paused');
    this.playBtn.classList.remove('is-playing');
    this.playBtn.innerHTML = ICON_PLAY;
    this.playBtn.setAttribute('aria-label', 'پخش دوباره انیمیشن');
  };

  RxStreamAnim.prototype.setElapsed = function (ms) {
    this.elapsed = ms;
    this.render();
  };

  /* ---------- رندر هر فریم ---------- */
  RxStreamAnim.prototype.render = function () {
    var p = this.duration ? Math.min(this.elapsed / this.duration, 1) : 1;
    this.grid.style.setProperty('--rx-p', p.toFixed(4));

    for (var i = 0; i < this.marbles.length; i++) {
      var m = this.marbles[i];
      var shown = this.elapsed >= m.at;
      if (shown !== m.shown) {
        m.el.classList.toggle('is-shown', shown);
        m.shown = shown;
      }
    }

    this.timeEl.textContent = 't = ' + (this.elapsed / UNIT_MS).toFixed(1) + 's';
  };

  /* ---------- شروع/توقف هنگام دیده‌شدن ---------- */
  RxStreamAnim.prototype.observeVisibility = function () {
    var self = this;
    if (!('IntersectionObserver' in window)) {
      /* مرورگر قدیمی: بلافاصله ایستا + پخش‌پذیر */
      this.setElapsed(this.duration);
      this.wantsPlay = true;
      this.play();
      return;
    }

    this.obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          self.visible = entry.isIntersecting;
          if (self.visible) {
            /* شروع خودکار فقط برای بار اول دیده‌شدن */
            if (!self.started && !self.done) {
              self.started = true;
              self.wantsPlay = true;
              self.play();
            } else if (self.wantsPlay && !self.playing && !self.done) {
              self.play(); /* ادامه بعد از خروج از دید */
            }
          } else if (self.playing) {
            self.pause(); /* خارج از دید: توقف برای صرفه‌جویی در پردازش */
          }
        });
      },
      { threshold: 0.35 }
    );
    this.obs.observe(this.fig);
  };

  /* ==========================================================================
     راه‌اندازی
     ========================================================================== */
  function init() {
    var nodes = document.querySelectorAll('.rx-anim[data-rx]');
    Array.prototype.forEach.call(nodes, function (fig) {
      if (fig.getAttribute('data-rx-ready')) return;
      var anim = new RxStreamAnim(fig);
      if (anim.init()) fig.setAttribute('data-rx-ready', '1');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* برای استفاده‌ی احتمالی از بیرون (تست/گسترش) */
  window.RxStreamAnimations = { CATALOG: CATALOG, init: init, UNIT_MS: UNIT_MS };
})();
