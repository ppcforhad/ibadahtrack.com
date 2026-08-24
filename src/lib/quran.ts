/** Quran reading helpers.
 *  Standard Madani mushaf layout = 604 pages; one full pass = one খতম. */

export const QURAN_TOTAL_PAGES = 604;

/** Lifetime khatam progress as a percentage (0–100), clamped.
 *  percentKhatam(302) → 50, percentKhatam(-5) → 0, percentKhatam(9999) → 100. */
export function percentKhatam(totalPages: number): number {
  if (!Number.isFinite(totalPages)) return 0;
  const pct = (totalPages / QURAN_TOTAL_PAGES) * 100;
  return Math.max(0, Math.min(100, pct));
}
