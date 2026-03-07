// =============================================================================
// LIFE FACTORY — Main Application Script
// =============================================================================
// Sections:
//   1.  Constants & Configuration
//   2.  Application State
//   3.  XP & Level Utilities
//   4.  Date & Streak Utilities
//   5.  Stats Utilities
//   6.  UI Utilities  (toast, xpFloat, tabs)
//   7.  DOM Helpers   (el, setStyles, clearAndAppend)
//   8.  Render: Header
//   9.  Render: Factory Floor
//  10.  Render: Tech Tree (goals + subtasks)
//  11.  Render: Resource Nodes + Heatmap
//  12.  Render: Manage Panel
//  13.  Actions: Habits
//  14.  Actions: Goals
//  15.  Actions: Subtasks
//  16.  Actions: Nodes
//  17.  Initialisation
// =============================================================================


// ─────────────────────────────────────────────────────────────────────────────
// 1. CONSTANTS & CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/** XP awarded per habit completion */
const HABIT_XP = 25;

/** XP awarded per subtask/milestone completion */
const TASK_XP = 15;

/** XP required to advance one level (multiplied by current level) */
const XP_PER_LEVEL = 100;

/** Node keys that ship with the app and cannot be deleted */
const BUILT_IN_NODES = ['health', 'mind', 'work', 'social', 'finance'];


// ─────────────────────────────────────────────────────────────────────────────
// 2. APPLICATION STATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} NodeData
 * @property {string} label  - Display name (e.g. "Health")
 * @property {string} icon   - Emoji icon (e.g. "❤️")
 * @property {string} color  - CSS hex color
 * @property {number} xp     - Accumulated XP
 * @property {number} level  - Current level (derived from xp)
 */

/**
 * @typedef {Object} Habit
 * @property {number} id   - Unique identifier
 * @property {string} name - Habit description
 * @property {string} node - Key of the associated NodeData
 */

/**
 * @typedef {Object} Subtask
 * @property {number}  id    - Unique identifier
 * @property {string}  label - Milestone description
 * @property {boolean} done  - Whether this milestone is completed
 */

/**
 * @typedef {Object} Goal
 * @property {number}      id        - Unique identifier
 * @property {string}      label     - Goal description
 * @property {string}      node      - Key of the associated NodeData
 * @property {number}      xp_cost   - Node XP required to unlock
 * @property {string|null} unlocks   - Descriptive label of what this leads to
 * @property {boolean}     completed - Whether goal has been researched
 * @property {Subtask[]}   subtasks  - List of milestones
 */

/**
 * @typedef {Object} AppState
 * @property {Object.<string, NodeData>}     nodes       - Map of node key → NodeData
 * @property {Habit[]}                       habits      - Daily habits
 * @property {Goal[]}                        goals       - Tech-tree goals
 * @property {Object.<string, number[]>}     completions - Date string → completed habit IDs
 * @property {number} nextHabitId  - Auto-increment counter
 * @property {number} nextGoalId   - Auto-increment counter
 * @property {number} nextTaskId   - Auto-increment counter
 */

/** @type {AppState} */
const state = {
  nodes: {
    health:  { label: 'Health',  icon: '❤️',  color: '#e05c5c', xp: 0, level: 1 },
    mind:    { label: 'Mind',    icon: '🧠',  color: '#7c6af7', xp: 0, level: 1 },
    work:    { label: 'Work',    icon: '⚙️',  color: '#f0a500', xp: 0, level: 1 },
    social:  { label: 'Social',  icon: '🤝',  color: '#4ec9b0', xp: 0, level: 1 },
    finance: { label: 'Finance', icon: '💰',  color: '#5cb85c', xp: 0, level: 1 },
  },
  habits: [
    { id: 1, name: 'Morning workout',       node: 'health'  },
    { id: 2, name: 'Read 20 mins',          node: 'mind'    },
    { id: 3, name: 'Deep work block (90m)', node: 'work'    },
    { id: 4, name: 'Drink 2L water',        node: 'health'  },
    { id: 5, name: 'Reach out to someone',  node: 'social'  },
    { id: 6, name: 'Log expenses',          node: 'finance' },
  ],
  goals: [
    {
      id: 1, label: 'Complete 7-day streak', node: 'health',
      xp_cost: 200, unlocks: 'Run a 5K', completed: false,
      subtasks: [
        { id: 1, label: 'Track workout 3 days straight', done: false },
        { id: 2, label: 'Establish a morning routine',   done: false },
        { id: 3, label: 'Hit the full 7-day streak',     done: false },
      ],
    },
    {
      id: 2, label: 'Read 5 books', node: 'mind',
      xp_cost: 300, unlocks: 'Start a writing habit', completed: false,
      subtasks: [
        { id: 4, label: 'Finish first book',   done: false },
        { id: 5, label: 'Summarise learnings', done: false },
        { id: 6, label: 'Read 3 more books',   done: false },
      ],
    },
    {
      id: 3, label: '30 deep work sessions', node: 'work',
      xp_cost: 500, unlocks: 'Launch a side project', completed: false,
      subtasks: [
        { id: 7,  label: 'Define deep work schedule', done: false },
        { id: 8,  label: 'Complete 10 sessions',      done: false },
        { id: 9,  label: 'Complete 20 sessions',      done: false },
        { id: 10, label: 'Hit 30 — reflect & refine', done: false },
      ],
    },
    {
      id: 4, label: 'Save 1 month expenses', node: 'finance',
      xp_cost: 400, unlocks: 'Invest surplus', completed: false,
      subtasks: [
        { id: 11, label: 'Audit monthly spending',      done: false },
        { id: 12, label: 'Identify 3 areas to cut',     done: false },
        { id: 13, label: 'Build 2-week savings buffer', done: false },
        { id: 14, label: 'Reach full 1-month goal',     done: false },
      ],
    },
  ],
  completions: {},
  nextHabitId: 7,
  nextGoalId:  5,
  nextTaskId:  15,
};

