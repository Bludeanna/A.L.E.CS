/* =============================================
   ALECS — script.js
   Analyzing Laws, Energy & Computational Simulations
   ============================================= */

/* ── CONSTANTS ── */
// XP cumulative thresholds per level (index = level number)
const LEVEL_THRESHOLDS = [0, 0, 150, 320, 500, 720];
const MAX_LEVEL = 5;

// Deep-link each game to its lesson's Phase 3
// Each lesson page checks localStorage for 'alecs_goto_phase' on load and auto-navigates
const GAME_LINKS = {
  1: 'lesson1.html?phase=3',
  2: 'lesson2.html?phase=3',
  3: 'lesson3.html?phase=3',
  4: 'lesson4.html?phase=3',
};

const ALL_ACHIEVEMENTS = [
  { id:'lvl2',    icon:'⚡', name:'Rising Star',      desc:'Reached Level 2',           type:'level',  req: u => getLevel(u) >= 2 },
  { id:'lvl3',    icon:'🔥', name:'On Fire',           desc:'Reached Level 3',           type:'level',  req: u => getLevel(u) >= 3 },
  { id:'lvl4',    icon:'💎', name:'Knowledge Seeker',  desc:'Reached Level 4',           type:'level',  req: u => getLevel(u) >= 4 },
  { id:'lvl5',    icon:'🏆', name:'Physics Master',    desc:'Reached MAX Level 5',       type:'level',  req: u => getLevel(u) >= 5 },
  { id:'l1done',  icon:'🚀', name:'Projectile Pro',    desc:'Completed Lesson 1 (100%)', type:'lesson', req: u => u.lessons[1].pct >= 100 },
  { id:'l2done',  icon:'💥', name:'Momentum Master',   desc:'Completed Lesson 2 (100%)', type:'lesson', req: u => u.lessons[2].pct >= 100 },
  { id:'l3done',  icon:'⚡', name:'Electricity Expert',desc:'Completed Lesson 3 (100%)', type:'lesson', req: u => u.lessons[3].pct >= 100 },
  { id:'l4done',  icon:'🌿', name:'Eco Champion',      desc:'Completed Lesson 4 (100%)', type:'lesson', req: u => u.lessons[4].pct >= 100 },
  { id:'alldone', icon:'🌟', name:'ALECS Graduate',    desc:'Completed all 4 lessons',   type:'lesson', req: u => [1,2,3,4].every(n => u.lessons[n].pct >= 100) },
  { id:'str3',    icon:'🔥', name:'3-Day Streak',      desc:'3 consecutive login days',  type:'streak', req: u => u.streak >= 3 },
  { id:'str7',    icon:'🗓️', name:'Week Warrior',      desc:'7-day login streak',        type:'streak', req: u => u.streak >= 7 },
];

/* ── STORAGE ── */
function getDefaultUser() {
  return {
    name: 'N/A', avatar: 0, xp: 0, level: 1, streak: 0,
    lastLoginDate: null, unlockedAchievements: [],
    lessons: {
      1: { pct: 0, unlocked: true  },
      2: { pct: 0, unlocked: false },
      3: { pct: 0, unlocked: false },
      4: { pct: 0, unlocked: false },
    },
  };
}

function loadUser() {
  try {
    const u = JSON.parse(localStorage.getItem('alecs_user') || 'null');
    if (!u) return getDefaultUser();
    if (u.avatar === undefined) u.avatar = 0;
    if (!u.unlockedAchievements) u.unlockedAchievements = [];
    return u;
  } catch { return getDefaultUser(); }
}
function saveUser(u) { localStorage.setItem('alecs_user', JSON.stringify(u)); }

/* ── STREAK ── */
function todayStr() { return new Date().toISOString().slice(0,10); }
function updateStreak(u) {
  const today = todayStr();
  if (!u.lastLoginDate) { u.streak = 1; u.lastLoginDate = today; return u; }
  const diff = Math.round((new Date(today) - new Date(u.lastLoginDate)) / 86400000);
  if (diff === 0) return u;
  u.streak = diff === 1 ? u.streak + 1 : 1;
  u.lastLoginDate = today;
  return u;
}

