// =============================================================================
// components/SubtaskList.js
//
// Renders the expandable milestone list inside a goal card.
// Each row can be toggled (done/undone) and deleted.
// An inline "Add milestone" input is always shown at the bottom.
// =============================================================================

/**
 * Builds a single subtask (milestone) row.
 *
 * The row contains:
 *   - A checkbox-style indicator (empty or ✓)
 *   - The milestone label text
 *   - A delete button (✕) that stops event propagation to avoid toggling
 *
 * Clicking the row body calls `toggleTask()`.
 * The left dashed border is provided by the parent wrapper for visual hierarchy.
 *
 * @param {Goal}    g     - Parent goal (needed to call toggleTask / deleteTask)
 * @param {Subtask} t     - The subtask record to render
 * @param {string}  color - Node colour applied via `--c` CSS property for accent styling
 * @returns {HTMLDivElement} Wrapper div containing the row and delete button
 */
const buildSubtaskRow = (g, t, color) => {
  const wrap = el('div');
  wrap.style.cssText = 'display:flex;align-items:center;margin-left:10px;border-left:2px dashed #ccc';

  const row = el('div', ['st', ...(t.done ? ['done'] : [])]);
  row.style.setProperty('--c', color);
  row.style.cssText += ';flex:1;border:none;margin:0';
  row.addEventListener('click', () => toggleTask(g.id, t.id));
  row.append(
    el('div', ['st-check'], t.done ? '✓' : ''),
    el('div', ['st-lbl'],   t.label)
  );

  const del = el('button', ['st-del'], '✕');
  del.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTask(g.id, t.id);
  });

  wrap.append(row, del);
  return wrap;
};

/**
 * Builds the full milestone section shown when a goal card is expanded.
 *
 * Contains:
 *   - An empty-state message if the goal has no milestones yet
 *   - A `buildSubtaskRow()` for each existing subtask
 *   - An inline "Add milestone" row with a text input and ADD button
 *     (Enter key also triggers addTask)
 *
 * @param {Goal}   g     - Goal record whose subtasks will be rendered
 * @param {string} color - Node colour passed through to each subtask row
 * @returns {HTMLDivElement} The `.subs` container element
 */
const buildSubtaskList = (g, color) => {
  const subs = el('div', ['subs']);

  if (!g.subtasks.length) {
    subs.appendChild(el('p', ['empty-msg'], 'No milestones yet.'));
  } else {
    g.subtasks.forEach(t => subs.appendChild(buildSubtaskRow(g, t, color)));
  }

  // Inline add row — always visible at the bottom of the expanded section
  const addRow = el('div', ['st-add']);
  const input  = el('input', ['st-input']);
  input.id          = `ti-${g.id}`;
  input.placeholder = 'Add milestone…';
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(g.id); });

  const addBtn = el('button', ['btn', 'btn-amber'], '+ ADD');
  addBtn.addEventListener('click', () => addTask(g.id));

  addRow.append(input, addBtn);
  subs.appendChild(addRow);
  return subs;
};
