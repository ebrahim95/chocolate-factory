// =============================================================================
// components/NodeGrid.js
//
// Resource Nodes panel: XP/level cards with identity statements + 28-day
// completion heatmap. Implements Psychology Principle 2 (progress visibility)
// and Principle 5 (identity reinforcement via the identity statement quote).
// =============================================================================

/**
 * Builds a single resource node card.
 * Accepts a destructured [key, nodeData] entry from `Object.entries(state.nodes)`.
 *
 * Card layout:
 *   - Top row: node label + emoji icon (left) | "LEVEL" label + level number (right)
 *   - XP progress bar (fills to current level completion %)
 *   - XP text: "current/needed XP · pct%"
 *   - Total XP line
 *   - Identity statement (italic quote), if set
 *
 * The card's accent colour is set via `--c` for the progress bar fill.
 *
 * @param {[string, NodeData]} entry - Destructured [nodeKey, nodeData] pair
 * @returns {HTMLDivElement} The `.node-card` element
 */
const buildNodeCard = ([, nd]) => {
  const lv   = nd.level;
  const cur  = xpInLevel(nd.xp, lv);
  const need = xpForLevel(lv);
  const pct  = (cur / need * 100).toFixed(1);

  const card = el('div', ['node-card']);
  card.style.setProperty('--c', nd.color);

  // Top row: label/icon block (left) and level number block (right)
  const top  = el('div');
  top.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start';

  const left = el('div');
  left.appendChild(el('div', ['node-lbl'], nd.label));
  const icon = el('div', [], nd.icon);
  icon.style.cssText = 'font-size:1.5rem;margin-top:2px';
  left.appendChild(icon);

  const right = el('div');
  right.style.textAlign = 'right';
  right.appendChild(el('div', ['node-lbl'], 'LEVEL'));
  right.appendChild(el('div', ['node-level'], String(lv).padStart(2, '0')));

  top.append(left, right);
  card.appendChild(top);

  // XP progress bar
  const bg   = el('div', ['xp-bg']);
  const fill = el('div', ['xp-fill']);
  fill.style.width = `${pct}%`;
  bg.appendChild(fill);
  card.appendChild(bg);

  card.appendChild(el('div', ['xp-txt'], `${cur}/${need} XP · ${pct}%`));
  card.appendChild(el('div', ['xp-txt'], `Total: ${nd.xp} XP`));

  // Identity statement — shown as an italic quote when set
  if (nd.identity && nd.identity.trim()) {
    card.appendChild(el('div', ['node-identity'], `"${nd.identity}"`));
  }

  return card;
};

/**
 * Renders the node grid inside `#node-grid`.
 * Iterates all nodes in `state.nodes` and builds a card for each.
 *
 * Side effects:
 *   - Replaces all children of `#node-grid`
 *
 * @returns {void}
 */
const renderNodeGrid = () => {
  clearAndAppend(
    document.getElementById('node-grid'),
    Object.entries(state.nodes).map(buildNodeCard)
  );
};

/**
 * Renders the 28-day habit completion heatmap inside `#heatmap`.
 *
 * Each cell represents one day (oldest left, today right).
 * Cell opacity scales with the fraction of habits completed that day:
 *   - No completions → light grey (#e8e3d8)
 *   - Some completions → rgba(10,10,10, 0.1 + frac * 0.9)
 *   - All completed → near-black
 *
 * The tooltip (`title` attribute) shows the formatted date and completion count.
 *
 * Side effects:
 *   - Replaces all children of `#heatmap`
 *
 * @returns {void}
 */
const renderHeatmap = () => {
  const total = state.habits.length || 1;
  const cells = [];

  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key  = d.toISOString().slice(0, 10);
    const done = (state.completions[key] || []).length;
    const frac = done / total;
    const lbl  = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    const cell = el('div', ['hm-cell']);
    cell.style.background = frac > 0
      ? `rgba(10,10,10,${(0.1 + frac * 0.9).toFixed(2)})`
      : '#e8e3d8';
    cell.title = `${lbl}: ${done} habits`;
    cells.push(cell);
  }

  clearAndAppend(document.getElementById('heatmap'), cells);
};

/**
 * Public render entry point for the Nodes panel.
 * Renders the node grid and the 28-day heatmap in sequence.
 *
 * @returns {void}
 */
const renderNodes = () => {
  renderNodeGrid();
  renderHeatmap();
};
