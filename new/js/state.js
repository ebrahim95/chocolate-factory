// =============================================================================
// state.js — Single source of truth for all application data
//            and mutable UI-state variables
// =============================================================================

/**
 * @typedef {Object} NodeData
 * @property {string} label    - Display name, e.g. "Health"
 * @property {string} icon     - Emoji icon, e.g. "❤️"
 * @property {string} color    - CSS colour string for theming
 * @property {number} xp       - Total accumulated XP (never resets)
 * @property {number} level    - Current level, derived from xp
 * @property {string} identity - "I am someone who…" affirmation statement
 */

/**
 * @typedef {Object} Habit
 * @property {number}      id        - Unique auto-incrementing ID
 * @property {string}      name      - Display name
 * @property {string}      node      - Key into state.nodes
 * @property {string}      time      - 'morning' | 'afternoon' | 'evening' | 'anytime'
 * @property {string}      priority  - 'high' | 'medium' | 'low'
 * @property {number}      xp        - XP awarded on completion
 * @property {string}      notes     - Optional context shown under the habit name
 * @property {number|null} qtyTarget - Required count for quantity-based habits, or null
 * @property {string}      qtyUnit   - Unit label, e.g. "glasses"
 * @property {number[]}    days      - Day-of-week indices (0=Sun). Empty = every day.
 */

/**
 * @typedef {Object} Subtask
 * @property {number}  id    - Unique auto-incrementing ID
 * @property {string}  label - Milestone description
 * @property {boolean} done  - Whether this milestone has been completed
 */

/**
 * @typedef {Object} Goal
 * @property {number}    id        - Unique auto-incrementing ID
 * @property {string}    label     - Short goal title
 * @property {string}    node      - Key into state.nodes
 * @property {number}    xp_cost   - Node XP required to unlock/research this goal
 * @property {string|null} unlocks - Label of the next goal this unlocks, or null
 * @property {boolean}   completed - Whether this goal has been researched
 * @property {Subtask[]} subtasks  - Ordered list of milestones
 */

/**
 * @typedef {Object} FocusSession
 * @property {string} node        - Key into state.nodes
 * @property {string} task        - Description of what was worked on
 * @property {number} targetMins  - Intended session length in minutes
 * @property {number} actualMins  - Real elapsed time in minutes
 * @property {number} xpAwarded   - XP granted on session completion
 * @property {string} date        - ISO date string "YYYY-MM-DD"
 */

/**
 * @typedef {Object} Experiment
 * @property {number} id      - Unique auto-incrementing ID
 * @property {number} goalId  - ID of the related goal
 * @property {string} what    - Description of what was tried
 * @property {string} outcome - 'win' | 'partial' | 'fail'
 * @property {string} insight - Key learning or adjustment note
 * @property {string} date    - ISO date string "YYYY-MM-DD"
 */

/**
 * @typedef {Object} AppState
 * @property {Object.<string, NodeData>}            nodes         - Resource nodes keyed by slug
 * @property {Habit[]}                              habits        - All user habits
 * @property {Goal[]}                               goals         - All user goals
 * @property {Object.<string, number[]>}            completions   - Date → completed habit IDs
 * @property {Object.<string, Object.<number,number>>} qtyProgress - Date → habitId → count
 * @property {FocusSession[]}                       focusSessions - Newest-first session log
 * @property {Experiment[]}                         experiments   - Newest-first experiment log
 * @property {number}                               nextHabitId   - Auto-increment counter
 * @property {number}                               nextGoalId    - Auto-increment counter
 * @property {number}                               nextTaskId    - Auto-increment counter
 * @property {number}                               nextExpId     - Auto-increment counter
 */

