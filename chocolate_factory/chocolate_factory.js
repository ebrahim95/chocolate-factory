// =============================================================================
// LIFE FACTORY — Main Application Script
// =============================================================================
// 1.  Constants
// 2.  State
// 3.  XP & Level Utilities
// 4.  Date & Streak Utilities
// 5.  Stats Utilities
// 6.  UI Utilities  (toast, xpFloat)
// 7.  DOM Helpers   (el, clearAndAppend)
// 8.  Habit Helpers (schedule, priority, time label, day picker)
// 9.  Render: Header
// 10. Render: Systems (Factory Floor)
// 11. Render: Deep Work Panel
// 12. Render: Lab Panel
// 13. Render: Goals (Tech Tree)
// 14. Render: Resource Nodes + Heatmap
// 15. Render: Manage Panel
// 16. Actions: Habits
// 17. Actions: Focus Sessions
// 18. Actions: Lab / Experiments
// 19. Actions: Goals
// 20. Actions: Subtasks
// 21. Actions: Nodes
// 22. Initialisation
// =============================================================================


// ─────────────────────────────────────────────────────────────────────────────
// 1. CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const HABIT_XP   = 25;
const TASK_XP    = 15;
const XP_PER_LEVEL = 100;

/** Deep work XP: base 30 + bonus for longer sessions */
const FOCUS_XP_BASE    = 30;
const FOCUS_XP_PER_MIN = 0.8;  // extra XP per minute beyond 20

const BUILT_IN_NODES = ['health','mind','work','social','finance'];

const DAY_SHORT  = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const DAY_LABELS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const TIME_ORDER = ['morning','afternoon','evening','anytime'];


// ─────────────────────────────────────────────────────────────────────────────
// 2. STATE
// ─────────────────────────────────────────────────────────────────────────────

const state = {
  nodes: {
    health:  { label:'Health',  icon:'❤️',  color:'#e05c5c', xp:0, level:1, identity:'I am someone who moves their body every day.' },
    mind:    { label:'Mind',    icon:'🧠',  color:'#7c6af7', xp:0, level:1, identity:'I am someone who never stops learning.' },
    work:    { label:'Work',    icon:'⚙️',  color:'#f0a500', xp:0, level:1, identity:'I am someone who does deep, focused work.' },
    social:  { label:'Social',  icon:'🤝',  color:'#4ec9b0', xp:0, level:1, identity:'I am someone who invests in relationships.' },
    finance: { label:'Finance', icon:'💰',  color:'#5cb85c', xp:0, level:1, identity:'I am someone who builds wealth intentionally.' },
  },
  habits: [
    { id:1, name:'Morning workout',       node:'health',  time:'morning',   priority:'high',   xp:30, notes:'',                   qtyTarget:null, qtyUnit:'',        days:[] },
    { id:2, name:'Read 20 mins',          node:'mind',    time:'evening',   priority:'medium', xp:25, notes:'Any book/article',    qtyTarget:null, qtyUnit:'',        days:[] },
    { id:3, name:'Deep work block (90m)', node:'work',    time:'morning',   priority:'high',   xp:40, notes:'No distractions',     qtyTarget:null, qtyUnit:'',        days:[] },
    { id:4, name:'Drink 2L water',        node:'health',  time:'anytime',   priority:'medium', xp:20, notes:'',                   qtyTarget:8,    qtyUnit:'glasses', days:[] },
    { id:5, name:'Reach out to someone',  node:'social',  time:'afternoon', priority:'medium', xp:25, notes:'Text, call, or meet', qtyTarget:null, qtyUnit:'',        days:[] },
    { id:6, name:'Log expenses',          node:'finance', time:'evening',   priority:'low',    xp:15, notes:'',                   qtyTarget:null, qtyUnit:'',        days:[] },
  ],
  goals: [
    { id:1, label:'Complete 7-day streak', node:'health',  xp_cost:200, unlocks:'Run a 5K',           completed:false, subtasks:[
      { id:1, label:'Track workout 3 days straight', done:false },
      { id:2, label:'Establish a morning routine',   done:false },
      { id:3, label:'Hit the full 7-day streak',     done:false },
    ]},
    { id:2, label:'Read 5 books',          node:'mind',    xp_cost:300, unlocks:'Start a writing habit', completed:false, subtasks:[
      { id:4, label:'Finish first book',   done:false },
      { id:5, label:'Summarise learnings', done:false },
      { id:6, label:'Read 3 more books',   done:false },
    ]},
    { id:3, label:'30 deep work sessions', node:'work',    xp_cost:500, unlocks:'Launch a side project', completed:false, subtasks:[
      { id:7,  label:'Define deep work schedule', done:false },
      { id:8,  label:'Complete 10 sessions',      done:false },
      { id:9,  label:'Complete 20 sessions',      done:false },
      { id:10, label:'Hit 30 — reflect & refine', done:false },
    ]},
    { id:4, label:'Save 1 month expenses', node:'finance', xp_cost:400, unlocks:'Invest surplus',       completed:false, subtasks:[
      { id:11, label:'Audit monthly spending',      done:false },
      { id:12, label:'Identify 3 areas to cut',     done:false },
      { id:13, label:'Build 2-week savings buffer', done:false },
      { id:14, label:'Reach full 1-month goal',     done:false },
    ]},
  ],
  completions:   {},   // date → [habitId…]
  qtyProgress:   {},   // date → { habitId: count }
  focusSessions: [],   // array of session objects (newest first)
  experiments:   [],   // array of experiment objects (newest first)
  nextHabitId:   7,
  nextGoalId:    5,
  nextTaskId:    15,
  nextExpId:     1,
};

const expandedGoals   = new Set();
let   editingGoal     = null;
let   editingHabit    = null;
let   deleteGoalPending = null;

// Deep work timer state
let focusTimer      = null;   // setInterval handle
let focusStartTime  = null;   // Date
let focusTargetMins = 0;
let focusNodeKey    = '';
let focusTask       = '';
let focusSelectedMins = 50;   // default preset


// ─────────────────────────────────────────────────────────────────────────────
// 3. XP & LEVEL UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function xpForLevel(level)     { return XP_PER_LEVEL * level; }

function levelFromXp(xp) {
  let lv=1, acc=0;
  while(true){
    const n = xpForLevel(lv);
    if(xp < acc+n) return lv;
    acc += n; lv++;
  }
}

function xpInLevel(xp, level) {
  let spent=0;
  for(let l=1;l<level;l++) spent+=xpForLevel(l);
  return xp-spent;
}

function addXp(nodeKey, amount) {
  state.nodes[nodeKey].xp    += amount;
  state.nodes[nodeKey].level  = levelFromXp(state.nodes[nodeKey].xp);
}

/** XP awarded for a focus session of given duration in minutes */
function focusXp(mins) {
  return Math.round(FOCUS_XP_BASE + Math.max(0, mins - 20) * FOCUS_XP_PER_MIN);
}


// ─────────────────────────────────────────────────────────────────────────────
// 4. DATE & STREAK UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0,10); }

function streak(habitId) {
  let n=0;
  const d = new Date();
  while(true){
    const k = d.toISOString().slice(0,10);
    if(state.completions[k]?.includes(habitId)){ n++; d.setDate(d.getDate()-1); }
    else break;
  }
  return n;
}

