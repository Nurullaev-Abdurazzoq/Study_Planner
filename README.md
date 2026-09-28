# 📚 Study Course Tracker

iPhone uchun oddiy, zamonaviy **kurs progress tracker** (PWA — web-app).
Internet, akkaunt yoki App Store kerak emas: bir marta ochib, **Add to Home Screen** qilasiz — keyin oddiy iPhone app kabi ishlaydi (offline ham).

**Nima qiladi:** har dars tugagach bitta **Complete Lesson** tugmasini bosasiz — qolgan darslar, qolgan soatlar, progress, kurs tugash sanasi hammasi avtomatik hisoblanadi.

---

## 🚀 iPhone'ga o'rnatish (bir marta)

### 1. GitHub Pages'ni yoqish (repozitoriy egasi, bir marta)

1. GitHub'da repozitoriyni oching → **Settings** → chap menyuda **Pages**.
2. **Build and deployment → Source**: `Deploy from a branch`.
3. **Branch**: kod turgan branch (masalan `claude/study-course-tracker-app-1q7rsi` yoki `main`), papka: `/ (root)` → **Save**.
4. 1–2 daqiqadan keyin shu sahifada link chiqadi:
   `https://nurullaev-abdurazzoq.github.io/Study_Planner/`

### 2. iPhone'da (Safari)

1. Yuqoridagi linkni **Safari**'da oching (Chrome emas — faqat Safari home screen'ga qo'sha oladi).
2. Pastdagi **Share** (kvadrat + strelka) tugmasini bosing.
3. **Add to Home Screen** → **Add**.
4. Endi asosiy ekranda **Study** ikonkasi bor. Uni ochsangiz to'liq ekranli app ochiladi.

> ⚠️ Ma'lumotlar faqat shu qurilmada saqlanadi. Home screen'dagi app va Safari'dagi tab **alohida** ma'lumot saqlaydi — doim bitta joydan (home screen app) foydalaning.
> Telefon almashtirsangiz: **Settings → Export backup** qilib, yangi telefonda **Import backup** qiling.

---

## ✨ Imkoniyatlar

Birinchi ochilganda qisqa **«Xush kelibsiz»** kartochkasi chiqadi (qanday ishlashini 2 gapda tushuntiradi). Til: **English / O'zbekcha** — Sozlamalarda yoki shu kartochkada almashtiriladi.

| Ekran | Nima bor |
|---|---|
| **Home** | Katta progress (1 / 66, %), progress bar, Total / Remaining / Completed / Hours remaining, kurs tugash sanasi va qolgan vaqt (oy · hafta · kun), keyingi dars sanasi, "On track / behind / ahead", **Complete Lesson** tugmasi (Undo bilan) |
| **History** | Har bir tugallangan dars sanasi bilan. Sanani o'zgartirish, xato bosilganini o'chirish, "Undo last" |
| **Calendar** | Dars kunlari belgilangan: ✓ Completed (yashil), ○ Upcoming (ko'k), Missed (kulrang). Kunni bossangiz tafsilot |
| **Stats** | Total / Completed / Remaining lessons, %, Total / Completed / Remaining hours, Current streak, Course days remaining |
| **Settings** | Til (English / O'zbekcha), Ko'rinish (Tizim / Yorug' / Qorong'i), Course name, Start date, Total lessons, Lesson duration, Study days (haftaning kunlari), Course end date (auto / qo'lda), Nusxa saqlash / tiklash, Qaytadan boshlash |

Kurs tugaganda Home ekranida **🎉 Course Completed** chiqadi.

## 🧮 Hisoblash

```
remainingLessons = totalLessons − completedLessons
completedHours   = completedLessons × lessonDuration
remainingHours   = remainingLessons × lessonDuration
progress         = completedLessons / totalLessons × 100
courseEndDate    = startDate'dan boshlab, tanlangan dars kunlari bo'yicha
                   totalLessons-nchi darsning sanasi (yoki Settings'da qo'lda)
```

**Default:** Study Course · 28 Sep 2026 · 66 dars · 2 soat · Mon, Wed, Fri (haftasiga 3) → kurs tugashi avtomatik hisoblanadi.

## 🛠 Texnik

- Toza HTML + CSS + JavaScript, hech qanday framework/kutubxona yo'q.
- `js/app.js` — butun logika (hisoblash, saqlash, ekranlar). `css/style.css` — iOS uslubidagi dizayn.
- Ma'lumot `localStorage`'da; `sw.js` (service worker) offline ishlashni ta'minlaydi.
- Lokal ko'rish: papkada `python3 -m http.server 8000` → `http://localhost:8000`.

## 📁 Fayllar

```
index.html            — app qobig'i, tab bar
css/style.css         — dizayn (light / dark)
js/app.js             — logika
manifest.webmanifest  — PWA manifest (nom, ikonka, standalone rejim)
sw.js                 — offline kesh
icons/                — app ikonkalari
```