/* ── XP & LEVEL ── */
function getLevel(u) {
  for (let i = MAX_LEVEL; i >= 1; i--) { if (u.xp >= LEVEL_THRESHOLDS[i]) return i; }
  return 1;
}
function xpInLevel(u) { const l = getLevel(u); return u.xp - LEVEL_THRESHOLDS[l]; }
function xpForNext(u)  { const l = getLevel(u); return l >= MAX_LEVEL ? 0 : LEVEL_THRESHOLDS[l+1] - LEVEL_THRESHOLDS[l]; }
function xpPct(u)      { return getLevel(u) >= MAX_LEVEL ? 100 : Math.min((xpInLevel(u) / xpForNext(u)) * 100, 100); }

function addXP(u, amount) {
  const prev = getLevel(u);
  u.xp = Math.max(0, u.xp + amount);
  u.level = getLevel(u);
  if (u.level > prev) showLevelUp(u.level);
  return u;
}

/* ── PROGRESS ── */
function overallPct(u) { return Math.round(([1,2,3,4].reduce((s,n) => s + u.lessons[n].pct, 0)) / 4); }
function doneLessons(u) { return [1,2,3,4].filter(n => u.lessons[n].pct >= 100).length; }
function setLessonPct(u, n, pct) {
  u.lessons[n].pct = Math.min(Math.max(pct, 0), 100);
  if (pct >= 100 && u.lessons[n+1]) u.lessons[n+1].unlocked = true;
  return u;
}

/* ── TOAST ── */
function showToast(msg, duration = 3000) {
  let t = document.getElementById('alecs-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'alecs-toast';
    t.style.cssText = `position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(60px);
      background:#1a3150;border:1px solid rgba(249,115,22,.5);color:#f0f6ff;padding:11px 22px;
      border-radius:99px;font-family:'Nunito',sans-serif;font-weight:700;font-size:13px;
      z-index:10001;transition:transform .25s,opacity .25s;opacity:0;pointer-events:none;white-space:nowrap`;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => { t.style.transform = 'translateX(-50%) translateY(0)'; t.style.opacity = '1'; });
  clearTimeout(t._tid);
  t._tid = setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(60px)'; t.style.opacity = '0'; }, duration);
}

/* ── LEVEL-UP POPUP ── */
function showLevelUp(lvl) {
  const p = document.getElementById('levelup-popup');
  if (!p) return;
  document.getElementById('levelup-text').textContent = `⚡ Level ${lvl}!`;
  document.getElementById('levelup-sub').textContent = lvl >= MAX_LEVEL
    ? '🏆 Maximum level reached — Physics Master!'
    : `Keep earning XP to reach Level ${lvl + 1}!`;
  p.style.display = 'block';
  requestAnimationFrame(() => p.classList.add('show'));
  setTimeout(() => { p.classList.remove('show'); setTimeout(() => { p.style.display = 'none'; }, 300); }, 3000);
}

/* ── ACHIEVEMENTS ── */
function checkAchievements(u) {
  ALL_ACHIEVEMENTS.forEach(a => {
    if (!u.unlockedAchievements.includes(a.id) && a.req(u)) {
      u.unlockedAchievements.push(a.id);
      setTimeout(() => showToast(`${a.icon} Achievement: ${a.name}!`, 4000), 600);
    }
  });
  return u;
}

function openAchievementsModal() {
  const u = loadUser();
  const grid = document.getElementById('achievements-grid');
  const modal = document.getElementById('achievements-modal');
  if (!grid || !modal) return;
  const unlocked = new Set(u.unlockedAchievements);
  const groups = { level:'⚡ Level', lesson:'📚 Lesson', streak:'🔥 Streak' };
  let html = '';
  Object.entries(groups).forEach(([type, label]) => {
    const items = ALL_ACHIEVEMENTS.filter(a => a.type === type);
    html += `<div style="font-size:.7rem;font-weight:800;letter-spacing:1px;color:var(--text-muted);margin:12px 0 7px;text-transform:uppercase">${label} Achievements</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">`;
    items.forEach(a => {
      const done = unlocked.has(a.id);
      html += `<div style="display:flex;align-items:center;gap:9px;padding:9px 11px;background:${done?'rgba(249,115,22,.1)':'rgba(255,255,255,.04)'};border:1px solid ${done?'rgba(249,115,22,.3)':'rgba(255,255,255,.06)'};border-radius:10px;${done?'':'opacity:.4'}">
        <span style="font-size:1.3rem">${done?a.icon:'🔒'}</span>
        <div><strong style="display:block;font-size:.78rem;color:${done?'var(--text-primary)':'var(--text-muted)'}">${a.name}</strong>
        <small style="font-size:.7rem;color:var(--text-muted)">${a.desc}</small></div></div>`;
    });
    html += `</div>`;
  });
  grid.innerHTML = html;
  modal.style.display = 'flex';
}
function closeAchievementsModal() { document.getElementById('achievements-modal').style.display = 'none'; }
window.openAchievementsModal = openAchievementsModal;
window.closeAchievementsModal = closeAchievementsModal;

