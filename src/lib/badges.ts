import { bestStreak, dayPoints } from "./scoring";
import { Logs } from "./storage";

export interface TopDay { key: string; pts: number }

/** Personal top-N days ranked by dayPoints desc (ties → newer date first).
 *  Days with 0 points are excluded so empty log shells never rank.
 *  quranGoal (default 0) threads the daily-goal bonus into rankings. */
export function topDays(logs: Logs, deedsMap?: Map<string, number>, n = 10, quranGoal = 0): TopDay[] {
  return Object.keys(logs)
    .map((key) => ({ key, pts: dayPoints(logs[key], deedsMap, quranGoal) }))
    .filter((d) => d.pts > 0)
    .sort((a, b) => b.pts - a.pts || (a.key < b.key ? 1 : -1))
    .slice(0, n);
}

export interface Badge {
  id: string; emoji: string; bn: string; desc: string; unlocked: boolean;
}

const FARDS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

/** Lifetime achievement badges computed from loadLogs().
 *  - প্রথম ধাপ: any fard logged on any single day
 *  - streaks: bestStreak thresholds
 *  - কুরআন: total quranPages summed over all days
 *  - যিকির: total zikr counts summed over all days
 *  - দুআ: UNIQUE duasRead entries across days (set union)
 *  - নিজের আমল: total deedsDone entries across days */
export function computeBadges(logs: Logs): Badge[] {
  let quranPages = 0;
  let zikrTotal = 0;
  let deedEntries = 0;
  let anyFard = false;
  const uniqueDuas = new Set<string>();
  for (const d of Object.values(logs)) {
    quranPages += d.quranPages ?? 0;
    zikrTotal += Object.values(d.zikrCounts ?? {}).reduce((a, b) => a + (b || 0), 0);
    deedEntries += d.deedsDone?.length ?? 0;
    if (FARDS.some((f) => !!d[f])) anyFard = true;
    (d.duasRead ?? []).forEach((x) => uniqueDuas.add(x));
  }
  const best = bestStreak(logs);
  return [
    { id: "first-step", emoji: "👣", bn: "প্রথম ধাপ", desc: "যেকোনো ফরজ নামাজ লগ করুন", unlocked: anyFard },
    { id: "streak-3", emoji: "🔥", bn: "৩ দিন স্ট্রিক", desc: "৫ নামাজ টানা ৩ দিন", unlocked: best >= 3 },
    { id: "streak-7", emoji: "⚡", bn: "৭ দিন স্ট্রিক", desc: "৫ নামাজ টানা ৭ দিন", unlocked: best >= 7 },
    { id: "streak-30", emoji: "🌟", bn: "৩০ দিন স্ট্রিক", desc: "৫ নামাজ টানা ৩০ দিন", unlocked: best >= 30 },
    { id: "quran-100", emoji: "📖", bn: "কুরআন ১০০ পৃষ্ঠা", desc: "মোট ১০০ পৃষ্ঠা তিলাওয়াত", unlocked: quranPages >= 100 },
    { id: "zikr-1000", emoji: "📿", bn: "যিকির ১০০০", desc: "মোট ১০০০ বার যিকির", unlocked: zikrTotal >= 1000 },
    { id: "dua-20", emoji: "🤲", bn: "দুআ ২০টি", desc: "২০টি ভিন্ন দুআ পড়ুন", unlocked: uniqueDuas.size >= 20 },
    { id: "deed-10", emoji: "✅", bn: "নিজের আমল ১০ বার", desc: "নিজের আমল ১০ বার সম্পন্ন", unlocked: deedEntries >= 10 },
  ];
}