/** @type {AppState} */
const state = {
  nodes: {
    health:  { label: 'Health',  icon: '❤️',  color: '#e05c5c', xp: 0, level: 1, identity: 'I am someone who moves their body every day.' },
    mind:    { label: 'Mind',    icon: '🧠',  color: '#7c6af7', xp: 0, level: 1, identity: 'I am someone who never stops learning.' },
    work:    { label: 'Work',    icon: '⚙️',  color: '#f0a500', xp: 0, level: 1, identity: 'I am someone who does deep, focused work.' },
    social:  { label: 'Social',  icon: '🤝',  color: '#4ec9b0', xp: 0, level: 1, identity: 'I am someone who invests in relationships.' },
    finance: { label: 'Finance', icon: '💰',  color: '#5cb85c', xp: 0, level: 1, identity: 'I am someone who builds wealth intentionally.' },
  },

  habits: [
    { id: 1, name: 'Morning workout',       node: 'health',  time: 'morning',   priority: 'high',   xp: 30, notes: '',                   qtyTarget: null, qtyUnit: '',        days: [] },
    { id: 2, name: 'Read 20 mins',          node: 'mind',    time: 'evening',   priority: 'medium', xp: 25, notes: 'Any book/article',    qtyTarget: null, qtyUnit: '',        days: [] },
    { id: 3, name: 'Deep work block (90m)', node: 'work',    time: 'morning',   priority: 'high',   xp: 40, notes: 'No distractions',     qtyTarget: null, qtyUnit: '',        days: [] },
    { id: 4, name: 'Drink 2L water',        node: 'health',  time: 'anytime',   priority: 'medium', xp: 20, notes: '',                   qtyTarget: 8,    qtyUnit: 'glasses', days: [] },
    { id: 5, name: 'Reach out to someone',  node: 'social',  time: 'afternoon', priority: 'medium', xp: 25, notes: 'Text, call, or meet', qtyTarget: null, qtyUnit: '',        days: [] },
    { id: 6, name: 'Log expenses',          node: 'finance', time: 'evening',   priority: 'low',    xp: 15, notes: '',                   qtyTarget: null, qtyUnit: '',        days: [] },
  ],

  goals: [
    { id: 1, label: 'Complete 7-day streak',  node: 'health',  xp_cost: 200, unlocks: 'Run a 5K',             completed: false, subtasks: [
      { id: 1,  label: 'Track workout 3 days straight', done: false },
      { id: 2,  label: 'Establish a morning routine',   done: false },
      { id: 3,  label: 'Hit the full 7-day streak',     done: false },
    ]},
    { id: 2, label: 'Read 5 books',            node: 'mind',    xp_cost: 300, unlocks: 'Start a writing habit', completed: false, subtasks: [
      { id: 4,  label: 'Finish first book',              done: false },
      { id: 5,  label: 'Summarise learnings',            done: false },
      { id: 6,  label: 'Read 3 more books',              done: false },
    ]},
    { id: 3, label: '30 deep work sessions',   node: 'work',    xp_cost: 500, unlocks: 'Launch a side project', completed: false, subtasks: [
      { id: 7,  label: 'Define deep work schedule',      done: false },
      { id: 8,  label: 'Complete 10 sessions',           done: false },
      { id: 9,  label: 'Complete 20 sessions',           done: false },
      { id: 10, label: 'Hit 30 — reflect & refine',      done: false },
    ]},
    { id: 4, label: 'Save 1 month expenses',   node: 'finance', xp_cost: 400, unlocks: 'Invest surplus',        completed: false, subtasks: [
      { id: 11, label: 'Audit monthly spending',         done: false },
      { id: 12, label: 'Identify 3 areas to cut',        done: false },
      { id: 13, label: 'Build 2-week savings buffer',    done: false },
      { id: 14, label: 'Reach full 1-month goal',        done: false },
    ]},
  ],

  completions:   {},   // { [dateStr]: habitId[] }
  qtyProgress:   {},   // { [dateStr]: { [habitId]: number } }
  focusSessions: [],   // FocusSession[]  — newest first
  experiments:   [],   // Experiment[]    — newest first

  nextHabitId: 7,
  nextGoalId:  5,
  nextTaskId:  15,
  nextExpId:   1,
};

// ── UI / transient state ──────────────────────────────────────────────────────

/**
 * Set of goal IDs whose milestone list is currently expanded in the UI.
 * Stored outside `state` because it is purely presentational — it does not
 * need to be persisted and should not trigger full re-renders on its own.
 * @type {Set<number>}
 */
const expandedGoals = new Set();

/**
 * ID of the goal whose inline edit form is currently open, or null.
 * Only one goal can be in edit mode at a time.
 * @type {number|null}
 */
let editingGoal = null;

/**
 * ID of the habit whose inline edit row is currently open in the Manage
 * panel, or null. Only one habit can be in edit mode at a time.
 * @type {number|null}
 */
let editingHabit = null;

/**
 * ID of the goal currently awaiting delete confirmation (two-click pattern),
 * or null if no delete is pending.
 * @type {number|null}
 */
let deleteGoalPending = null;

// ── Deep-work timer state ─────────────────────────────────────────────────────

/**
 * Active setInterval handle for the focus clock tick, or null when idle.
 * @type {number|null}
 */
let focusTimer = null;

/**
 * Timestamp (from Date.now()) captured when the current session started.
 * Used to calculate elapsed time on each clock tick.
 * @type {number|null}
 */
let focusStartTime = null;

/**
 * Target duration in minutes chosen before the session started.
 * Stored so it can be saved on the session record when the session ends.
 * @type {number}
 */
let focusTargetMins = 0;

/**
 * Key into state.nodes for the node the current session is contributing to.
 * @type {string}
 */
let focusNodeKey = '';

/**
 * Description of the task being worked on in the current session.
 * @type {string}
 */
let focusTask = '';

/**
 * Duration (in minutes) of the currently highlighted preset button.
 * Set to 0 when the user types a custom value instead.
 * @type {number}
 */
let focusSelectedMins = 50;
