// =============================================================================
// components/HabitCard.js
//
// Builds a single habit card.  Pure function: takes habit data, returns a
// DOM node.  All interactivity is wired here via event listeners so callers
// don't need to reach inside the card after creation.
// =============================================================================

/**
 * Builds and returns a fully interactive habit card DOM element.
 *
 * The card is split into two columns:
 *   - Left (`habit-main`): habit name, priority icon, node/XP/schedule tags, notes
 *   - Right (`habit-right`): optional quantity stepper, current streak badge
 *
 * Clicking anywhere on the card (except the qty stepper) toggles completion
 * via `toggleHabit()`. The card's accent colour is driven by the node's colour
 * through the `--c` CSS custom property.
 *
 * @param {Habit}    h     - Habit record from `state.habits`
 * @param {number[]} done  - Array of habit IDs completed today (from state.completions)
 * @param {string}   today - Today's ISO date string "YYYY-MM-DD"
 * @returns {HTMLDivElement} The complete habit card element
 */
const buildHabitCard = (h, done, today) => {
  const nd     = state.nodes[h.node];
  const isDone = done.includes(h.id);
  const st     = streak(h.id);
  const xpVal  = h.xp || HABIT_XP;
  const hasQty = !!(h.qtyTarget && h.qtyUnit);
  const qty    = state.qtyProgress?.[today]?.[h.id] || 0;

  // ── Card shell ──────────────────────────────────────────────────────────────
  const card = el('div', ['habit', ...(isDone ? ['done'] : [])]);
  card.style.setProperty('--c', nd.color);
  card.addEventListener('click', (e) => toggleHabit(h.id, e));

  // ── Left column: name, tags, notes ─────────────────────────────────────────
  const main    = el('div', ['habit-main']);
  const nameRow = el('div');
  nameRow.style.cssText = 'display:flex;align-items:center;gap:8px';

  const check   = el('div', ['hcheck'], isDone ? '✓' : '');
  const nameEl  = el('div', ['hname'], h.name);

  const priSpan = el('span', [], PRIORITY_ICON[h.priority] || '—');
  priSpan.style.cssText = `font-size:.6rem;font-weight:700;color:${PRIORITY_COLOR[h.priority] || '#888'};flex-shrink:0`;

  nameRow.append(check, nameEl, priSpan);
  main.appendChild(nameRow);

  // Tag row: node chip, XP chip, and optional schedule days chip
  const tagRow = el('div');
  tagRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap';

  const nodeTag = el('div', ['htag'], `${nd.icon} ${nd.label}`);
  const xpTag   = el('div', ['htag'], `+${xpVal} XP`);
  xpTag.style.color = '#1a1aff';
  tagRow.append(nodeTag, xpTag);

  if (h.days && h.days.length) {
    tagRow.appendChild(el('div', ['htag'], h.days.map(d => DAY_SHORT[d]).join(' ')));
  }
  main.appendChild(tagRow);

  if (h.notes) main.appendChild(el('div', ['habit-notes'], h.notes));

  // ── Right column: optional qty stepper + streak badge ──────────────────────
  const right = el('div', ['habit-right']);

  if (hasQty) {
    right.appendChild(buildQtyStepper(h, qty, nd.color));
  }

  right.appendChild(
    el('div', ['hstreak', ...(st ? [] : ['z'])], st ? `🔥 ${st}d` : '0d')
  );

  card.append(main, right);
  return card;
};

/**
 * Builds the quantity-tracking sub-component for habits that have a `qtyTarget`.
 * Contains a progress bar showing fill percentage and a −/+ stepper row.
 * Click events are stopped from bubbling to the parent card to avoid
 * accidentally toggling the whole habit.
 *
 * When the quantity reaches `qtyTarget` the habit is auto-completed and
 * XP is awarded via `adjustQty()`.
 *
 * @param {Habit}  h     - Habit record (must have qtyTarget and qtyUnit set)
 * @param {number} qty   - Current quantity count for today
 * @param {string} color - Node colour string used for the progress bar fill
 * @returns {HTMLDivElement} The qty stepper container element
 */
const buildQtyStepper = (h, qty, color) => {
  const wrap = el('div', ['habit-qty']);
  wrap.addEventListener('click', (e) => e.stopPropagation());

  // Progress bar
  const barWrap = el('div', ['qty-bar-wrap']);
  const barFill = el('div', ['qty-bar-fill']);
  barFill.style.width      = `${Math.min(100, qty / h.qtyTarget * 100).toFixed(0)}%`;
  barFill.style.background = color;
  barWrap.appendChild(barFill);

  // Stepper row: minus button, current/target label, plus button
  const stepRow  = el('div');
  stepRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:3px';

  const minusBtn = el('button', ['qty-btn'], '−');
  const qtyLabel = el('span', ['qty-val'], `${qty}/${h.qtyTarget} ${h.qtyUnit}`);
  const plusBtn  = el('button', ['qty-btn'], '+');

  minusBtn.addEventListener('click', (e) => adjustQty(h.id, -1, e));
  plusBtn.addEventListener('click',  (e) => adjustQty(h.id, +1, e));

  stepRow.append(minusBtn, qtyLabel, plusBtn);
  wrap.append(barWrap, stepRow);
  return wrap;
};
