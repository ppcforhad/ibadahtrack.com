"use client";

import { useEffect, useState } from "react";
import { Logs, loadDeeds, loadLogs } from "@/lib/storage";
import { lifetimePoints, monthStats } from "@/lib/scoring";

const bnNum = (n: number) => n.toLocaleString("bn-BD");

type Scope = "month" | "alltime";

/** Fixed demo cohort — constant values only, so the render is fully
 *  deterministic (no random / no clock inside render → no hydration mismatch). */
const DEMO: { name: string; month: number; alltime: number }[] = [
  { name: "আয়েশা", month: 640, alltime: 8420 },
  { name: "ইব্রাহীম", month: 585, alltime: 7960 },
  { name: "সুমাইয়া", month: 512, alltime: 6810 },
  { name: "ইউসুফ", month: 468, alltime: 6540 },
  { name: "মরিয়ম", month: 430, alltime: 5975 },
  { name: "হামজা", month: 372, alltime: 5230 },
  { name: "যাকারিয়া", month: 315, alltime: 4880 },
  { name: "হাফসা", month: 264, alltime: 4125 },
  { name: "বিলাল", month: 190, alltime: 3560 },
];

const SCOPES: { id: Scope; label: string }[] = [
  { id: "month", label: "এই মাস" },
  { id: "alltime", label: "সর্বকাল" },
];

/** লিডারবোর্ড প্রিভিউ — user's real score ranked against a seeded demo list.
 *  Privacy-first: nothing leaves the device; group join is a disabled visual. */
export default function LeaderboardPage() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<Logs>({});
  const [scope, setScope] = useState<Scope>("month");

  useEffect(() => {
    setMounted(true);
    setLogs(loadLogs());
  }, []);

  if (!mounted) return <p className="py-20 text-center text-gray-400">লোড হচ্ছে…</p>;

  const nowD = new Date();
  const y = nowD.getFullYear(), m = nowD.getMonth();
  // Build deedsMap from loadDeeds() BEFORE scoring, or custom-deed points silently drop
  // (same pattern as stats/page.tsx).
  const deedsMap = new Map(loadDeeds().map((x) => [x.id, x.pts]));

  const userMonthPts = monthStats(logs, y, m, deedsMap).totalPoints;
  const userAllPts = lifetimePoints(logs, deedsMap);

  type Row = { name: string; pts: number; isUser?: boolean };
  const rows: Row[] = [
    ...DEMO.map((d) => ({ name: d.name, pts: scope === "month" ? d.month : d.alltime })),
    { name: "আপনি", pts: scope === "month" ? userMonthPts : userAllPts, isUser: true },
  ];

  // Highest points first; equal points share the same rank (no arbitrary tie-break).
  type Ranked = Row & { rank: number };
  const ranked: Ranked[] = [];
  let prevPts = NaN;
  let prevRank = 0;
  [...rows]
    .sort((a, b) => b.pts - a.pts)
    .forEach((r, i) => {
      const rank = r.pts === prevPts ? prevRank : i + 1;
      prevPts = r.pts;
      prevRank = rank;
      ranked.push({ ...r, rank });
    });

  const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <>
      <h1 className="mb-1 text-lg font-bold">🏅 লিডারবোর্ড প্রিভিউ</h1>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        নিজের অগ্রগতি নমুনা তালিকার সাথে মিলিয়ে দেখুন — প্রতিযোগিতা নয়, অনুপ্রেরণা।
      </p>

      <div className="mb-4 flex gap-2">
        {SCOPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setScope(t.id)}
            aria-pressed={scope === t.id}
            className={
              "min-h-[36px] flex-1 rounded-full border px-4 text-sm font-medium transition active:scale-[0.98] " +
              (scope === t.id
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {ranked.map((r) => (
          <div
            key={r.name}
            className={
              "flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 text-sm last:border-b-0 dark:border-gray-800 " +
              (r.isUser ? "bg-emerald-50 dark:bg-emerald-900/30" : "")
            }
          >
            <span className="w-7 shrink-0 text-center font-semibold tabular-nums text-gray-400">
              {medals[r.rank] ?? bnNum(r.rank)}
            </span>
            <span className={"flex-1 truncate " + (r.isUser ? "font-bold text-emerald-700 dark:text-emerald-300" : "")}>
              {r.name}
            </span>
            <span
              className={
                "shrink-0 font-semibold tabular-nums " +
                (r.isUser ? "text-emerald-600" : "text-gray-600 dark:text-gray-300")
              }
            >
              {bnNum(r.pts)}
            </span>
          </div>
        ))}
      </section>

      {/* Future opt-in — visual placeholder only, stays off and disabled */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-3 opacity-60 dark:border-gray-700 dark:bg-gray-800/50">
        <span className="text-sm text-gray-600 dark:text-gray-300">👥 গ্রুপে যুক্ত হওয়া (শীঘ্রই)</span>
        <button
          type="button"
          disabled
          aria-pressed={false}
          aria-label="গ্রুপে যুক্ত হওয়া (শীঘ্রই)"
          className="relative h-6 w-11 cursor-not-allowed rounded-full bg-gray-300 dark:bg-gray-600"
        >
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
        </button>
      </div>

      <p className="mb-2 text-center text-xs text-gray-400">🔒 নমুনা ডেটা — আপনার স্কোর শুধু আপনার ডিভাইসে, কারও সাথে শেয়ার হয় না।</p>
      <p className="pb-2 text-center text-xs text-gray-400">
        ইবাদতের স্কোর লোক দেখানোর জন্য নয় — এটি শুধু নিজের হিসাব ও ইখলাস যাচাইয়ের সঙ্গী।
      </p>
    </>
  );
}