/** Goal IDs whose subtask list is currently expanded */
const expandedGoals = new Set();

/** ID of the goal currently open in edit mode, or null */
let editingGoal = null;

/** ID of the goal pending delete confirmation, or null */
let deleteGoalPending = null;


// ─────────────────────────────────────────────────────────────────────────────
// 3. XP & LEVEL UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the XP required to complete a given level.
 * @param {number} level
 * @returns {number}
 */
function xpForLevel(level) {
  return XP_PER_LEVEL * level;
}

/**
 * Derives the current level from a raw cumulative XP total.
 * @param {number} xp
 * @returns {number}
 */
function levelFromXp(xp) {
  let lv = 1, acc = 0;
  while (true) {
    const needed = xpForLevel(lv);
    if (xp < acc + needed) return lv;
    acc += needed;
    lv++;
  }
}

/**
 * Returns XP accumulated within the current level (progress toward next level-up).
 * @param {number} xp    - Total cumulative XP
 * @param {number} level - Current level
 * @returns {number}
 */
function xpInLevel(xp, level) {
  let spent = 0;
  for (let l = 1; l < level; l++) spent += xpForLevel(l);
  return xp - spent;
}

/**
 * Adds XP to a node and recalculates its level.
 * @param {string} nodeKey - Key of the node to award XP to
 * @param {number} amount  - Amount of XP to add
 */
function addXp(nodeKey, amount) {
  state.nodes[nodeKey].xp    += amount;
  state.nodes[nodeKey].level  = levelFromXp(state.nodes[nodeKey].xp);
}


// ─────────────────────────────────────────────────────────────────────────────
// 4. DATE & STREAK UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns today's date as an ISO string (YYYY-MM-DD).
 * @returns {string}
 */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Calculates the current consecutive-day streak for a habit.
 * Walks backwards from today until a day with no completion is found.
 * @param {number} habitId
 * @returns {number}
 */
