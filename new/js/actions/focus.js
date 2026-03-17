// =============================================================================
// actions/focus.js — Deep work session lifecycle
// =============================================================================

/**
 * Starts a new deep-work session.
 * Reads the task description, target node, and duration from the setup form,
 * records the start time, primes the active display, and kicks off the
 * 1-second tick interval.
 *
 * Validation: task description must be non-empty.
 * If `focusSelectedMins` is 0 (no preset selected) the custom input is read,
 * falling back to 50 minutes if neither is provided.
 *
 * Side effects:
 *   - Sets global timer state: focusNodeKey, focusTask, focusTargetMins, focusStartTime
 *   - Sets `focusTimer` to the setInterval handle
 *   - Updates `#focus-active-node`, `#focus-active-task`, `#focus-clock`, `#focus-xp-preview`
 *   - Calls `syncFocusUI()` to switch to the active view
 *
 * @returns {void}
 */
const startFocus = () => {
  const task  = document.getElementById('focus-task').value.trim();
  const nodeK = document.getElementById('focus-node').value;
  const mins  = focusSelectedMins ||
    parseInt(document.getElementById('focus-custom-mins').value) || 50;

  if (!task) { toast('Describe what you are working on', '#FF3B3B'); return; }

  focusNodeKey    = nodeK;
  focusTask       = task;
  focusTargetMins = mins;
  focusStartTime  = Date.now();

  // Prime the active display before the first tick fires
  const nd = state.nodes[nodeK];
  document.getElementById('focus-active-node').textContent = `${nd.icon} ${nd.label}`;
  document.getElementById('focus-active-task').textContent = `"${task}"`;
  document.getElementById('focus-clock').textContent       = '00:00';
  document.getElementById('focus-xp-preview').textContent  =
    `Target: ${fmtMins(mins)} · +${focusXp(mins)} XP`;

  syncFocusUI();
  focusTimer = setInterval(tickFocusClock, 1000);
  toast(`Session started — ${fmtMins(mins)} target`, '#1a1aff');
};

/**
 * Ends the current deep-work session, either completing it or abandoning it.
 *
 * When completed (`abandoned = false`):
 *   - Calculates actual elapsed minutes (minimum 1)
 *   - Awards XP to the session's node via `focusXp(actualMins)`
 *   - Shows an XP float animation at the centre of the screen
 *   - Prepends a session record to `state.focusSessions`
 *   - Re-renders the Factory panel (for the Deep Work stat card) and Nodes panel
 *
 * When abandoned (`abandoned = true`):
 *   - Clears the timer and resets the UI without recording anything
 *
 * Always:
 *   - Clears `focusTimer` and sets `focusStartTime` to null
 *   - Calls `syncFocusUI()` to return to the setup view
 *   - Calls `renderFocusLog()` to update the session history
 *
 * @param {boolean} abandoned - `true` to discard the session, `false` to complete it
 * @returns {void}
 */
const endFocus = (abandoned) => {
  if (!focusTimer) return;
  clearInterval(focusTimer);
  focusTimer = null;

  if (!abandoned) {
    const elapsedMs  = Date.now() - focusStartTime;
    const actualMins = Math.max(1, Math.round(elapsedMs / 60000));
    const xpAwarded  = focusXp(actualMins);

    addXp(focusNodeKey, xpAwarded);
    xpFloat(window.innerWidth / 2 - 50, 120, `+${xpAwarded} XP`);

    state.focusSessions.unshift({
      node:       focusNodeKey,
      task:       focusTask,
      targetMins: focusTargetMins,
      actualMins,
      xpAwarded,
      date:       todayStr(),
    });

    renderFactory();
    renderNodes();
    toast(`Session complete! +${xpAwarded} XP awarded`, '#00c853');
  } else {
    toast('Session abandoned', '#FF3B3B');
  }

  focusStartTime = null;
  syncFocusUI();
  renderFocusLog();
};

/**
 * Selects a duration preset button and updates `focusSelectedMins`.
 * Deselects all other preset buttons and clears the custom input field.
 * Passing the same `mins` value again (e.g. on `init`) highlights that preset.
 *
 * @param {number} mins - Duration in minutes matching a `.focus-preset` button's `data-mins`
 * @returns {void}
 */
const setFocusPreset = (mins) => {
  focusSelectedMins = mins;
  document.querySelectorAll('.focus-preset').forEach(b => {
    b.classList.toggle('selected', parseInt(b.dataset.mins) === mins);
  });
  document.getElementById('focus-custom-mins').value = '';
};
