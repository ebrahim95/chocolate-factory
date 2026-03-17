// =============================================================================
// utils/date.js — Date helpers, streak calculator, and time formatters
// =============================================================================

/**
 * Returns today's date as an ISO 8601 date string.
 * Used as the key for state.completions and state.qtyProgress.
 *
 * @returns {string} e.g. "2026-03-09"
 */
const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Counts how many consecutive days ending with today a habit has been completed.
 * Walks backwards through `state.completions` one day at a time until it finds
 * a day without a completion entry, then stops.
 *
 * A streak of 0 means the habit was not completed today.
 * A streak of 1 means it was completed today but not yesterday.
 *
 * @param {number} habitId - The habit's unique ID
 * @returns {number} Number of consecutive days completed (0 or more)
 */
const streak = (habitId) => {
  let count = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (state.completions[key]?.includes(habitId)) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
};

/**
 * Formats a duration given in milliseconds as a compact clock string.
 * Used for the live deep-work timer display.
 *
 * @param {number} ms - Duration in milliseconds
 * @returns {string}
 *   - Under 1 hour:  "mm:ss" (e.g. "04:37")
 *   - 1 hour+:       "Xh YYm" (e.g. "1h 07m")
 *
 * @example
 * fmtDuration(277000)  // → "04:37"
 * fmtDuration(3660000) // → "1h 01m"
 */
const fmtDuration = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/**
 * Formats a duration given in whole minutes as a compact human-readable string.
 * Used for session logs, stat cards, and focus presets.
 *
 * @param {number} mins - Duration in whole minutes
 * @returns {string}
 *   - Under 60 min:       "Xm"     (e.g. "25m")
 *   - Exactly on the hour: "Xh"    (e.g. "2h")
 *   - Otherwise:           "Xh Ym" (e.g. "1h 30m")
 *
 * @example
 * fmtMins(25)  // → "25m"
 * fmtMins(90)  // → "1h 30m"
 * fmtMins(120) // → "2h"
 */
const fmtMins = (mins) => {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
};

/**
 * Builds the full long-form date string displayed in the app header.
 * Reads the current system date each time it is called.
 *
 * @returns {string} e.g. "Monday, 09 Mar 2026"
 */
const formatHeaderDate = () => {
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now    = new Date();
  return `${DAYS[now.getDay()]}, ${String(now.getDate()).padStart(2,'0')} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
};
