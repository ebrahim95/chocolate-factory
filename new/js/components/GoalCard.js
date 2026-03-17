// =============================================================================
// components/GoalCard.js
//
// Builds a single goal card.  Composed from four sub-builders:
//   buildGoalBadge()    — status pill (XP counter / READY / DONE)
//   buildGoalButtons()  — action row (Research, Milestones toggle, Edit)
//   buildGoalEditForm() — inline edit form (label, node, XP cost, unlocks)
//   buildGoalCard()     — full card assembly (calls all of the above)
// =============================================================================

/**
 * Builds the status badge shown in the top-right of a goal card.
 * Three visual states:
 *   - **XP counter** (grey)  — not enough XP yet; shows "current/required XP"
 *   - **READY** (yellow)     — node has enough XP; goal can be researched now
 *   - **DONE** (green)       — goal has already been completed/researched
 *
 * @param {Goal}    g           - The goal record
 * @param {boolean} canResearch - True when node XP ≥ goal's xp_cost and not completed
 * @param {number}  nodeXp      - Current XP of the goal's associated node
 * @returns {HTMLSpanElement} The styled badge element
 */
const buildGoalBadge = (g, canResearch, nodeXp) => {
  const badge = el('span');
  badge.style.cssText = "font-family:'Archivo Black',sans-serif;font-size:.67rem;padding:2px 8px;";

  if (g.completed) {
    badge.textContent      = '✓ DONE';
    badge.style.background = '#00c853';
    badge.style.color      = '#0a0a0a';
    badge.style.border     = '2px solid #0a0a0a';
  } else if (canResearch) {
    badge.textContent      = '◈ READY';
    badge.style.background = '#FFE500';
    badge.style.color      = '#0a0a0a';
    badge.style.border     = '2px solid #0a0a0a';
  } else {
    badge.textContent      = `${nodeXp}/${g.xp_cost} XP`;
    badge.style.background = '#e8e3d8';
    badge.style.color      = '#555';
    badge.style.border     = '2px solid #ccc';
    badge.style.fontFamily = "'Space Mono',monospace";
  }

  return badge;
};

/**
 * Builds the action-button row at the bottom of a goal card head section.
 *
 * Buttons shown (conditionally):
 *   - **RESEARCH** (amber)  — only when canResearch; calls `researchGoal()`
 *   - **COMPLETE ✓** (green, non-interactive)  — only when goal is completed
 *   - **▸ MILESTONES / ▾ HIDE** — always shown; toggles the subtask section
 *   - **✏ EDIT** — always shown, right-aligned; opens the inline edit form
 *
 * @param {Goal}    g               - The goal record
 * @param {boolean} canResearch     - Whether the RESEARCH button should appear
 * @param {boolean} isExpanded      - Whether the milestones section is currently open
 * @param {number}  totalMilestones - Count of subtasks (shown in button label)
 * @returns {HTMLDivElement} The `.goal-btns` row element
 */
const buildGoalButtons = (g, canResearch, isExpanded, totalMilestones) => {
  const row = el('div', ['goal-btns']);

  if (canResearch) {
    const researchBtn = el('button', ['btn', 'btn-amber'], 'RESEARCH');
    researchBtn.addEventListener('click', () => researchGoal(g.id));
    row.appendChild(researchBtn);
  } else if (g.completed) {
    row.appendChild(el('div', ['btn', 'btn-green'], 'COMPLETE ✓'));
  }

  const expandLabel = isExpanded ? '▾ HIDE' : `▸ MILESTONES (${totalMilestones})`;
  const expandBtn   = el('button', ['btn', 'btn-ghost'], expandLabel);
  expandBtn.addEventListener('click', () => toggleExpand(g.id));
  row.appendChild(expandBtn);

  const editBtn = el('button', ['btn', 'btn-ghost'], '✏ EDIT');
  editBtn.style.marginLeft = 'auto';
  editBtn.addEventListener('click', () => startGoalEdit(g.id));
  row.appendChild(editBtn);

  return row;
};

/**
 * Builds the inline edit form that appears below the goal card head
 * when the edit button is clicked.
 *
 * Fields: Goal Label, Node (select), XP Cost, Unlocks
 * Buttons: ✓ SAVE, ✕ CANCEL, 🗑 DELETE GOAL (two-click confirm)
 *
 * @param {Goal} g - The goal record being edited (pre-fills form values)
 * @returns {HTMLDivElement} The edit form wrapper element
 */