function streak(habitId) {
  let n = 0;
  const d = new Date();
  while (true) {
    const k = d.toISOString().slice(0, 10);
    if (state.completions[k]?.includes(habitId)) {
      n++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return n;
}


// ─────────────────────────────────────────────────────────────────────────────
// 5. STATS UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns today's habit completion rate as a percentage (0–100).
 * @returns {number}
 */
function efficiency() {
  if (!state.habits.length) return 0;
  const done = (state.completions[todayStr()] || []).length;
  return Math.round(done / state.habits.length * 1000) / 10;
}

/**
 * Returns the node with the lowest level — the production bottleneck.
 * @returns {[string, NodeData]}
 */
function bottleneck() {
  return Object.entries(state.nodes).sort((a, b) => a[1].level - b[1].level)[0];
}

/**
 * Maps an efficiency score to a CSS color string.
 * @param {number} e - Efficiency percentage
 * @returns {string}
 */
function effColor(e) {
  return e >= 80 ? '#00c853' : e >= 40 ? '#0a0a0a' : '#FF3B3B';
}


// ─────────────────────────────────────────────────────────────────────────────
// 6. UI UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shows a temporary toast notification.
 * @param {string} msg   - Message to display
 * @param {string} color - Border/text color (CSS color string)
 */
function toast(msg, color = '#FFE500') {
  const t = document.getElementById('toast');
  t.textContent       = msg;
  t.style.borderColor = color;
  t.style.color       = color;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/**
 * Spawns a floating XP label at the given screen coordinates.
 * @param {number} x    - clientX
 * @param {number} y    - clientY
 * @param {string} text - Label text e.g. "+25 XP"
 */
function xpFloat(x, y, text) {
  const el = document.createElement('div');
  el.className   = 'xp-float';
  el.textContent = text;
  el.style.left  = x + 'px';
  el.style.top   = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}


// ─────────────────────────────────────────────────────────────────────────────
// 7. DOM HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a DOM element with optional class names and text content.
 * @param {string}   tag       - HTML tag name
 * @param {string[]} [classes] - CSS class names to add
 * @param {string}   [text]    - textContent to set
 * @returns {HTMLElement}
 */
function el(tag, classes = [], text = '') {
  const node = document.createElement(tag);
  if (classes.length) node.classList.add(...classes);
  if (text)           node.textContent = text;
  return node;
}

/**
 * Replaces the children of a container with a new set of nodes.
 * @param {HTMLElement}   container
 * @param {HTMLElement[]} children
 */
function clearAndAppend(container, children) {
  container.replaceChildren(...children);
}


// ─────────────────────────────────────────────────────────────────────────────
// 8. RENDER: HEADER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates the sticky header: efficiency badge colour and today's date string.
 */
function renderHeader() {
  const e     = efficiency();
  const badge = document.getElementById('eff-badge');
  badge.textContent      = `EFFICIENCY  ${e}%`;
  badge.style.background = e >= 80 ? '#00c853' : e >= 40 ? '#FFE500' : '#FF3B3B';
  badge.style.color      = e >= 80 ? '#0a0a0a' : e >= 40 ? '#0a0a0a' : '#f5f0e8';

  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now    = new Date();
  document.getElementById('hdr-date').textContent =
    `${DAYS[now.getDay()]}, ${String(now.getDate()).padStart(2,'0')} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}


// ─────────────────────────────────────────────────────────────────────────────
// 9. RENDER: FACTORY FLOOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Re-renders the Factory Floor panel: bottleneck alert, habit list, summary.
 */
function renderFactory() {
  renderHeader();
  _renderBottleneck();
  _renderHabitList();
  _renderSummary();
}

/**
 * @private Builds the bottleneck warning banner.
 */
function _renderBottleneck() {
  const [, bnd] = bottleneck();

  const banner = el('div', ['bn']);

  const pulse = el('span', ['pulse'], '⚠');
  banner.appendChild(pulse);

  const msg = document.createTextNode(` BOTTLENECK — `);
  banner.appendChild(msg);

  const strong = el('strong');
  strong.style.color   = '#fff';
  strong.textContent   = `${bnd.icon} ${bnd.label}`;
  banner.appendChild(strong);

  banner.appendChild(document.createTextNode(` is your lowest node (Lv.${bnd.level}). Focus here to unlock progress.`));

  clearAndAppend(document.getElementById('bn-alert'), [banner]);
}

/**
 * @private Builds the daily habit card list.
 */
function _renderHabitList() {
  const container = document.getElementById('habit-list');
  const today     = todayStr();
  const done      = state.completions[today] || [];

  if (!state.habits.length) {
    clearAndAppend(container, [el('p', ['empty-msg'], 'No habits yet — add some in Manage.')]);
    return;
  }

  const cards = state.habits.map(h => {
    const nd     = state.nodes[h.node];
    const isDone = done.includes(h.id);
    const st     = streak(h.id);

    const card = el('div', ['habit', ...(isDone ? ['done'] : [])]);
    card.style.setProperty('--c', nd.color);
    card.addEventListener('click', e => toggleHabit(h.id, e));

    const check = el('div', ['hcheck'], isDone ? '✓' : '');
    const name  = el('div', ['hname'], h.name);
    const tag   = el('div', ['htag'],  `${nd.icon} ${nd.label}`);
    const fire  = el('div', ['hstreak', ...(st ? [] : ['z'])], st ? `🔥 ${st}d` : '0d');

    card.append(check, name, tag, fire);
    return card;
  });

  clearAndAppend(container, cards);
}

/**
 * @private Builds the three today's-output stat cards.
 */
function _renderSummary() {
  const today = todayStr();
  const done  = (state.completions[today] || []).length;
  const total = state.habits.length;
  const best  = total ? Math.max(...state.habits.map(h => streak(h.id))) : 0;
  const e     = efficiency();

  /**
   * @param {string} lbl
   * @param {string} val
   * @param {string} color
   * @returns {HTMLElement}
   */
  function statCard(lbl, val, color) {
    const card  = el('div', ['sum-card']);
    const label = el('div', ['sum-lbl'], lbl);
    const value = el('div', ['sum-val'], val);
    value.style.color = color;
    card.append(label, value);
    return card;
  }

  clearAndAppend(document.getElementById('summary'), [
    statCard('COMPLETED',   `${done}/${total}`, '#00c853'),
    statCard('EFFICIENCY',  `${e}%`,             effColor(e)),
    statCard('BEST STREAK', `${best}d`,          '#1a1aff'),
  ]);
}


// ─────────────────────────────────────────────────────────────────────────────
// 10. RENDER: TECH TREE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Re-renders all goal cards in the Tech Tree panel.
 */
function renderGoals() {
  const container = document.getElementById('goal-list');

  if (!state.goals.length) {
    clearAndAppend(container, [el('p', ['empty-msg'], 'No goals yet — add some in Manage.')]);
    return;
  }

  clearAndAppend(container, state.goals.map(_buildGoalCard));
}

/**
 * @private Builds a complete goal card element.
 * @param {Goal} g
 * @returns {HTMLElement}
 */
function _buildGoalCard(g) {
  const nd        = state.nodes[g.node];
  const nodeXp    = nd.xp;
  const fracXp    = Math.min(100, nodeXp / g.xp_cost * 100).toFixed(1);
  const doneT     = g.subtasks.filter(t => t.done).length;
  const totalT    = g.subtasks.length;
  const fracT     = totalT ? (doneT / totalT * 100).toFixed(1) : 0;
  const canRes    = nodeXp >= g.xp_cost && !g.completed;
  const isExp     = expandedGoals.has(g.id);
  const isEditing = editingGoal === g.id;

  const card = el('div', ['goal']);
  card.style.setProperty('--c', nd.color);
  card.style.opacity = (g.completed && !isEditing) ? '0.65' : '1';

  // ── Goal head ──────────────────────────────────────────────────────────────
  const head = el('div', ['goal-head']);

  // Title row + badge
  const titleRow = el('div');
  titleRow.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px';

  const titleText = el('div', ['goal-title'], `${nd.icon} ${g.label}`);
  titleRow.appendChild(titleText);
  titleRow.appendChild(_buildGoalBadge(g, canRes, nodeXp));
  head.appendChild(titleRow);

  // Meta line
  head.appendChild(el('div', ['goal-meta'], `${nd.label.toUpperCase()} · ${g.xp_cost} XP REQUIRED`));

  // Unlocks label
  if (g.unlocks) {
    head.appendChild(el('div', ['goal-unlocks'], `→ Unlocks: ${g.unlocks}`));
  }

  // XP progress bar
  head.appendChild(_buildLabeledBar('XP PROGRESS', fracXp, nd.color));

  // Milestone bar
  if (totalT) {
    head.appendChild(_buildLabeledBar(`MILESTONES ${doneT}/${totalT}`, fracT, '#00c853'));
  }

  // Action buttons
  head.appendChild(_buildGoalButtons(g, canRes, isExp, totalT));
  card.appendChild(head);

  // ── Inline edit form ───────────────────────────────────────────────────────
  if (isEditing) {
    card.appendChild(_buildEditForm(g));
  }

  // ── Subtask list ───────────────────────────────────────────────────────────
  if (isExp) {
    card.appendChild(_buildSubtaskList(g, nd.color));
  }

  return card;
}

/**
 * @private Builds the status badge (DONE / READY / XP count).
 * @param {Goal}    g
 * @param {boolean} canRes
 * @param {number}  nodeXp
 * @returns {HTMLElement}
 */
function _buildGoalBadge(g, canRes, nodeXp) {
  const badge = el('span');
  badge.style.cssText = "font-family:'Archivo Black',sans-serif;font-size:.67rem;padding:2px 8px;";

  if (g.completed) {
    badge.textContent      = '✓ DONE';
    badge.style.background = '#00c853';
    badge.style.color      = '#0a0a0a';
    badge.style.border     = '2px solid #0a0a0a';
  } else if (canRes) {
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

/**
 * @private Builds a labelled progress bar.
 * @param {string} label
 * @param {number} pct   - 0–100
 * @param {string} color
 * @returns {DocumentFragment}
 */
function _buildLabeledBar(label, pct, color) {
  const frag  = document.createDocumentFragment();
  const lbl   = el('div');
  lbl.style.cssText = "font-family:'Space Mono',monospace;font-size:.6rem;color:#555;text-transform:uppercase;margin-top:7px;margin-bottom:2px";
  lbl.textContent   = label;

  const bar  = el('div', ['pbar']);
  const fill = el('div', ['pfill']);
  fill.style.width      = `${pct}%`;
  fill.style.background = color;
  bar.appendChild(fill);

  frag.append(lbl, bar);
  return frag;
}

/**
 * @private Builds the action button row for a goal card.
 * @param {Goal}    g
 * @param {boolean} canRes
 * @param {boolean} isExp
 * @param {number}  totalT
 * @returns {HTMLElement}
 */
function _buildGoalButtons(g, canRes, isExp, totalT) {
  const row = el('div', ['goal-btns']);

  if (canRes) {
    const btn = el('button', ['btn', 'btn-amber'], 'RESEARCH');
    btn.addEventListener('click', () => researchGoal(g.id));
    row.appendChild(btn);
  } else if (g.completed) {
    row.appendChild(el('div', ['btn', 'btn-green'], 'COMPLETE ✓'));
  }

  const expandBtn = el('button', ['btn', 'btn-ghost'], isExp ? '▾ HIDE' : `▸ MILESTONES (${totalT})`);
  expandBtn.addEventListener('click', () => toggleExpand(g.id));
  row.appendChild(expandBtn);

  const editBtn = el('button', ['btn', 'btn-ghost'], '✏ EDIT');
  editBtn.style.marginLeft = 'auto';
  editBtn.addEventListener('click', () => startGoalEdit(g.id));
  row.appendChild(editBtn);

  return row;
}

/**
 * @private Builds the inline edit form shown when a goal is in edit mode.
 * @param {Goal} g
 * @returns {HTMLElement}
 */
function _buildEditForm(g) {
  const wrap = el('div');
  wrap.style.cssText = 'background:#f0ebe0;border-top:3px solid #0a0a0a;padding:14px;display:flex;flex-direction:column;gap:10px';

  // Field row
  const fields = el('div');
  fields.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end';

  fields.appendChild(_formField('Goal Label',    'eg-label',   'input',  g.label,   { style: 'width:200px' }));
  fields.appendChild(_formField('Node',          'eg-node',    'select', g.node));
  fields.appendChild(_formField('XP Cost',       'eg-xp',      'input',  g.xp_cost, { type: 'number', style: 'width:90px' }));
  fields.appendChild(_formField('Unlocks',       'eg-unlocks', 'input',  g.unlocks || '', { placeholder: 'Next goal…', style: 'width:180px' }));

  // Populate the node select
  const nodeSelect = fields.querySelector('#eg-node');
  for (const [k, nd] of Object.entries(state.nodes)) {
    const opt = el('option', [], `${nd.icon} ${nd.label}`);
    opt.value    = k;
    opt.selected = k === g.node;
    nodeSelect.appendChild(opt);
  }

  // Button row
  const btns = el('div');
  btns.style.cssText = 'display:flex;gap:8px';

  const saveBtn   = el('button', ['btn', 'btn-amber'], '✓ SAVE');
  saveBtn.addEventListener('click', () => saveGoalEdit(g.id));

  const cancelBtn = el('button', ['btn', 'btn-ghost'], '✕ CANCEL');
  cancelBtn.addEventListener('click', cancelGoalEdit);

  const deleteBtn = el('button', ['btn'], '🗑 DELETE GOAL');
  deleteBtn.style.cssText      = 'background:#FF3B3B;color:#f5f0e8;border-color:#0a0a0a;margin-left:auto';
  deleteBtn.addEventListener('click', (e) => deleteGoal(g.id, e));

  btns.append(saveBtn, cancelBtn, deleteBtn);
  wrap.append(fields, btns);
  return wrap;
}

/**
 * @private Creates a labelled form field (input or select).
 * @param {string} labelText
 * @param {string} id
 * @param {'input'|'select'} tag
 * @param {string|number} value
 * @param {Object} [attrs] - Extra attributes to set on the control
 * @returns {HTMLElement} A wrapper div containing label + control
 */
function _formField(labelText, id, tag, value, attrs = {}) {
  const wrap  = el('div');
  const label = el('label', ['inp-label'], labelText);
  label.setAttribute('for', id);

  const ctrl = el(tag, ['inp']);
  ctrl.id = id;

  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'style') ctrl.style.cssText = v;
    else               ctrl.setAttribute(k, v);
  }

  if (tag === 'input')  ctrl.value = value;
  // select options are added by the caller

  wrap.append(label, ctrl);
  return wrap;
}

/**
 * @private Builds the expanded subtask list for a goal.
 * @param {Goal}   g
 * @param {string} color - Node color for the left-border accent
 * @returns {HTMLElement}
 */
function _buildSubtaskList(g, color) {
  const subs = el('div', ['subs']);

  if (g.subtasks.length === 0) {
    subs.appendChild(el('p', ['empty-msg'], 'No milestones yet.'));
  } else {
    for (const t of g.subtasks) {
      subs.appendChild(_buildSubtaskRow(g, t, color));
    }
  }

  // Add-milestone row
  const addRow   = el('div', ['st-add']);
  const input    = el('input', ['st-input']);
  input.id          = `ti-${g.id}`;
  input.placeholder = 'Add milestone…';
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(g.id); });

  const addBtn = el('button', ['btn', 'btn-amber'], '+ ADD');
  addBtn.addEventListener('click', () => addTask(g.id));

  addRow.append(input, addBtn);
  subs.appendChild(addRow);
  return subs;
}

/**
 * @private Builds a single subtask row.
 * @param {Goal}    g
 * @param {Subtask} t
 * @param {string}  color
 * @returns {HTMLElement}
 */
function _buildSubtaskRow(g, t, color) {
  const wrap = el('div');
  wrap.style.cssText = 'display:flex;align-items:center;margin-left:10px;border-left:2px dashed #ccc';

  const row = el('div', ['st', ...(t.done ? ['done'] : [])]);
  row.style.setProperty('--c', color);
  row.style.cssText += ';flex:1;border:none;margin:0';
  row.addEventListener('click', () => toggleTask(g.id, t.id));

  const check = el('div', ['st-check'], t.done ? '✓' : '');
  const lbl   = el('div', ['st-lbl'],   t.label);
  row.append(check, lbl);

  const del = el('button', ['st-del'], '✕');
  del.addEventListener('click', (e) => { e.stopPropagation(); deleteTask(g.id, t.id); });

  wrap.append(row, del);
  return wrap;
}


// ─────────────────────────────────────────────────────────────────────────────
// 11. RENDER: RESOURCE NODES + HEATMAP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Re-renders the node grid cards and the 4-week completion heatmap.
 */
function renderNodes() {
  _renderNodeGrid();
  _renderHeatmap();
}

/**
 * @private Renders node level cards.
 */
function _renderNodeGrid() {
  const cards = Object.entries(state.nodes).map(([, nd]) => {
    const lv   = nd.level;
    const cur  = xpInLevel(nd.xp, lv);
    const need = xpForLevel(lv);
    const pct  = (cur / need * 100).toFixed(1);

    const card = el('div', ['node-card']);
    card.style.setProperty('--c', nd.color);

    // Top row: label/icon | level
    const top  = el('div');
    top.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start';

    const left  = el('div');
    left.appendChild(el('div', ['node-lbl'], nd.label));
    left.appendChild(el('div', [], nd.icon));
    left.lastChild.style.cssText = 'font-size:1.5rem;margin-top:2px';

    const right = el('div');
    right.style.textAlign = 'right';
    right.appendChild(el('div', ['node-lbl'], 'LEVEL'));
    right.appendChild(el('div', ['node-level'], String(lv).padStart(2, '0')));

    top.append(left, right);
    card.appendChild(top);

    // XP bar
    const bg   = el('div', ['xp-bg']);
    const fill = el('div', ['xp-fill']);
    fill.style.width = `${pct}%`;
    bg.appendChild(fill);
    card.appendChild(bg);

    card.appendChild(el('div', ['xp-txt'], `${cur}/${need} XP · ${pct}%`));
    card.appendChild(el('div', ['xp-txt'], `Total: ${nd.xp} XP`));

    return card;
  });

  clearAndAppend(document.getElementById('node-grid'), cards);
}

/**
 * @private Renders the 28-day completion heatmap.
 */
function _renderHeatmap() {
  const total = state.habits.length || 1;
  const cells = [];

  for (let i = 27; i >= 0; i--) {
    const d    = new Date();
    d.setDate(d.getDate() - i);
    const k    = d.toISOString().slice(0, 10);
    const done = (state.completions[k] || []).length;
    const frac = done / total;
    const lbl  = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    const cell = el('div', ['hm-cell']);
    cell.style.background = frac > 0
      ? `rgba(10,10,10,${(0.1 + frac * 0.9).toFixed(2)})`
      : '#e8e3d8';
    cell.title = `${lbl}: ${done} habits`;
    cells.push(cell);
  }

  clearAndAppend(document.getElementById('heatmap'), cells);
}


// ─────────────────────────────────────────────────────────────────────────────
// 12. RENDER: MANAGE PANEL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Re-renders the habit list in the Manage panel.
 */
function renderManage() {
  const container = document.getElementById('manage-habits');

  if (!state.habits.length) {
    clearAndAppend(container, [el('p', ['empty-msg'], 'No habits yet.')]);
    return;
  }

  const rows = state.habits.map(h => {
    const nd  = state.nodes[h.node];
    const row = el('div', ['manage-row']);
    row.style.setProperty('--c', nd.color);

    const name = el('span', [], h.name);
    name.style.cssText = 'flex:1;font-size:.87rem';

    const tag = el('span', [], `${nd.icon} ${nd.label}`);
    tag.style.cssText = 'font-size:.7rem;color:#555';

    const del = el('button', ['btn', 'btn-ghost'], '✕');
    del.style.cssText = 'padding:3px 8px;font-size:.7rem';
    del.addEventListener('click', () => deleteHabit(h.id));

    row.append(name, tag, del);
    return row;
  });

  clearAndAppend(container, rows);
}

/**
 * Re-renders the node list in the Manage panel.
 * Built-in nodes get a BUILT-IN badge; custom nodes get a remove button.
 */
function renderManageNodes() {
  const container = document.getElementById('manage-nodes');
  if (!container) return;

  const rows = Object.entries(state.nodes).map(([k, nd]) => {
    const isBuiltIn = BUILT_IN_NODES.includes(k);
    const row = el('div', ['manage-row']);
    row.style.setProperty('--c', nd.color);

    const icon = el('span', [], nd.icon);
    icon.style.cssText = 'font-size:1.2rem;margin-right:4px';

    const name = el('span', [], nd.label);
    name.style.cssText = "flex:1;font-size:.9rem;font-family:'Archivo Black',sans-serif";

    const xpInfo = el('span', [], `Lv.${nd.level} · ${nd.xp} XP`);
    xpInfo.style.cssText = 'font-size:.65rem;color:#555;margin-right:8px';

    const swatch = el('div');
    swatch.style.cssText = `width:18px;height:18px;background:${nd.color};border:2px solid #0a0a0a;margin-right:8px;flex-shrink:0`;

    row.append(icon, name, xpInfo, swatch);

    if (isBuiltIn) {
      const badge = el('span', [], 'BUILT-IN');
      badge.style.cssText = "color:#aaa;font-family:'Space Mono',monospace;font-size:.65rem;padding:2px 8px;border:2px solid #ccc";
      row.appendChild(badge);
    } else {
      const del = el('button', ['btn', 'btn-ghost'], '✕ REMOVE');
      del.style.cssText = 'padding:3px 10px;font-size:.7rem';
      del.addEventListener('click', () => deleteNode(k));
      row.appendChild(del);
    }

    return row;
  });

  clearAndAppend(container, rows);
}

/**
 * Rebuilds the node <select> dropdowns so they reflect added/removed nodes.
 */
function refreshNodeSelects() {
  ['h-node', 'g-node'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.replaceChildren();
    for (const [k, nd] of Object.entries(state.nodes)) {
      const opt      = el('option', [], `${nd.icon} ${nd.label}`);
      opt.value      = k;
      opt.selected   = k === cur;
      sel.appendChild(opt);
    }
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// 13. ACTIONS: HABITS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toggles a habit's completion for today.
 * Awards HABIT_XP to the linked node on first completion.
 * @param {number}     id - Habit ID
 * @param {MouseEvent} e  - Click event (used for XP float position)
 */
function toggleHabit(id, e) {
  const today = todayStr();
  if (!state.completions[today]) state.completions[today] = [];
  const lst = state.completions[today];
  const idx = lst.indexOf(id);
  if (idx > -1) {
    lst.splice(idx, 1);
  } else {
    lst.push(id);
    const h = state.habits.find(x => x.id === id);
    if (h) {
      addXp(h.node, HABIT_XP);
      xpFloat(e.clientX, e.clientY, `+${HABIT_XP} XP`);
    }
  }
  renderFactory();
}

/**
 * Creates a new habit from the Manage panel form and adds it to state.
 */
function addHabit() {
  const name = document.getElementById('h-name').value.trim();
  const node = document.getElementById('h-node').value;
  if (!name) { toast('Enter a habit name', '#FF3B3B'); return; }
  state.habits.push({ id: state.nextHabitId++, name, node });
  document.getElementById('h-name').value = '';
  renderFactory();
  renderManage();
  toast(`Added: ${name}`, '#00c853');
}

/**
 * Removes a habit from state by ID.
 * @param {number} id - Habit ID
 */
function deleteHabit(id) {
  state.habits = state.habits.filter(h => h.id !== id);
  renderFactory();
  renderManage();
  toast('Habit removed', '#FF3B3B');
}


// ─────────────────────────────────────────────────────────────────────────────
// 14. ACTIONS: GOALS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new goal from the Manage panel form and adds it to state.
 */
function addGoal() {
  const label   = document.getElementById('g-label').value.trim();
  const node    = document.getElementById('g-node').value;
  const xp_cost = parseInt(document.getElementById('g-xp').value) || 200;
  const unlocks = document.getElementById('g-unlocks').value.trim() || null;
  if (!label) { toast('Enter a goal label', '#FF3B3B'); return; }
  state.goals.push({ id: state.nextGoalId++, label, node, xp_cost, unlocks, completed: false, subtasks: [] });
  document.getElementById('g-label').value   = '';
  document.getElementById('g-unlocks').value = '';
  renderGoals();
  toast('Goal added — open Tech Tree to add milestones', '#00c853');
}

/**
 * Spends node XP to mark a goal as completed (researched).
 * @param {number} gid - Goal ID
 */
function researchGoal(gid) {
  const g = state.goals.find(x => x.id === gid);
  if (!g || g.completed) return;
  if (state.nodes[g.node].xp >= g.xp_cost) {
    state.nodes[g.node].xp   -= g.xp_cost;
    state.nodes[g.node].level = levelFromXp(state.nodes[g.node].xp);
    g.completed = true;
    renderGoals();
    renderNodes();
    toast(`✅ Unlocked: ${g.label}`, '#00c853');
  }
}

/**
 * Toggles the subtask list open/closed for a goal.
 * @param {number} gid - Goal ID
 */
function toggleExpand(gid) {
  expandedGoals.has(gid) ? expandedGoals.delete(gid) : expandedGoals.add(gid);
  renderGoals();
}

/**
 * Opens the inline edit form for a goal.
 * @param {number} gid - Goal ID
 */
function startGoalEdit(gid) {
  editingGoal = gid;
  renderGoals();
  setTimeout(() => document.getElementById('eg-label')?.focus(), 50);
}

/** Closes the inline edit form without saving. */
function cancelGoalEdit() {
  editingGoal = null;
  renderGoals();
}

/**
 * Saves edits from the inline form back to the goal in state.
 * @param {number} gid - Goal ID
 */
function saveGoalEdit(gid) {
  const g = state.goals.find(x => x.id === gid);
  if (!g) return;
  const label   = document.getElementById('eg-label').value.trim();
  const node    = document.getElementById('eg-node').value;
  const xp_cost = parseInt(document.getElementById('eg-xp').value) || 200;
  const unlocks = document.getElementById('eg-unlocks').value.trim() || null;
  if (!label) { toast('Label cannot be empty', '#FF3B3B'); return; }
  Object.assign(g, { label, node, xp_cost, unlocks });
  editingGoal = null;
  renderGoals();
  toast('Goal updated', '#00c853');
}

/**
 * Deletes a goal with a double-click confirmation pattern.
 * First click: button warns. Second click within 3 s: deletes.
 * @param {number}     gid - Goal ID
 * @param {MouseEvent} e
 */
function deleteGoal(gid, e) {
  if (deleteGoalPending === gid) {
    clearTimeout(window._deleteGoalTimer);
    deleteGoalPending = null;
    state.goals = state.goals.filter(g => g.id !== gid);
    expandedGoals.delete(gid);
    if (editingGoal === gid) editingGoal = null;
    renderGoals();
    toast('Goal deleted', '#FF3B3B');
  } else {
    deleteGoalPending = gid;
    const btn = e.target;
    btn.textContent      = '⚠ CLICK AGAIN TO CONFIRM';
    btn.style.background = '#0a0a0a';
    window._deleteGoalTimer = setTimeout(() => {
      deleteGoalPending = null;
      renderGoals();
    }, 3000);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// 15. ACTIONS: SUBTASKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toggles a subtask's done state.
 * Awards TASK_XP to the goal's node on completion.
 * @param {number} gid - Goal ID
 * @param {number} tid - Subtask ID
 */
function toggleTask(gid, tid) {
  const g = state.goals.find(x => x.id === gid);
  if (!g) return;
  const t = g.subtasks.find(x => x.id === tid);
  if (!t) return;
  t.done = !t.done;
  if (t.done) {
    addXp(g.node, TASK_XP);
    toast(`+${TASK_XP} XP — ${state.nodes[g.node].label}`, '#FFE500');
  }
  renderGoals();
  renderNodes();
  renderHeader();
}

/**
 * Removes a subtask from a goal.
 * @param {number} gid - Goal ID
 * @param {number} tid - Subtask ID
 */
function deleteTask(gid, tid) {
  const g = state.goals.find(x => x.id === gid);
  if (!g) return;
  g.subtasks = g.subtasks.filter(t => t.id !== tid);
  renderGoals();
}

/**
 * Adds a new subtask from the inline milestone input.
 * @param {number} gid - Goal ID
 */
function addTask(gid) {
  const inp   = document.getElementById(`ti-${gid}`);
  const label = inp?.value.trim();
  if (!label) return;
  const g = state.goals.find(x => x.id === gid);
  if (!g) return;
  g.subtasks.push({ id: state.nextTaskId++, label, done: false });
  expandedGoals.add(gid);
  inp.value = '';
  renderGoals();
}


// ─────────────────────────────────────────────────────────────────────────────
// 16. ACTIONS: NODES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new custom node from the Manage panel form.
 */
function addNode() {
  const label = document.getElementById('n-label').value.trim();
  const icon  = document.getElementById('n-icon').value.trim() || '⭐';
  const color = document.getElementById('n-color').value;
  if (!label) { toast('Enter a node name', '#FF3B3B'); return; }
  const key = `node_${Date.now()}`;
  state.nodes[key] = { label, icon, color, xp: 0, level: 1 };
  document.getElementById('n-label').value = '';
  document.getElementById('n-icon').value  = '';
  refreshNodeSelects();
  renderNodes();
  renderManageNodes();
  toast(`Node added: ${label}`, '#00c853');
}

/**
 * Removes a custom node from state.
 * Habits/goals on the deleted node are reassigned to 'work'.
 * Built-in nodes cannot be removed.
 * @param {string} key - Node key
 */
function deleteNode(key) {
  if (BUILT_IN_NODES.includes(key)) {
    toast('Cannot delete built-in nodes', '#FF3B3B');
    return;
  }
  state.habits.forEach(h => { if (h.node === key) h.node = 'work'; });
  state.goals.forEach(g  => { if (g.node === key) g.node = 'work'; });
  delete state.nodes[key];
  refreshNodeSelects();
  renderFactory();
  renderGoals();
  renderNodes();
  renderManageNodes();
  toast('Node removed', '#FF3B3B');
}


// ─────────────────────────────────────────────────────────────────────────────
// 17. INITIALISATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wires up event listeners that cannot live as onclick attributes in the HTML
 * (because the JS is in a separate file loaded at end of body).
 */
function _bindStaticListeners() {
  // Tab switching
  document.querySelectorAll('.tab[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.panel;
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`panel-${id}`).classList.add('active');
      if (id === 'nodes') renderNodes();
    });
  });

  document.getElementById('btn-add-habit').addEventListener('click', addHabit);
  document.getElementById('btn-add-goal').addEventListener('click',  addGoal);
  document.getElementById('btn-add-node').addEventListener('click',  addNode);

  // Allow Enter key on habit/goal name inputs
  document.getElementById('h-name').addEventListener('keydown', e => { if (e.key === 'Enter') addHabit(); });
  document.getElementById('g-label').addEventListener('keydown', e => { if (e.key === 'Enter') addGoal(); });
}

/**
 * Bootstraps the application: binds listeners, populates selects, renders all panels.
 */
function init() {
  _bindStaticListeners();
  refreshNodeSelects();
  renderHeader();
  renderFactory();
  renderGoals();
  renderNodes();
  renderManage();
  renderManageNodes();
}

init();
