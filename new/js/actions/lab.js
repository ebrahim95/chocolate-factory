// =============================================================================
// actions/lab.js — Experiment log mutations
// =============================================================================

/**
 * Reads the Lab entry form, validates, prepends a new experiment to
 * `state.experiments`, resets the form inputs, and refreshes the UI.
 *
 * Validation: the "what did you try" field must be non-empty.
 * The `goalId` is read from the goal select and parsed as an integer.
 *
 * After saving, both the lab log and the goal list are re-rendered so that
 * the experiment count pill on goal cards stays accurate.
 *
 * Side effects:
 *   - Prepends to `state.experiments`
 *   - Clears `#lab-what` and `#lab-insight`
 *   - Calls `renderLabLog()` and `renderGoals()`
 *
 * @returns {void}
 */
const addExperiment = () => {
  const goalId  = parseInt(document.getElementById('lab-goal').value);
  const what    = document.getElementById('lab-what').value.trim();
  const outcome = document.getElementById('lab-outcome').value;
  const insight = document.getElementById('lab-insight').value.trim();

  if (!what) { toast('Describe what you tried', '#FF3B3B'); return; }

  state.experiments.unshift({
    id: state.nextExpId++,
    goalId, what, outcome, insight,
    date: todayStr(),
  });

  document.getElementById('lab-what').value    = '';
  document.getElementById('lab-insight').value = '';

  renderLabLog();
  renderGoals(); // keep experiment count pills on goal cards up to date
  toast(`Experiment logged — ${outcome}`, '#00c853');
};

/**
 * Permanently removes an experiment from `state.experiments` by ID and
 * re-renders the lab log and goal list.
 *
 * @param {number} id - The unique ID of the experiment to delete
 * @returns {void}
 */
const deleteExperiment = (id) => {
  state.experiments = state.experiments.filter(e => e.id !== id);
  renderLabLog();
  renderGoals();
};