function fmtDuration(ms) {
  const totalSec = Math.floor(ms/1000);
  const h = Math.floor(totalSec/3600);
  const m = Math.floor((totalSec%3600)/60);
  const s = totalSec%60;
  if(h>0) return `${h}h ${String(m).padStart(2,'0')}m`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function fmtMins(mins) {
  if(mins >= 60) return `${Math.floor(mins/60)}h ${mins%60 ? (mins%60)+'m' : ''}`.trim();
  return `${mins}m`;
}


// ─────────────────────────────────────────────────────────────────────────────
// 5. STATS
// ─────────────────────────────────────────────────────────────────────────────

function efficiency() {
  const dow       = new Date().getDay();
  const scheduled = state.habits.filter(h => _isScheduledToday(h, dow));
  if(!scheduled.length) return 0;
  const done = (state.completions[todayStr()]||[]).filter(id=>scheduled.some(h=>h.id===id)).length;
  return Math.round(done/scheduled.length*1000)/10;
}

function bottleneck() {
  return Object.entries(state.nodes).sort((a,b)=>a[1].level-b[1].level)[0];
}

function effColor(e) {
  return e>=80 ? '#00c853' : e>=40 ? '#0a0a0a' : '#FF3B3B';
}

function totalFocusMinutes() {
  return state.focusSessions.reduce((s,f)=>s+f.actualMins,0);
}

function totalExperiments() { return state.experiments.length; }


// ─────────────────────────────────────────────────────────────────────────────
// 6. UI UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function toast(msg, color='#FFE500') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderColor = color;
  t.style.color = color;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

function xpFloat(x, y, text) {
  const d = document.createElement('div');
  d.className   = 'xp-float';
  d.textContent = text;
  d.style.left  = x+'px';
  d.style.top   = y+'px';
  document.body.appendChild(d);
  setTimeout(()=>d.remove(), 1200);
}


// ─────────────────────────────────────────────────────────────────────────────
// 7. DOM HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function el(tag, classes=[], text='') {
  const n = document.createElement(tag);
  if(classes.length) n.classList.add(...classes);
  if(text) n.textContent = text;
  return n;
}

function clearAndAppend(container, children) {
  container.replaceChildren(...children);
}

function _formField(labelText, id, tag, value, attrs={}) {
  const wrap  = el('div');
  const label = el('label',['inp-label'],labelText);
  label.setAttribute('for', id);
  const ctrl  = el(tag,['inp']);
  ctrl.id = id;
  for(const [k,v] of Object.entries(attrs)){
    if(k==='style') ctrl.style.cssText = v;
    else ctrl.setAttribute(k,v);
  }
  if(tag==='input') ctrl.value = value;
  wrap.append(label, ctrl);
  return wrap;
}

function _buildLabeledBar(label, pct, color) {
  const frag = document.createDocumentFragment();
  const lbl  = el('div');
  lbl.style.cssText = "font-family:'Space Mono',monospace;font-size:.6rem;color:#555;text-transform:uppercase;margin-top:7px;margin-bottom:2px";
  lbl.textContent   = label;
  const bar  = el('div',['pbar']);
  const fill = el('div',['pfill']);
  fill.style.width      = `${pct}%`;
  fill.style.background = color;
  bar.appendChild(fill);
  frag.append(lbl, bar);
  return frag;
}


// ─────────────────────────────────────────────────────────────────────────────
// 8. HABIT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function _timeLabel(time) {
  return {morning:'🌅 Morning',afternoon:'☀️ Afternoon',evening:'🌙 Evening',anytime:'⏰ Anytime'}[time]||'⏰ Anytime';
}

function _priorityWeight(p) { return {high:0,medium:1,low:2}[p]??1; }

function _isScheduledToday(h, dow) {
  return !h.days || h.days.length===0 || h.days.includes(dow);
}

function _buildDayPicker(pickerId, activeDays) {
  const wrap = el('div',['day-picker']);
  wrap.id = pickerId;
  DAY_LABELS.forEach((label,d) => {
    const btn = el('button',['day-btn'],label);
    btn.type = 'button';
    btn.dataset.day = d;
    if(!activeDays || activeDays.length===0 || activeDays.includes(d)) btn.classList.add('active');
    btn.addEventListener('click', ()=>btn.classList.toggle('active'));
    wrap.appendChild(btn);
  });
  return wrap;
}


// ─────────────────────────────────────────────────────────────────────────────
// 9. RENDER: HEADER
// ─────────────────────────────────────────────────────────────────────────────

