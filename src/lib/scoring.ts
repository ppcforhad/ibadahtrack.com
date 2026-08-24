import { DayLog, Logs } from "./storage";

const FARDS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export function allFive(d?: DayLog): boolean {
  return !!d && FARDS.every((k) => !!d[k]);
}

/** Fard 10 pts each, Fajr +5 bonus, all-5 +20 bonus, Quran >=1 page +5,
 *  Zikr +2 per completed 100 (cap 10/day), Dua read +1 each (cap 5/day),
 *  custom deeds add their own point values via deedsMap (loaded by caller). */
export function dayPoints(d?: DayLog, deedsMap?: Map<string, number>): number {
  if (!d) return 0;
  let p = 0;
  FARDS.forEach((k, i) => { if (d[k]) p += i === 0 ? 15 : 10; });
  if (allFive(d)) p += 20;
  if ((d.quranPages ?? 0) > 0) p += 5;
  const zTotal = Object.values(d.zikrCounts ?? {}).reduce((a, b) => a + (b || 0), 0);
  p += Math.min(10, Math.floor(zTotal / 100) * 2);
  p += Math.min(5, d.duasRead?.length ?? 0);
  p += (d.deedsDone ?? []).reduce((a, id) => a + (deedsMap?.get(id) ?? 0), 0);
  return p;
}

export function currentStreak(logs: Logs, todayKey: string): number {
  let k = todayKey;
  if (!allFive(logs[todayKey])) k = minusOne(k);
  let s = 0;
  while (allFive(logs[k])) { s++; k = minusOne(k); }
  return s;
}

function minusOne(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d - 1);
  return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
}

export function bestStreak(logs: Logs): number {
  const keys = Object.keys(logs).filter((k) => allFive(logs[k])).sort();
  let best = 0, run = 0, prev = "";
  for (const k of keys) {
    run = prev && minusOne(prev) === k ? run + 1 : 1;
    if (run > best) best = run;
    prev = k;
  }
  return best;
}

export function lifetimePoints(logs: Logs, deedsMap?: Map<string, number>): number {
  return Object.values(logs).reduce((a, d) => a + dayPoints(d, deedsMap), 0);
}

export interface MonthStats {
  totalPoints: number; activeDays: number; quranPages: number; bestFardDay: number;
}

/** Stats for calendar month m (0-based) of year y.
 *  activeDays counts days with dayPoints > 0 (empty log shells don't count);
 *  bestFardDay is the highest fard count reached on any single day (tie → first). */
export function monthStats(logs: Logs, y: number, m: number, deedsMap?: Map<string, number>): MonthStats {
  const prefix = y + "-" + String(m + 1).padStart(2, "0") + "-";
  const keys = Object.keys(logs).filter((k) => k.startsWith(prefix)).sort();
  let totalPoints = 0, activeDays = 0, quranPages = 0, bestFardDay = 0;
  for (const k of keys) {
    const d = logs[k];
    const p = dayPoints(d, deedsMap);
    totalPoints += p;
    if (p > 0) activeDays++;
    quranPages += d.quranPages ?? 0;
    const f = FARDS.reduce((a, kd) => a + (d[kd] ? 1 : 0), 0);
    if (f > bestFardDay) bestFardDay = f;
  }
  return { totalPoints, activeDays, quranPages, bestFardDay };
}
