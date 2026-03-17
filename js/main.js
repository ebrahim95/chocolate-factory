// =============================================================================
// main.js — Application entry point
//
// Responsibilities:
//   1. Tab switching router  (activateTab, bindTabListeners)
//   2. Bind static event listeners (bindStaticListeners)
//   3. Composite render functions that don't belong to a single component
//      (renderFactory, renderFocusNodeAlert)
//   4. Initial full render pass  (init)
// =============================================================================

// ── Tab router ────────────────────────────────────────────────────────────────

/**
 * Maps each panel ID to the render function(s) that should run when that
 * tab becomes active. This keeps the router declarative and avoids a long
 * if/else chain in the click handler.
 *
 * Each value is wrapped in an arrow function (rather than a bare reference)
 * so the lookup is deferred to call time. Because scripts are loaded in
 * sequential <script> tags, a bare `renderFocus` reference evaluated at
 * parse time would be `undefined` — the arrow wrapper ensures the name is
 * resolved only when the tab is actually clicked.
 *
 * @type {Object.<string, function(): void>}
 */
const PANEL_RENDERERS = {
  factory: () => renderFactory(),
  focus:   () => renderFocus(),
  lab:     () => renderLab(),
  tech:    () => renderGoals(),
  nodes:   () => renderNodes(),
  manage:  () => { renderManage(); renderManageNodes(); },
};

/**
 * Switches the visible panel to `panelId` by toggling `.active` classes on
 * both the tab button and the corresponding panel element, then calling the
 * associated render function to ensure the panel content is fresh.
 *
 * @param {string} panelId - The `data-panel` value on the tab button
 *                           (e.g. 'factory', 'focus', 'lab', 'tech', 'nodes', 'manage')
 * @returns {void}
 */
const activateTab = (panelId) => {
  document.querySelectorAll('.tab').forEach(b   => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

  const tab   = document.querySelector(`.tab[data-panel="${panelId}"]`);
  const panel = document.getElementById(`panel-${panelId}`);
  if (tab)   tab.classList.add('active');
  if (panel) panel.classList.add('active');

  PANEL_RENDERERS[panelId]?.();
};

/**
 * Attaches click listeners to every `.tab[data-panel]` button so that
 * clicking any tab calls `activateTab` with its panel ID.
 *
 * @returns {void}
 */
const bindTabListeners = () => {
  document.querySelectorAll('.tab[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.panel));
  });
};

// ── Static event listeners ────────────────────────────────────────────────────

/**
 * Binds all static event listeners that live in the HTML and do not get
 * re-created on re-renders (unlike listeners wired inside component builders).
 *
 * Covers:
 *   - Tab buttons (via `bindTabListeners`)
 *   - Manage panel "Add" buttons (#btn-add-habit, #btn-add-goal, #btn-add-node)
 *   - Enter-key shortcuts for the habit name and goal label inputs
 *   - Day-picker toggle buttons in the static "Add Habit" form
 *   - Focus session controls (start, complete, abandon)
 *   - Focus preset buttons and custom minute input
 *   - Lab experiment add button and Enter shortcut
 *
 * Called once from `init()`. Dynamic listeners (e.g. on habit cards) are
 * attached inside their respective component builder functions.
 *
 * @returns {void}
 */
const bindStaticListeners = () => {
  bindTabListeners();

  // Manage panel — add entity buttons
  document.getElementById('btn-add-habit').addEventListener('click', addHabit);
  document.getElementById('btn-add-goal').addEventListener('click',  addGoal);
  document.getElementById('btn-add-node').addEventListener('click',  addNode);

  // Keyboard shortcuts: Enter key submits the form
  document.getElementById('h-name').addEventListener('keydown',  e => { if (e.key === 'Enter') addHabit(); });
  document.getElementById('g-label').addEventListener('keydown', e => { if (e.key === 'Enter') addGoal(); });

  // Day-picker toggle buttons in the static Add Habit form
  document.querySelectorAll('#h-days .day-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });

  // Focus session controls
  document.getElementById('btn-start-focus').addEventListener('click', startFocus);
  document.getElementById('btn-end-focus').addEventListener('click',   () => endFocus(false));
  document.getElementById('btn-abort-focus').addEventListener('click', () => endFocus(true));

  // Preset buttons highlight on click; custom input deselects all presets
  document.querySelectorAll('.focus-preset').forEach(btn => {
    btn.addEventListener('click', () => setFocusPreset(parseInt(btn.dataset.mins)));
  });
  document.getElementById('focus-custom-mins').addEventListener('input', () => {
    focusSelectedMins = 0;
    document.querySelectorAll('.focus-preset').forEach(b => b.classList.remove('selected'));
  });

  // Lab panel
  document.getElementById('btn-add-experiment').addEventListener('click', addExperiment);
  document.getElementById('lab-what').addEventListener('keydown', e => { if (e.key === 'Enter') addExperiment(); });
};

// ── Composite render functions ────────────────────────────────────────────────

/**
 * Composite render entry point for the Systems (Factory Floor) tab.
 * Orchestrates four sub-components that together make up the panel:
 *   1. `renderHeader()`          — efficiency badge + date
 *   2. `renderIdentityBar()`     — "I am someone who…" chips
 *   3. `renderHabitList()`       — time-grouped habit cards
 *   4. `renderSummary()`         — four stat cards
 *   5. `renderFocusNodeAlert()`  — lowest-node focus suggestion banner
 *
 * Called whenever any habit, focus session, or node XP change occurs
 * (i.e. after `toggleHabit`, `adjustQty`, `endFocus`, etc.).
 *
 * @returns {void}
 */
const renderFactory = () => {
  renderHeader();
  renderIdentityBar();
  renderHabitList();
  renderSummary();
  renderFocusNodeAlert();
};

/**
 * Renders the "Focus Node" suggestion banner inside `#focus-node-alert`.
 * Identifies the lowest-level node via `bottleneck()` and displays it as
 * a calm, informational prompt rather than a red alert — framing low areas
 * as opportunities rather than failures (Psychology Principle 1).
 *
 * Side effects:
 *   - Replaces all children of `#focus-node-alert`
 *
 * @returns {void}
 */
const renderFocusNodeAlert = () => {
  const container = document.getElementById('focus-node-alert');
  const [, bnd]   = bottleneck();

  const banner = el('div', ['focus-node']);
  banner.appendChild(el('span', ['pulse'], '◎'));
  banner.appendChild(document.createTextNode(' FOCUS NODE — '));

  const strong       = el('strong');
  strong.style.color = '#fff';
  strong.textContent = `${bnd.icon} ${bnd.label}`;
  banner.appendChild(strong);
  banner.appendChild(document.createTextNode(` is your lowest node (Lv.${bnd.level}). Prioritise it today.`));

  clearAndAppend(container, [banner]);
};

// ── Initialisation ────────────────────────────────────────────────────────────

/**
 * Application bootstrap function. Called once when the page loads.
 *
 * Sequence:
 *   1. Bind all static event listeners
 *   2. Populate all node `<select>` elements with starter data
 *   3. Render every panel so content is ready when a tab is opened
 *   4. Highlight the default focus preset (50 min)
 *
 * All renders run eagerly rather than lazily so there is no flash of empty
 * content when the user first switches to a non-default tab.
 *
 * @returns {void}
 */
const init = () => {
  bindStaticListeners();
  refreshNodeSelects();

  renderHeader();
  renderFactory();
  renderGoals();
  renderNodes();
  renderManage();
  renderManageNodes();
  renderFocus();
  renderLab();

  setFocusPreset(50); // highlight the default 50-min preset button
};

init();