function renderHeader() {
  const e     = efficiency();
  const badge = document.getElementById('eff-badge');
  badge.textContent      = `EFFICIENCY  ${e}%`;
  badge.style.background = e>=80 ? '#00c853' : e>=40 ? '#FFE500' : '#FF3B3B';
  badge.style.color      = e>=80 ? '#0a0a0a' : e>=40 ? '#0a0a0a' : '#f5f0e8';

  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now    = new Date();
  document.getElementById('hdr-date').textContent =
    `${DAYS[now.getDay()]}, ${String(now.getDate()).padStart(2,'0')} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}


// ─────────────────────────────────────────────────────────────────────────────
// 10. RENDER: SYSTEMS (Factory Floor)
// ─────────────────────────────────────────────────────────────────────────────

function renderFactory() {
  renderHeader();
  _renderIdentityBar();
  _renderFocusNodeAlert();
  _renderHabitList();
  _renderSummary();
}

/** Identity statements bar — shows one chip per node that has an identity set */
function _renderIdentityBar() {
  const container = document.getElementById('identity-bar');
  const chips = Object.entries(state.nodes)
    .filter(([,nd]) => nd.identity && nd.identity.trim())
    .map(([,nd]) => {
      const chip = el('div',['identity-chip']);
      chip.style.setProperty('--c', nd.color);
      const icon = el('span',['i-icon'], nd.icon);
      const txt  = el('span',[], nd.identity);
      chip.append(icon, txt);
      return chip;
    });
  clearAndAppend(container, chips.length ? chips : []);
}

/** Focus node suggestion — calmer framing than "BOTTLENECK" */
function _renderFocusNodeAlert() {
  const container = document.getElementById('focus-node-alert');
  const [, bnd]   = bottleneck();
  const banner    = el('div',['focus-node']);
  banner.appendChild(el('span',['pulse'],'◎'));
  banner.appendChild(document.createTextNode(' FOCUS NODE — '));
  const strong = el('strong');
  strong.style.color = '#fff';
  strong.textContent = `${bnd.icon} ${bnd.label}`;
  banner.appendChild(strong);
  banner.appendChild(document.createTextNode(` is your lowest node (Lv.${bnd.level}). Prioritise it today.`));
  clearAndAppend(container, [banner]);
}

function _renderHabitList() {
  const container = document.getElementById('habit-list');
  const today = todayStr();
  const dow   = new Date().getDay();
  const done  = state.completions[today] || [];

  const todayHabits = state.habits
    .filter(h => _isScheduledToday(h, dow))
    .sort((a,b) => _priorityWeight(a.priority) - _priorityWeight(b.priority));

  if(!todayHabits.length){
    clearAndAppend(container,[el('p',['empty-msg'],'No habits scheduled for today — add some in Manage.')]);
    return;
  }

  const groups = {};
  TIME_ORDER.forEach(t => { groups[t]=[]; });
  todayHabits.forEach(h => { groups[h.time||'anytime'].push(h); });

  const nodes=[];
  for(const time of TIME_ORDER){
    const habits = groups[time];
    if(!habits.length) continue;
    nodes.push(el('div',['habit-group-label'],_timeLabel(time)));
    habits.forEach(h => nodes.push(_buildHabitCard(h, done, today)));
  }
  clearAndAppend(container, nodes);
}

function _buildHabitCard(h, done, today) {
  const nd     = state.nodes[h.node];
  const isDone = done.includes(h.id);
  const st     = streak(h.id);
  const xpVal  = h.xp || HABIT_XP;
  const hasQty = !!(h.qtyTarget && h.qtyUnit);
  const qty    = state.qtyProgress?.[today]?.[h.id] || 0;

  const card = el('div',['habit',...(isDone?['done']:[])]);
  card.style.setProperty('--c', nd.color);
  card.addEventListener('click', e => toggleHabit(h.id, e));

  // Left: main info
  const main = el('div',['habit-main']);

  const nameRow = el('div');
  nameRow.style.cssText = 'display:flex;align-items:center;gap:8px';
  const check = el('div',['hcheck'], isDone?'✓':'');

  const nameEl = el('div',['hname'], h.name);
  const priColor = h.priority==='high'?'#FF3B3B':h.priority==='low'?'#aaa':'#888';
  const priIcon  = h.priority==='high'?'▲':h.priority==='low'?'▼':'—';
  const priSpan  = el('span',[],priIcon);
  priSpan.style.cssText = `font-size:.6rem;font-weight:700;color:${priColor};flex-shrink:0`;
  nameRow.append(check, nameEl, priSpan);
  main.appendChild(nameRow);

  const tagRow = el('div');
  tagRow.style.cssText='display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap';
  const nodeTag = el('div',['htag'],`${nd.icon} ${nd.label}`);
  const xpTag   = el('div',['htag'],`+${xpVal} XP`);
  xpTag.style.color = '#1a1aff';
  tagRow.append(nodeTag, xpTag);
  if(h.days && h.days.length) tagRow.appendChild(el('div',['htag'],h.days.map(d=>DAY_SHORT[d]).join(' ')));
  main.appendChild(tagRow);
  if(h.notes) main.appendChild(el('div',['habit-notes'],h.notes));

  // Right: qty + streak
  const right = el('div',['habit-right']);

  if(hasQty){
    const qtyWrap = el('div',['habit-qty']);
    qtyWrap.addEventListener('click',e=>e.stopPropagation());
    const barWrap = el('div',['qty-bar-wrap']);
    const barFill = el('div',['qty-bar-fill']);
    barFill.style.width      = `${Math.min(100, qty/h.qtyTarget*100).toFixed(0)}%`;
    barFill.style.background = nd.color;
    barWrap.appendChild(barFill);
    const stepRow = el('div');
    stepRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:3px';
    const minusBtn = el('button',['qty-btn'],'−');
    minusBtn.addEventListener('click',e=>adjustQty(h.id,-1,e));
    const qtyVal = el('span',['qty-val'],`${qty}/${h.qtyTarget} ${h.qtyUnit}`);
    const plusBtn  = el('button',['qty-btn'],'+');
    plusBtn.addEventListener('click',e=>adjustQty(h.id,+1,e));
    stepRow.append(minusBtn, qtyVal, plusBtn);
    qtyWrap.append(barWrap, stepRow);
    right.appendChild(qtyWrap);
  }

  right.appendChild(el('div',['hstreak',...(st?[]:['z'])], st?`🔥 ${st}d`:'0d'));
  card.append(main, right);
  return card;
}

function _renderSummary() {
  const today     = todayStr();
  const dow       = new Date().getDay();
  const scheduled = state.habits.filter(h=>_isScheduledToday(h,dow));
  const total     = scheduled.length;
  const done      = (state.completions[today]||[]).filter(id=>scheduled.some(h=>h.id===id)).length;
  const best      = state.habits.length ? Math.max(...state.habits.map(h=>streak(h.id))) : 0;
  const e         = efficiency();

  function statCard(lbl, val, color) {
    const card  = el('div',['sum-card']);
    const label = el('div',['sum-lbl'],lbl);
    const value = el('div',['sum-val'],val);
    value.style.color = color;
    card.append(label, value);
    return card;
  }

  // 4-card grid: add deep work total
  const focusMins = totalFocusMinutes();
  const grid = document.getElementById('summary');
  grid.style.gridTemplateColumns = 'repeat(4,1fr)';
  clearAndAppend(grid, [
    statCard('COMPLETED',   `${done}/${total}`,         '#00c853'),
    statCard('EFFICIENCY',  `${e}%`,                    effColor(e)),
    statCard('BEST STREAK', `${best}d`,                 '#1a1aff'),
    statCard('DEEP WORK',   fmtMins(focusMins),         '#f0a500'),
  ]);
}


// ─────────────────────────────────────────────────────────────────────────────
// 11. RENDER: DEEP WORK PANEL
// ─────────────────────────────────────────────────────────────────────────────

function renderFocus() {
  _syncFocusUI();
  _renderFocusLog();
}

function _syncFocusUI() {
  const isRunning = focusTimer !== null;
  document.getElementById('focus-setup').style.display  = isRunning ? 'none' : 'block';
  document.getElementById('focus-active').style.display = isRunning ? 'block' : 'none';
}

function _renderFocusLog() {
  const container = document.getElementById('focus-log');
  if(!state.focusSessions.length){
    clearAndAppend(container,[el('p',['empty-msg'],'No sessions yet. Start your first deep work block above.')]);
    return;
  }

  const entries = state.focusSessions.map(s => {
    const nd   = state.nodes[s.node];
    const entry = el('div',['focus-entry']);
    entry.style.setProperty('--c', nd?.color || '#888');

    const timeEl = el('div',['focus-entry-time'], fmtMins(s.actualMins));
    const body   = el('div',['focus-entry-body']);
    const title  = el('div',['focus-entry-title'], s.task || '(no task set)');
    const meta   = el('div',['focus-entry-meta'],  `${nd?.icon||''} ${nd?.label||s.node} · ${s.date} · target: ${fmtMins(s.targetMins)}`);
    body.append(title, meta);
    const xpEl   = el('div',['focus-entry-xp'], `+${s.xpAwarded} XP`);

    entry.append(timeEl, body, xpEl);
    return entry;
  });

  clearAndAppend(container, entries);
}

/** Called every second while timer is running */
function _tickFocusClock() {
  const elapsed = Date.now() - focusStartTime;
  document.getElementById('focus-clock').textContent = fmtDuration(elapsed);

  const elapsedMins = elapsed/60000;
  const xp = focusXp(elapsedMins);
  document.getElementById('focus-xp-preview').textContent =
    `${fmtMins(Math.round(elapsedMins))} elapsed · +${xp} XP on complete`;
}


// ─────────────────────────────────────────────────────────────────────────────
// 12. RENDER: LAB PANEL
// ─────────────────────────────────────────────────────────────────────────────

function renderLab() {
  _refreshLabGoalSelect();
  _renderLabLog();
}

function _refreshLabGoalSelect() {
  const sel = document.getElementById('lab-goal');
  if(!sel) return;
  const cur = sel.value;
  sel.replaceChildren();
  state.goals.forEach(g => {
    const nd  = state.nodes[g.node];
    const opt = el('option',[],`${nd?.icon||''} ${g.label}`);
    opt.value    = g.id;
    opt.selected = String(g.id) === cur;
    sel.appendChild(opt);
  });
  if(!state.goals.length){
    const opt = el('option',[],'— add goals first —');
    opt.disabled = true;
    sel.appendChild(opt);
  }
}

function _renderLabLog() {
  const container = document.getElementById('lab-log');
  if(!state.experiments.length){
    clearAndAppend(container,[el('p',['empty-msg'],'No experiments logged yet. Every attempt — win or fail — teaches you something.')]);
    return;
  }

  const entries = state.experiments.map(exp => {
    const goal = state.goals.find(g=>g.id===exp.goalId);
    const nd   = goal ? state.nodes[goal.node] : null;
    const entry = el('div',['lab-entry']);
    entry.style.setProperty('--c', nd?.color||'#888');

    const head = el('div',['lab-entry-head']);

    const badge = el('div',['lab-outcome-badge', exp.outcome]);
    badge.textContent = exp.outcome==='win'?'✅ Win':exp.outcome==='partial'?'⚡ Partial':'❌ Fail';

    const body = el('div');
    body.style.cssText = 'flex:1;min-width:0';
    const what = el('div',['lab-what'], exp.what);
    const meta = el('div',['lab-meta'],
      `${nd?.icon||''} ${goal?.label||'Unknown goal'} · ${exp.date}`);
    body.append(what, meta);

    const delBtn = el('button',['btn','btn-ghost'],'✕');
    delBtn.style.cssText = 'padding:3px 8px;font-size:.7rem;flex-shrink:0';
    delBtn.addEventListener('click',()=>deleteExperiment(exp.id));

    head.append(badge, body, delBtn);
    entry.appendChild(head);

    if(exp.insight){
      const ins = el('div',['lab-insight'],`💡 ${exp.insight}`);
      entry.appendChild(ins);
    }

    return entry;
  });

  clearAndAppend(container, entries);
}


// ─────────────────────────────────────────────────────────────────────────────
// 13. RENDER: GOALS (Tech Tree)
// ─────────────────────────────────────────────────────────────────────────────

function renderGoals() {
  const container = document.getElementById('goal-list');
  if(!state.goals.length){
    clearAndAppend(container,[el('p',['empty-msg'],'No goals yet — add some in Manage.')]);
    return;
  }
  clearAndAppend(container, state.goals.map(_buildGoalCard));
}

function _buildGoalCard(g) {
  const nd        = state.nodes[g.node];
  const nodeXp    = nd.xp;
  const fracXp    = Math.min(100, nodeXp/g.xp_cost*100).toFixed(1);
  const doneT     = g.subtasks.filter(t=>t.done).length;
  const totalT    = g.subtasks.length;
  const fracT     = totalT ? (doneT/totalT*100).toFixed(1) : 0;
  const canRes    = nodeXp>=g.xp_cost && !g.completed;
  const isExp     = expandedGoals.has(g.id);
  const isEditing = editingGoal===g.id;

  const expCount  = state.experiments.filter(e=>e.goalId===g.id).length;

  const card = el('div',['goal']);
  card.style.setProperty('--c', nd.color);
  card.style.opacity = (g.completed && !isEditing) ? '0.65' : '1';

  const head = el('div',['goal-head']);

  const titleRow = el('div');
  titleRow.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px';
  titleRow.appendChild(el('div',['goal-title'],`${nd.icon} ${g.label}`));
  titleRow.appendChild(_buildGoalBadge(g, canRes, nodeXp));
  head.appendChild(titleRow);

  head.appendChild(el('div',['goal-meta'],`${nd.label.toUpperCase()} · ${g.xp_cost} XP REQUIRED`));
  if(g.unlocks) head.appendChild(el('div',['goal-unlocks'],`→ Unlocks: ${g.unlocks}`));

  head.appendChild(_buildLabeledBar('XP PROGRESS', fracXp, nd.color));
  if(totalT) head.appendChild(_buildLabeledBar(`MILESTONES ${doneT}/${totalT}`, fracT, '#00c853'));

  // Experiment count pill
  if(expCount){
    const pill = el('div');
    pill.style.cssText = "font-size:.62rem;margin-top:6px;color:#555";
    pill.textContent   = `🧪 ${expCount} experiment${expCount>1?'s':''} logged`;
    head.appendChild(pill);
  }

  head.appendChild(_buildGoalButtons(g, canRes, isExp, totalT));
  card.appendChild(head);
  if(isEditing) card.appendChild(_buildGoalEditForm(g));
  if(isExp)     card.appendChild(_buildSubtaskList(g, nd.color));
  return card;
}

function _buildGoalBadge(g, canRes, nodeXp) {
  const badge = el('span');
  badge.style.cssText = "font-family:'Archivo Black',sans-serif;font-size:.67rem;padding:2px 8px;";
  if(g.completed){
    badge.textContent      = '✓ DONE';
    badge.style.background = '#00c853';
    badge.style.color      = '#0a0a0a';
    badge.style.border     = '2px solid #0a0a0a';
  } else if(canRes){
    badge.textContent      = '◈ READY';
    badge.style.background = '#FFE500';
    badge.style.color      = '#0a0a0a';
    badge.style.border     = '2px solid #0a0a0a';
  } else {
    badge.textContent      = `${nodeXp}/${g.xp_cost} XP`;
    badge.style.background = '#e8e3d8';
    badge.style.color      = '#555';
    badge.style.border     = '2px solid #ccc';
    badge.style.fontFamily = "'Space Mono',monospace";
  }
  return badge;
}

function _buildGoalButtons(g, canRes, isExp, totalT) {
  const row = el('div',['goal-btns']);
  if(canRes){
    const btn = el('button',['btn','btn-amber'],'RESEARCH');
    btn.addEventListener('click',()=>researchGoal(g.id));
    row.appendChild(btn);
  } else if(g.completed){
    row.appendChild(el('div',['btn','btn-green'],'COMPLETE ✓'));
  }
  const expandBtn = el('button',['btn','btn-ghost'], isExp?'▾ HIDE':`▸ MILESTONES (${totalT})`);
  expandBtn.addEventListener('click',()=>toggleExpand(g.id));
  row.appendChild(expandBtn);
  const editBtn = el('button',['btn','btn-ghost'],'✏ EDIT');
  editBtn.style.marginLeft = 'auto';
  editBtn.addEventListener('click',()=>startGoalEdit(g.id));
  row.appendChild(editBtn);
  return row;
}

function _buildGoalEditForm(g) {
  const wrap = el('div');
  wrap.style.cssText = 'background:#f0ebe0;border-top:3px solid #0a0a0a;padding:14px;display:flex;flex-direction:column;gap:10px';
  const fields = el('div');
  fields.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end';

  fields.appendChild(_formField('Goal Label','eg-label','input',g.label,{style:'width:200px'}));
  fields.appendChild(_formField('Node','eg-node','select',''));
  fields.appendChild(_formField('XP Cost','eg-xp','input',g.xp_cost,{type:'number',style:'width:90px'}));
  fields.appendChild(_formField('Unlocks','eg-unlocks','input',g.unlocks||'',{placeholder:'Next goal…',style:'width:180px'}));

  const nodeSelect = fields.querySelector('#eg-node');
  for(const [k,nd] of Object.entries(state.nodes)){
    const opt = el('option',[],`${nd.icon} ${nd.label}`);
    opt.value = k; opt.selected = k===g.node;
    nodeSelect.appendChild(opt);
  }

  const btns = el('div');
  btns.style.cssText = 'display:flex;gap:8px';
  const saveBtn   = el('button',['btn','btn-amber'],'✓ SAVE');
  saveBtn.addEventListener('click',()=>saveGoalEdit(g.id));
  const cancelBtn = el('button',['btn','btn-ghost'],'✕ CANCEL');
  cancelBtn.addEventListener('click',cancelGoalEdit);
  const deleteBtn = el('button',['btn'],'🗑 DELETE GOAL');
  deleteBtn.style.cssText = 'background:#FF3B3B;color:#f5f0e8;border-color:#0a0a0a;margin-left:auto';
  deleteBtn.addEventListener('click',e=>deleteGoal(g.id,e));
  btns.append(saveBtn, cancelBtn, deleteBtn);
  wrap.append(fields, btns);
  return wrap;
}

function _buildSubtaskList(g, color) {
  const subs = el('div',['subs']);
  if(!g.subtasks.length) subs.appendChild(el('p',['empty-msg'],'No milestones yet.'));
  else g.subtasks.forEach(t=>subs.appendChild(_buildSubtaskRow(g,t,color)));

  const addRow = el('div',['st-add']);
  const input  = el('input',['st-input']);
  input.id = `ti-${g.id}`; input.placeholder='Add milestone…';
  input.addEventListener('keydown',e=>{if(e.key==='Enter')addTask(g.id);});
  const addBtn = el('button',['btn','btn-amber'],'+ ADD');
  addBtn.addEventListener('click',()=>addTask(g.id));
  addRow.append(input, addBtn);
  subs.appendChild(addRow);
  return subs;
}

function _buildSubtaskRow(g, t, color) {
  const wrap = el('div');
  wrap.style.cssText = 'display:flex;align-items:center;margin-left:10px;border-left:2px dashed #ccc';
  const row = el('div',['st',...(t.done?['done']:[])]);
  row.style.setProperty('--c',color);
  row.style.cssText += ';flex:1;border:none;margin:0';
  row.addEventListener('click',()=>toggleTask(g.id,t.id));
  row.append(el('div',['st-check'],t.done?'✓':''), el('div',['st-lbl'],t.label));
  const del = el('button',['st-del'],'✕');
  del.addEventListener('click',e=>{e.stopPropagation();deleteTask(g.id,t.id);});
  wrap.append(row, del);
  return wrap;
}


// ─────────────────────────────────────────────────────────────────────────────
// 14. RENDER: RESOURCE NODES + HEATMAP
// ─────────────────────────────────────────────────────────────────────────────

function renderNodes() {
  _renderNodeGrid();
  _renderHeatmap();
}

function _renderNodeGrid() {
  const cards = Object.entries(state.nodes).map(([,nd]) => {
    const lv   = nd.level;
    const cur  = xpInLevel(nd.xp, lv);
    const need = xpForLevel(lv);
    const pct  = (cur/need*100).toFixed(1);

    const card = el('div',['node-card']);
    card.style.setProperty('--c', nd.color);

    const top = el('div');
    top.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start';
    const left = el('div');
    left.appendChild(el('div',['node-lbl'],nd.label));
    const icon = el('div',[],nd.icon);
    icon.style.cssText = 'font-size:1.5rem;margin-top:2px';
    left.appendChild(icon);
    const right = el('div');
    right.style.textAlign = 'right';
    right.appendChild(el('div',['node-lbl'],'LEVEL'));
    right.appendChild(el('div',['node-level'],String(lv).padStart(2,'0')));
    top.append(left, right);
    card.appendChild(top);

    const bg   = el('div',['xp-bg']);
    const fill = el('div',['xp-fill']);
    fill.style.width = `${pct}%`;
    bg.appendChild(fill);
    card.appendChild(bg);
    card.appendChild(el('div',['xp-txt'],`${cur}/${need} XP · ${pct}%`));
    card.appendChild(el('div',['xp-txt'],`Total: ${nd.xp} XP`));

    // Identity statement
    if(nd.identity && nd.identity.trim()){
      card.appendChild(el('div',['node-identity'],`"${nd.identity}"`));
    }

    return card;
  });
  clearAndAppend(document.getElementById('node-grid'), cards);
}

function _renderHeatmap() {
  const total = state.habits.length || 1;
  const cells = [];
  for(let i=27;i>=0;i--){
    const d = new Date();
    d.setDate(d.getDate()-i);
    const k   = d.toISOString().slice(0,10);
    const done= (state.completions[k]||[]).length;
    const frac= done/total;
    const lbl = d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
    const cell= el('div',['hm-cell']);
    cell.style.background = frac>0 ? `rgba(10,10,10,${(0.1+frac*0.9).toFixed(2)})` : '#e8e3d8';
    cell.title = `${lbl}: ${done} habits`;
    cells.push(cell);
  }
  clearAndAppend(document.getElementById('heatmap'), cells);
}


// ─────────────────────────────────────────────────────────────────────────────
// 15. RENDER: MANAGE PANEL
// ─────────────────────────────────────────────────────────────────────────────

function renderManage() {
  const container = document.getElementById('manage-habits');
  if(!state.habits.length){
    clearAndAppend(container,[el('p',['empty-msg'],'No habits yet.')]);
    return;
  }
  clearAndAppend(container, state.habits.map(h =>
    editingHabit===h.id ? _buildHabitEditRow(h) : _buildHabitSummaryRow(h)
  ));
}

function _buildHabitSummaryRow(h) {
  const nd  = state.nodes[h.node];
  const row = el('div',['manage-row']);
  row.style.setProperty('--c', nd.color);

  const info = el('div');
  info.style.cssText = 'flex:1;min-width:0';
  const nameEl = el('div',[],h.name);
  nameEl.style.cssText = 'font-size:.87rem;font-weight:700';
  const days   = (h.days&&h.days.length) ? h.days.map(d=>DAY_SHORT[d]).join(' ') : 'Every day';
  const detail = el('div');
  detail.style.cssText = 'font-size:.65rem;color:#555;margin-top:2px';
  detail.textContent   = `${nd.icon} ${nd.label} · ${_timeLabel(h.time||'anytime')} · ${h.priority||'medium'} · +${h.xp||HABIT_XP} XP · ${days}`;
  info.append(nameEl, detail);

  const editBtn = el('button',['btn','btn-ghost'],'✏ EDIT');
  editBtn.style.cssText = 'padding:3px 10px;font-size:.7rem';
  editBtn.addEventListener('click',()=>startHabitEdit(h.id));

  const delBtn = el('button',['btn','btn-ghost'],'✕');
  delBtn.style.cssText = 'padding:3px 8px;font-size:.7rem';
  delBtn.addEventListener('click',()=>deleteHabit(h.id));

  row.append(info, editBtn, delBtn);
  return row;
}

function _buildHabitEditRow(h) {
  const nd  = state.nodes[h.node];
  const row = el('div',['manage-row']);
  row.style.setProperty('--c', nd.color);
  row.style.cssText += ';flex-direction:column;align-items:stretch;gap:10px;padding:14px';

  const r1 = el('div');
  r1.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end';
  r1.appendChild(_formField('Name',`eh-name-${h.id}`,'input',h.name,{style:'width:200px'}));
  r1.appendChild(_formField('XP Value',`eh-xp-${h.id}`,'input',h.xp||HABIT_XP,{type:'number',style:'width:80px'}));

  const nf = _formField('Node',`eh-node-${h.id}`,'select','');
  const ns = nf.querySelector('select');
  for(const [k,nd2] of Object.entries(state.nodes)){
    const o=el('option',[],`${nd2.icon} ${nd2.label}`);o.value=k;o.selected=k===h.node;ns.appendChild(o);
  }
  r1.appendChild(nf);

  const tf = _formField('Time',`eh-time-${h.id}`,'select','',{style:'width:140px'});
  const ts = tf.querySelector('select');
  [['anytime','⏰ Anytime'],['morning','🌅 Morning'],['afternoon','☀️ Afternoon'],['evening','🌙 Evening']].forEach(([v,t])=>{
    const o=el('option',[],t);o.value=v;o.selected=(h.time||'anytime')===v;ts.appendChild(o);
  });
  r1.appendChild(tf);

  const pf = _formField('Priority',`eh-priority-${h.id}`,'select','',{style:'width:120px'});
  const ps = pf.querySelector('select');
  [['medium','— Medium'],['high','▲ High'],['low','▼ Low']].forEach(([v,t])=>{
    const o=el('option',[],t);o.value=v;o.selected=(h.priority||'medium')===v;ps.appendChild(o);
  });
  r1.appendChild(pf);

  const r2 = el('div');
  r2.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end';
  const nw = _formField('Notes',`eh-notes-${h.id}`,'input',h.notes||'',{placeholder:'Extra context…',style:'width:100%'});
  nw.style.cssText='flex:1;min-width:180px';
  r2.appendChild(nw);
  r2.appendChild(_formField('Qty Target',`eh-qty-target-${h.id}`,'input',h.qtyTarget||'',{type:'number',min:'1',placeholder:'—',style:'width:80px'}));
  r2.appendChild(_formField('Qty Unit',`eh-qty-unit-${h.id}`,'input',h.qtyUnit||'',{placeholder:'glasses',style:'width:100px'}));

  const sw = el('div');
  const sl = el('label',['inp-label'],'Schedule'); sl.setAttribute('for',`eh-days-${h.id}`);
  sw.append(sl, _buildDayPicker(`eh-days-${h.id}`, h.days));

  const btns = el('div');
  btns.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
  const sv = el('button',['btn','btn-amber'],'✓ SAVE');
  sv.addEventListener('click',()=>saveHabitEdit(h.id));
  const cn = el('button',['btn','btn-ghost'],'✕ CANCEL');
  cn.addEventListener('click',cancelHabitEdit);
  const dl = el('button',['btn'],'🗑 DELETE');
  dl.style.cssText='background:#FF3B3B;color:#fff;border-color:#c03030;margin-left:auto';
  dl.addEventListener('click',()=>deleteHabit(h.id));
  btns.append(sv,cn,dl);

  row.append(r1,r2,sw,btns);
  return row;
}

function renderManageNodes() {
  const container = document.getElementById('manage-nodes');
  if(!container) return;

  const rows = Object.entries(state.nodes).map(([k,nd]) => {
    const isBuiltIn = BUILT_IN_NODES.includes(k);
    const row = el('div',['manage-row']);
    row.style.setProperty('--c', nd.color);

    const icon = el('span',[],nd.icon);
    icon.style.cssText = 'font-size:1.2rem;margin-right:4px';
    const name = el('span',[],nd.label);
    name.style.cssText = "flex:1;font-size:.9rem;font-family:'Archivo Black',sans-serif";
    const xpInfo = el('span',[],`Lv.${nd.level} · ${nd.xp} XP`);
    xpInfo.style.cssText = 'font-size:.65rem;color:#555;margin-right:8px';
    const swatch = el('div');
    swatch.style.cssText = `width:18px;height:18px;background:${nd.color};border:2px solid #0a0a0a;margin-right:8px;flex-shrink:0`;
    row.append(icon, name, xpInfo, swatch);

    // Inline identity edit
    const idInp = el('input',['inp']);
    idInp.style.cssText = 'font-size:.7rem;padding:4px 8px;flex:1;min-width:180px;font-style:italic';
    idInp.value       = nd.identity || '';
    idInp.placeholder = 'I am someone who…';
    idInp.addEventListener('change', () => {
      nd.identity = idInp.value.trim();
      renderFactory();
      renderNodes();
    });
    row.appendChild(idInp);

    if(isBuiltIn){
      const badge = el('span',[],'BUILT-IN');
      badge.style.cssText = "color:#aaa;font-family:'Space Mono',monospace;font-size:.65rem;padding:2px 8px;border:2px solid #ccc";
      row.appendChild(badge);
    } else {
      const del = el('button',['btn','btn-ghost'],'✕ REMOVE');
      del.style.cssText = 'padding:3px 10px;font-size:.7rem';
      del.addEventListener('click',()=>deleteNode(k));
      row.appendChild(del);
    }
    return row;
  });

  clearAndAppend(container, rows);
}

