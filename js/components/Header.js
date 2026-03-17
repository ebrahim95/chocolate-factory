// =============================================================================
// components/Header.js — Sticky top bar: efficiency badge + today's date
// =============================================================================

/**
 * Updates the sticky header with the current efficiency score and today's date.
 * Called on every state change that could affect either value (habit toggle,
 * focus session end, etc.).
 *
 * Side effects:
 *   - Sets `#eff-badge` text, background colour, and text colour
 *   - Sets `#hdr-date` text content
 *
 * @returns {void}
 */
const renderHeader = () => {
  const e     = efficiency();
  const badge = document.getElementById('eff-badge');

  badge.textContent      = `EFFICIENCY  ${e}%`;
  badge.style.background = e >= 80 ? '#00c853' : e >= 40 ? '#FFE500' : '#FF3B3B';
  badge.style.color      = e >= 80 ? '#0a0a0a' : e >= 40 ? '#0a0a0a' : '#f5f0e8';

  document.getElementById('hdr-date').textContent = formatHeaderDate();
};
