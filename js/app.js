/* ============================================================
   Study Course Tracker
   Plain JS, no dependencies. All data lives in localStorage.
   ------------------------------------------------------------
   Sections:
     1. Constants & defaults
     2. Date helpers
     3. State (load / save / normalize)
     4. Calculations (schedule, stats, streak)
     5. Rendering (dashboard, history, calendar, stats, settings)
     6. Actions & event wiring
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. Constants & defaults ---------- */
  const STORAGE_KEY = 'studyCourseTracker.v1';
  const UI_KEY = 'studyCourseTracker.ui';
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Monday-first week. `id` is JS Date.getDay() (0 = Sunday).
  const WEEKDAYS = [
    { id: 1, short: 'Mon', letter: 'M', long: 'Monday' },
    { id: 2, short: 'Tue', letter: 'T', long: 'Tuesday' },
    { id: 3, short: 'Wed', letter: 'W', long: 'Wednesday' },
    { id: 4, short: 'Thu', letter: 'T', long: 'Thursday' },
    { id: 5, short: 'Fri', letter: 'F', long: 'Friday' },
    { id: 6, short: 'Sat', letter: 'S', long: 'Saturday' },
    { id: 0, short: 'Sun', letter: 'S', long: 'Sunday' },
  ];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  const DEFAULT_SETTINGS = {
    courseName: 'Study Course',
    startDate: '2026-09-28',
    totalLessons: 66,
    lessonDuration: 2,        // hours per lesson
    studyDays: [1, 3, 5],     // Mon, Wed, Fri
    endDateMode: 'auto',      // 'auto' = computed from schedule, 'manual' = endDate below
    endDate: '',
    appearance: 'system',     // 'system' | 'light' | 'dark'
  };

  /* ---------- 2. Date helpers (all local-time, ISO "YYYY-MM-DD") ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
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
  const fmtLong = (iso) => { const d = parseISO(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtShort = (iso) => { const d = parseISO(iso); return `${pad(d.getDate())} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; };
  const fmtDay = (iso) => {
    const d = parseISO(iso);
    const wd = WEEKDAYS.find((w) => w.id === d.getDay()).short;
    return `${wd}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  };
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const fmtNum = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));
  const fmtPct = (p) => (Number.isInteger(p) ? `${p}%` : `${p.toFixed(1)}%`);

  /* ---------- 3. State ---------- */
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const clampInt = (v, min, max, fallback) => {
    const n = parseInt(v, 10);
    if (isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  };
  const clampNum = (v, min, max, fallback) => {
    const n = parseFloat(v);
    if (isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  };

  function normalize(obj) {
    const s = Object.assign({}, DEFAULT_SETTINGS, (obj && obj.settings) || {});
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

    const completions = (Array.isArray(obj && obj.completions) ? obj.completions : [])
      .filter((c) => c && isValidISO(c.date))
      .map((c) => ({ id: c.id || uid(), date: c.date, completedAt: c.completedAt || new Date().toISOString() }));

    return { settings: s, completions };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { /* corrupted storage: fall through to defaults */ }
    return normalize({});
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage full / private mode */ }
  }
  function loadUI() {
    try { return Object.assign({ tab: 'dashboard' }, JSON.parse(localStorage.getItem(UI_KEY) || '{}')); }
    catch (e) { return { tab: 'dashboard' }; }
  }
  function saveUI() {
    try { localStorage.setItem(UI_KEY, JSON.stringify({ tab: ui.tab })); } catch (e) { /* ignore */ }
  }

  let state = loadState();
  const ui = loadUI();
  const now = new Date();
  ui.calYear = now.getFullYear();
  ui.calMonth = now.getMonth();
  ui.calSelected = null;

  /* ---------- 4. Calculations ---------- */

  // The dates on which lesson #1 … #total are scheduled, given the study days.
  function scheduleDates(s) {
    const dates = [];
    if (!s.studyDays.length) return dates;
    let d = parseISO(s.startDate);
    let guard = 0;
    while (dates.length < s.totalLessons && guard < 20000) {
      if (s.studyDays.includes(d.getDay())) dates.push(toISO(d));
      d = addDays(d, 1);
      guard++;
    }
    return dates;
  }

  // Consecutive scheduled lesson days (up to today) that have a completion.
  // Today is not counted against you until it is over.
  function currentStreak(schedule, completions, today) {
    const done = new Set(completions.map((c) => c.date));
    const past = schedule.filter((d) => d <= today);
    let streak = 0;
    for (let i = past.length - 1; i >= 0; i--) {
      const d = past[i];
      if (done.has(d)) streak++;
      else if (d === today) continue;
      else break;
    }
    return streak;
  }

  function computeStats() {
    const s = state.settings;
    const today = todayISO();
    const schedule = scheduleDates(s);

    const total = s.totalLessons;
    const completed = Math.min(state.completions.length, total);
    const remaining = total - completed;
    const percent = total ? (completed / total) * 100 : 0;

    const totalHours = total * s.lessonDuration;
    const completedHours = completed * s.lessonDuration;
    const remainingHours = remaining * s.lessonDuration;

    const autoEndDate = schedule.length ? schedule[schedule.length - 1] : s.startDate;
    const endDate = s.endDateMode === 'manual' && s.endDate ? s.endDate : autoEndDate;

    const daysRemaining = Math.max(0, daysBetween(today, endDate));
    const weeksRemaining = Math.floor(daysRemaining / 7);
    const monthsRemaining = monthsBetween(today, endDate);

    // Lessons that should already be done. Today's lesson is not counted until the day is over.
    const expectedByToday = schedule.filter((d) => d < today).length;
    const nextLessonDate = remaining > 0 ? (schedule.find((d) => d >= today) || null) : null;
    const lastCompletion = state.completions.length ? state.completions[state.completions.length - 1] : null;

    return {
      today, schedule, total, completed, remaining, percent,
      totalHours, completedHours, remainingHours,
      autoEndDate, endDate, daysRemaining, weeksRemaining, monthsRemaining,
      expectedByToday, nextLessonDate, lastCompletion,
      streak: currentStreak(schedule, state.completions, today),
      isDone: remaining === 0,
      started: today >= s.startDate,
    };
  }

  /* ---------- 5. Rendering ---------- */
  const $ = (sel) => document.querySelector(sel);
  const esc = (str) => String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function applyAppearance() {
    const a = state.settings.appearance;
    if (a === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', a);
  }

  function render() {
    applyAppearance();
    const st = computeStats();
    const view = $('#view');
    const renderers = { dashboard: renderDashboard, history: renderHistory, calendar: renderCalendar, stats: renderStats, settings: renderSettings };
    view.innerHTML = (renderers[ui.tab] || renderDashboard)(st);
    view.classList.toggle('has-action', ui.tab === 'dashboard' && !st.isDone);
    renderActionBar(st);
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === ui.tab));
  }

  function progressBar(st) {
    return `<div class="progress ${st.isDone ? 'done' : ''}" role="progressbar" aria-valuenow="${st.completed}" aria-valuemax="${st.total}">
              <i style="width:${Math.min(100, st.percent).toFixed(2)}%"></i>
            </div>`;
  }

  function paceLabel(st) {
    if (st.isDone) return '<span class="pill green">Course completed</span>';
    if (!st.started) return `<span class="pill accent">Starts in ${plural(daysBetween(st.today, state.settings.startDate), 'day')}</span>`;
    const diff = st.completed - st.expectedByToday;
    if (diff === 0) return '<span class="pill green">On track</span>';
    if (diff > 0) return `<span class="pill accent">${plural(diff, 'lesson')} ahead</span>`;
    return `<span class="pill orange">${plural(-diff, 'lesson')} behind</span>`;
  }

  function renderDashboard(st) {
    const s = state.settings;
    const days = WEEKDAYS.filter((w) => s.studyDays.includes(w.id)).map((w) => w.short).join(', ');

    const heroOrCelebrate = st.isDone
      ? `<div class="card celebrate">
           <div class="emoji">🎉</div>
           <h2>Course Completed</h2>
           <p class="num">${st.total} / ${st.total} lessons</p>
           <p class="num">${fmtNum(st.completedHours)} / ${fmtNum(st.totalHours)} hours</p>
           <p>100% completed</p>
         </div>`
      : `<div class="card hero">
           <div class="hero-top">
             <div>
               <div class="card-label">Course progress</div>
               <div class="hero-value num">${st.completed}<small> / ${st.total}</small></div>
             </div>
             <div class="hero-pct num">${fmtPct(st.percent)}</div>
           </div>
           ${progressBar(st)}
           <div class="progress-row">
             <span><b class="num">${st.remaining}</b> lessons left</span>
             <span><b class="num">${fmtNum(st.remainingHours)}h</b> left</span>
           </div>
         </div>`;

    const timeRemaining = st.daysRemaining === 0
      ? `<div class="ends-remaining">Ended</div><div class="ends-detail">Course period is over</div>`
      : `<div class="ends-remaining num">${st.monthsRemaining >= 1 ? plural(st.monthsRemaining, 'month') : plural(st.weeksRemaining, 'week')}</div>
         <div class="ends-detail num">${plural(st.weeksRemaining, 'week')} · ${plural(st.daysRemaining, 'day')}</div>`;

    return `
      <h1 class="large-title">📚 ${esc(s.courseName)}</h1>
      <p class="subtitle">Started ${fmtShort(s.startDate)} · ${esc(days)}</p>

      ${heroOrCelebrate}

      <div class="grid-2">
        <div class="card"><div class="tile-value num">${st.total}</div><div class="tile-label">Total lessons</div></div>
        <div class="card"><div class="tile-value num accent">${st.remaining}</div><div class="tile-label">Lessons remaining</div></div>
        <div class="card"><div class="tile-value num green">${st.completed}</div><div class="tile-label">Lessons completed</div></div>
        <div class="card"><div class="tile-value num">${fmtNum(st.remainingHours)}<small>hours</small></div><div class="tile-label">Hours remaining</div></div>
      </div>

      <div class="card ends-card">
        <div class="left">
          <div class="card-label">Course ends</div>
          <div class="ends-date">${fmtLong(st.endDate)}</div>
        </div>
        <div class="right">
          <div class="card-label">Time remaining</div>
          ${timeRemaining}
        </div>
      </div>

      <div class="card next-row">
        <div>
          <div class="lbl">${st.isDone ? 'Finished' : 'Next lesson'}</div>
          <div class="val">${st.isDone ? 'All lessons done' : (st.nextLessonDate ? `${fmtDay(st.nextLessonDate)} · Lesson #${st.completed + 1}` : 'No scheduled days left')}</div>
        </div>
        ${paceLabel(st)}
      </div>

      ${st.lastCompletion ? `<p class="footnote">Last completed: Lesson #${state.completions.length} · ${fmtShort(st.lastCompletion.date)}</p>` : ''}
    `;
  }

  function renderActionBar(st) {
    const bar = $('#actionBar');
    if (ui.tab !== 'dashboard' || st.isDone) { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    bar.innerHTML = `<div class="inner"><button class="btn btn-primary" data-action="complete">✓&nbsp; Complete Lesson</button></div>`;
  }

  function renderHistory(st) {
    const items = state.completions.map((c, i) => ({ ...c, n: i + 1 })).reverse();
    const list = items.length
      ? `<div class="group">${items.map((c) => `
          <div class="row hist-row" data-id="${c.id}">
            <div class="row-label">
              <div class="lesson">Lesson #${c.n}</div>
              <input class="date-input" type="date" value="${c.date}" data-action="edit-date" data-id="${c.id}" aria-label="Completion date">
            </div>
            <span class="badge">Completed</span>
            <button class="icon-btn danger" data-action="remove" data-id="${c.id}" aria-label="Remove completion">
              <svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
            </button>
          </div>`).join('')}</div>`
      : `<div class="card empty"><div class="big">📖</div>No lessons completed yet.<br>Tap <b>Complete Lesson</b> on the Home tab after each lesson.</div>`;

    return `
      <h1 class="large-title">History</h1>
      <p class="subtitle num">${plural(st.completed, 'lesson')} completed · ${fmtNum(st.completedHours)} hours</p>
      ${items.length ? `<button class="btn btn-secondary" data-action="undo" style="margin-bottom:12px">↩︎&nbsp; Undo last completion</button>` : ''}
      ${list}
      ${items.length ? `<p class="footnote">Tap a date to change it. Use the trash icon to remove a completion made by mistake.</p>` : ''}
    `;
  }

  function renderCalendar(st) {
    const y = ui.calYear, m = ui.calMonth;
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Monday-first offset
    const scheduleIndex = new Map(st.schedule.map((d, i) => [d, i + 1]));
    const completedDates = new Set(state.completions.map((c) => c.date));

    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<div class="cal-cell"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(new Date(y, m, d));
      const cls = ['cal-day'];
      if (iso === st.today) cls.push('today');
      if (completedDates.has(iso)) cls.push('completed');
      else if (scheduleIndex.has(iso)) cls.push(iso < st.today ? 'missed' : 'upcoming');
      if (ui.calSelected === iso) cls.push('selected');
      cells += `<div class="cal-cell"><button class="${cls.join(' ')}" data-action="cal-select" data-date="${iso}">${d}</button></div>`;
    }

    let detail = '';
    if (ui.calSelected) {
      const iso = ui.calSelected;
      const doneHere = state.completions.map((c, i) => ({ ...c, n: i + 1 })).filter((c) => c.date === iso);
      const n = scheduleIndex.get(iso);
      let status;
      if (doneHere.length) status = `✓ Completed — ${doneHere.map((c) => `Lesson #${c.n}`).join(', ')}`;
      else if (n) status = iso < st.today ? `Scheduled lesson #${n} — not completed` : `○ Upcoming — Lesson #${n}`;
      else status = 'No lesson scheduled';
      detail = `<div class="card cal-detail"><div class="d">${fmtLong(iso)}</div><div class="s">${status}</div></div>`;
    }

    return `
      <h1 class="large-title">Calendar</h1>
      <p class="subtitle">Lesson days are marked. Tap a day for details.</p>
      <div class="card">
        <div class="cal-head">
          <h2>${MONTHS[m]} ${y}</h2>
          <div class="cal-nav">
            <button class="today-btn" data-action="cal-today">Today</button>
            <button class="icon-btn" data-action="cal-prev" aria-label="Previous month"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
            <button class="icon-btn" data-action="cal-next" aria-label="Next month"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
          </div>
        </div>
        <div class="cal-grid">
          ${WEEKDAYS.map((w) => `<div class="cal-dow">${w.short}</div>`).join('')}
          ${cells}
        </div>
        <div class="legend">
          <span><i class="c"></i>Completed</span>
          <span><i class="u"></i>Upcoming</span>
          <span><i class="m"></i>Missed</span>
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
    const diff = st.completed - st.expectedByToday;
    const paceText = st.isDone ? 'Completed' : diff === 0 ? 'On track' : diff > 0 ? `${plural(diff, 'lesson')} ahead` : `${plural(-diff, 'lesson')} behind`;

    return `
      <h1 class="large-title">Statistics</h1>
      <p class="subtitle">${esc(state.settings.courseName)}</p>

      <div class="card stat-hero">
        <div class="card-label">Progress</div>
        <div class="big num">${st.completed}<small> / ${st.total}</small></div>
        ${progressBar(st)}
        <div class="progress-row">
          <span><b class="num">${fmtPct(st.percent)}</b> completed</span>
          ${paceLabel(st)}
        </div>
      </div>

      <div class="section-title">Lessons</div>
      <div class="group">
        ${row('Total lessons', st.total)}
        ${row('Completed lessons', st.completed)}
        ${row('Remaining lessons', st.remaining)}
        ${row('Completion percentage', fmtPct(st.percent))}
        ${row('Expected by today', st.expectedByToday, paceText)}
      </div>

      <div class="section-title">Hours</div>
      <div class="group">
        ${row('Total hours', `${fmtNum(st.totalHours)} h`)}
        ${row('Completed hours', `${fmtNum(st.completedHours)} h`)}
        ${row('Remaining hours', `${fmtNum(st.remainingHours)} h`)}
      </div>

      <div class="section-title">Time</div>
      <div class="group">
        ${row('Current streak', plural(st.streak, 'lesson'), 'Scheduled lesson days completed in a row')}
        ${row('Course days remaining', plural(st.daysRemaining, 'day'))}
        ${row('Weeks remaining', plural(st.weeksRemaining, 'week'))}
        ${row('Course ends', fmtShort(st.endDate))}
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
      <h1 class="large-title">Settings</h1>
      <p class="subtitle">Changes are saved automatically.</p>

      <div class="section-title">Course</div>
      <div class="group">
        <div class="row"><div class="row-label">Course name</div>
          <input type="text" value="${esc(s.courseName)}" data-setting="courseName" maxlength="40" autocomplete="off"></div>
        <div class="row"><div class="row-label">Start date</div>
          <input type="date" value="${s.startDate}" data-setting="startDate"></div>
        <div class="row"><div class="row-label">Total lessons<span class="hint">Cannot be less than completed (${state.completions.length})</span></div>
          <input type="number" inputmode="numeric" min="1" max="9999" value="${s.totalLessons}" data-setting="totalLessons"></div>
        <div class="row"><div class="row-label">Lesson duration<span class="hint">Hours per lesson</span></div>
          <input type="number" inputmode="decimal" min="0.25" max="24" step="0.25" value="${s.lessonDuration}" data-setting="lessonDuration"></div>
      </div>

      <div class="section-title">Weekly schedule</div>
      <div class="group">
        <div class="row"><div class="row-label">Study days<span class="hint">Tap to select the days you have lessons</span></div></div>
        <div class="days">
          ${WEEKDAYS.map((w) => `<button class="day-chip ${s.studyDays.includes(w.id) ? 'on' : ''}" data-action="toggle-day" data-day="${w.id}" aria-label="${w.long}" aria-pressed="${s.studyDays.includes(w.id)}">${w.letter}</button>`).join('')}
        </div>
        <div class="row"><div class="row-label">Lessons per week</div><div class="row-value strong num">${s.studyDays.length}</div></div>
      </div>
      <p class="footnote">${WEEKDAYS.filter((w) => s.studyDays.includes(w.id)).map((w) => w.long).join(', ')}</p>

      <div class="section-title">Course end date</div>
      <div class="group">
        <div class="row">
          <div class="row-label">Calculate automatically<span class="hint">From start date, study days and total lessons</span></div>
          <label class="switch"><input type="checkbox" data-setting="endDateAuto" ${s.endDateMode === 'auto' ? 'checked' : ''}><i></i></label>
        </div>
        ${s.endDateMode === 'auto'
          ? `<div class="row"><div class="row-label">Course end date</div><div class="row-value strong">${fmtShort(st.autoEndDate)}</div></div>`
          : `<div class="row"><div class="row-label">Course end date</div><input type="date" value="${s.endDate || st.autoEndDate}" data-setting="endDate"></div>`}
      </div>

      <div class="section-title">Appearance</div>
      <div class="group"><div class="row">${seg('appearance', [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']])}</div></div>

      <div class="section-title">Data</div>
      <div class="group">
        <button class="row-btn" data-action="export">Export backup (JSON)</button>
        <button class="row-btn" data-action="import">Import backup</button>
        <button class="row-btn danger" data-action="reset-progress">Reset progress</button>
        <button class="row-btn danger" data-action="reset-all">Reset everything</button>
      </div>
      <p class="footnote">Data is stored only on this device. Export a backup before deleting the app or clearing Safari data.</p>

      <div class="section-title">About</div>
      <div class="group">
        <div class="row"><div class="row-label">Version</div><div class="row-value">1.0</div></div>
        <div class="row"><div class="row-label">Install<span class="hint">Safari → Share → Add to Home Screen</span></div></div>
      </div>
    `;
  }

  /* ---------- 6. Actions ---------- */
  let toastTimer = null;
  function showToast(text, action) {
    const t = $('#toast');
    t.innerHTML = `<span>${esc(text)}</span>${action ? `<button data-action="toast-action">${esc(action.label)}</button>` : ''}`;
    t.hidden = false;
    t.classList.toggle('low', $('#actionBar').hidden);
    t._action = action ? action.onClick : null;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 4000);
  }
  function hideToast() { const t = $('#toast'); t.hidden = true; t._action = null; }

  function commit() { saveState(); render(); }

  function completeLesson() {
    const st = computeStats();
    if (st.isDone) return;
    state.completions.push({ id: uid(), date: todayISO(), completedAt: new Date().toISOString() });
    commit();
    const n = state.completions.length;
    const after = computeStats();
    showToast(after.isDone ? `🎉 Lesson #${n} — course completed!` : `Lesson #${n} completed · ${after.remaining} left`, { label: 'Undo', onClick: undoLast });
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
    if (!confirm(`Remove Lesson #${idx + 1} from history?`)) return;
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
      if (days.length === 1) { showToast('Keep at least one study day'); return; }
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
        if (!confirm('Replace current data with this backup?')) return;
        state = normalize(parsed);
        commit();
        showToast('Backup imported');
      } catch (e) {
        showToast('Could not read this backup file');
      }
    };
    reader.readAsText(file);
  }

  function resetProgress() {
    if (!confirm('Delete all completed lessons? Settings will be kept.')) return;
    state.completions = [];
    commit();
  }
  function resetAll() {
    if (!confirm('Reset everything to defaults? This cannot be undone.')) return;
    state = normalize({});
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
    const a = el.dataset.action;
    switch (a) {
      case 'tab': setTab(el.dataset.tab); break;
      case 'complete': completeLesson(); break;
      case 'undo': undoLast(); break;
      case 'remove': removeCompletion(el.dataset.id); break;
      case 'toast-action': { const fn = $('#toast')._action; hideToast(); if (fn) fn(); break; }
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
      default: break;
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.setting) {
      updateSetting(el.dataset.setting, el.type === 'checkbox' ? el.checked : el.value);
      return;
    }
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
    const t = todayISO();
    if (t !== lastDay) { lastDay = t; render(); }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshIfDayChanged(); });
  setInterval(refreshIfDayChanged, 60 * 1000);

  // Offline support.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }

  render();
})();
