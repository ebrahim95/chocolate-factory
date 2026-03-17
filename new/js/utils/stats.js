// =============================================================================
// utils/stats.js — Derived statistics calculated from state
// =============================================================================

/**
 * Calculates the percentage of today's *scheduled* habits that have been completed.
 *
 * Habits not scheduled for today (based on their `days` array) are excluded from
 * both the numerator and denominator — they neither help nor hurt the score.
 * This gives an honest picture of follow-through on commitments actually made today.
 *
 * @returns {number} A value between 0 and 100, rounded to one decimal place.
 *                   Returns 0 if no habits are scheduled today.
 *
 * @example
 * // 3 scheduled today, 2 done
 * efficiency() // → 66.7
 */
const efficiency = () => {
  const dow       = new Date().getDay();
  const scheduled = state.habits.filter(h => isScheduledToday(h, dow));
  if (!scheduled.length) return 0;
  const doneIds = state.completions[todayStr()] || [];
  const done    = doneIds.filter(id => scheduled.some(h => h.id === id)).length;
  return Math.round(done / scheduled.length * 1000) / 10;
};

/**
 * Returns the node with the lowest current level — the "weakest link"
 * in the user's system.  Displayed as a calm focus suggestion rather than
 * an alert, encouraging intentional prioritisation.
 *
 * If multiple nodes share the lowest level the first one (by insertion order)
 * is returned, which is deterministic for the built-in nodes.
 *
 * @returns {[string, NodeData]} Tuple of [nodeKey, nodeData] for the lowest-level node
 */
const bottleneck = () =>
  Object.entries(state.nodes).sort((a, b) => a[1].level - b[1].level)[0];

/**
 * Maps an efficiency percentage to a CSS colour for visual feedback.
 *
 * @param {number} e - Efficiency value 0–100
 * @returns {string} CSS colour string:
 *   - '#00c853' (green)  if e ≥ 80%  — on track
 *   - '#0a0a0a' (black)  if e ≥ 40%  — neutral (badge is already yellow)
 *   - '#FF3B3B' (red)    if e <  40%  — behind
 */
const effColor = (e) => e >= 80 ? '#00c853' : e >= 40 ? '#0a0a0a' : '#FF3B3B';

/**
 * Returns the total number of deep-work minutes logged across all sessions
 * in the current in-memory session (resets on page reload since there is no persistence).
 *
 * @returns {number} Total minutes of deep work completed
 */
const totalFocusMinutes = () =>
  state.focusSessions.reduce((sum, s) => sum + s.actualMins, 0);

/**
 * Returns the total number of lab experiments that have been recorded.
 * Used to display the experiment count pill on goal cards.
 *
 * @returns {number} Total number of experiments across all goals
 */
const totalExperiments = () => state.experiments.length;
