/**
 * analytics.js — Pure statistic computation functions for AnalyticsDashboard.
 * No side effects, no IndexedDB or network calls. All functions operate solely
 * on the data passed as arguments.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

/**
 * Compute session counts for today, last 7 days, last 30 days.
 *
 * - "today"  : sessions with date >= start of the reference day (00:00:00.000)
 * - "last7"  : sessions with date >= 6 days before start of reference day
 *              (i.e. the 7-day window includes today)
 * - "last30" : sessions with date >= 29 days before start of reference day
 *              (i.e. the 30-day window includes today)
 *
 * @param {Array<{date: string}>} sessions - Array of session objects; each must
 *   have a `.date` property that is a valid ISO 8601 date string.
 * @param {Date} referenceDate - The "today" reference (defaults to new Date()).
 * @returns {{ today: number, last7: number, last30: number }}
 */
export function computePeriodCounts(sessions, referenceDate = new Date()) {
  const now = referenceDate;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start7 = new Date(startOfToday);
  start7.setDate(start7.getDate() - 6);
  const start30 = new Date(startOfToday);
  start30.setDate(start30.getDate() - 29);

  let today = 0, last7 = 0, last30 = 0;
  for (const s of sessions) {
    const d = new Date(s.date);
    if (d >= startOfToday) today++;
    if (d >= start7) last7++;
    if (d >= start30) last30++;
  }
  return { today, last7, last30 };
}

/**
 * Compute the most frequently used value for a given field across sessions.
 *
 * - Returns `null` if the sessions array is empty.
 * - Sessions where the field is falsy (undefined, null, empty string) are skipped.
 * - Ties are broken alphabetically (ascending) so the result is deterministic.
 *
 * @param {Array<Object>} sessions - Array of session objects.
 * @param {string} field - The field name to analyse (e.g. `"theme"`, `"filter"`).
 * @returns {string|null} The most common value, or `null` if no data.
 */
export function computeTopUsed(sessions, field) {
  if (!sessions.length) return null;

  const counts = {};
  for (const s of sessions) {
    const val = s[field];
    if (val) counts[val] = (counts[val] || 0) + 1;
  }

  const entries = Object.entries(counts);
  if (!entries.length) return null;

  // Sort: descending by count, then ascending alphabetically to break ties.
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return entries[0][0];
}

/**
 * Compute hourly distribution (hours 0–23) of sessions.
 *
 * The hour is determined by `new Date(s.date).getHours()`, which uses the
 * local timezone of the device running the code.
 *
 * @param {Array<{date: string}>} sessions - Array of session objects.
 * @returns {number[]} Array of 24 numbers where index `h` is the count of
 *   sessions whose local hour equals `h`.  Sum of array equals sessions.length.
 */
export function computeHourlyDistribution(sessions) {
  const dist = new Array(24).fill(0);
  for (const s of sessions) {
    const h = new Date(s.date).getHours();
    dist[h]++;
  }
  return dist;
}

/**
 * Compute weekly distribution (Monday=0 … Sunday=6) of sessions.
 *
 * JavaScript's `Date.getDay()` returns 0 for Sunday and 6 for Saturday.
 * This function remaps to ISO-week order: Monday=0, …, Sunday=6.
 *
 * @param {Array<{date: string}>} sessions - Array of session objects.
 * @returns {number[]} Array of 7 numbers where index 0=Monday … 6=Sunday.
 *   Sum of array equals sessions.length.
 */
export function computeWeeklyDistribution(sessions) {
  const dist = new Array(7).fill(0);
  for (const s of sessions) {
    // getDay(): 0=Sun, 1=Mon, …, 6=Sat  →  remap to Mon=0 … Sun=6
    const day = (new Date(s.date).getDay() + 6) % 7;
    dist[day]++;
  }
  return dist;
}
