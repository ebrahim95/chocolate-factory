// =============================================================================
// components/ManagePanel.js
//
// Manage panel: habit summary rows, inline habit edit rows, node management
// rows (with live identity statement editing), and the refreshNodeSelects()
// helper that keeps all node <select> elements in sync.
// =============================================================================

/**
 * Builds a read-only summary row for a single habit in the Manage panel.
 * Shows the habit name, node, time of day, priority, XP, and schedule in a
 * compact single-line format, with Edit and Delete buttons on the right.
 *
 * Clicking Edit calls `startHabitEdit()` which switches this row to the
 * expanded edit form via `buildHabitEditRow()`.
 *
 * @param {Habit} h - The habit record to summarise
 * @returns {HTMLDivElement} The `.manage-row` summary element
 */
const buildHabitSummaryRow = (h) => {
  const nd  = state.nodes[h.node];
  const row = el('div', ['manage-row']);
  row.style.setProperty('--c', nd.color);

  const info   = el('div');
  info.style.cssText = 'flex:1;min-width:0';

  const nameEl = el('div', [], h.name);
  nameEl.style.cssText = 'font-size:.87rem;font-weight:700';

  const days   = (h.days && h.days.length)
    ? h.days.map(d => DAY_SHORT[d]).join(' ')
    : 'Every day';

  const detail = el('div');
  detail.style.cssText = 'font-size:.65rem;color:#555;margin-top:2px';
  detail.textContent   =
    `${nd.icon} ${nd.label} · ${TIME_LABELS[h.time] || TIME_LABELS.anytime} · ${h.priority || 'medium'} · +${h.xp || HABIT_XP} XP · ${days}`;

  info.append(nameEl, detail);

  const editBtn = el('button', ['btn', 'btn-ghost'], '✏ EDIT');
  editBtn.style.cssText = 'padding:3px 10px;font-size:.7rem';
  editBtn.addEventListener('click', () => startHabitEdit(h.id));

  const delBtn = el('button', ['btn', 'btn-ghost'], '✕');
  delBtn.style.cssText = 'padding:3px 8px;font-size:.7rem';
  delBtn.addEventListener('click', () => deleteHabit(h.id));

  row.append(info, editBtn, delBtn);
  return row;
};

/**
 * Builds the expanded inline edit form for a habit in the Manage panel.
 * Shown in place of `buildHabitSummaryRow()` when `editingHabit === h.id`.
 *
 * Form sections:
 *   Row 1 — Name, XP Value, Node (select), Time (select), Priority (select)
 *   Row 2 — Notes, Qty Target, Qty Unit
 *   Row 3 — Schedule day picker (SUN–SAT toggle buttons)
 *   Buttons — ✓ SAVE, ✕ CANCEL, 🗑 DELETE
 *
 * All field IDs are namespaced with `eh-*-{id}` to avoid collisions when
 * multiple rows exist (though only one can be in edit mode at a time).
 *
 * @param {Habit} h - The habit record to edit (pre-fills all form fields)
 * @returns {HTMLDivElement} The expanded `.manage-row` form element
 */
