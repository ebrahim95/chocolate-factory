// =============================================================================
// components/HabitList.js
//
// Filters habits to today's schedule, groups them by time-of-day bucket,
// sorts by priority within each group, and renders the full list.
// Implements Psychology Principle 1: systems over motivation — routines
// are framed by time of day rather than as a flat undifferentiated list.
// =============================================================================

/**
 * Renders the full habit list for today inside `#habit-list`.
 *
 * Pipeline:
 *   1. Filter `state.habits` to those scheduled for today's day-of-week
 *   2. Sort by priority weight (high → medium → low)
 *   3. Group into time-of-day buckets (morning / afternoon / evening / anytime)
 *   4. Render a group label header followed by habit cards for each bucket
 *
 * If no habits are scheduled today, an empty-state message is shown instead.
 *
 * Side effects:
 *   - Replaces all children of `#habit-list`
 *
 * @returns {void}
 */
const renderHabitList = () => {
  const container = document.getElementById('habit-list');
  const today     = todayStr();
  const dow       = new Date().getDay();
  const done      = state.completions[today] || [];

  // Step 1 & 2: filter + sort
  const todayHabits = state.habits
    .filter(h => isScheduledToday(h, dow))
    .sort((a, b) => (PRIORITY_WEIGHT[a.priority] ?? 1) - (PRIORITY_WEIGHT[b.priority] ?? 1));

  if (!todayHabits.length) {
    clearAndAppend(container, [
      el('p', ['empty-msg'], 'No habits scheduled for today — add some in Manage.'),
    ]);
    return;
  }

  // Step 3: group by time-of-day
  const groups = Object.fromEntries(TIME_ORDER.map(t => [t, []]));
  todayHabits.forEach(h => { groups[h.time || 'anytime'].push(h); });

  // Step 4: flatten into nodes array [group label, card, card, group label, card …]
  const nodes = [];
  for (const time of TIME_ORDER) {
    const habits = groups[time];
    if (!habits.length) continue;
    nodes.push(el('div', ['habit-group-label'], TIME_LABELS[time]));
    habits.forEach(h => nodes.push(buildHabitCard(h, done, today)));
  }

  clearAndAppend(container, nodes);
};
