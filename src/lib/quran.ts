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

export const JUZ_COUNT = 30;
export const PAGES_PER_JUZ = QURAN_TOTAL_PAGES / JUZ_COUNT;

/** Approximate juz progress derived from lifetime page total (pages are summed,
 *  not ordered — UI labels this আনুমানিক). Float guard: a full 604-page khatam
 *  must report done=30, never 29 due to 604/30 being non-terminating. */
export function juzProgress(
  totalPages: number
): { done: number; pagesToNext: number } {
  if (!Number.isFinite(totalPages) || totalPages <= 0)
    return { done: 0, pagesToNext: Math.ceil(PAGES_PER_JUZ) };
  if (totalPages >= QURAN_TOTAL_PAGES) return { done: JUZ_COUNT, pagesToNext: 0 };
  const done = Math.floor(totalPages / PAGES_PER_JUZ);
  const pagesToNext = Math.max(1, Math.ceil((done + 1) * PAGES_PER_JUZ - totalPages));
  return { done, pagesToNext };
}
