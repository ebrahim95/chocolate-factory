// =============================================================================
// actions/subtasks.js — Milestone/subtask mutations
// =============================================================================

/**
 * Toggles a subtask's `done` state within a goal's subtask array.
 * When a subtask is marked done, TASK_XP is awarded to the goal's node
 * and the header/nodes panel are refreshed to reflect the new XP/level.
 *
 * Note: XP is only awarded on completion (not reversed on un-checking),
 * consistent with the habit toggle behaviour.
 *
 * @param {number} gid - ID of the parent goal
 * @param {number} tid - ID of the subtask to toggle
 * @returns {void}
 */
const toggleTask = (gid, tid) => {
  const g = state.goals.find(x => x.id === gid); if (!g) return;
  const t = g.subtasks.find(x => x.id === tid);  if (!t) return;

  t.done = !t.done;
  if (t.done) {
    addXp(g.node, TASK_XP);
    toast(`+${TASK_XP} XP — ${state.nodes[g.node].label}`, '#FFE500');
  }

  renderGoals();
  renderNodes();
  renderHeader();
};

/**
 * Permanently removes a subtask from its parent goal's `subtasks` array.
 * Does not award or remove XP regardless of the subtask's `done` state.
 *
 * @param {number} gid - ID of the parent goal
 * @param {number} tid - ID of the subtask to delete
 * @returns {void}
 */
const deleteTask = (gid, tid) => {
  const g = state.goals.find(x => x.id === gid); if (!g) return;
  g.subtasks = g.subtasks.filter(t => t.id !== tid);
  renderGoals();
};

/**
 * Reads the inline milestone input for a goal (`#ti-{gid}`), validates,
 * appends a new subtask to the goal's `subtasks` array, and ensures the
 * goal is in the `expandedGoals` set so the new task is immediately visible.
 *
 * Does nothing if the input is empty or the goal cannot be found.
 *
 * @param {number} gid - ID of the goal to add a milestone to
 * @returns {void}
 */
const addTask = (gid) => {
  const inp   = document.getElementById(`ti-${gid}`);
  const label = inp?.value.trim();
  if (!label) return;

  const g = state.goals.find(x => x.id === gid); if (!g) return;
  g.subtasks.push({ id: state.nextTaskId++, label, done: false });
  expandedGoals.add(gid); // keep the section open so the new task is visible
  inp.value = '';
  renderGoals();
};
