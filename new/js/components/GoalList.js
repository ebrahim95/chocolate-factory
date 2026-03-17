// =============================================================================
// components/GoalList.js — Renders the full Goals (Tech Tree) panel
// =============================================================================

/**
 * Renders all goal cards inside `#goal-list`.
 * Shows an empty-state message when no goals have been added yet.
 *
 * Goals are rendered in their insertion order (the order they appear in
 * `state.goals`). Each goal is rendered by `buildGoalCard()` which handles
 * expanded/editing/completed states internally.
 *
 * Side effects:
 *   - Replaces all children of `#goal-list`
 *
 * @returns {void}
 */
const renderGoals = () => {
  const container = document.getElementById('goal-list');

  if (!state.goals.length) {
    clearAndAppend(container, [
      el('p', ['empty-msg'], 'No goals yet — add some in Manage.'),
    ]);
    return;
  }

  clearAndAppend(container, state.goals.map(buildGoalCard));
};
