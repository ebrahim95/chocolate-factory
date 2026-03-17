// =============================================================================
// utils/xp.js — XP calculation and leveling pure functions
// =============================================================================

/**
 * Returns the total XP needed to complete a given level.
 * Levels scale linearly: Lv1 = 100 XP, Lv2 = 200 XP, Lv3 = 300 XP, …
 *
 * @param {number} level - The level number (1-based)
 * @returns {number} XP required to finish that level
 */
const xpForLevel = (level) => XP_PER_LEVEL * level;

/**
 * Derives which level a node is currently at from its total lifetime XP.
 * Walks up the level thresholds until the XP bucket is found.
 *
 * @param {number} xp - Total accumulated XP (never decreases except via research)
 * @returns {number} Current level (minimum 1)
 *
 * @example
 * levelFromXp(0)   // → 1
 * levelFromXp(100) // → 2  (finished Lv1 which needed 100 XP)
 * levelFromXp(250) // → 2  (inside Lv2 which needs 200 XP; 50 XP spent so far)
 * levelFromXp(300) // → 3
 */
const levelFromXp = (xp) => {
  let lv = 1, acc = 0;
  while (true) {
    const needed = xpForLevel(lv);
    if (xp < acc + needed) return lv;
    acc += needed;
    lv++;
  }
};

/**
 * Returns how much XP has been spent inside the *current* level,
 * i.e. the progress toward the next level-up (used for the progress bar).
 *
 * @param {number} xp    - Total accumulated XP
 * @param {number} level - Current level (from levelFromXp)
 * @returns {number} XP spent within the current level
 *
 * @example
 * xpInLevel(250, 2) // → 50  (100 spent on Lv1; 150 spent on Lv2, but Lv2 needs 200)
 */
const xpInLevel = (xp, level) => {
  let spent = 0;
  for (let l = 1; l < level; l++) spent += xpForLevel(l);
  return xp - spent;
};

/**
 * Adds XP to a node and recalculates its level in-place.
 * This is the only function that mutates node XP — all XP grants go through here.
 *
 * @param {string} nodeKey - Key into state.nodes (e.g. 'health')
 * @param {number} amount  - XP to add (must be positive)
 * @returns {void}
 */
const addXp = (nodeKey, amount) => {
  state.nodes[nodeKey].xp    += amount;
  state.nodes[nodeKey].level  = levelFromXp(state.nodes[nodeKey].xp);
};

/**
 * Calculates the XP awarded for completing a deep-work session.
 * Uses a flat base plus a per-minute bonus for sessions longer than 20 minutes,
 * rewarding sustained concentration over short bursts.
 *
 * Formula: `FOCUS_XP_BASE + max(0, mins - 20) * FOCUS_XP_PER_MIN`
 *
 * @param {number} mins - Actual session duration in minutes
 * @returns {number} XP to award (rounded to nearest integer)
 *
 * @example
 * focusXp(10)  // → 30  (below 20 min: only base XP)
 * focusXp(20)  // → 30  (exactly 20 min: no bonus yet)
 * focusXp(50)  // → 54  (30 + 30 * 0.8)
 * focusXp(90)  // → 86  (30 + 70 * 0.8)
 */
const focusXp = (mins) =>
  Math.round(FOCUS_XP_BASE + Math.max(0, mins - 20) * FOCUS_XP_PER_MIN);
