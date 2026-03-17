// =============================================================================
// actions/habits.js — All habit data mutations
// =============================================================================

/**
 * Adjusts the quantity progress for a quantity-based habit by `delta` (+1 or -1).
 * Clamps the result between 0 and the habit's `qtyTarget`.
 * When the new count reaches `qtyTarget` the habit is auto-completed and
 * XP is awarded exactly once (guarded by checking the completions array).
 *
 * Stops click event propagation to prevent the parent card's `toggleHabit`
 * handler from firing.
 *
 * @param {number}     id    - Habit ID to update
 * @param {number}     delta - Amount to change by (+1 or -1)
 * @param {MouseEvent} e     - The originating click event (used for xpFloat position)
 * @returns {void}
 */
const adjustQty = (id, delta, e) => {
  e.stopPropagation();
  const today = todayStr();
  if (!state.qtyProgress[today]) state.qtyProgress[today] = {};

  const h    = state.habits.find(x => x.id === id);
  const cur  = state.qtyProgress[today][id] || 0;
  const next = Math.max(0, Math.min(h.qtyTarget || 99, cur + delta));
  state.qtyProgress[today][id] = next;

  // Auto-complete once the target is reached (idempotent guard)
  if (next >= h.qtyTarget) {
    if (!state.completions[today]) state.completions[today] = [];
    if (!state.completions[today].includes(id)) {
      state.completions[today].push(id);
      const xp = h.xp || HABIT_XP;
      addXp(h.node, xp);
      xpFloat(e.clientX, e.clientY, `+${xp} XP`);
    }
  }
  renderFactory();
};

/**
 * Toggles a habit's completion state for today.
 * - If already done: removes from today's completions (no XP reversal)
 * - If not done: adds to completions and awards XP to the associated node
 *
 * @param {number}     id - Habit ID to toggle
 * @param {MouseEvent} e  - The originating click event (used for xpFloat position)
 * @returns {void}
 */
const toggleHabit = (id, e) => {
  const today = todayStr();
  if (!state.completions[today]) state.completions[today] = [];

  const lst   = state.completions[today];
  const idx   = lst.indexOf(id);
  const h     = state.habits.find(x => x.id === id);
  const xpVal = h?.xp || HABIT_XP;

  if (idx > -1) {
    lst.splice(idx, 1);
  } else {
    lst.push(id);
    if (h) {
      addXp(h.node, xpVal);
      xpFloat(e.clientX, e.clientY, `+${xpVal} XP`);
    }
  }
  renderFactory();
};

/**
 * Reads the "Add Habit" form fields, validates, pushes a new habit into
 * `state.habits`, resets the form, and re-renders.
 *
 * Validation: habit name must be non-empty.
 * All days active in the day picker are read as the schedule.
 * An empty schedule (all days toggled off) is treated as "every day".
 *
 * @returns {void}
 */
const addHabit = () => {
  const name      = document.getElementById('h-name').value.trim();
  const node      = document.getElementById('h-node').value;
  const time      = document.getElementById('h-time').value;
  const priority  = document.getElementById('h-priority').value;
  const xp        = parseInt(document.getElementById('h-xp').value) || HABIT_XP;
  const notes     = document.getElementById('h-notes').value.trim();
  const qtyTarget = parseInt(document.getElementById('h-qty-target').value) || null;
  const qtyUnit   = document.getElementById('h-qty-unit').value.trim();
  const days      = Array.from(document.querySelectorAll('#h-days .day-btn.active'))
                      .map(b => parseInt(b.dataset.day));

  if (!name) { toast('Enter a habit name', '#FF3B3B'); return; }

  state.habits.push({ id: state.nextHabitId++, name, node, time, priority, xp, notes, qtyTarget, qtyUnit, days });

  // Reset form to defaults
  document.getElementById('h-name').value       = '';
  document.getElementById('h-notes').value      = '';
  document.getElementById('h-qty-target').value = '';
  document.getElementById('h-qty-unit').value   = '';
  document.getElementById('h-xp').value         = '25';
  document.getElementById('h-time').value       = 'anytime';
  document.getElementById('h-priority').value   = 'medium';
  document.querySelectorAll('#h-days .day-btn').forEach(b => b.classList.add('active'));

  renderFactory();
  renderManage();
  toast(`Added: ${name}`, '#00c853');
};

/**
 * Opens the inline edit form for a habit in the Manage panel.
 * Sets `editingHabit` to the given ID and re-renders the list so the
 * summary row is replaced by the edit form.
 *
 * @param {number} id - ID of the habit to start editing
 * @returns {void}
 */
const startHabitEdit = (id) => { editingHabit = id; renderManage(); };

/**
 * Cancels the current habit edit without saving, closing the edit form.
 *
 * @returns {void}
 */
const cancelHabitEdit = () => { editingHabit = null; renderManage(); };

/**
 * Reads the inline edit form for the given habit ID, validates, and saves
 * the updated values back to the habit record in `state.habits`.
 * Closes the edit form on success.
 *
 * Validation: habit name must be non-empty.
 *
 * @param {number} id - ID of the habit being saved
 * @returns {void}
 */
const saveHabitEdit = (id) => {
  const h = state.habits.find(x => x.id === id);
  if (!h) return;

  const name = document.getElementById(`eh-name-${id}`).value.trim();
  if (!name) { toast('Name cannot be empty', '#FF3B3B'); return; }

  h.name      = name;
  h.node      = document.getElementById(`eh-node-${id}`).value;
  h.time      = document.getElementById(`eh-time-${id}`).value;
  h.priority  = document.getElementById(`eh-priority-${id}`).value;
  h.xp        = parseInt(document.getElementById(`eh-xp-${id}`).value) || HABIT_XP;
  h.notes     = document.getElementById(`eh-notes-${id}`).value.trim();
  h.qtyTarget = parseInt(document.getElementById(`eh-qty-target-${id}`).value) || null;
  h.qtyUnit   = document.getElementById(`eh-qty-unit-${id}`).value.trim();
  h.days      = Array.from(document.querySelectorAll(`#eh-days-${id} .day-btn.active`))
                  .map(b => parseInt(b.dataset.day));

  editingHabit = null;
  renderFactory();
  renderManage();
  toast('Habit updated', '#00c853');
};

/**
 * Permanently removes a habit from `state.habits` and closes any open
 * edit form for it. Note: historical completion data in `state.completions`
 * is intentionally kept for heatmap accuracy.
 *
 * @param {number} id - ID of the habit to delete
 * @returns {void}
 */
const deleteHabit = (id) => {
  state.habits = state.habits.filter(h => h.id !== id);
  editingHabit = null;
  renderFactory();
  renderManage();
  toast('Habit removed', '#FF3B3B');
};
