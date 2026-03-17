// =============================================================================
// components/LabPanel.js
//
// Experiment Lab panel (Psychology Principle 4: learning loops).
// Every attempt against a goal — win, partial, or fail — is logged here
// with an outcome tag and an optional insight/adjustment note.
// =============================================================================

/**
 * Keeps the "Goal" `<select>` in the Lab entry form synchronised with
 * `state.goals`. Preserves the currently selected option across re-renders.
 *
 * Called after any goal is added, edited, or deleted so the dropdown
 * always reflects the current goal list.
 *
 * Side effects:
 *   - Replaces all `<option>` children of `#lab-goal`
 *
 * @returns {void}
 */
const refreshLabGoalSelect = () => {
  const sel = document.getElementById('lab-goal');
  if (!sel) return;

  const current = sel.value;
  sel.replaceChildren();

  if (!state.goals.length) {
    const opt    = el('option', [], '— add goals first —');
    opt.disabled = true;
    sel.appendChild(opt);
    return;
  }

  state.goals.forEach(g => {
    const nd  = state.nodes[g.node];
    const opt = el('option', [], `${nd?.icon || ''} ${g.label}`);
    opt.value    = g.id;
    opt.selected = String(g.id) === current;
    sel.appendChild(opt);
  });
};

/**
 * Builds a single experiment log entry card.
 *
 * Layout:
 *   - Head row: outcome badge (✅/⚡/❌) | task description + goal/date meta | delete button
 *   - Optional insight row: shown only when `exp.insight` is non-empty
 *
 * The card's left-border accent colour is driven by the related goal's node colour.
 *
 * @param {Experiment} exp - A single experiment record from `state.experiments`
 * @returns {HTMLDivElement} The `.lab-entry` card element
 */
const buildLabEntry = (exp) => {
  const goal  = state.goals.find(g => g.id === exp.goalId);
  const nd    = goal ? state.nodes[goal.node] : null;

  const entry = el('div', ['lab-entry']);
  entry.style.setProperty('--c', nd?.color || '#888');

  // Head row
  const head        = el('div', ['lab-entry-head']);
  const outcomeText = { win: '✅ Win', partial: '⚡ Partial', fail: '❌ Fail' };
  const badge       = el('div', ['lab-outcome-badge', exp.outcome]);
  badge.textContent = outcomeText[exp.outcome] || exp.outcome;

  const body = el('div');
  body.style.cssText = 'flex:1;min-width:0';
  body.append(
    el('div', ['lab-what'], exp.what),
    el('div', ['lab-meta'], `${nd?.icon || ''} ${goal?.label || 'Unknown goal'} · ${exp.date}`)
  );

  const delBtn = el('button', ['btn', 'btn-ghost'], '✕');
  delBtn.style.cssText = 'padding:3px 8px;font-size:.7rem;flex-shrink:0';
  delBtn.addEventListener('click', () => deleteExperiment(exp.id));

  head.append(badge, body, delBtn);
  entry.appendChild(head);

  // Insight row — rendered only when a learning note was recorded
  if (exp.insight) {
    entry.appendChild(el('div', ['lab-insight'], `💡 ${exp.insight}`));
  }

  return entry;
};

/**
 * Renders the full experiment log inside `#lab-log`.
 * Shows an empty-state prompt when no experiments have been logged yet.
 *
 * Side effects:
 *   - Replaces all children of `#lab-log`
 *
 * @returns {void}
 */
const renderLabLog = () => {
  const container = document.getElementById('lab-log');

  if (!state.experiments.length) {
    clearAndAppend(container, [
      el('p', ['empty-msg'],
        'No experiments logged yet. Every attempt — win or fail — teaches you something.'),
    ]);
    return;
  }

  clearAndAppend(container, state.experiments.map(buildLabEntry));
};

/**
 * Public render entry point for the Lab panel.
 * Refreshes the goal select and re-renders the experiment log.
 * Called when the tab becomes active or after any experiment is added/deleted.
 *
 * @returns {void}
 */
const renderLab = () => {
  refreshLabGoalSelect();
  renderLabLog();
};