/* ── PROFILE ── */
let _selectedAvatar = 0;

function openProfileModal() {
  const u = loadUser();
  _selectedAvatar = u.avatar || 0;
  document.getElementById('prof-name-input').value = u.name === 'N/A' ? '' : u.name;
  document.getElementById('prof-level-preview').textContent = getLevel(u);
  buildAvatarGrid(_selectedAvatar);
  updateProfilePreview();
  document.getElementById('profile-modal').style.display = 'flex';
}
function closeProfileModal() { document.getElementById('profile-modal').style.display = 'none'; }
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;

function buildAvatarGrid(selected) {
  const grid = document.getElementById('avatar-picker-grid');
  if (!grid) return;
  grid.innerHTML = '';
  // Option 0: initials
  const init = document.createElement('button');
  init.className = 'av-btn' + (selected === 0 ? ' av-selected' : '');
  init.textContent = 'AB'; init.title = 'Use initials';
  init.onclick = () => { _selectedAvatar = 0; buildAvatarGrid(0); updateProfilePreview(); };
  grid.appendChild(init);
  for (let i = 1; i <= 100; i++) {
    const b = document.createElement('button');
    b.className = 'av-btn' + (selected === i ? ' av-selected' : '');
    b.textContent = i; b.title = `Avatar ${i}`;
    b.onclick = () => { _selectedAvatar = i; buildAvatarGrid(i); updateProfilePreview(); };
    grid.appendChild(b);
  }
}

function updateProfilePreview() {
  const name = (document.getElementById('prof-name-input').value.trim()) || 'Your Name';
  document.getElementById('prof-name-preview').textContent = name;
  const el = document.getElementById('prof-avatar-preview');
  if (!el) return;
  if (_selectedAvatar === 0) {
    el.textContent = name.slice(0,2).toUpperCase();
    el.style.cssText = `background:var(--orange);font-size:20px`;
  } else {
    el.textContent = _selectedAvatar;
    el.style.cssText = `background:hsl(${(_selectedAvatar * 37) % 360},50%,32%);font-size:18px`;
  }
}
window.updateProfilePreview = updateProfilePreview;

function saveProfile() {
  let u = loadUser();
  const name = document.getElementById('prof-name-input').value.trim();
  u.name = name || 'N/A';
  u.avatar = _selectedAvatar;
  saveUser(u);
  closeProfileModal();
  renderDashboard(u);
  showToast('✅ Profile saved!');
}
window.saveProfile = saveProfile;

/* ── AVATAR APPLY ── */
function applyAvatar(el, u) {
  if (!el) return;
  if (u.avatar && u.avatar > 0) {
    el.textContent = u.avatar;
    el.style.fontSize = '13px';
    el.style.fontWeight = '900';
    el.style.background = `hsl(${(u.avatar * 37) % 360},50%,32%)`;
    el.style.color = 'white';
  } else {
    el.textContent = (u.name || '?').slice(0,2).toUpperCase();
    el.style.fontSize = '12px';
    el.style.background = 'var(--orange)';
    el.style.color = 'white';
  }
}

/* ── PROGRESS RING ── */
function renderRing(pct) {
  const fg = document.querySelector('.ring-fg');
  if (fg) fg.style.strokeDashoffset = 239 - (pct / 100) * 239;
}

/* ── VIEW SWITCHING ── */
function showView(viewId) {
  document.querySelectorAll('.main-view').forEach(v => v.classList.remove('active'));
  const t = document.getElementById('view-' + viewId);
  if (t) t.classList.add('active');
  if (viewId === 'lessons') syncLessonView();
  if (viewId === 'games')   syncGamesView();
  if (viewId === 'progress') renderProgressDetail();
}
window.showView = showView;

function setActiveNav(el) {
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
}
window.setActiveNav = setActiveNav;

