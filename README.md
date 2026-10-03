# حیدر فرهانی — پورتفولیو و پایگاه دانش مهندسی نرم‌افزار

سایت شخصی استاتیک (بدون هیچ مرحله‌ی build) شامل **مقالات تخصصی**، **پروژه‌ها** و **کتابخانه‌های نرم‌افزاری**؛
منتشرشده روی **GitHub Pages** با پالت زمردی (Emerald) و پشتیبانی کامل RTL/فارسی.

> نام کاربری گیت‌هاب از روی دامنه/پیکربندی استخراج شده است: `haedarfarhani`.
> پیش از انتشار، ایمیل، آدرس کانال‌ها و نام کاربری را در `about/` و `contact/` با اطلاعات واقعی خود جایگزین کنید.

## فهرست مقالات

| # | مقاله | فایل | زمان مطالعه |
|---|-------|------|-------------|
| ۱ | همزمانی در کاتلین: از Thread تا Flow | [`articles/concurrency-in-kotlin.html`](articles/concurrency-in-kotlin.html) | ~۳۰ دقیقه |
| ۲ | معماری تمیز و الگوی MVI در Jetpack Compose | [`articles/clean-architecture-mvi-compose.html`](articles/clean-architecture-mvi-compose.html) | ~۲۵ دقیقه |
| ۳ | بهینه‌سازی کارایی و مدیریت حافظه در اندروید | [`articles/android-performance-memory.html`](articles/android-performance-memory.html) | ~۲۲ دقیقه |
| ۴ | تزریق وابستگی در کاتلین: Hilt در برابر Koin | [`articles/dependency-injection-hilt-koin.html`](articles/dependency-injection-hilt-koin.html) | ~۲۰ دقیقه |
| ۵ | قواعد نام‌گذاری در برنامه‌نویسی: راهنمای کدهای خوانا | [`articles/naming-conventions.html`](articles/naming-conventions.html) | ~۲۵ دقیقه |
| ۶ | اسکوپ فانکشن‌ها در کاتلین: راهنمای کامل let، run، with، apply و also | [`articles/scope-functions.html`](articles/scope-functions.html) | ~۳۰ دقیقه |
| ۷ | RxJava و RxAndroid: از Observable تا Flowable و Subject | [`articles/rxjava-rxandroid.html`](articles/rxjava-rxandroid.html) | ~۴۵ دقیقه |
| ۸ | Design Patterns در Java: آموزش کامل الگوهای طراحی با مثال و تست | [`articles/design-patterns-in-java.html`](articles/design-patterns-in-java.html) | ~۶۰ دقیقه |
| ۹ | Java Collections Framework: آموزش کامل Collectionهای جاوا | [`articles/java-collections-framework.html`](articles/java-collections-framework.html) | ~۷۰ دقیقه |

## فهرست پروژه‌ها

