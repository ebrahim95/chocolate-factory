// =============================================================================
// components/Summary.js
//
// Renders the four "Today's Output" stat cards at the bottom of the
// Systems panel: Completed, Efficiency, Best Streak, Deep Work.
// Implements Psychology Principle 2: progress visibility.
// =============================================================================

/**
 * Builds a single stat card DOM node for the summary grid.
 *
 * @param {string} lbl   - Short uppercase label shown above the value
 * @param {string} val   - The metric value to display (already formatted)
 * @param {string} color - CSS colour string applied to the value text
 * @returns {HTMLDivElement} A `.sum-card` element containing label + value divs
 */
const buildStatCard = (lbl, val, color) => {
  const card  = el('div', ['sum-card']);
  const label = el('div', ['sum-lbl'], lbl);
  const value = el('div', ['sum-val'], val);
  value.style.color = color;
  card.append(label, value);
  return card;
};

/**
 * Renders the four summary stat cards inside `#summary`.
 *
 * Cards displayed:
 *   1. COMPLETED   — "done / total" habits scheduled today
 *   2. EFFICIENCY  — percentage of scheduled habits completed (colour-coded)
 *   3. BEST STREAK — longest current streak across all habits
 *   4. DEEP WORK   — total focus minutes logged this session
 *
 * Side effects:
 *   - Sets `grid-template-columns` on `#summary` to force 4-column layout
 *   - Replaces all children of `#summary`
 *
 * @returns {void}
 */
const renderSummary = () => {
  const today     = todayStr();
  const dow       = new Date().getDay();
  const scheduled = state.habits.filter(h => isScheduledToday(h, dow));
  const total     = scheduled.length;
  const doneCount = (state.completions[today] || [])
    .filter(id => scheduled.some(h => h.id === id)).length;
  const best      = state.habits.length
    ? Math.max(...state.habits.map(h => streak(h.id)))
    : 0;
  const e         = efficiency();
  const focusMins = totalFocusMinutes();

  const grid = document.getElementById('summary');
  grid.style.gridTemplateColumns = 'repeat(4, 1fr)';

  clearAndAppend(grid, [
    buildStatCard('COMPLETED',   `${doneCount}/${total}`, '#00c853'),
    buildStatCard('EFFICIENCY',  `${e}%`,                 effColor(e)),
    buildStatCard('BEST STREAK', `${best}d`,              '#1a1aff'),
    buildStatCard('DEEP WORK',   fmtMins(focusMins),      '#f0a500'),
  ]);
};
