// =============================================================================
// constants.js — All magic values in one place
// =============================================================================

/** Default XP awarded when a habit is completed (overridable per-habit). */
const HABIT_XP = 25;

/** XP awarded when a goal milestone/subtask is marked done. */
const TASK_XP = 15;

/**
 * Base XP needed to complete level 1.
 * Each subsequent level costs `XP_PER_LEVEL * level`, so:
 *   Lv1 = 100, Lv2 = 200, Lv3 = 300 …
 */
const XP_PER_LEVEL = 100;

/** Flat XP granted at the start of any deep-work session completion. */
const FOCUS_XP_BASE = 30;

/**
 * Additional XP earned per minute of deep work beyond the first 20 minutes.
 * Encourages longer, more focused sessions.
 * e.g. a 50-min session earns: 30 + (50 - 20) * 0.8 = 54 XP
 */
const FOCUS_XP_PER_MIN = 0.8;

/**
 * Keys of the five built-in resource nodes.
 * Built-in nodes cannot be deleted by the user.
 * @type {string[]}
 */
const BUILT_IN_NODES = ['health', 'mind', 'work', 'social', 'finance'];

/**
 * Two-letter abbreviations for each day of the week, Sunday-first.
 * Used in habit schedule tags on cards.
 * @type {string[]}
 */
const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Three-letter uppercase labels for the day-of-week picker buttons.
 * @type {string[]}
 */
const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Canonical render order for time-of-day habit groups.
 * Morning habits appear first, "anytime" habits last.
 * @type {string[]}
 */
const TIME_ORDER = ['morning', 'afternoon', 'evening', 'anytime'];

/**
 * Human-readable labels (with emoji) for each time-of-day bucket.
 * Keyed by the internal value stored on a habit's `time` field.
 * @type {Object.<string, string>}
 */
const TIME_LABELS = {
  morning:   '🌅 Morning',
  afternoon: '☀️ Afternoon',
  evening:   '🌙 Evening',
  anytime:   '⏰ Anytime',
};

/**
 * Sort weight for each priority level.
 * Lower numbers sort first — high priority habits appear at the top.
 * @type {Object.<string, number>}
 */
const PRIORITY_WEIGHT = { high: 0, medium: 1, low: 2 };

/**
 * Unicode arrow icon representing each priority level on habit cards.
 * @type {Object.<string, string>}
 */
const PRIORITY_ICON = { high: '▲', medium: '—', low: '▼' };

/**
 * CSS colour string for each priority level's icon on habit cards.
 * @type {Object.<string, string>}
 */
const PRIORITY_COLOR = { high: '#FF3B3B', medium: '#888', low: '#aaa' };