const buildGoalEditForm = (g) => {
  const wrap = el('div');
  wrap.style.cssText = 'background:#f0ebe0;border-top:3px solid #0a0a0a;padding:14px;display:flex;flex-direction:column;gap:10px';

  const fields = el('div');
  fields.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end';

  fields.appendChild(formField('Goal Label', 'eg-label',   'input',  g.label,         { style: 'width:200px' }));
  fields.appendChild(formField('Node',       'eg-node',    'select', ''));
  fields.appendChild(formField('XP Cost',    'eg-xp',      'input',  g.xp_cost,       { type: 'number', style: 'width:90px' }));
  fields.appendChild(formField('Unlocks',    'eg-unlocks', 'input',  g.unlocks || '', { placeholder: 'Next goal…', style: 'width:180px' }));

  // Populate node <select> with current selection pre-checked
  const nodeSelect = fields.querySelector('#eg-node');
  for (const [k, nd] of Object.entries(state.nodes)) {
    const opt  = el('option', [], `${nd.icon} ${nd.label}`);
    opt.value    = k;
    opt.selected = k === g.node;
    nodeSelect.appendChild(opt);
  }

  const btns = el('div');
  btns.style.cssText = 'display:flex;gap:8px';

  const saveBtn = el('button', ['btn', 'btn-amber'], '✓ SAVE');
  saveBtn.addEventListener('click', () => saveGoalEdit(g.id));

  const cancelBtn = el('button', ['btn', 'btn-ghost'], '✕ CANCEL');
  cancelBtn.addEventListener('click', cancelGoalEdit);

  const deleteBtn = el('button', ['btn'], '🗑 DELETE GOAL');
  deleteBtn.style.cssText = 'background:#FF3B3B;color:#f5f0e8;border-color:#0a0a0a;margin-left:auto';
  deleteBtn.addEventListener('click', (e) => deleteGoal(g.id, e));

  btns.append(saveBtn, cancelBtn, deleteBtn);
  wrap.append(fields, btns);
  return wrap;
};

/**
 * Builds the complete goal card for a single goal record.
 *
 * Structure:
 *   `.goal`
 *     `.goal-head`
 *       title row (goal title + status badge)
 *       meta line (node name + XP cost)
 *       optional "Unlocks" line
 *       XP progress bar
 *       optional milestone progress bar (when subtasks exist)
 *       optional experiment count pill
 *       action buttons row
 *     [inline edit form]   — only when `editingGoal === g.id`
 *     [subtask list]       — only when goal is in `expandedGoals`
 *
 * @param {Goal} g - The goal record to render
 * @returns {HTMLDivElement} The complete `.goal` card element
 */
const buildGoalCard = (g) => {
  const nd          = state.nodes[g.node];
  const nodeXp      = nd.xp;
  const fracXp      = Math.min(100, nodeXp / g.xp_cost * 100).toFixed(1);
  const doneT       = g.subtasks.filter(t => t.done).length;
  const totalT      = g.subtasks.length;
  const fracT       = totalT ? (doneT / totalT * 100).toFixed(1) : 0;
  const canResearch = nodeXp >= g.xp_cost && !g.completed;
  const isExpanded  = expandedGoals.has(g.id);
  const isEditing   = editingGoal === g.id;
  const expCount    = state.experiments.filter(e => e.goalId === g.id).length;

  const card = el('div', ['goal']);
  card.style.setProperty('--c', nd.color);
  card.style.opacity = (g.completed && !isEditing) ? '0.65' : '1';

  // ── Head section ───────────────────────────────────────────────────────────
  const head     = el('div', ['goal-head']);
  const titleRow = el('div');
  titleRow.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px';
  titleRow.append(
    el('div', ['goal-title'], `${nd.icon} ${g.label}`),
    buildGoalBadge(g, canResearch, nodeXp)
  );
  head.appendChild(titleRow);

  head.appendChild(el('div', ['goal-meta'], `${nd.label.toUpperCase()} · ${g.xp_cost} XP REQUIRED`));
  if (g.unlocks) head.appendChild(el('div', ['goal-unlocks'], `→ Unlocks: ${g.unlocks}`));

  head.appendChild(labeledBar('XP PROGRESS', fracXp, nd.color));
  if (totalT) head.appendChild(labeledBar(`MILESTONES ${doneT}/${totalT}`, fracT, '#00c853'));

  // Experiment count pill — visible at a glance how much has been tried
  if (expCount) {
    const pill = el('div');
    pill.style.cssText = 'font-size:.62rem;margin-top:6px;color:#555';
    pill.textContent   = `🧪 ${expCount} experiment${expCount > 1 ? 's' : ''} logged`;
    head.appendChild(pill);
  }

  head.appendChild(buildGoalButtons(g, canResearch, isExpanded, totalT));
  card.appendChild(head);

  // Conditionally append edit form and/or subtask list
  if (isEditing)  card.appendChild(buildGoalEditForm(g));
  if (isExpanded) card.appendChild(buildSubtaskList(g, nd.color));

  return card;
};
