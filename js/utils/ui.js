// =============================================================================
// utils/ui.js — Visual feedback helpers (toast notifications, XP float)
// =============================================================================

/**
 * Displays a brief notification banner at the bottom-right of the screen.
 * The banner auto-dismisses after 2.2 seconds.
 * Repeated calls restart the timer, replacing any in-flight message.
 *
 * @param {string} msg            - The message text to display
 * @param {string} [color='#FFE500'] - CSS colour for the border and text.
 *                                    Defaults to yellow for neutral info;
 *                                    use '#00c853' for success, '#FF3B3B' for errors.
 * @returns {void}
 */
const toast = (msg, color = '#FFE500') => {
  const t = document.getElementById('toast');
  t.textContent       = msg;
  t.style.borderColor = color;
  t.style.color       = color;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
};

/**
 * Spawns a floating "+XP" label at a given viewport position that drifts
 * upward and fades out over ~1.2 seconds via CSS animation, then removes itself.
 * Provides satisfying feedback when XP is awarded on a click event.
 *
 * @param {number} x    - Horizontal position in viewport pixels (from MouseEvent.clientX)
 * @param {number} y    - Vertical position in viewport pixels (from MouseEvent.clientY)
 * @param {string} text - Label text to display, e.g. "+25 XP" or "+54 XP"
 * @returns {void}
 */
const xpFloat = (x, y, text) => {
  const div = document.createElement('div');
  div.className   = 'xp-float';
  div.textContent = text;
  div.style.left  = x + 'px';
  div.style.top   = y + 'px';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1200);
};