function setActiveMenu(el) {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}
window.setActiveMenu = setActiveMenu;

/* ── GAME LAUNCH (deep-link to Phase 3) ── */
function launchGame(n) {
  const u = loadUser();
  if (!u.lessons[n].unlocked) { showToast('🔒 Complete the previous lesson first!'); return; }
  // Store intent so the lesson page can auto-scroll to the game phase
  localStorage.setItem('alecs_goto_phase', '3');
  window.location.href = GAME_LINKS[n];
}
window.launchGame = launchGame;

/* ── LESSON SUMMARY VIEW ── */
function syncLessonView() {
  const u = loadUser();
  [1,2,3,4].forEach(n => {
    const pct = u.lessons[n].pct;
    const unlocked = u.lessons[n].unlocked;
    const pctEl  = document.getElementById('lsc-pct-'  + n);
    const fillEl = document.getElementById('lsc-fill-' + n);
    const tagEl  = document.getElementById('lsc-tag-'  + n);
    const card   = document.getElementById('lscard-'   + n);
    if (pctEl)  pctEl.textContent = pct + '%';
    if (fillEl) fillEl.style.width = pct + '%';
    if (n > 1 && card && unlocked) {
      card.classList.remove('locked-summary');
      card.onclick = () => window.location.href = 'lesson' + n + '.html';
      if (tagEl) { tagEl.className = 'lsc-tag'; tagEl.textContent = `LESSON 0${n} · ${pct >= 100 ? 'Complete ✓' : 'In Progress'}`; }
      card.querySelectorAll('.lsc-title-muted,.lsc-desc-muted,.lsc-pct-muted').forEach(e => {
        e.classList.remove('lsc-title-muted','lsc-desc-muted','lsc-pct-muted');
      });
      card.querySelectorAll('.muted-tag').forEach(e => e.classList.remove('muted-tag'));
    }
  });
}

/* ── GAMES VIEW ── */
function syncGamesView() {
  const u = loadUser();
  [2,3,4].forEach(n => {
    if (!u.lessons[n].unlocked) return;
    const card = document.getElementById('gcrd-' + n);
    if (!card) return;
    card.classList.remove('gc-locked');
    const badge = card.querySelector('.gc-badge');
    const title = card.querySelector('.gc-title');
    const emoji = card.querySelector('.gc-emoji');
    const tag   = card.querySelector('.gc-lesson-tag');
    const btn   = card.querySelector('.gc-play-btn');
    if (badge) { badge.textContent = '✅ Playable'; badge.className = 'gc-badge gc-unlocked'; }
    if (title) title.style.color = '';
    if (emoji) emoji.style.opacity = '1';
    if (tag)   tag.style.opacity = '1';
    if (btn) {
      btn.className = 'gc-play-btn';
      btn.disabled = false;
      btn.textContent = '▶ Play';
      btn.onclick = () => launchGame(n);
    }
  });
}

