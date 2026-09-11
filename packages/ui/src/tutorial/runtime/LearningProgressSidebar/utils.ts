/**
 * RSSB Utilities
 * Format helpers matching ILS_UI_UX/script.js prototype logic
 */

/**
 * Format seconds to "Xm Ys" or "Ys"
 * EXACT logic from ILS_UI_UX/script.js prototype
 * 
 * @param sec - Seconds value (undefined/0 returns "0s")
 * @returns Formatted time string
 */
export function formatSeconds(sec: number | undefined): string {
  if (!sec || sec === 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * Format date to "Jan 10, 2026"
 * EXACT logic from ILS_UI_UX/script.js prototype
 * 
 * Handles both Date objects (ILSOverallProgress) and ISO strings (ILSActiveBlockProgress)
 * 
 * @param date - Date object, ISO string, or null/undefined
 * @returns Formatted date string or "—" if unavailable
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}
