# مقالات من — حیدر فرحانی

پورتفولیو و پایگاه دانش تخصصی توسعه اندروید و کاتلین؛ مجموعه‌ای از راهنماهای عمیق و کاربردی
که به‌صورت مستقیم و بدون هیچ مرحله‌ی ساخت (Static Site) روی **GitHub Pages** منتشر می‌شود.

## فهرست مقالات

| # | مقاله | فایل | زمان مطالعه |
|---|-------|------|-------------|
| ۱ | همزمانی در کاتلین: از Thread تا Flow | [`concurrency-in-kotlin.html`](concurrency-in-kotlin.html) | ~۳۰ دقیقه |
| ۲ | معماری تمیز و الگوی MVI در Jetpack Compose | [`clean-architecture-mvi-compose.html`](clean-architecture-mvi-compose.html) | ~۲۵ دقیقه |
| ۳ | بهینه‌سازی کارایی و مدیریت حافظه در اندروید | [`android-performance-memory.html`](android-performance-memory.html) | ~۲۲ دقیقه |
| ۴ | تزریق وابستگی در کاتلین: Hilt در برابر Koin | [`dependency-injection-hilt-koin.html`](dependency-injection-hilt-koin.html) | ~۲۰ دقیقه |
| ۵ | قواعد نام‌گذاری در برنامه‌نویسی: راهنمای کدهای خوانا | [`naming-conventions.html`](naming-conventions.html) | ~۲۵ دقیقه |

## ساختار پروژه

```
my-articales/
├── index.html                           # صفحه اصلی: معرفی نویسنده، فیلتر تگ‌ها، جستجوی لحظه‌ای
├── concurrency-in-kotlin.html           # مقاله ۱
├── clean-architecture-mvi-compose.html  # مقاله ۲
├── android-performance-memory.html      # مقاله ۳
├── dependency-injection-hilt-koin.html  # مقاله ۴
├── naming-conventions.html             # مقاله ۵
├── .nojekyll                            # جلوگیری از پردازش Jekyll در GitHub Pages
└── README.md                            # همین فایل
```

## امکانات

- **هویت بصری مدرن**: تایپوگرافی وزیرمتن، گرادیانت‌های بنفش/صورتی، آیکون‌های SVG.
- **تم تیره/روشن**: با `localStorage` — انتخاب کاربر در همه‌ی صفحات پابرجا می‌ماند.
- **جستجوی لحظه‌ای**: فیلتر کلاینت‌ساید روی عنوان و چکیده مقالات.
- **شمارنده بازدید**: تعداد بازدیدکنندگان هر مقاله (در هدر مقاله) و مجموع بازدیدها (در آمار صفحه‌ی اصلی)، با [Page Views API](https://page-views-api.ratneshc.com/) — بدون کوکی، بدون ذخیره‌ی IP و با شمارش یکتای هر بازدیدکننده در بازه‌ی ۳۰ دقیقه.
- **فیلتر تگ‌ها**: همه، کاتلین، اندروید و کامپوز، معماری نرم‌افزار، پرفورمنس، مبانی و کیفیت کد.
- **تجربه‌ی مطالعه**: نوار پیشرفت خواندن، فهرست مطالب چسبان (ScrollSpy)، دکمه کپی کد، دکمه بازگشت به بالا، اشتراک‌گذاری.
- **کاملاً واکنش‌گرا**: موبایل، تبلت و دسکتاپ (کشوی موبایل برای فهرست مطالب).
- **راست‌چین و RTL**: با پشتیبانی کامل اعداد و متن فارسی.
- **بدون وابستگی بیلد**: فقط HTML/CSS/JS خام — بدون Jekyll، بدون Node، بدون خطای ساخت.

## انتشار روی GitHub Pages

### روش ۱ — از طریق تنظیمات رابط وب (ساده‌ترین)

1. یک مخزن جدید در GitHub بسازید (مثلاً `my-articles`).
2. فایل‌های همین پوشه را push کنید:

   ```bash
   git init
   git add .
   git commit -m "feat: publish articles portfolio"
   git branch -M main
   git remote add origin https://github.com/<USERNAME>/my-articles.git
   git push -u origin main
   ```

3. در مخزن: **Settings → Pages → Source: Deploy from a branch**.
4. شاخه `main` و پوشه `/ (root)` را انتخاب کنید و Save بزنید.
5. چند دقیقه بعد، سایت روی `https://<USERNAME>.github.io/my-articles/` بالا می‌آید.

### روش ۲ — اکشن GitHub Pages (Recommended)

فایل `.github/workflows/pages.yml` بسازید:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v4
```

سپس در **Settings → Pages → Source** گزینه‌ی **GitHub Actions** را انتخاب کنید.

### نکته‌ی مهم: فایل `.nojekyll`

فایل [`.nojekyll`](.nojekyll) عمداً خالی است و باید در ریشه مخزن بماند؛
بدون آن، GitHub Pages پردازشگر Jekyll را اجرا می‌کند و فایل‌ها/پوشه‌هایی که با `_` شروع شوند را نادیده می‌گیرد.
این پروژه به Jekyll نیازی ندارد، پس پردازش آن فقط کندتر و غیرقابل‌پیش‌بینی‌ترش می‌کند.

## اجرای محلی (Local Dev)

برای بررسی پیش از انتشار، یک سرور ساده‌ی استاتیک کافی است:

```bash
# با Python (پیشنهادی)
python -m http.server 8080

# یا با Node
npx serve .
```

سپس `http://localhost:8080` را باز کنید و این موارد را چک کنید:

- [ ] تمام لینک‌های بین `index.html` و پنج مقاله کار می‌کنند.
- [ ] سوییچر تم در همه‌ی صفحات کار می‌کند و انتخاب کاربر می‌ماند.
- [ ] متن فارسی (راست‌چین)، جداول و نمودارهای SVG بی‌نقص رندر می‌شوند.
- [ ] جستجو و فیلتر تگ‌ها لحظه‌ای است.
- [ ] در عرض‌های موبایل/تبلت/دسکتاپ چیدمان درست می‌شکند.

## افزودن مقاله‌ی جدید

1. یک فایل HTML جدید با همان ساختار مقالات موجود بسازید
   (کپی از یکی از مقالات موجود، سریع‌ترین راه است — `lang="fa" dir="rtl"` و `data-theme` را حفظ کنید).
2. در `index.html` یک کارت مقاله‌ی جدید با `data-tags` مناسب اضافه کنید.
3. آمار بخش Hero (`تعداد مقالات`) و برچسب شمارش کنار «فهرست مقالات» را به‌روز کنید.

## مشخصات فنی

- HTML استاتیک خام، بدون فریم‌ورک و بدون مرحله‌ی build.
- تایپوگرافی: [Vazirmatn](https://github.com/rastikerdar/vazirmatn) + [JetBrains Mono](https://www.jetbrains.com/lp/mono/) از Google Fonts.
- ذخیره‌سازی ترجیح تم: `localStorage` با کلید `blog_theme`.

---

ساخته‌شده با ❤ توسط **حیدر فرحانی** — مهندس نرم‌افزار | معمار اندروید و کاتلین