/* ── PROGRESS DETAIL ── */
function renderProgressDetail() {
  const u = loadUser();
  const wrap = document.getElementById('progress-detail-wrap');
  if (!wrap) return;
  const LESSONS = {
    1:{icon:'🚀',title:'Projectile Motion',    phases:['Knowledge Check','Concepts','Basketball Game','Analysis','Final Quiz','Results']},
    2:{icon:'💥',title:'Momentum & Collisions', phases:['Knowledge Check','Concepts','Collision Lab','Analysis','Final Quiz','Results']},
    3:{icon:'⚡',title:'Electricity Generation',phases:['Knowledge Check','Concepts','Generator Sim','Analysis','Final Quiz','Results']},
    4:{icon:'🌿',title:'Energy Sources',         phases:['Knowledge Check','Sort & Match','Energy Simulator','Community App','Analysis','Final Quiz','Results']},
  };
  const ov = overallPct(u);
  let html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:14px">
    <div style="background:var(--navy-card);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center">
      <div style="font-size:1.9rem;font-family:'Syne',sans-serif;font-weight:800;color:var(--orange)">${ov}%</div>
      <div style="font-size:.74rem;color:var(--text-secondary);margin-top:3px">Overall Completion</div>
    </div>
    <div style="background:var(--navy-card);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center">
      <div style="font-size:1.9rem;font-family:'Syne',sans-serif;font-weight:800;color:var(--yellow)">Lvl ${getLevel(u)}</div>
      <div style="font-size:.74rem;color:var(--text-secondary);margin-top:3px">Current Level (Max ${MAX_LEVEL})</div>
    </div>
  </div>`;
  [1,2,3,4].forEach(n => {
    const info = LESSONS[n];
    const pct = u.lessons[n].pct;
    const unlocked = u.lessons[n].unlocked;
    const statusColor = pct >= 100 ? 'var(--green)' : unlocked ? 'var(--orange)' : 'var(--text-muted)';
    const statusLabel = pct >= 100 ? '✓ Complete' : unlocked ? `${pct}% In Progress` : '🔒 Locked';
    html += `<div style="background:var(--navy-card);border:1px solid var(--border);border-radius:12px;padding:16px;${!unlocked?'opacity:.45':''}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:11px">
        <span style="font-size:1.3rem">${info.icon}</span>
        <div style="flex:1">
          <strong style="font-family:'Syne',sans-serif;font-size:.9rem">Lesson ${n}: ${info.title}</strong>
          <div style="font-size:.75rem;color:${statusColor};font-weight:700">${statusLabel}</div>
        </div>
      </div>
      <div style="height:5px;background:var(--navy-mid);border-radius:99px;overflow:hidden;margin-bottom:11px">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--orange),var(--yellow));border-radius:99px;transition:.5s"></div>
      </div>
      <div style="font-size:.68rem;font-weight:800;color:var(--text-muted);letter-spacing:1px;margin-bottom:7px">PHASES</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">`;
    info.phases.forEach((ph, i) => {
      const done = pct >= 100 || (pct > 0 && i === 0);
      html += `<span style="padding:3px 9px;border-radius:99px;font-size:.68rem;font-weight:700;background:${done?'rgba(34,197,94,.1)':'rgba(255,255,255,.04)'};color:${done?'var(--green)':'var(--text-muted)'};border:1px solid ${done?'rgba(34,197,94,.3)':'rgba(255,255,255,.06)'}">${done?'✓ ':''}${ph}</span>`;
    });
    html += `</div></div>`;
  });
  wrap.innerHTML = html;
}

/* ── LESSON CARDS ── */
function updateLessonCard(u, n) {
  const card = document.getElementById('card-lesson-' + n);
  if (!card) return;
  const pct = u.lessons[n].pct;
  const unlocked = u.lessons[n].unlocked;
  const fill = document.getElementById('fill-l' + n);
  const pctEl = document.getElementById('pct-l' + n);
  const sbStatus = document.getElementById('sidebar-l' + n + '-status');
  const pbVal = document.getElementById('pb-val-l' + n);
  if (fill) fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
  if (sbStatus) sbStatus.textContent = pct >= 100 ? 'Complete ✓' : unlocked ? pct + '%' : 'Locked 🔒';
  if (pbVal) pbVal.textContent = pct >= 100 ? '✓' : unlocked ? pct + '%' : '🔒';
  if (unlocked) {
    card.className = 'lesson-card' + (pct >= 100 ? ' done' : '');
    card.onclick = () => window.location.href = 'lesson' + n + '.html';
    card.querySelectorAll('.muted').forEach(e => e.classList.remove('muted'));
    const badge = card.querySelector('.status-badge');
    if (badge) {
      badge.className = 'status-badge';
      badge.textContent = pct >= 100 ? '✓ Done' : '▶ Active';
      badge.style.background = pct >= 100 ? 'rgba(34,197,94,.2)' : 'rgba(249,115,22,.2)';
      badge.style.color = pct >= 100 ? 'var(--green)' : 'var(--orange)';
    }
    const sb = document.getElementById('sidebar-l' + n);
    if (sb) {
      sb.classList.remove('locked');
      sb.onclick = () => window.location.href = 'lesson' + n + '.html';
      const pill = sb.querySelector('.lesson-pill');
      if (pill) pill.classList.add('l' + n + '-pill');
    }
  }
}

