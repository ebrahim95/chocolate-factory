// =============================================================================
// utils/dom.js — Low-level DOM factory helpers used by every component
// =============================================================================

/**
 * Creates a DOM element with optional CSS classes and text content.
 * Shorthand to keep component code concise and free of repetitive
 * `document.createElement` + `classList.add` + `textContent` chains.
 *
 * @param {string}   tag       - HTML tag name (e.g. 'div', 'button', 'span')
 * @param {string[]} [classes=[]] - CSS class names to add via classList
 * @param {string}   [text=''] - Text to set as textContent (skipped if falsy)
 * @returns {HTMLElement}
 *
 * @example
 * el('div', ['habit', 'done'], 'Morning workout')
 * // → <div class="habit done">Morning workout</div>
 */
const el = (tag, classes = [], text = '') => {
  const node = document.createElement(tag);
  if (classes.length) node.classList.add(...classes);
  if (text) node.textContent = text;
  return node;
};

/**
 * Replaces all children of a container element with a new array of nodes.
 * Safer and more explicit than setting `innerHTML`.
 * Uses `replaceChildren` which is atomic — no partial DOM flicker.
 *
 * @param {HTMLElement}   container - The element whose children will be replaced
 * @param {Node[]}        children  - New child nodes to insert
 * @returns {void}
 */
const clearAndAppend = (container, children) => {
  container.replaceChildren(...children);
};

/**
 * Builds a labelled form field consisting of a `<label>` and either an
 * `<input>` or `<select>`, wrapped in a `<div>`.
 * The label's `for` attribute is wired to the control's `id`.
 *
 * @param {string}  labelText        - Visible label text above the control
 * @param {string}  id               - `id` attribute set on the control (and `for` on label)
 * @param {string}  tag              - Tag name: 'input' or 'select'
 * @param {*}       value            - Initial value; only applied when tag is 'input'
 * @param {Object}  [attrs={}]       - Extra attributes to set on the control.
 *                                     The special key `'style'` sets `style.cssText`.
 *                                     All other keys are set via `setAttribute`.
 * @returns {HTMLDivElement} Wrapper div containing `<label>` + control
 *
 * @example
 * formField('XP Value', 'h-xp', 'input', 25, { type: 'number', style: 'width:80px' })
 */
const formField = (labelText, id, tag, value, attrs = {}) => {
  const wrap  = el('div');
  const label = el('label', ['inp-label'], labelText);
  label.setAttribute('for', id);

  const ctrl = el(tag, ['inp']);
  ctrl.id = id;

  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'style') ctrl.style.cssText = v;
    else ctrl.setAttribute(k, v);
  }

  if (tag === 'input') ctrl.value = value;
  wrap.append(label, ctrl);
  return wrap;
};

/**
 * Builds a labelled progress bar as a `DocumentFragment` for use inside cards.
 * The fragment contains a small uppercase label above a filled bar.
 *
 * @param {string} label - Short uppercase label shown above the bar (e.g. "XP PROGRESS")
 * @param {number} pct   - Fill percentage, clamped externally; passed directly as width %
 * @param {string} color - CSS colour string for the filled portion of the bar
 * @returns {DocumentFragment} Fragment containing label div + bar div
 */
const labeledBar = (label, pct, color) => {
  const frag = document.createDocumentFragment();

  const lbl = el('div');
  lbl.style.cssText = "font-family:'Space Mono',monospace;font-size:.6rem;color:#555;text-transform:uppercase;margin-top:7px;margin-bottom:2px";
  lbl.textContent   = label;

  const bar  = el('div', ['pbar']);
  const fill = el('div', ['pfill']);
  fill.style.width      = `${pct}%`;
  fill.style.background = color;
  bar.appendChild(fill);

  frag.append(lbl, bar);
  return frag;
};

/**
 * Returns whether a habit is scheduled to run on a given day of the week.
 * An empty `days` array is treated as "every day" — the habit has no schedule
 * restriction and should always appear.
 *
 * @param {{ days: number[] }} h  - Habit object; only `days` is accessed
 * @param {number}             dow - Day-of-week index: 0 = Sunday, 6 = Saturday
 * @returns {boolean} `true` if the habit should appear today
 *
 * @example
 * isScheduledToday({ days: [] }, 1)        // → true  (every day)
 * isScheduledToday({ days: [1, 3, 5] }, 1) // → true  (Monday)
 * isScheduledToday({ days: [1, 3, 5] }, 0) // → false (Sunday)
 */
const isScheduledToday = (h, dow) =>
  !h.days || h.days.length === 0 || h.days.includes(dow);

/**
 * Builds a day-of-week picker widget: a row of seven toggle buttons (SUN–SAT).
 * Each button can be clicked to toggle its active state.
 * All buttons start active when `activeDays` is empty (meaning "every day").
 *
 * @param {string}   pickerId   - `id` attribute set on the wrapper `<div>`
 * @param {number[]} activeDays - Day indices (0–6) that should start toggled on.
 *                                Pass `[]` to activate all seven days.
 * @returns {HTMLDivElement} The day-picker wrapper containing seven button elements
 */
const buildDayPicker = (pickerId, activeDays) => {
  const wrap = el('div', ['day-picker']);
  wrap.id = pickerId;

  DAY_LABELS.forEach((label, d) => {
    const btn = el('button', ['day-btn'], label);
    btn.type        = 'button';
    btn.dataset.day = d;

    const isActive = !activeDays || activeDays.length === 0 || activeDays.includes(d);
    if (isActive) btn.classList.add('active');

    btn.addEventListener('click', () => btn.classList.toggle('active'));
    wrap.appendChild(btn);
  });

  return wrap;
};
