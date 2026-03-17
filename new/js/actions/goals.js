// =============================================================================
// actions/goals.js — Goal mutations: add, research, edit, delete, expand
// =============================================================================

/**
 * Reads the "Add Goal" form, validates, pushes a new goal into `state.goals`,
 * resets the form, and refreshes the goal list and lab goal select.
 *
 * Validation: goal label must be non-empty.
 * New goals start with an empty subtask array and `completed: false`.
 *
 * @returns {void}
 */
const addGoal = () => {
  const label   = document.getElementById('g-label').value.trim();
  const node    = document.getElementById('g-node').value;
  const xp_cost = parseInt(document.getElementById('g-xp').value) || 200;
  const unlocks = document.getElementById('g-unlocks').value.trim() || null;

  if (!label) { toast('Enter a goal label', '#FF3B3B'); return; }

  state.goals.push({ id: state.nextGoalId++, label, node, xp_cost, unlocks, completed: false, subtasks: [] });
  document.getElementById('g-label').value   = '';
  document.getElementById('g-unlocks').value = '';

  renderGoals();
  refreshLabGoalSelect();
  toast('Goal added — open Goals to add milestones', '#00c853');
};

/**
 * "Researches" (unlocks) a goal by spending node XP.
 * Deducts `g.xp_cost` from the node's XP, recalculates the node's level,
 * marks the goal as completed, and re-renders.
 *
 * Does nothing if:
 *   - The goal cannot be found
 *   - The goal is already completed
 *   - The node does not have enough XP
 *
 * @param {number} gid - ID of the goal to research
 * @returns {void}
 */
const researchGoal = (gid) => {
  const g = state.goals.find(x => x.id === gid);
  if (!g || g.completed) return;

  if (state.nodes[g.node].xp >= g.xp_cost) {
    state.nodes[g.node].xp    -= g.xp_cost;
    state.nodes[g.node].level  = levelFromXp(state.nodes[g.node].xp);
    g.completed = true;
    renderGoals();
    renderNodes();
    toast(`✅ Unlocked: ${g.label}`, '#00c853');
  }
};

/**
 * Toggles the milestone list expand/collapse state for a goal.
 * Adds the ID to `expandedGoals` if not present, or removes it if already there.
 *
 * @param {number} gid - ID of the goal to toggle
 * @returns {void}
 */
const toggleExpand = (gid) => {
  expandedGoals.has(gid) ? expandedGoals.delete(gid) : expandedGoals.add(gid);
  renderGoals();
};

/**
 * Opens the inline edit form for a goal by setting `editingGoal` and
 * re-rendering. Schedules a 50ms focus on the label input so the user
 * can start typing immediately after the DOM settles.
 *
 * @param {number} gid - ID of the goal to start editing
 * @returns {void}
 */
const startGoalEdit = (gid) => {
  editingGoal = gid;
  renderGoals();
  setTimeout(() => document.getElementById('eg-label')?.focus(), 50);
};

/**
 * Cancels the current goal edit without saving any changes.
 * Closes the inline edit form by clearing `editingGoal`.
 *
 * @returns {void}
 */
const cancelGoalEdit = () => {
  editingGoal = null;
  renderGoals();
};

/**
 * Reads the inline goal edit form, validates, applies the updated values to
 * the goal record in `state.goals`, and closes the edit form.
 *
 * Validation: label must be non-empty.
 *
 * @param {number} gid - ID of the goal being saved
 * @returns {void}
 */
const saveGoalEdit = (gid) => {
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
  refreshLabGoalSelect();
  toast('Goal updated', '#00c853');
};

/**
 * Deletes a goal using a two-click confirmation pattern to prevent accidents.
 *
 * First click:
 *   - Sets `deleteGoalPending` to the goal's ID
 *   - Transforms the button text to a confirmation warning
 *   - Starts a 3-second timeout that resets the state if unconfirmed
 *
 * Second click (within 3 seconds):
 *   - Cancels the timeout
 *   - Removes the goal from `state.goals`
 *   - Cleans up expanded/editing state for the deleted goal
 *   - Re-renders the goal list and lab goal select
 *
 * @param {number}     gid - ID of the goal to delete
 * @param {MouseEvent} e   - The originating click event (used to access the button)
 * @returns {void}
 */
const deleteGoal = (gid, e) => {
  if (deleteGoalPending === gid) {
    clearTimeout(window._deleteGoalTimer);
    deleteGoalPending = null;
    state.goals = state.goals.filter(g => g.id !== gid);
    expandedGoals.delete(gid);
    if (editingGoal === gid) editingGoal = null;
    renderGoals();
    refreshLabGoalSelect();
    toast('Goal deleted', '#FF3B3B');
  } else {
    deleteGoalPending = gid;
    const btn            = e.target;
    btn.textContent      = '⚠ CLICK AGAIN TO CONFIRM';
    btn.style.background = '#0a0a0a';
    window._deleteGoalTimer = setTimeout(() => {
      deleteGoalPending = null;
      renderGoals();
    }, 3000);
  }
};