const buildHabitEditRow = (h) => {
  const nd  = state.nodes[h.node];
  const row = el('div', ['manage-row']);
  row.style.setProperty('--c', nd.color);
  row.style.cssText += ';flex-direction:column;align-items:stretch;gap:10px;padding:14px';

  // ── Row 1: name, xp, node, time, priority ─────────────────────────────────
  const r1 = el('div');
  r1.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end';
  r1.appendChild(formField('Name',     `eh-name-${h.id}`,     'input',  h.name,           { style: 'width:200px' }));
  r1.appendChild(formField('XP Value', `eh-xp-${h.id}`,       'input',  h.xp || HABIT_XP, { type: 'number', style: 'width:80px' }));

  const nodeWrap = formField('Node', `eh-node-${h.id}`, 'select', '');
  const nodeSel  = nodeWrap.querySelector('select');
  for (const [k, nd2] of Object.entries(state.nodes)) {
    const o    = el('option', [], `${nd2.icon} ${nd2.label}`);
    o.value    = k;
    o.selected = k === h.node;
    nodeSel.appendChild(o);
  }
  r1.appendChild(nodeWrap);

  const timeWrap = formField('Time', `eh-time-${h.id}`, 'select', '', { style: 'width:140px' });
  const timeSel  = timeWrap.querySelector('select');
  [['anytime','⏰ Anytime'],['morning','🌅 Morning'],['afternoon','☀️ Afternoon'],['evening','🌙 Evening']]
    .forEach(([v, t]) => {
      const o    = el('option', [], t);
      o.value    = v;
      o.selected = (h.time || 'anytime') === v;
      timeSel.appendChild(o);
    });
  r1.appendChild(timeWrap);

  const priWrap = formField('Priority', `eh-priority-${h.id}`, 'select', '', { style: 'width:120px' });
  const priSel  = priWrap.querySelector('select');
  [['medium','— Medium'],['high','▲ High'],['low','▼ Low']].forEach(([v, t]) => {
    const o    = el('option', [], t);
    o.value    = v;
    o.selected = (h.priority || 'medium') === v;
    priSel.appendChild(o);
  });
  r1.appendChild(priWrap);

  // ── Row 2: notes, qty target, qty unit ────────────────────────────────────
  const r2       = el('div');
  r2.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end';

  const notesWrap = formField('Notes', `eh-notes-${h.id}`, 'input', h.notes || '', { placeholder: 'Extra context…', style: 'width:100%' });
  notesWrap.style.cssText = 'flex:1;min-width:180px';
  r2.appendChild(notesWrap);
  r2.appendChild(formField('Qty Target', `eh-qty-target-${h.id}`, 'input', h.qtyTarget || '', { type: 'number', min: '1', placeholder: '—', style: 'width:80px' }));
  r2.appendChild(formField('Qty Unit',   `eh-qty-unit-${h.id}`,   'input', h.qtyUnit   || '', { placeholder: 'glasses', style: 'width:100px' }));

  // ── Schedule day picker ───────────────────────────────────────────────────
  const schedWrap = el('div');
  const schedLbl  = el('label', ['inp-label'], 'Schedule');
  schedLbl.setAttribute('for', `eh-days-${h.id}`);
  schedWrap.append(schedLbl, buildDayPicker(`eh-days-${h.id}`, h.days));

  // ── Action buttons ────────────────────────────────────────────────────────
  const btns = el('div');
  btns.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';

  const saveBtn = el('button', ['btn', 'btn-amber'], '✓ SAVE');
  saveBtn.addEventListener('click', () => saveHabitEdit(h.id));

  const cancelBtn = el('button', ['btn', 'btn-ghost'], '✕ CANCEL');
  cancelBtn.addEventListener('click', cancelHabitEdit);

  const delBtn = el('button', ['btn'], '🗑 DELETE');
  delBtn.style.cssText = 'background:#FF3B3B;color:#fff;border-color:#c03030;margin-left:auto';
  delBtn.addEventListener('click', () => deleteHabit(h.id));

  btns.append(saveBtn, cancelBtn, delBtn);
  row.append(r1, r2, schedWrap, btns);
  return row;
};

/**
 * Renders the habit management list inside `#manage-habits`.
 * Each habit is shown as either a summary row or an edit row depending on
 * whether `editingHabit` matches its ID.
 *
 * Side effects:
 *   - Replaces all children of `#manage-habits`
 *
 * @returns {void}
 */
const renderManage = () => {
  const container = document.getElementById('manage-habits');

  if (!state.habits.length) {
    clearAndAppend(container, [el('p', ['empty-msg'], 'No habits yet.')]);
    return;
  }

  clearAndAppend(container, state.habits.map(h =>
    editingHabit === h.id ? buildHabitEditRow(h) : buildHabitSummaryRow(h)
  ));
};

