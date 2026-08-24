"use client";

import Link from "next/link";
import { MonthStats } from "@/lib/scoring";

const bnNum = (n: number) => n.toLocaleString("bn-BD");

/** Compact monthly report strip — receives precomputed stats so all numbers
 *  refresh with the home page's render cycle (no separate localStorage reads). */
export default function MonthReport({ stats, daysInMonth }: { stats: MonthStats; daysInMonth: number }) {
  const tiles = [
    { label: "মোট পয়েন্ট", val: bnNum(stats.totalPoints) },
    { label: "অ্যাক্টিভ দিন", val: `${bnNum(stats.activeDays)}/${bnNum(daysInMonth)}` },
    { label: "কুরআন পৃষ্ঠা", val: bnNum(stats.quranPages) },
    { label: "সেরা দিন", val: `${bnNum(stats.bestFardDay)}/${bnNum(5)} নামাজ` },
  ];

  return (
    <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">📅 এই মাসের রিপোর্ট</h3>
        <span className="flex shrink-0 items-center gap-3">
          <Link href="/leaderboard" className="text-xs font-medium text-emerald-600 hover:underline">
            র‍্যাঙ্ক দেখুন →
          </Link>
          <Link href="/stats" className="text-xs font-medium text-emerald-600 hover:underline">
            বিস্তারিত →
          </Link>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-900/20">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{t.label}</p>
            <p className="text-lg font-bold tabular-nums text-emerald-600">{t.val}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
