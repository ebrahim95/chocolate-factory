// =============================================================================
// components/FocusPanel.js
//
// Deep Work panel (Psychology Principle 3): timer setup form, active session
// countdown display, and session history log.
// Longer sessions earn bonus XP via focusXp() to reward sustained focus.
// =============================================================================

/**
 * Toggles visibility between the session setup form and the active timer display.
 * Called whenever the timer starts, ends, or the panel is first rendered.
 * - When `focusTimer !== null` → show active timer, hide setup form
 * - When `focusTimer === null` → show setup form, hide active timer
 *
 * Side effects:
 *   - Sets `display` style on `#focus-setup` and `#focus-active`
 *
 * @returns {void}
 */
const syncFocusUI = () => {
  const isRunning = focusTimer !== null;
  document.getElementById('focus-setup').style.display  = isRunning ? 'none'  : 'block';
  document.getElementById('focus-active').style.display = isRunning ? 'block' : 'none';
};

/**
 * Builds a single past-session entry card for the session history log.
 * Displays: elapsed time (large, left), task description + metadata (centre),
 * and XP awarded (right, blue).
 *
 * @param {FocusSession} s - A completed session record from `state.focusSessions`
 * @returns {HTMLDivElement} The `.focus-entry` card element
 */
const buildFocusEntry = (s) => {
  const nd    = state.nodes[s.node];
  const entry = el('div', ['focus-entry']);
  entry.style.setProperty('--c', nd?.color || '#888');

  const timeEl = el('div', ['focus-entry-time'], fmtMins(s.actualMins));
  const body   = el('div', ['focus-entry-body']);
  const title  = el('div', ['focus-entry-title'], s.task || '(no task set)');
  const meta   = el('div', ['focus-entry-meta'],
    `${nd?.icon || ''} ${nd?.label || s.node} · ${s.date} · target: ${fmtMins(s.targetMins)}`);
  const xpEl   = el('div', ['focus-entry-xp'], `+${s.xpAwarded} XP`);

  body.append(title, meta);
  entry.append(timeEl, body, xpEl);
  return entry;
};

/**
 * Renders the session history log inside `#focus-log`.
 * Shows an empty-state message when no sessions have been completed yet.
 * Sessions are stored newest-first in `state.focusSessions`.
 *
 * Side effects:
 *   - Replaces all children of `#focus-log`
 *
 * @returns {void}
 */
const renderFocusLog = () => {
  const container = document.getElementById('focus-log');

  if (!state.focusSessions.length) {
    clearAndAppend(container, [
      el('p', ['empty-msg'], 'No sessions yet. Start your first deep work block above.'),
    ]);
    return;
  }

  clearAndAppend(container, state.focusSessions.map(buildFocusEntry));
};

/**
 * Clock tick callback — called every second by `setInterval` while a session
 * is active.  Updates the elapsed time display and the live XP preview.
 *
 * Reads `focusStartTime` (set in `startFocus`) to calculate elapsed ms.
 * The XP preview shows what will be awarded if the session is completed now.
 *
 * Side effects:
 *   - Sets `#focus-clock` text content
 *   - Sets `#focus-xp-preview` text content
 *
 * @returns {void}
 */
const tickFocusClock = () => {
  const elapsed     = Date.now() - focusStartTime;
  const elapsedMins = elapsed / 60000;
  const xp          = focusXp(elapsedMins);

  document.getElementById('focus-clock').textContent =
    fmtDuration(elapsed);
  document.getElementById('focus-xp-preview').textContent =
    `${fmtMins(Math.round(elapsedMins))} elapsed · +${xp} XP on complete`;
};

/**
 * Public render entry point for the Deep Work panel.
 * Synchronises the setup/active view and re-renders the session log.
 * Called when the tab becomes active or after a session ends.
 *
 * @returns {void}
 */
const renderFocus = () => {
  syncFocusUI();
  renderFocusLog();
};