/* ── MAIN RENDER ── */
function renderDashboard(u) {
  // Avatar
  applyAvatar(document.getElementById('user-initials'), u);
  // Name
  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.textContent = u.name;
  // XP bar
  const lvl = getLevel(u);
  const el = id => document.getElementById(id);
  if (el('level-num'))   el('level-num').textContent   = lvl;
  if (el('xp-fill'))     el('xp-fill').style.width     = xpPct(u) + '%';
  if (el('xp-current'))  el('xp-current').textContent  = xpInLevel(u);
  if (el('xp-max'))      el('xp-max').textContent      = lvl >= MAX_LEVEL ? 'MAX' : xpForNext(u);
  if (el('streak-count')) el('streak-count').textContent = u.streak;
  // Newton
  if (el('newton-username')) el('newton-username').textContent = u.name;
  if (el('newton-streak'))   el('newton-streak').textContent   = u.streak;
  if (el('newton-message'))  el('newton-message').textContent  = getNewtonMsg(u);
  // Lesson cards
  [1,2,3,4].forEach(n => updateLessonCard(u, n));
  // Ring
  const ov = overallPct(u);
  renderRing(ov);
  if (el('ring-pct-text')) el('ring-pct-text').textContent = ov + '%';
  if (el('ring-sub')) el('ring-sub').textContent = `${doneLessons(u)} of 4 lessons complete`;
}

function getNewtonMsg(u) {
  if ([1,2,3,4].every(n => u.lessons[n].pct >= 100)) return 'You completed all lessons! Physics master 🌟';
  if (u.streak >= 7) return "A whole week of learning! You're unstoppable 🔥";
  if (u.streak >= 3) return `${u.streak}-day streak! Keep the momentum going 💪`;
  const active = [1,2,3,4].find(n => u.lessons[n].pct < 100 && u.lessons[n].unlocked) || 1;
  const hints = {1:'Lesson 1 is ready — launch something! 🚀',2:'Momentum awaits in Lesson 2 💥',3:'Lesson 3: Electricity Generation ⚡',4:'Final lesson — finish strong! 🌿'};
  return hints[active];
}

/* ── SETTINGS / RESET ── */
function openSettingsModal() { document.getElementById('reset-modal').style.display = 'flex'; }
function resetAllProgress() {
  ['alecs_user','alecs_goto_phase'].forEach(k => localStorage.removeItem(k));
  document.getElementById('reset-modal').style.display = 'none';
  showToast('✅ All progress reset!');
  setTimeout(() => location.reload(), 1100);
}
window.openSettingsModal = openSettingsModal;
window.resetAllProgress  = resetAllProgress;

/* ── PUBLIC API (lesson pages call these) ── */
window.ALECS = {
  loadUser, saveUser, addXP, showToast, getLevel, checkAchievements,
  setLessonPct,
  updateLessonProgress(n, pct) {
    let u = loadUser();
    setLessonPct(u, n, pct);
    u = checkAchievements(u);
    saveUser(u);
    updateLessonCard(u, n);
    renderRing(overallPct(u));
  },
  markGamePlayed() {
    let u = loadUser();
    u = addXP(u, 30);
    u = checkAchievements(u);
    saveUser(u);
    showToast('🎮 +30 XP for playing!');
  },
  markQuizPassed(n, score, total) {
    let u = loadUser();
    const pct = Math.round((score / total) * 100);
    u = addXP(u, Math.round(pct * 0.5));
    if (pct >= 80) u = addXP(u, 20);
    setLessonPct(u, n, 100);
    u = checkAchievements(u);
    saveUser(u);
    showToast(`🧠 Quiz: ${score}/${total} · +XP!`);
  },
};

/* ── HANDLE ?phase= DEEP-LINK (called by lesson pages) ── */
window.ALECS.handlePhaseDeepLink = function(goPhaseFunc) {
  const params = new URLSearchParams(window.location.search);
  const gotoPhase = params.get('phase') || localStorage.getItem('alecs_goto_phase');
  if (gotoPhase) {
    localStorage.removeItem('alecs_goto_phase');
    const n = parseInt(gotoPhase);
    if (!isNaN(n) && typeof goPhaseFunc === 'function') {
      setTimeout(() => goPhaseFunc(n), 300);
    }
  }
};

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  let u = loadUser();
  u = updateStreak(u);
  u = checkAchievements(u);
  saveUser(u);
  renderDashboard(u);
  if (u.streak > 1) showToast(`🔥 ${u.streak}-day streak! Keep it up!`, 4000);
});

// ── Basketball game stubs (lesson1 only) ──
const canvas2 = document.getElementById('game');
const ctx2    = canvas2 ? canvas2.getContext('2d') : null;