| پروژه | معماری / تکنولوژی | مخزن |
|-------|-------------------|------|
| 📁 فایل‌منیجر جتپک کامپوز | Jetpack Compose · Material 3 · Scoped Storage | [`filemanager-jetpack-compose`](https://github.com/haedarfarhani/filemanager-jetpack-compose) |
| 💬 چت‌اپ با الگوی MVI | Compose · MVI · Apollo GraphQL · Supabase · Hilt | [`chatapp-jetpack-compose-mvi`](https://github.com/haedarfarhani/chatapp-jetpack-compose-mvi) |
| 🛍️ اپ فروشگاهی MVVM | MVVM · Ktor · Hilt · Fragments | [`mvvm-shoping-app`](https://github.com/haedarfarhani/mvvm-shoping-app) |
| 🧱 فروشگاه با Clean Architecture | چند-ماژوله (domain/data/presentation) · Detekt · Kover | [`android-clean-architecture-shoping`](https://github.com/haedarfarhani/android-clean-architecture-shoping) |
| 🏗️ فروشگاه ساده با MVP | MVP · Java · Dagger · ObjectBox · RxJava | [`simple-android-mvp-shoping`](https://github.com/haedarfarhani/simple-android-mvp-shoping) |
| 🛒 فروشگاه با معماری MVC | MVC · Java · Retrofit · Room · RxJava | [`shoping_mvc_architecture`](https://github.com/haedarfarhani/shoping_mvc_architecture) |
| 🗺️ شهرها و موقعیت‌های ایران (JSON) | داده‌ی باز · JSON | [`iran-cities-and-locations-in-json-format`](https://github.com/haedarfarhani/iran-cities-and-locations-in-json-format) |

## ساختار پروژه

```
my-articales/
├── index.html                    # صفحه خانه: معرفی، آمار، مقالات، کتابخانه‌ها
├── 404.html                      # صفحه ۴۰۴ با تشخیص خودکار مسیر پایه
├── .nojekyll                     # جلوگیری از پردازش Jekyll در GitHub Pages
├── README.md
│
├── articles/                     # فهرست مقالات + ۹ مقاله
│   ├── index.html                # جستجو + فیلتر تگ + حالت خالی
│   ├── java-collections-framework.html
│   ├── design-patterns-in-java.html
│   ├── concurrency-in-kotlin.html
│   ├── clean-architecture-mvi-compose.html
│   ├── android-performance-memory.html
│   ├── dependency-injection-hilt-koin.html
│   ├── naming-conventions.html
│   ├── scope-functions.html
│   └── rxjava-rxandroid.html
│
├── projects/                     # پروژه‌ها (۷ کارت + راهنمای افزودن در کامنت)
│   └── index.html
├── libraries/                    # کتابخانه‌های نرم‌افزاری/پکیج‌ها (۱۲ کارت با لینک رسمی)
│   └── index.html
├── about/                        # پروفایل، تایم‌لاین، مهارت‌ها
│   └── index.html
├── contact/                      # کانال‌های تماس + فرم کپی‌پیام
│   └── index.html
│
├── css/                          # توکن‌های طراحی + استایل‌های جداشده
│   ├── tokens.css                # رنگ‌ها، سایه‌ها، رادیوس، گرادیانت‌ها
│   ├── fonts.css                 # فونت‌های self-host شده (assets/fonts)
│   ├── base.css                  # reset + متغیرها + کلاس‌های عمومی
│   ├── layout.css                # نویگیشن، Hero، فوتر، ریسپانسیو
│   ├── articles.css              # کارت‌ها و کنترل‌های فهرست مقالات
│   ├── article-shell.css         # پوسته‌ی صفحه‌ی مقاله (سایدبار، TOC، نوار پیشرفت)
│   ├── article-content.css       # تایپوگرافی محتوا، کد، جدول، Callout، نمودار
│   ├── rx-stream.css             # انیمیشن‌های ماربل مقاله‌ی RxJava
│   ├── responsive.css            # لایه‌ی نهایی واکنش‌گرایی همه‌ی صفحات
│   ├── projects.css | libraries.css | about.css | contact.css
│
├── js/
│   ├── theme.js                  # تم تیره/روشن + کلید hf_theme
│   ├── main.js                   # نویگیشن، منوی موبایل، toast، نوار مهارت، سال
│   ├── article.js                # پیشرفت خواندن، کپی کد، ScrollSpy، اشتراک‌گذاری
│   ├── rx-stream-animations.js   # موتور انیمیشن ماربل (پخش/توقف/سرعت + reduced-motion)
│   ├── views.js                  # شمارنده بازدید (Page Views API)
│   ├── articles.js | projects.js | libraries.js | contact.js
│
└── assets/
    └── fonts/                    # woff2 وزیرمتن و JetBrains Mono (بدون وابستگی به CDN)
```

## امکانات

- **هویت بصری زمردی**: `#0F766E` / `#14B8A6` / `#84CC16` — بدون هیچ رنگ بنفش قدیمی.
- **فونت self-host**: وزیرمتن و JetBrains Mono از `assets/fonts/` — بدون فراخوانی به Google Fonts.
- **تم تیره/روشن**: با `localStorage` (کلید `hf_theme` + اسکریپت `theme.js` در `<head>` برای جلوگیری از فلش اولیه).
- **چهار بخش مجزا**: مقالات، پروژه‌ها، کتابخانه‌های نرم‌افزاری، درباره/تماس — هرکدام CSS و JS اختصاصی خودشان.
- **جستجو و فیلتر لحظه‌ای**: کلاینت‌ساید، با هش (`#kotlin` و غیره) برای لینک‌پذیری.
- **صفحه‌ی پروژه‌ها**: ۷ پروژه‌ی واقعی از گیت‌هاب با توضیح معماری و تگ‌های فنی، به‌همراه فیلتر دسته‌ای (اندروید، بک‌اند، ابزارسازی، کتابخانه، داده) و شمارنده‌ی خودکار.
- **تجربه‌ی مطالعه**: نوار پیشرفت خواندن، فهرست مطالب چسبان (ScrollSpy)، دکمه کپی کد، بازگشت به بالا، اشتراک‌گذاری.
- **شمارنده بازدید**: با [Page Views API](https://page-views-api.ratneshc.com/) — بدون کوکی، بدون ذخیره‌ی IP، شمارش یکتا در بازه‌ی ۳۰ دقیقه.
- **کاملاً واکنش‌گرا و RTL**: موبایل/تبلت/دسکتاپ، منوی همبرگری، کشوی موبایل فهرست مطالب.

## انتشار روی GitHub Pages

### روش ۱ — از طریق تنظیمات رابط وب

1. مخزنی بسازید (مثلاً `My-Articles`) و فایل‌های همین پوشه را push کنید:

   ```bash
   git init
   git add .
   git commit -m "feat: emerald personal site"
   git branch -M main
   git remote add origin https://github.com/haedarfarhani/My-Articles.git
   git push -u origin main
   ```

2. **Settings → Pages → Source: Deploy from a branch** → شاخه `main` و پوشه `/ (root)` → Save.

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

### نکته‌ی مهم: مسیر پایه (base path)

- سایت روی مخزن پروژه با نام `My-Articles` روی `https://haedarfarhani.github.io/My-Articles/` سرو می‌شود.
- تمام لینک‌های داخلی **نسبی** هستند، پس تغییر نام مخزن لینک‌ها را نمی‌شکند؛
  فقط `404.html` از مقدار ثابت `/My-Articles/` استفاده می‌کند و اگر نام مخزن را عوض کردید، آن را به‌روز کنید.
- فایل [`.nojekyll`](.nojekyll) عمداً خالی است و باید در ریشه بماند.

## اجرای محلی (Local Dev)

```bash
python -m http.server 8080     # یا: npx serve .
```

سپس `http://localhost:8080` را باز کنید:

- [ ] لینک خانه ← مقالات ← پروژه‌ها ← کتابخانه‌ها ← درباره ← تماس کار می‌کند.
- [ ] از داخل یک مقاله، برند/نان‌بار به خانه و نان‌بار به فهرست مقالات می‌رود.
- [ ] تم تیره/روشن در همه‌ی صفحات پابرجا می‌ماند (کلید `hf_theme`).
- [ ] جستجو/فیلتر در `articles/` و `libraries/` لحظه‌ای است؛ نوشتن چیزی نامربوط حالت خالی نشان می‌دهد.
- [ ] نوار پیشرفت خواندن، کپی کد و ScrollSpy در مقالات کار می‌کنند.
- [ ] URL ناموجود (مثل `/foo`) صفحه‌ی ۴۰۴ درست با لینک‌های سالم نشان می‌دهد.

## افزودن محتوا

### مقاله‌ی جدید

1. کپی از یکی از فایل‌های `articles/*.html`؛ `<head>` را تغییر ندهید (همان ۴ لینک CSS و ۴ اسکریپت).
2. کارت مقاله را در `articles/index.html` اضافه کنید و `data-tags` را درست بگذارید.
3. آمار «تعداد مقالات» در `index.html` و برچسب شمارش کنار «فهرست مقالات» را به‌روز کنید.
4. به‌روزرسانی `sitemap.xml` (آدرس مقاله جدید)، `README.md` (سطر جدول و یادداشت پوشه) و شمارش «تعداد مقالات» در `index.html`.

### پروژه‌ی جدید

کافی است یکی از بلوک‌های `<article class="project-card">` موجود در `projects/index.html` را کپی کنید؛
سپس لینک مخزن، عنوان، توضیح، تگ‌های فنی و `data-tech` را بگذارید.
کلیدهای معتبر `data-tech` (برای فیلترها): `android` · `backend` · `tooling` · `library` · `data` — چند کلید با فاصله مجاز است.

### کتابخانه‌ی جدید

یک بلوک کارت در `libraries/index.html` کپی کنید و `data-cat` را با دسته‌ی فیلتر هماهنگ کنید.

## مشخصات فنی

- HTML استاتیک خام — بدون فریم‌ورک، بدون Node، بدون build.
- تایپوگرافی: [Vazirmatn](https://github.com/rastikerdar/vazirmatn) + [JetBrains Mono](https://www.jetbrains.com/lp/mono/) به‌صورت self-host (woff2).
- ذخیره‌سازی ترجیح تم: `localStorage` با کلید `hf_theme` (مهاجرت خودکار از کلید قدیمی `blog_theme`).

## تاریخچهٔ تغییرات

### مهر ۱۴۰۵

- **مقالهٔ Java Collections Framework** — راهنمای جامع ۵۲ بخشی از تفاوت Collection/Collections/Map و سلسله‌مراتب JCF
  تا ArrayList، LinkedList، List/Set/Queue/Deque، equals/hashCode، HashMap (bucket، collision، treeification،
  load factor)، LinkedHashMap و LRU، TreeMap، ConcurrentHashMap، synchronized collections، Immutable Collections،
  Iterator، ConcurrentModificationException، Comparable/Comparator، Memory/Performance، جدول Time Complexity،
  Decision Tree انتخاب، ۱۵ سناریوی واقعی، Best Practices، اشتباهات رایج، Unit Test با JUnit 5، پروژهٔ
  Task Management، Benchmark با JMH، ۳۰ سؤال مصاحبه، FAQ، Cheat Sheet و Roadmap.
- **مقالهٔ Design Patterns در Java** — راهنمای جامع ۳۸ بخشی از مفهوم الگو و تفاوتش با Algorithm/Architecture
  تا SOLID، سه خانوادهٔ GoF، پیاده‌سازی Java 21 برای Singleton، Factory Method، Abstract Factory، Builder،
  Prototype، Adapter، Decorator، Facade، Composite/Bridge/Flyweight/Proxy، Strategy، Observer، State،
  Command و بقیهٔ الگوهای رفتاری؛ همراه با Unit Test‌های JUnit 5، پروژهٔ عملی Notification و E-Commerce،
  Cheat Sheet، چک‌لیست انتخاب، ۱۰ تمرین، ۲۰ سؤال مصاحبه و FAQ.
- **ریسپانسیو کامل سایت** — بازنویسی لایهٔ نهایی `responsive.css` با Mobile-First؛
  تایپوگرافی `clamp()` در `base.css`/`layout.css`، ویژگی‌های منطقی (RTL) در layout،
  منوی همبرگری کشویی تا عرض ۱۰۲۴px (بسته‌شدن خودکار در دسکتاپ)، هدف‌های لمسی ۴۴px،
  جدول‌ها/نمودارها/کدها با اسکرول افقی داخلی (بدون اسکرول افقی صفحه)، گریدها با
  `minmax(min(...), 1fr)`، پشتیبانی `prefers-reduced-motion`/`forced-colors`/چاپ؛
  لینک `responsive.css` به همهٔ صفحات اضافه شد (دسکتاپ بدون تغییر بصری).
- **موتور انیمیشن ماربل RxJava** — فایل‌های جدید `css/rx-stream.css` و
  `js/rx-stream-animations.js` با ۳۱ Operator در کاتالوگ (map، filter، flatMap،
  switchMap، debounce، Subjects، استراتژی‌های Backpressure و…)؛ کنترل پخش/توقف/
  شروع دوباره/سرعت (۰.۵×، ۱×، ۲×)، شروع خودکار با دیده‌شدن (IntersectionObserver)،
  مکث هنگام خروج از دید، حالت ایستا برای `prefers-reduced-motion` و برچسب‌های فارسی.
- **مقالهٔ RxJava و RxAndroid جامع‌تر شد** — بازنویسی بخش‌های ۱ تا ۹ (مقدمهٔ
  واکنش‌گرا، ایجاد Observable، انواع جریان، Operatorهای اصلی، زنجیره‌سازی، کاهش
  داده، کنترل زمان، Schedulers، مدیریت خطا با retryWhen)، اصلاح بخش‌های ۱۰ تا ۱۴
  (جدول Subjects با AsyncSubject، Disposable در برابر Subscription، استراتژی‌های
  Backpressure، چک‌لیست و منابع)، و افزودن بخش‌های **۱۵** (ساخت جریان: just، from،
  range، repeat، interval، timer)، **۱۶** (merge، zip، combineLatest) و **۱۷**
  (DisposableObserver، RxBinding، تست با TestScheduler)؛ به‌همراه ۳۰ نمودار ماربل
  متحرک، نمونه‌های LogCat، برچسب زبان کدها (`data-lang`) و جدول‌های اسکرول‌پذیر.

---

ساخته‌شده با ❤ توسط **حیدر فرهانی** — مهندس نرم‌افزار | معمار اندروید و کاتلین