function refreshNodeSelects() {
  ['h-node','g-node','focus-node'].forEach(id => {
    const sel = document.getElementById(id);
    if(!sel) return;
    const cur = sel.value;
    sel.replaceChildren();
    for(const [k,nd] of Object.entries(state.nodes)){
      const opt = el('option',[],`${nd.icon} ${nd.label}`);
      opt.value = k; opt.selected = k===cur;
      sel.appendChild(opt);
    }
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// 16. ACTIONS: HABITS
// ─────────────────────────────────────────────────────────────────────────────

function adjustQty(id, delta, e) {
  e.stopPropagation();
  const today = todayStr();
  if(!state.qtyProgress[today]) state.qtyProgress[today]={};
  const h    = state.habits.find(x=>x.id===id);
  const cur  = state.qtyProgress[today][id]||0;
  const next = Math.max(0, Math.min(h.qtyTarget||99, cur+delta));
  state.qtyProgress[today][id] = next;
  if(next>=h.qtyTarget){
    if(!state.completions[today]) state.completions[today]=[];
    if(!state.completions[today].includes(id)){
      state.completions[today].push(id);
      const xp = h.xp||HABIT_XP;
      addXp(h.node, xp);
      xpFloat(e.clientX, e.clientY, `+${xp} XP`);
    }
  }
  renderFactory();
}

function toggleHabit(id, e) {
  const today = todayStr();
  if(!state.completions[today]) state.completions[today]=[];
  const lst   = state.completions[today];
  const idx   = lst.indexOf(id);
  const h     = state.habits.find(x=>x.id===id);
  const xpVal = h?.xp||HABIT_XP;
  if(idx>-1){
    lst.splice(idx,1);
  } else {
    lst.push(id);
    if(h){ addXp(h.node,xpVal); xpFloat(e.clientX,e.clientY,`+${xpVal} XP`); }
  }
  renderFactory();
}

function addHabit() {
  const name      = document.getElementById('h-name').value.trim();
  const node      = document.getElementById('h-node').value;
  const time      = document.getElementById('h-time').value;
  const priority  = document.getElementById('h-priority').value;
  const xp        = parseInt(document.getElementById('h-xp').value)||HABIT_XP;
  const notes     = document.getElementById('h-notes').value.trim();
  const qtyTarget = parseInt(document.getElementById('h-qty-target').value)||null;
  const qtyUnit   = document.getElementById('h-qty-unit').value.trim();
  const days      = Array.from(document.querySelectorAll('#h-days .day-btn.active')).map(b=>parseInt(b.dataset.day));
  if(!name){ toast('Enter a habit name','#FF3B3B'); return; }
  state.habits.push({id:state.nextHabitId++,name,node,time,priority,xp,notes,qtyTarget,qtyUnit,days});
  document.getElementById('h-name').value='';
  document.getElementById('h-notes').value='';
  document.getElementById('h-qty-target').value='';
  document.getElementById('h-qty-unit').value='';
  document.getElementById('h-xp').value='25';
  document.getElementById('h-time').value='anytime';
  document.getElementById('h-priority').value='medium';
  document.querySelectorAll('#h-days .day-btn').forEach(b=>b.classList.add('active'));
  renderFactory(); renderManage();
  toast(`Added: ${name}`,'#00c853');
}

function startHabitEdit(id) { editingHabit=id; renderManage(); }
function cancelHabitEdit()  { editingHabit=null; renderManage(); }

function saveHabitEdit(id) {
  const h = state.habits.find(x=>x.id===id);
  if(!h) return;
  const name = document.getElementById(`eh-name-${id}`).value.trim();
  if(!name){ toast('Name cannot be empty','#FF3B3B'); return; }
  h.name      = name;
  h.node      = document.getElementById(`eh-node-${id}`).value;
  h.time      = document.getElementById(`eh-time-${id}`).value;
  h.priority  = document.getElementById(`eh-priority-${id}`).value;
  h.xp        = parseInt(document.getElementById(`eh-xp-${id}`).value)||HABIT_XP;
  h.notes     = document.getElementById(`eh-notes-${id}`).value.trim();
  h.qtyTarget = parseInt(document.getElementById(`eh-qty-target-${id}`).value)||null;
  h.qtyUnit   = document.getElementById(`eh-qty-unit-${id}`).value.trim();
  h.days      = Array.from(document.querySelectorAll(`#eh-days-${id} .day-btn.active`)).map(b=>parseInt(b.dataset.day));
  editingHabit=null;
  renderFactory(); renderManage();
  toast('Habit updated','#00c853');
}

function deleteHabit(id) {
  state.habits = state.habits.filter(h=>h.id!==id);
  editingHabit=null;
  renderFactory(); renderManage();
  toast('Habit removed','#FF3B3B');
}


// ─────────────────────────────────────────────────────────────────────────────
// 17. ACTIONS: FOCUS SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

function startFocus() {
  const task  = document.getElementById('focus-task').value.trim();
  const nodeK = document.getElementById('focus-node').value;
  const mins  = focusSelectedMins ||
    parseInt(document.getElementById('focus-custom-mins').value) || 50;

  if(!task){ toast('Describe what you are working on','#FF3B3B'); return; }

  focusNodeKey   = nodeK;
  focusTask      = task;
  focusTargetMins= mins;
  focusStartTime = Date.now();

  const nd = state.nodes[nodeK];
  document.getElementById('focus-active-node').textContent = `${nd.icon} ${nd.label}`;
  document.getElementById('focus-active-task').textContent = `"${task}"`;
  document.getElementById('focus-clock').textContent       = '00:00';
  document.getElementById('focus-xp-preview').textContent  = `Target: ${fmtMins(mins)} · +${focusXp(mins)} XP`;

  _syncFocusUI();
  focusTimer = setInterval(_tickFocusClock, 1000);
  toast(`Session started — ${fmtMins(mins)} target`,'#1a1aff');
}

function endFocus(abandoned) {
  if(!focusTimer) return;
  clearInterval(focusTimer);
  focusTimer = null;

  if(!abandoned){
    const elapsedMs   = Date.now() - focusStartTime;
    const actualMins  = Math.max(1, Math.round(elapsedMs/60000));
    const xpAwarded   = focusXp(actualMins);

    addXp(focusNodeKey, xpAwarded);
    xpFloat(window.innerWidth/2-50, 120, `+${xpAwarded} XP`);

    state.focusSessions.unshift({
      node:       focusNodeKey,
      task:       focusTask,
      targetMins: focusTargetMins,
      actualMins,
      xpAwarded,
      date:       todayStr(),
    });

    renderFactory();
    renderNodes();
    toast(`Session complete! +${xpAwarded} XP awarded`,'#00c853');
  } else {
    toast('Session abandoned','#FF3B3B');
  }

  focusStartTime = null;
  _syncFocusUI();
  _renderFocusLog();
}

function setFocusPreset(mins) {
  focusSelectedMins = mins;
  document.querySelectorAll('.focus-preset').forEach(b=>{
    b.classList.toggle('selected', parseInt(b.dataset.mins)===mins);
  });
  document.getElementById('focus-custom-mins').value='';
}


// ─────────────────────────────────────────────────────────────────────────────
// 18. ACTIONS: LAB / EXPERIMENTS
// ─────────────────────────────────────────────────────────────────────────────

function addExperiment() {
  const goalId  = parseInt(document.getElementById('lab-goal').value);
  const what    = document.getElementById('lab-what').value.trim();
  const outcome = document.getElementById('lab-outcome').value;
  const insight = document.getElementById('lab-insight').value.trim();
  if(!what){ toast('Describe what you tried','#FF3B3B'); return; }

  state.experiments.unshift({
    id: state.nextExpId++,
    goalId, what, outcome, insight,
    date: todayStr(),
  });

  document.getElementById('lab-what').value    = '';
  document.getElementById('lab-insight').value = '';
  _renderLabLog();
  renderGoals(); // refresh experiment count on goal cards
  toast(`Experiment logged — ${outcome}`,'#00c853');
}

function deleteExperiment(id) {
  state.experiments = state.experiments.filter(e=>e.id!==id);
  _renderLabLog();
  renderGoals();
}


// ─────────────────────────────────────────────────────────────────────────────
// 19. ACTIONS: GOALS
// ─────────────────────────────────────────────────────────────────────────────

function addGoal() {
  const label   = document.getElementById('g-label').value.trim();
  const node    = document.getElementById('g-node').value;
  const xp_cost = parseInt(document.getElementById('g-xp').value)||200;
  const unlocks = document.getElementById('g-unlocks').value.trim()||null;
  if(!label){ toast('Enter a goal label','#FF3B3B'); return; }
  state.goals.push({id:state.nextGoalId++,label,node,xp_cost,unlocks,completed:false,subtasks:[]});
  document.getElementById('g-label').value='';
  document.getElementById('g-unlocks').value='';
  renderGoals(); _refreshLabGoalSelect();
  toast('Goal added — open Goals to add milestones','#00c853');
}

function researchGoal(gid) {
  const g = state.goals.find(x=>x.id===gid);
  if(!g||g.completed) return;
  if(state.nodes[g.node].xp>=g.xp_cost){
    state.nodes[g.node].xp   -= g.xp_cost;
    state.nodes[g.node].level = levelFromXp(state.nodes[g.node].xp);
    g.completed=true;
    renderGoals(); renderNodes();
    toast(`✅ Unlocked: ${g.label}`,'#00c853');
  }
}

function toggleExpand(gid){ expandedGoals.has(gid)?expandedGoals.delete(gid):expandedGoals.add(gid); renderGoals(); }
function startGoalEdit(gid){ editingGoal=gid; renderGoals(); setTimeout(()=>document.getElementById('eg-label')?.focus(),50); }
function cancelGoalEdit()  { editingGoal=null; renderGoals(); }

function saveGoalEdit(gid) {
  const g = state.goals.find(x=>x.id===gid);
  if(!g) return;
  const label   = document.getElementById('eg-label').value.trim();
  const node    = document.getElementById('eg-node').value;
  const xp_cost = parseInt(document.getElementById('eg-xp').value)||200;
  const unlocks = document.getElementById('eg-unlocks').value.trim()||null;
  if(!label){ toast('Label cannot be empty','#FF3B3B'); return; }
  Object.assign(g,{label,node,xp_cost,unlocks});
  editingGoal=null;
  renderGoals(); _refreshLabGoalSelect();
  toast('Goal updated','#00c853');
}

function deleteGoal(gid, e) {
  if(deleteGoalPending===gid){
    clearTimeout(window._deleteGoalTimer);
    deleteGoalPending=null;
    state.goals = state.goals.filter(g=>g.id!==gid);
    expandedGoals.delete(gid);
    if(editingGoal===gid) editingGoal=null;
    renderGoals(); _refreshLabGoalSelect();
    toast('Goal deleted','#FF3B3B');
  } else {
    deleteGoalPending=gid;
    const btn=e.target;
    btn.textContent='⚠ CLICK AGAIN TO CONFIRM'; btn.style.background='#0a0a0a';
    window._deleteGoalTimer=setTimeout(()=>{ deleteGoalPending=null; renderGoals(); },3000);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// 20. ACTIONS: SUBTASKS
// ─────────────────────────────────────────────────────────────────────────────

function toggleTask(gid, tid) {
  const g=state.goals.find(x=>x.id===gid); if(!g) return;
  const t=g.subtasks.find(x=>x.id===tid);  if(!t) return;
  t.done=!t.done;
  if(t.done){ addXp(g.node,TASK_XP); toast(`+${TASK_XP} XP — ${state.nodes[g.node].label}`,'#FFE500'); }
  renderGoals(); renderNodes(); renderHeader();
}

function deleteTask(gid, tid) {
  const g=state.goals.find(x=>x.id===gid); if(!g) return;
  g.subtasks=g.subtasks.filter(t=>t.id!==tid);
  renderGoals();
}

function addTask(gid) {
  const inp=document.getElementById(`ti-${gid}`);
  const label=inp?.value.trim(); if(!label) return;
  const g=state.goals.find(x=>x.id===gid); if(!g) return;
  g.subtasks.push({id:state.nextTaskId++,label,done:false});
  expandedGoals.add(gid);
  inp.value='';
  renderGoals();
}


// ─────────────────────────────────────────────────────────────────────────────
// 21. ACTIONS: NODES
// ─────────────────────────────────────────────────────────────────────────────

function addNode() {
  const label    = document.getElementById('n-label').value.trim();
  const icon     = document.getElementById('n-icon').value.trim()||'⭐';
  const color    = document.getElementById('n-color').value;
  const identity = document.getElementById('n-identity').value.trim();
  if(!label){ toast('Enter a node name','#FF3B3B'); return; }
  const key = `node_${Date.now()}`;
  state.nodes[key]={label,icon,color,xp:0,level:1,identity};
  document.getElementById('n-label').value='';
  document.getElementById('n-icon').value='';
  document.getElementById('n-identity').value='';
  refreshNodeSelects(); renderNodes(); renderManageNodes();
  toast(`Node added: ${label}`,'#00c853');
}

function deleteNode(key) {
  if(BUILT_IN_NODES.includes(key)){ toast('Cannot delete built-in nodes','#FF3B3B'); return; }
  state.habits.forEach(h=>{ if(h.node===key) h.node='work'; });
  state.goals.forEach(g=>{  if(g.node===key) g.node='work'; });
  delete state.nodes[key];
  refreshNodeSelects(); renderFactory(); renderGoals(); renderNodes(); renderManageNodes();
  toast('Node removed','#FF3B3B');
}


// ─────────────────────────────────────────────────────────────────────────────
// 22. INITIALISATION
// ─────────────────────────────────────────────────────────────────────────────

function _bindStaticListeners() {
  // Tab switching
  document.querySelectorAll('.tab[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.panel;
      document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`panel-${id}`).classList.add('active');
      if(id==='nodes')   renderNodes();
      if(id==='focus')   renderFocus();
      if(id==='lab')     renderLab();
      if(id==='tech')    renderGoals();
      if(id==='factory') renderFactory();
    });
  });

  // Manage panel buttons
  document.getElementById('btn-add-habit').addEventListener('click', addHabit);
  document.getElementById('btn-add-goal').addEventListener('click',  addGoal);
  document.getElementById('btn-add-node').addEventListener('click',  addNode);

  // Enter shortcuts
  document.getElementById('h-name').addEventListener('keydown',  e=>{ if(e.key==='Enter') addHabit(); });
  document.getElementById('g-label').addEventListener('keydown', e=>{ if(e.key==='Enter') addGoal(); });

  // Day picker toggle in Add Habit form
  document.querySelectorAll('#h-days .day-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>btn.classList.toggle('active'));
  });

  // Focus session controls
  document.getElementById('btn-start-focus').addEventListener('click', startFocus);
  document.getElementById('btn-end-focus').addEventListener('click',   ()=>endFocus(false));
  document.getElementById('btn-abort-focus').addEventListener('click',  ()=>endFocus(true));

  document.querySelectorAll('.focus-preset').forEach(btn=>{
    btn.addEventListener('click',()=>setFocusPreset(parseInt(btn.dataset.mins)));
  });
  document.getElementById('focus-custom-mins').addEventListener('input', ()=>{
    focusSelectedMins = 0;
    document.querySelectorAll('.focus-preset').forEach(b=>b.classList.remove('selected'));
  });

  // Lab
  document.getElementById('btn-add-experiment').addEventListener('click', addExperiment);
  document.getElementById('lab-what').addEventListener('keydown', e=>{ if(e.key==='Enter') addExperiment(); });
}

function init() {
  _bindStaticListeners();
  refreshNodeSelects();
  renderHeader();
  renderFactory();
  renderGoals();
  renderNodes();
  renderManage();
  renderManageNodes();
  renderFocus();
  renderLab();
  // default focus preset highlight
  setFocusPreset(50);
}

init();