/**
 * Renders the node management list inside `#manage-nodes`.
 *
 * Each row shows:
 *   - Node icon + name + level/XP info + colour swatch
 *   - An inline text input for editing the identity statement (fires `change`)
 *   - Either a "BUILT-IN" badge (for built-in nodes) or a ✕ REMOVE button
 *
 * Identity statement changes are applied immediately to `nd.identity` and
 * trigger a re-render of `renderIdentityBar()` and `renderNodeGrid()` so
 * the change is visible across panels without a full page refresh.
 *
 * Side effects:
 *   - Replaces all children of `#manage-nodes`
 *
 * @returns {void}
 */
const renderManageNodes = () => {
  const container = document.getElementById('manage-nodes');
  if (!container) return;

  const rows = Object.entries(state.nodes).map(([key, nd]) => {
    const isBuiltIn = BUILT_IN_NODES.includes(key);
    const row       = el('div', ['manage-row']);
    row.style.setProperty('--c', nd.color);

    const icon = el('span', [], nd.icon);
    icon.style.cssText = 'font-size:1.2rem;margin-right:4px';

    const name = el('span', [], nd.label);
    name.style.cssText = "flex:1;font-size:.9rem;font-family:'Archivo Black',sans-serif";

    const xpInfo = el('span', [], `Lv.${nd.level} · ${nd.xp} XP`);
    xpInfo.style.cssText = 'font-size:.65rem;color:#555;margin-right:8px';

    const swatch = el('div');
    swatch.style.cssText = `width:18px;height:18px;background:${nd.color};border:2px solid #0a0a0a;margin-right:8px;flex-shrink:0`;

    row.append(icon, name, xpInfo, swatch);

    // Live identity statement input — updates state and re-renders on change
    const idInp       = el('input', ['inp']);
    idInp.style.cssText = 'font-size:.7rem;padding:4px 8px;flex:1;min-width:180px;font-style:italic';
    idInp.value         = nd.identity || '';
    idInp.placeholder   = 'I am someone who…';
    idInp.addEventListener('change', () => {
      nd.identity = idInp.value.trim();
      renderIdentityBar();
      renderNodeGrid();
    });
    row.appendChild(idInp);

    if (isBuiltIn) {
      const badge = el('span', [], 'BUILT-IN');
      badge.style.cssText = "color:#aaa;font-family:'Space Mono',monospace;font-size:.65rem;padding:2px 8px;border:2px solid #ccc";
      row.appendChild(badge);
    } else {
      const delBtn = el('button', ['btn', 'btn-ghost'], '✕ REMOVE');
      delBtn.style.cssText = 'padding:3px 10px;font-size:.7rem';
      delBtn.addEventListener('click', () => deleteNode(key));
      row.appendChild(delBtn);
    }

    return row;
  });

  clearAndAppend(container, rows);
};

/**
 * Keeps all node `<select>` elements across the app in sync with `state.nodes`.
 * Targets three selects: habit form (`#h-node`), goal form (`#g-node`), and
 * focus session form (`#focus-node`).
 *
 * Preserves the currently selected value in each select across re-renders
 * so the user's in-progress choice is not lost when a node is added/removed.
 *
 * Called from `init()`, `addNode()`, and `deleteNode()`.
 *
 * Side effects:
 *   - Replaces all `<option>` children of `#h-node`, `#g-node`, `#focus-node`
 *
 * @returns {void}
 */
const refreshNodeSelects = () => {
  ['h-node', 'g-node', 'focus-node'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;

    const current = sel.value;
    sel.replaceChildren();

    for (const [k, nd] of Object.entries(state.nodes)) {
      const opt    = el('option', [], `${nd.icon} ${nd.label}`);
      opt.value    = k;
      opt.selected = k === current;
      sel.appendChild(opt);
    }
  });
};
