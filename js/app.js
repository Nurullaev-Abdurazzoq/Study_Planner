/* ============================================================
   Study Course Tracker
   Plain JS, no dependencies. All data lives in localStorage.
   ------------------------------------------------------------
   Sections:
     1. Constants & defaults
     2. Translations (English / O'zbek)
     3. Date helpers
     4. State (load / save / normalize)
     5. Calculations (schedule, stats, streak)
     6. Rendering (dashboard, history, calendar, stats, settings)
     7. Actions & event wiring
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. Constants & defaults ---------- */
  const STORAGE_KEY = 'studyCourseTracker.v1';
  const UI_KEY = 'studyCourseTracker.ui';
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Monday-first week. `id` is JS Date.getDay() (0 = Sunday).
  const WEEKDAY_IDS = [1, 2, 3, 4, 5, 6, 0];

  const DEFAULT_SETTINGS = {
    courseName: 'Study Course',
    startDate: '2026-09-29',
    totalLessons: 66,
    lessonDuration: 2,        // hours per lesson
    studyDays: [2, 4, 6],     // Tue, Thu, Sat
    endDateMode: 'auto',      // 'auto' = computed from schedule, 'manual' = endDate below
    endDate: '',
    appearance: 'system',     // 'system' | 'light' | 'dark'
    lang: 'en',               // 'en' | 'uz'
  };

  /* ---------- 2. Translations ---------- */
  const L = {
    en: {
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      weekdays: { 1: ['Mon', 'Monday', 'M'], 2: ['Tue', 'Tuesday', 'T'], 3: ['Wed', 'Wednesday', 'W'], 4: ['Thu', 'Thursday', 'T'], 5: ['Fri', 'Friday', 'F'], 6: ['Sat', 'Saturday', 'S'], 0: ['Sun', 'Sunday', 'S'] },
      unit: { lesson: ['lesson', 'lessons'], hour: ['hour', 'hours'], day: ['day', 'days'], week: ['week', 'weeks'], month: ['month', 'months'] },
      tabs: { dashboard: 'Home', history: 'History', calendar: 'Calendar', stats: 'Stats', settings: 'Settings' },

      welcomeTitle: '👋 Welcome!',
      welcomeText: 'This app counts your lessons for you. After each lesson, tap the big <b>Complete Lesson</b> button — remaining lessons, hours and the course end date update automatically.',
      welcomeHint: 'You can change the course name, start date and lesson days in <b>Settings</b>.',
      gotIt: 'Got it',
      switchLang: "O'zbekcha",

      started: 'Started {date}',
      courseProgress: 'Course progress',
      lessonsLeftHoursLeft: '{lessons} · {hours} to go',
      totalLessons: 'Total lessons',
      lessonsRemaining: 'Lessons remaining',
      lessonsCompleted: 'Lessons completed',
      hoursRemaining: 'Hours remaining',
      hours: 'hours',
      courseEnds: 'Course ends',
      timeRemaining: 'Time remaining',
      ended: 'Ended',
      endedHint: 'Course period is over',
      nextLesson: 'Next lesson',
      finished: 'Finished',
      allDone: 'All lessons done',
      noDaysLeft: 'No scheduled days left',
      lessonN: 'Lesson #{n}',
      onTrack: 'On track',
      ahead: '{n} ahead',
      behind: '{n} behind',
      startsIn: 'Starts in {n}',
      courseCompletedPill: 'Course completed',
      completeLesson: 'Complete Lesson',
      completeHint: 'Tap once after each finished lesson',
      courseCompleted: 'Course Completed',
      lessonsOf: '{a} / {b} lessons',
      hoursOf: '{a} / {b} hours',
      pctCompleted: '{p} completed',
      lastCompleted: 'Last completed: Lesson #{n} · {date}',
      toastDone: 'Lesson #{n} completed · {left} left',
      toastAllDone: '🎉 Lesson #{n} — course completed!',
      undo: 'Undo',
      keepOneDay: 'Keep at least one study day',

      history: 'History',
      historySub: '{lessons} completed · {hours}',
      undoLast: 'Undo last completion',
      historyEmpty: 'No lessons completed yet.',
      historyEmptyHint: 'After each lesson, tap <b>Complete Lesson</b> on the Home tab.',
      completed: 'Completed',
      remove: 'Remove',
      historyHint: 'Tap a date to change it. "Remove" deletes a lesson you completed by mistake.',
      removeConfirm: 'Remove Lesson #{n} from history?',

      calendar: 'Calendar',
      calendarSub: 'Lesson days are marked. Tap a day for details.',
      today: 'Today',
      upcoming: 'Upcoming',
      calCompleted: '✓ Completed — {list}',
      calUpcoming: '○ Upcoming — Lesson #{n}',
      calSkipped: '✕ No lesson on this day (skipped)',
      calNone: 'No lesson on this day',
      noLesson: 'No lesson',
      tapToChange: 'Tap the date to change it',
      noLessonToday: 'No lesson today',
      noLessonThisDay: 'No lesson on this day',
      skipConfirm: "Mark {date} as a day without a lesson?\n\nIt will not be counted, and the schedule moves to the next study day.",
      skippedToast: '{date} — no lesson. Schedule updated.',
      restoreLesson: 'Put the lesson back on this day',
      nextMoved: 'Next lesson moved to {date}',

      stats: 'Statistics',
      progress: 'Progress',
      lessons: 'Lessons',
      hoursTitle: 'Hours',
      time: 'Time',
      completedLessons: 'Completed lessons',
      remainingLessons: 'Remaining lessons',
      completionPct: 'Completion percentage',
      expectedByToday: 'Should be done by today',
      expectedHint: 'According to your schedule',
      totalHours: 'Total hours',
      completedHours: 'Completed hours',
      remainingHours: 'Remaining hours',
      streak: 'Current streak',
      streakHint: 'Lesson days completed in a row',
      daysRemaining: 'Course days remaining',
      weeksRemaining: 'Weeks remaining',

      settings: 'Settings',
      settingsSub: 'Changes are saved automatically.',
      course: 'Course',
      courseName: 'Course name',
      startDate: 'Start date',
      startDateHint: 'The day of your first lesson',
      totalLessonsHint: 'Cannot be less than completed ({n})',
      lessonDuration: 'Lesson duration',
      lessonDurationHint: 'Hours per lesson',
      weeklySchedule: 'Weekly schedule',
      studyDays: 'Study days',
      studyDaysHint: 'Tap the days you have lessons',
      lessonsPerWeek: 'Lessons per week',
      courseEndDate: 'Course end date',
      autoEnd: 'Calculate automatically',
      autoEndHint: 'From start date, study days and total lessons',
      language: 'Language',
      appearance: 'Appearance',
      system: 'System', light: 'Light', dark: 'Dark',
      data: 'Your data',
      exportBackup: 'Save a backup',
      importBackup: 'Restore from backup',
      dataHint: 'Everything is stored only on this phone. Save a backup before deleting the app or changing phones.',
      resetTitle: 'Start over',
      resetProgress: 'Clear completed lessons',
      resetAll: 'Reset everything to defaults',
      resetProgressConfirm: 'Delete all completed lessons? Your settings will be kept.',
      resetAllConfirm: 'Reset everything to defaults? This cannot be undone.',
      importConfirm: 'Replace current data with this backup?',
      importOk: 'Backup restored',
      importBad: 'Could not read this backup file',
      about: 'About',
      version: 'Version',
      install: 'Install on iPhone',
      installHint: 'Safari → Share → Add to Home Screen',
      showWelcome: 'Show the welcome tips again',
    },
    uz: {
      months: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
      monthsShort: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
      weekdays: { 1: ['Du', 'Dushanba', 'D'], 2: ['Se', 'Seshanba', 'S'], 3: ['Ch', 'Chorshanba', 'C'], 4: ['Pa', 'Payshanba', 'P'], 5: ['Ju', 'Juma', 'J'], 6: ['Sh', 'Shanba', 'S'], 0: ['Ya', 'Yakshanba', 'Y'] },
      unit: { lesson: ['dars', 'dars'], hour: ['soat', 'soat'], day: ['kun', 'kun'], week: ['hafta', 'hafta'], month: ['oy', 'oy'] },
      tabs: { dashboard: 'Asosiy', history: 'Tarix', calendar: 'Kalendar', stats: 'Statistika', settings: 'Sozlamalar' },

      welcomeTitle: '👋 Xush kelibsiz!',
      welcomeText: "Bu ilova darslaringizni o'zi sanaydi. Har dars tugagach katta <b>Darsni tugatdim</b> tugmasini bosing — qolgan darslar, soatlar va kurs tugash sanasi avtomatik yangilanadi.",
      welcomeHint: "Kurs nomi, boshlanish sanasi va dars kunlarini <b>Sozlamalar</b>da o'zgartirish mumkin.",
      gotIt: 'Tushundim',
      switchLang: 'English',

      started: '{date} dan boshlangan',
      courseProgress: 'Kurs jarayoni',
      lessonsLeftHoursLeft: '{lessons} · {hours} qoldi',
      totalLessons: 'Jami darslar',
      lessonsRemaining: 'Qolgan darslar',
      lessonsCompleted: "O'tilgan darslar",
      hoursRemaining: 'Qolgan soatlar',
      hours: 'soat',
      courseEnds: 'Kurs tugaydi',
      timeRemaining: 'Qolgan vaqt',
      ended: 'Tugadi',
      endedHint: 'Kurs muddati tugagan',
      nextLesson: 'Keyingi dars',
      finished: 'Tugallandi',
      allDone: 'Barcha darslar o\'tildi',
      noDaysLeft: 'Rejalashtirilgan kun qolmadi',
      lessonN: '{n}-dars',
      onTrack: 'Jadval bo\'yicha',
      ahead: '{n} oldinda',
      behind: '{n} orqada',
      startsIn: '{n}dan keyin boshlanadi',
      courseCompletedPill: 'Kurs tugallandi',
      completeLesson: 'Darsni tugatdim',
      completeHint: 'Har dars tugagach bir marta bosing',
      courseCompleted: 'Kurs tugallandi',
      lessonsOf: '{a} / {b} dars',
      hoursOf: '{a} / {b} soat',
      pctCompleted: '{p} bajarildi',
      lastCompleted: 'Oxirgi dars: {n}-dars · {date}',
      toastDone: '{n}-dars tugatildi · {left} qoldi',
      toastAllDone: '🎉 {n}-dars — kurs tugallandi!',
      undo: 'Bekor qilish',
      keepOneDay: 'Kamida bitta dars kuni qolsin',

      history: 'Tarix',
      historySub: '{lessons} o\'tildi · {hours}',
      undoLast: 'Oxirgi darsni bekor qilish',
      historyEmpty: 'Hali dars tugatilmagan.',
      historyEmptyHint: 'Har dars tugagach Asosiy sahifadagi <b>Darsni tugatdim</b> tugmasini bosing.',
      completed: 'Tugallandi',
      remove: "O'chirish",
      historyHint: "Sanani o'zgartirish uchun uni bosing. Xato bosilgan darsni «O'chirish» bilan olib tashlang.",
      removeConfirm: '{n}-darsni tarixdan o\'chirasizmi?',

      calendar: 'Kalendar',
      calendarSub: 'Dars kunlari belgilangan. Batafsil uchun kunni bosing.',
      today: 'Bugun',
      upcoming: 'Kelgusi',
      calCompleted: '✓ Tugallangan — {list}',
      calUpcoming: '○ Kelgusi — {n}-dars',
      calSkipped: "✕ Bu kuni dars yo'q (o'tkazib yuborilgan)",
      calNone: 'Bu kunda dars yo\'q',
      noLesson: "Dars yo'q",
      tapToChange: "Sanani o'zgartirish uchun uni bosing",
      noLessonToday: "Bugun dars yo'q",
      noLessonThisDay: "Bu kuni dars yo'q",
      skipConfirm: "{date} kuni dars yo'q deb belgilansinmi?\n\nBu kun hisoblanmaydi, jadval keyingi dars kuniga suriladi.",
      skippedToast: "{date} — dars yo'q. Jadval yangilandi.",
      restoreLesson: 'Bu kunga darsni qaytarish',
      nextMoved: 'Keyingi dars {date}ga ko\'chirildi',

      stats: 'Statistika',
      progress: 'Jarayon',
      lessons: 'Darslar',
      hoursTitle: 'Soatlar',
      time: 'Vaqt',
      completedLessons: "O'tilgan darslar",
      remainingLessons: 'Qolgan darslar',
      completionPct: 'Bajarilgan foiz',
      expectedByToday: 'Bugungacha bo\'lishi kerak',
      expectedHint: 'Jadval bo\'yicha',
      totalHours: 'Jami soat',
      completedHours: "O'tilgan soat",
      remainingHours: 'Qolgan soat',
      streak: 'Ketma-ketlik',
      streakHint: 'Ketma-ket tugatilgan dars kunlari',
      daysRemaining: 'Kurs tugashiga kun',
      weeksRemaining: 'Qolgan haftalar',

      settings: 'Sozlamalar',
      settingsSub: "O'zgarishlar avtomatik saqlanadi.",
      course: 'Kurs',
      courseName: 'Kurs nomi',
      startDate: 'Boshlanish sanasi',
      startDateHint: 'Birinchi dars kuni',
      totalLessonsHint: "O'tilganlardan ({n}) kam bo'lishi mumkin emas",
      lessonDuration: 'Dars davomiyligi',
      lessonDurationHint: 'Bir dars necha soat',
      weeklySchedule: 'Haftalik jadval',
      studyDays: 'Dars kunlari',
      studyDaysHint: 'Dars bo\'ladigan kunlarni bosing',
      lessonsPerWeek: 'Haftasiga darslar',
      courseEndDate: 'Kurs tugash sanasi',
      autoEnd: 'Avtomatik hisoblash',
      autoEndHint: 'Boshlanish sanasi, dars kunlari va darslar sonidan',
      language: 'Til',
      appearance: "Ko'rinish",
      system: 'Tizim', light: 'Yorug\'', dark: 'Qorong\'i',
      data: "Ma'lumotlar",
      exportBackup: 'Nusxa saqlash',
      importBackup: 'Nusxadan tiklash',
      dataHint: "Hamma narsa faqat shu telefonda saqlanadi. Ilovani o'chirishdan yoki telefon almashtirishdan oldin nusxa saqlang.",
      resetTitle: 'Qaytadan boshlash',
      resetProgress: "O'tilgan darslarni tozalash",
      resetAll: "Hammasini boshlang'ich holatga qaytarish",
      resetProgressConfirm: "Barcha o'tilgan darslar o'chirilsinmi? Sozlamalar saqlanib qoladi.",
      resetAllConfirm: "Hammasi boshlang'ich holatga qaytarilsinmi? Buni bekor qilib bo'lmaydi.",
      importConfirm: "Hozirgi ma'lumotlar nusxadagi bilan almashtirilsinmi?",
      importOk: 'Nusxa tiklandi',
      importBad: "Bu faylni o'qib bo'lmadi",
      about: 'Ilova haqida',
      version: 'Versiya',
      install: "iPhone'ga o'rnatish",
      installHint: 'Safari → Ulashish → Add to Home Screen',
      showWelcome: "Boshlang'ich maslahatlarni yana ko'rsatish",
    },
  };

  let lang = 'en';
  const T = () => L[lang];
  function t(key, vars) {
    let s = T()[key];
    if (s === undefined) s = L.en[key] !== undefined ? L.en[key] : key;
    if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
    return s;
  }
  // "3 lessons" / "3 dars"
  const cnt = (n, unit) => `${n} ${T().unit[unit][n === 1 ? 0 : 1]}`;

  /* ---------- 3. Date helpers (all local-time, ISO "YYYY-MM-DD") ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayISO = () => toISO(new Date());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const daysBetween = (aISO, bISO) => Math.round((parseISO(bISO) - parseISO(aISO)) / DAY_MS);
  const isValidISO = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseISO(s));

  function monthsBetween(aISO, bISO) {
    const a = parseISO(aISO), b = parseISO(bISO);
    let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    if (b.getDate() < a.getDate()) months -= 1;
    return Math.max(0, months);
  }
  const fmtLong = (iso) => { const d = parseISO(iso); return `${d.getDate()} ${T().months[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtShort = (iso) => { const d = parseISO(iso); return `${pad(d.getDate())} ${T().monthsShort[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtDay = (iso) => { const d = parseISO(iso); return `${T().weekdays[d.getDay()][0]}, ${d.getDate()} ${T().monthsShort[d.getMonth()]}`; };
  const fmtNum = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));
  const fmtPct = (p) => (Number.isInteger(p) ? `${p}%` : `${p.toFixed(1)}%`);
  const wd = (id) => T().weekdays[id];

  /* ---------- 4. State ---------- */
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const clampInt = (v, min, max, fallback) => { const n = parseInt(v, 10); return isNaN(n) ? fallback : Math.min(max, Math.max(min, n)); };
  const clampNum = (v, min, max, fallback) => { const n = parseFloat(v); return isNaN(n) ? fallback : Math.min(max, Math.max(min, n)); };

  function normalize(obj) {
    const s = Object.assign({}, DEFAULT_SETTINGS, (obj && obj.settings) || {});
    // One-time migration: version 1 shipped with Mon/Wed/Fri from 28 Sep 2026.
    // If those defaults were never changed, move to the current defaults.
    if (!s.settingsVersion) {
      const oldDays = Array.isArray(s.studyDays) && s.studyDays.length === 3 && [1, 3, 5].every((d) => s.studyDays.includes(d));
      if (oldDays && s.startDate === '2026-09-28') {
        s.studyDays = [...DEFAULT_SETTINGS.studyDays];
        s.startDate = DEFAULT_SETTINGS.startDate;
      }
      s.settingsVersion = 2;
    }
    s.courseName = String(s.courseName || '').trim() || DEFAULT_SETTINGS.courseName;
    s.startDate = isValidISO(s.startDate) ? s.startDate : DEFAULT_SETTINGS.startDate;
    s.totalLessons = clampInt(s.totalLessons, 1, 9999, DEFAULT_SETTINGS.totalLessons);
    s.lessonDuration = clampNum(s.lessonDuration, 0.25, 24, DEFAULT_SETTINGS.lessonDuration);
    s.studyDays = Array.isArray(s.studyDays)
      ? [...new Set(s.studyDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))]
      : [...DEFAULT_SETTINGS.studyDays];
    if (!s.studyDays.length) s.studyDays = [...DEFAULT_SETTINGS.studyDays];
    s.endDateMode = s.endDateMode === 'manual' && isValidISO(s.endDate) ? 'manual' : 'auto';
    if (!isValidISO(s.endDate)) s.endDate = '';
    if (!['system', 'light', 'dark'].includes(s.appearance)) s.appearance = 'system';
    if (!L[s.lang]) s.lang = 'en';

    const completions = (Array.isArray(obj && obj.completions) ? obj.completions : [])
      .filter((c) => c && isValidISO(c.date))
      .map((c) => ({ id: c.id || uid(), date: c.date, completedAt: c.completedAt || new Date().toISOString() }));

    const skipped = Array.isArray(obj && obj.skipped) ? [...new Set(obj.skipped.filter(isValidISO))] : [];
    const nextLessonDate = obj && isValidISO(obj.nextLessonDate) ? obj.nextLessonDate : '';

    return { settings: s, completions, skipped, nextLessonDate };
  }

  function loadState() {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return normalize(JSON.parse(raw)); }
    catch (e) { /* corrupted storage: fall through to defaults */ }
    return normalize({});
  }
  function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
  function loadUI() {
    try { return Object.assign({ tab: 'dashboard', welcomeDone: false }, JSON.parse(localStorage.getItem(UI_KEY) || '{}')); }
    catch (e) { return { tab: 'dashboard', welcomeDone: false }; }
  }
  function saveUI() { try { localStorage.setItem(UI_KEY, JSON.stringify({ tab: ui.tab, welcomeDone: ui.welcomeDone })); } catch (e) { /* ignore */ } }

  let state = loadState();
  const ui = loadUI();
  const now = new Date();
  ui.calYear = now.getFullYear();
  ui.calMonth = now.getMonth();
  ui.calSelected = null;

  /* ---------- 5. Calculations ---------- */

  // Planned schedule: lesson days from the start date, skipping "no lesson" days.
  // Used only to judge pace ("2 lessons behind").
  function plannedSchedule(s, skipped) {
    const dates = [];
    const skip = new Set(skipped);
    let d = parseISO(s.startDate);
    let guard = 0;
    while (dates.length < s.totalLessons && guard < 20000) {
      const iso = toISO(d);
      if (s.studyDays.includes(d.getDay()) && !skip.has(iso)) dates.push(iso);
      d = addDays(d, 1);
      guard++;
    }
    return dates;
  }

  // Dates for the lessons still to do (lesson #completed+1 … #total).
  // Starts today (or at the chosen "next lesson" date) and follows the study days,
  // skipping "no lesson" days and days that already have a completed lesson.
  function remainingSchedule(s, remaining, today) {
    const dates = [];
    if (remaining <= 0) return dates;
    const exclude = new Set([...state.skipped, ...state.completions.map((c) => c.date)]);
    let d;
    if (state.nextLessonDate && state.nextLessonDate >= today) {
      dates.push(state.nextLessonDate);
      d = addDays(parseISO(state.nextLessonDate), 1);
    } else {
      d = parseISO(today >= s.startDate ? today : s.startDate);
    }
    let guard = 0;
    while (dates.length < remaining && guard < 20000) {
      const iso = toISO(d);
      if (s.studyDays.includes(d.getDay()) && !exclude.has(iso)) dates.push(iso);
      d = addDays(d, 1);
      guard++;
    }
    return dates;
  }

  // Lessons completed in a row without a gap of more than 7 days (counted from the latest).
  function currentStreak(completions, today) {
    const dates = completions.map((c) => c.date).sort();
    if (!dates.length) return 0;
    if (daysBetween(dates[dates.length - 1], today) > 7) return 0;
    let streak = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      if (daysBetween(dates[i - 1], dates[i]) > 7) break;
      streak++;
    }
    return streak;
  }

  function computeStats() {
    const s = state.settings;
    const today = todayISO();

    const total = s.totalLessons;
    const completed = Math.min(state.completions.length, total);
    const remaining = total - completed;
    const percent = total ? (completed / total) * 100 : 0;

    const totalHours = total * s.lessonDuration;
    const completedHours = completed * s.lessonDuration;
    const remainingHours = remaining * s.lessonDuration;

    const schedule = remainingSchedule(s, remaining, today);
    const lastCompletion = state.completions.length ? state.completions[state.completions.length - 1] : null;
    const autoEndDate = schedule.length ? schedule[schedule.length - 1] : (lastCompletion ? lastCompletion.date : s.startDate);
    const endDate = s.endDateMode === 'manual' && s.endDate ? s.endDate : autoEndDate;

    const daysRemaining = Math.max(0, daysBetween(today, endDate));
    const weeksRemaining = Math.floor(daysRemaining / 7);
    const monthsRemaining = monthsBetween(today, endDate);

    // Lessons that should already be done by plan. Today's lesson is not counted until the day is over.
    const expectedByToday = plannedSchedule(s, state.skipped).filter((d) => d < today).length;
    const nextLessonDate = schedule.length ? schedule[0] : null;

    return {
      today, schedule, total, completed, remaining, percent,
      totalHours, completedHours, remainingHours,
      autoEndDate, endDate, daysRemaining, weeksRemaining, monthsRemaining,
      expectedByToday, nextLessonDate, lastCompletion,
      streak: currentStreak(state.completions, today),
      isDone: remaining === 0,
      started: today >= s.startDate,
    };
  }

  /* ---------- 6. Rendering ---------- */
  const $ = (sel) => document.querySelector(sel);
  const esc = (str) => String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function applyAppearance() {
    const a = state.settings.appearance;
    if (a === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', a);
  }

  function render() {
    lang = state.settings.lang;
    document.documentElement.lang = lang;
    applyAppearance();
    const st = computeStats();
    const view = $('#view');
    const renderers = { dashboard: renderDashboard, history: renderHistory, calendar: renderCalendar, stats: renderStats, settings: renderSettings };
    view.innerHTML = (renderers[ui.tab] || renderDashboard)(st);
    view.classList.toggle('has-action', ui.tab === 'dashboard' && !st.isDone);
    renderActionBar(st);
    document.querySelectorAll('.tab').forEach((el) => {
      el.classList.toggle('on', el.dataset.tab === ui.tab);
      el.querySelector('span').textContent = T().tabs[el.dataset.tab];
    });
  }

  function progressBar(st) {
    return `<div class="progress ${st.isDone ? 'done' : ''}" role="progressbar" aria-valuenow="${st.completed}" aria-valuemax="${st.total}">
              <i style="width:${Math.min(100, st.percent).toFixed(2)}%"></i>
            </div>`;
  }

  function paceLabel(st) {
    if (st.isDone) return `<span class="pill green">${t('courseCompletedPill')}</span>`;
    if (!st.started) return `<span class="pill accent">${t('startsIn', { n: cnt(daysBetween(st.today, state.settings.startDate), 'day') })}</span>`;
    const diff = st.completed - st.expectedByToday;
    if (diff === 0) return `<span class="pill green">${t('onTrack')}</span>`;
    if (diff > 0) return `<span class="pill accent">${t('ahead', { n: cnt(diff, 'lesson') })}</span>`;
    return `<span class="pill orange">${t('behind', { n: cnt(-diff, 'lesson') })}</span>`;
  }

  function welcomeCard() {
    if (ui.welcomeDone) return '';
    return `
      <div class="card welcome">
        <h2>${t('welcomeTitle')}</h2>
        <p>${t('welcomeText')}</p>
        <p class="muted">${t('welcomeHint')}</p>
        <div class="btn-row">
          <button class="btn btn-primary small" data-action="welcome-done">${t('gotIt')}</button>
          <button class="btn btn-secondary small" data-action="switch-lang">🌐 ${t('switchLang')}</button>
        </div>
      </div>`;
  }

  function renderDashboard(st) {
    const s = state.settings;
    const days = s.studyDays.length === 7 ? '' : ' · ' + WEEKDAY_IDS.filter((id) => s.studyDays.includes(id)).map((id) => wd(id)[0]).join(', ');

    const heroOrCelebrate = st.isDone
      ? `<div class="card celebrate">
           <div class="emoji">🎉</div>
           <h2>${t('courseCompleted')}</h2>
           <p class="num">${t('lessonsOf', { a: st.total, b: st.total })}</p>
           <p class="num">${t('hoursOf', { a: fmtNum(st.completedHours), b: fmtNum(st.totalHours) })}</p>
           <p>${t('pctCompleted', { p: '100%' })}</p>
         </div>`
      : `<div class="card hero">
           <div class="hero-top">
             <div>
               <div class="card-label">${t('courseProgress')}</div>
               <div class="hero-value num">${st.completed}<small> / ${st.total}</small></div>
             </div>
             <div class="hero-pct num">${fmtPct(st.percent)}</div>
           </div>
           ${progressBar(st)}
           <div class="progress-row">
             <span class="num">${t('lessonsLeftHoursLeft', { lessons: `<b>${cnt(st.remaining, 'lesson')}</b>`, hours: `<b>${cnt(fmtNum(st.remainingHours), 'hour')}</b>` })}</span>
             ${paceLabel(st)}
           </div>
         </div>`;

    const timeRemaining = st.daysRemaining === 0
      ? `<div class="ends-remaining">${t('ended')}</div><div class="ends-detail">${t('endedHint')}</div>`
      : `<div class="ends-remaining num">${st.monthsRemaining >= 1 ? cnt(st.monthsRemaining, 'month') : cnt(st.weeksRemaining, 'week')}</div>
         <div class="ends-detail num">${cnt(st.weeksRemaining, 'week')} · ${cnt(st.daysRemaining, 'day')}</div>`;

    let nextBlock;
    if (st.isDone) {
      nextBlock = `<div class="lbl">${t('finished')}</div><div class="val">${t('allDone')}</div>`;
    } else if (st.nextLessonDate) {
      const isToday = st.nextLessonDate === st.today;
      nextBlock = `
        <div class="lbl">${t('nextLesson')} · ${t('lessonN', { n: st.completed + 1 })}</div>
        <div class="val">
          <span class="date-pick">📅 ${fmtDay(st.nextLessonDate)} <span class="edit-mark">✎</span>
            <input type="date" value="${st.nextLessonDate}" min="${st.today}" data-action="next-date" aria-label="${t('nextLesson')}">
          </span>
        </div>
        <div class="hint-line">${t('tapToChange')}</div>
        <button class="btn btn-secondary small skip-btn" data-action="skip-date" data-date="${st.nextLessonDate}">🚫 ${isToday ? t('noLessonToday') : t('noLessonThisDay')}</button>`;
    } else {
      nextBlock = `<div class="lbl">${t('nextLesson')}</div><div class="val">${t('noDaysLeft')}</div>`;
    }

    return `
      <h1 class="large-title">📚 ${esc(s.courseName)}</h1>
      <p class="subtitle">${t('started', { date: fmtShort(s.startDate) })}${esc(days)}</p>

      ${welcomeCard()}
      ${heroOrCelebrate}

      <div class="grid-2">
        <div class="card"><div class="tile-value num">${st.total}</div><div class="tile-label">${t('totalLessons')}</div></div>
        <div class="card"><div class="tile-value num accent">${st.remaining}</div><div class="tile-label">${t('lessonsRemaining')}</div></div>
        <div class="card"><div class="tile-value num green">${st.completed}</div><div class="tile-label">${t('lessonsCompleted')}</div></div>
        <div class="card"><div class="tile-value num">${fmtNum(st.remainingHours)}<small>${t('hours')}</small></div><div class="tile-label">${t('hoursRemaining')}</div></div>
      </div>

      <div class="card">
        <div class="ends-card">
          <div class="left">
            <div class="card-label">${t('courseEnds')}</div>
            <div class="ends-date">${fmtLong(st.endDate)}</div>
          </div>
          <div class="right">
            <div class="card-label">${t('timeRemaining')}</div>
            ${timeRemaining}
          </div>
        </div>
        <div class="divider"></div>
        <div class="next-block">${nextBlock}</div>
      </div>

      ${st.lastCompletion ? `<p class="footnote">${t('lastCompleted', { n: state.completions.length, date: fmtShort(st.lastCompletion.date) })}</p>` : ''}
    `;
  }

  function renderActionBar(st) {
    const bar = $('#actionBar');
    if (ui.tab !== 'dashboard' || st.isDone) { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    bar.innerHTML = `<div class="inner">
      <button class="btn btn-primary" data-action="complete">✓&nbsp; ${t('completeLesson')}</button>
      <div class="action-hint">${t('completeHint')}</div>
    </div>`;
  }

  function renderHistory(st) {
    const items = state.completions.map((c, i) => ({ ...c, n: i + 1 })).reverse();
    const list = items.length
      ? `<div class="group">${items.map((c) => `
          <div class="row hist-row">
            <div class="row-label">
              <div class="lesson">${t('lessonN', { n: c.n })} <span class="badge">${t('completed')}</span></div>
              <label class="date-wrap">📅 <input class="date-input" type="date" value="${c.date}" data-action="edit-date" data-id="${c.id}" aria-label="Completion date"></label>
            </div>
            <button class="text-btn danger" data-action="remove" data-id="${c.id}">${t('remove')}</button>
          </div>`).join('')}</div>`
      : `<div class="card empty"><div class="big">📖</div><b>${t('historyEmpty')}</b><br>${t('historyEmptyHint')}</div>`;

    return `
      <h1 class="large-title">${t('history')}</h1>
      <p class="subtitle num">${t('historySub', { lessons: cnt(st.completed, 'lesson'), hours: cnt(fmtNum(st.completedHours), 'hour') })}</p>
      ${items.length ? `<button class="btn btn-secondary" data-action="undo" style="margin-bottom:12px">↩︎&nbsp; ${t('undoLast')}</button>` : ''}
      ${list}
      ${items.length ? `<p class="footnote">${t('historyHint')}</p>` : ''}
    `;
  }

  function renderCalendar(st) {
    const y = ui.calYear, m = ui.calMonth;
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Monday-first offset
    const scheduleIndex = new Map(st.schedule.map((d, i) => [d, st.completed + i + 1]));
    const completedDates = new Set(state.completions.map((c) => c.date));
    const skipped = new Set(state.skipped);

    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<div class="cal-cell"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(new Date(y, m, d));
      const cls = ['cal-day'];
      if (iso === st.today) cls.push('today');
      if (completedDates.has(iso)) cls.push('completed');
      else if (skipped.has(iso)) cls.push('skipped');
      else if (scheduleIndex.has(iso)) cls.push('upcoming');
      if (ui.calSelected === iso) cls.push('selected');
      cells += `<div class="cal-cell"><button class="${cls.join(' ')}" data-action="cal-select" data-date="${iso}">${d}</button></div>`;
    }

    let detail = '';
    if (ui.calSelected) {
      const iso = ui.calSelected;
      const doneHere = state.completions.map((c, i) => ({ ...c, n: i + 1 })).filter((c) => c.date === iso);
      const n = scheduleIndex.get(iso);
      let status, action = '';
      if (doneHere.length) status = t('calCompleted', { list: doneHere.map((c) => t('lessonN', { n: c.n })).join(', ') });
      else if (skipped.has(iso)) {
        status = t('calSkipped');
        if (iso >= st.today) action = `<button class="btn btn-secondary small" data-action="unskip-date" data-date="${iso}">↩︎ ${t('restoreLesson')}</button>`;
      } else if (n) {
        status = t('calUpcoming', { n });
        action = `<button class="btn btn-secondary small" data-action="skip-date" data-date="${iso}">🚫 ${iso === st.today ? t('noLessonToday') : t('noLessonThisDay')}</button>`;
      } else status = t('calNone');
      detail = `<div class="card cal-detail"><div class="d">${fmtLong(iso)}</div><div class="s">${status}</div>${action ? `<div class="sp"></div>${action}` : ''}</div>`;
    }

    return `
      <h1 class="large-title">${t('calendar')}</h1>
      <p class="subtitle">${t('calendarSub')}</p>
      <div class="card">
        <div class="cal-head">
          <h2>${T().months[m]} ${y}</h2>
          <div class="cal-nav">
            <button class="today-btn" data-action="cal-today">${t('today')}</button>
            <button class="icon-btn" data-action="cal-prev" aria-label="Previous month"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
            <button class="icon-btn" data-action="cal-next" aria-label="Next month"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
          </div>
        </div>
        <div class="cal-grid">
          ${WEEKDAY_IDS.map((id) => `<div class="cal-dow">${wd(id)[0]}</div>`).join('')}
          ${cells}
        </div>
        <div class="legend">
          <span><i class="c"></i>${t('completed')}</span>
          <span><i class="u"></i>${t('upcoming')}</span>
          <span><i class="m"></i>${t('noLesson')}</span>
        </div>
      </div>
      ${detail}
    `;
  }

  function renderStats(st) {
    const row = (label, value, hint) => `
      <div class="row">
        <div class="row-label">${label}${hint ? `<span class="hint">${hint}</span>` : ''}</div>
        <div class="row-value strong num">${value}</div>
      </div>`;

    return `
      <h1 class="large-title">${t('stats')}</h1>
      <p class="subtitle">${esc(state.settings.courseName)}</p>

      <div class="card stat-hero">
        <div class="card-label">${t('progress')}</div>
        <div class="big num">${st.completed}<small> / ${st.total}</small></div>
        ${progressBar(st)}
        <div class="progress-row">
          <span>${t('pctCompleted', { p: `<b class="num">${fmtPct(st.percent)}</b>` })}</span>
          ${paceLabel(st)}
        </div>
      </div>

      <div class="section-title">${t('lessons')}</div>
      <div class="group">
        ${row(t('totalLessons'), st.total)}
        ${row(t('completedLessons'), st.completed)}
        ${row(t('remainingLessons'), st.remaining)}
        ${row(t('completionPct'), fmtPct(st.percent))}
        ${row(t('expectedByToday'), st.expectedByToday, t('expectedHint'))}
      </div>

      <div class="section-title">${t('hoursTitle')}</div>
      <div class="group">
        ${row(t('totalHours'), cnt(fmtNum(st.totalHours), 'hour'))}
        ${row(t('completedHours'), cnt(fmtNum(st.completedHours), 'hour'))}
        ${row(t('remainingHours'), cnt(fmtNum(st.remainingHours), 'hour'))}
      </div>

      <div class="section-title">${t('time')}</div>
      <div class="group">
        ${row(t('streak'), cnt(st.streak, 'lesson'), t('streakHint'))}
        ${row(t('daysRemaining'), cnt(st.daysRemaining, 'day'))}
        ${row(t('weeksRemaining'), cnt(st.weeksRemaining, 'week'))}
        ${row(t('courseEnds'), fmtShort(st.endDate))}
      </div>
    `;
  }

  function renderSettings(st) {
    const s = state.settings;
    const seg = (key, options) => `
      <div class="segmented">
        ${options.map(([v, label]) => `<button class="${s[key] === v ? 'on' : ''}" data-action="set-seg" data-key="${key}" data-value="${v}">${label}</button>`).join('')}
      </div>`;

    return `
      <h1 class="large-title">${t('settings')}</h1>
      <p class="subtitle">${t('settingsSub')}</p>

      <div class="section-title">${t('language')} / ${t('appearance')}</div>
      <div class="group">
        <div class="row">${seg('lang', [['en', 'English'], ['uz', "O'zbekcha"]])}</div>
        <div class="row">${seg('appearance', [['system', t('system')], ['light', t('light')], ['dark', t('dark')]])}</div>
      </div>

      <div class="section-title">${t('course')}</div>
      <div class="group">
        <div class="row"><div class="row-label">${t('courseName')}</div>
          <input type="text" value="${esc(s.courseName)}" data-setting="courseName" maxlength="40" autocomplete="off"></div>
        <div class="row"><div class="row-label">${t('startDate')}<span class="hint">${t('startDateHint')}</span></div>
          <input type="date" value="${s.startDate}" data-setting="startDate"></div>
        <div class="row"><div class="row-label">${t('totalLessons')}<span class="hint">${t('totalLessonsHint', { n: state.completions.length })}</span></div>
          <input type="number" inputmode="numeric" min="1" max="9999" value="${s.totalLessons}" data-setting="totalLessons"></div>
        <div class="row"><div class="row-label">${t('lessonDuration')}<span class="hint">${t('lessonDurationHint')}</span></div>
          <input type="number" inputmode="decimal" min="0.25" max="24" step="0.25" value="${s.lessonDuration}" data-setting="lessonDuration"></div>
      </div>

      <div class="section-title">${t('weeklySchedule')}</div>
      <div class="group">
        <div class="row"><div class="row-label">${t('studyDays')}<span class="hint">${t('studyDaysHint')}</span></div></div>
        <div class="days">
          ${WEEKDAY_IDS.map((id) => `<button class="day-chip ${s.studyDays.includes(id) ? 'on' : ''}" data-action="toggle-day" data-day="${id}" aria-label="${wd(id)[1]}" aria-pressed="${s.studyDays.includes(id)}">${wd(id)[0]}</button>`).join('')}
        </div>
        <div class="row"><div class="row-label">${t('lessonsPerWeek')}<span class="hint">${WEEKDAY_IDS.filter((id) => s.studyDays.includes(id)).map((id) => wd(id)[1]).join(', ')}</span></div><div class="row-value strong num">${s.studyDays.length}</div></div>
      </div>

      <div class="section-title">${t('courseEndDate')}</div>
      <div class="group">
        <div class="row">
          <div class="row-label">${t('autoEnd')}<span class="hint">${t('autoEndHint')}</span></div>
          <label class="switch"><input type="checkbox" data-setting="endDateAuto" ${s.endDateMode === 'auto' ? 'checked' : ''}><i></i></label>
        </div>
        ${s.endDateMode === 'auto'
          ? `<div class="row"><div class="row-label">${t('courseEndDate')}</div><div class="row-value strong">${fmtShort(st.autoEndDate)}</div></div>`
          : `<div class="row"><div class="row-label">${t('courseEndDate')}</div><input type="date" value="${s.endDate || st.autoEndDate}" data-setting="endDate"></div>`}
      </div>

      <div class="section-title">${t('data')}</div>
      <div class="group">
        <button class="row-btn" data-action="export">💾 ${t('exportBackup')}</button>
        <button class="row-btn" data-action="import">📂 ${t('importBackup')}</button>
      </div>
      <p class="footnote">${t('dataHint')}</p>

      <div class="section-title">${t('resetTitle')}</div>
      <div class="group">
        <button class="row-btn danger" data-action="reset-progress">${t('resetProgress')}</button>
        <button class="row-btn danger" data-action="reset-all">${t('resetAll')}</button>
      </div>

      <div class="section-title">${t('about')}</div>
      <div class="group">
        <div class="row"><div class="row-label">${t('install')}<span class="hint">${t('installHint')}</span></div></div>
        <button class="row-btn" data-action="show-welcome">${t('showWelcome')}</button>
        <div class="row"><div class="row-label">${t('version')}</div><div class="row-value">1.3</div></div>
      </div>
    `;
  }

  /* ---------- 7. Actions ---------- */
  let toastTimer = null;
  function showToast(text, action) {
    const el = $('#toast');
    el.innerHTML = `<span>${esc(text)}</span>${action ? `<button data-action="toast-action">${esc(action.label)}</button>` : ''}`;
    el.hidden = false;
    el.classList.toggle('low', $('#actionBar').hidden);
    el._action = action ? action.onClick : null;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 4000);
  }
  function hideToast() { const el = $('#toast'); el.hidden = true; el._action = null; }

  function commit() { saveState(); render(); }

  function completeLesson() {
    const st = computeStats();
    if (st.isDone) return;
    state.completions.push({ id: uid(), date: todayISO(), completedAt: new Date().toISOString() });
    state.nextLessonDate = ''; // the chosen next-lesson date is used up
    commit();
    const n = state.completions.length;
    const after = computeStats();
    showToast(after.isDone ? t('toastAllDone', { n }) : t('toastDone', { n, left: cnt(after.remaining, 'lesson') }), { label: t('undo'), onClick: undoLast });
  }

  function undoLast() {
    if (!state.completions.length) return;
    state.completions.pop();
    commit();
    hideToast();
  }

  function removeCompletion(id) {
    const idx = state.completions.findIndex((c) => c.id === id);
    if (idx === -1) return;
    if (!confirm(t('removeConfirm', { n: idx + 1 }))) return;
    state.completions.splice(idx, 1);
    commit();
  }

  function updateSetting(key, raw) {
    const s = state.settings;
    switch (key) {
      case 'courseName': s.courseName = String(raw).trim() || DEFAULT_SETTINGS.courseName; break;
      case 'startDate': if (isValidISO(raw)) s.startDate = raw; break;
      case 'totalLessons': s.totalLessons = clampInt(raw, Math.max(1, state.completions.length), 9999, s.totalLessons); break;
      case 'lessonDuration': s.lessonDuration = clampNum(raw, 0.25, 24, s.lessonDuration); break;
      case 'endDateAuto':
        if (raw) { s.endDateMode = 'auto'; }
        else { s.endDateMode = 'manual'; if (!s.endDate) s.endDate = computeStats().autoEndDate; }
        break;
      case 'endDate': if (isValidISO(raw)) { s.endDate = raw; s.endDateMode = 'manual'; } break;
      default: return;
    }
    commit();
  }

  function toggleDay(day) {
    const days = state.settings.studyDays;
    if (days.includes(day)) {
      if (days.length === 1) { showToast(t('keepOneDay')); return; }
      state.settings.studyDays = days.filter((d) => d !== day);
    } else {
      state.settings.studyDays = [...days, day];
    }
    commit();
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-tracker-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== 'object' || !parsed.settings) throw new Error('bad');
        if (!confirm(t('importConfirm'))) return;
        state = normalize(parsed);
        commit();
        showToast(t('importOk'));
      } catch (e) {
        showToast(t('importBad'));
      }
    };
    reader.readAsText(file);
  }

  function resetProgress() {
    if (!confirm(t('resetProgressConfirm'))) return;
    state.completions = [];
    state.skipped = [];
    state.nextLessonDate = '';
    commit();
  }

  function skipDate(iso) {
    if (!confirm(t('skipConfirm', { date: fmtLong(iso) }))) return;
    if (!state.skipped.includes(iso)) state.skipped.push(iso);
    if (state.nextLessonDate === iso) state.nextLessonDate = '';
    commit();
    showToast(t('skippedToast', { date: fmtShort(iso) }), { label: t('undo'), onClick: () => unskipDate(iso) });
  }
  function unskipDate(iso) {
    state.skipped = state.skipped.filter((d) => d !== iso);
    commit();
  }
  function setNextLessonDate(iso) {
    if (!isValidISO(iso) || iso < todayISO()) return;
    state.nextLessonDate = iso;
    state.skipped = state.skipped.filter((d) => d !== iso);
    commit();
    showToast(t('nextMoved', { date: fmtDay(iso) }));
  }
  function resetAll() {
    if (!confirm(t('resetAllConfirm'))) return;
    const keepLang = state.settings.lang;
    state = normalize({});
    state.settings.lang = keepLang;
    commit();
  }

  function setTab(tab) {
    ui.tab = tab;
    saveUI();
    window.scrollTo(0, 0);
    render();
  }

  /* ---------- Event wiring ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    switch (el.dataset.action) {
      case 'tab': setTab(el.dataset.tab); break;
      case 'complete': completeLesson(); break;
      case 'undo': undoLast(); break;
      case 'remove': removeCompletion(el.dataset.id); break;
      case 'toast-action': { const fn = $('#toast')._action; hideToast(); if (fn) fn(); break; }
      case 'welcome-done': ui.welcomeDone = true; saveUI(); render(); break;
      case 'show-welcome': ui.welcomeDone = false; saveUI(); setTab('dashboard'); break;
      case 'switch-lang': state.settings.lang = lang === 'en' ? 'uz' : 'en'; commit(); break;
      case 'cal-prev': ui.calMonth--; if (ui.calMonth < 0) { ui.calMonth = 11; ui.calYear--; } render(); break;
      case 'cal-next': ui.calMonth++; if (ui.calMonth > 11) { ui.calMonth = 0; ui.calYear++; } render(); break;
      case 'cal-today': { const d = new Date(); ui.calYear = d.getFullYear(); ui.calMonth = d.getMonth(); ui.calSelected = todayISO(); render(); break; }
      case 'cal-select': ui.calSelected = ui.calSelected === el.dataset.date ? null : el.dataset.date; render(); break;
      case 'toggle-day': toggleDay(Number(el.dataset.day)); break;
      case 'set-seg': state.settings[el.dataset.key] = el.dataset.value; commit(); break;
      case 'export': exportBackup(); break;
      case 'import': $('#importFile').click(); break;
      case 'reset-progress': resetProgress(); break;
      case 'reset-all': resetAll(); break;
      case 'skip-date': skipDate(el.dataset.date); break;
      case 'unskip-date': unskipDate(el.dataset.date); break;
      default: break;
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.setting) {
      updateSetting(el.dataset.setting, el.type === 'checkbox' ? el.checked : el.value);
      return;
    }
    if (el.dataset.action === 'next-date') { setNextLessonDate(el.value); return; }
    if (el.dataset.action === 'edit-date') {
      const c = state.completions.find((x) => x.id === el.dataset.id);
      if (c && isValidISO(el.value)) { c.date = el.value; commit(); }
      return;
    }
    if (el.id === 'importFile' && el.files && el.files[0]) {
      importBackup(el.files[0]);
      el.value = '';
    }
  });

  // Keep "today"-based numbers fresh when the app is reopened or the day changes.
  let lastDay = todayISO();
  function refreshIfDayChanged() {
    const today = todayISO();
    if (today !== lastDay) { lastDay = today; render(); }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshIfDayChanged(); });
  setInterval(refreshIfDayChanged, 60 * 1000);

  // Offline support.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }

  render();
})();
