"use client";

import { useState } from "react";
import { surahAyahs, surahName } from "@/lib/surahs";

const bnNum = (n: number) => n.toLocaleString("bn-BD");

interface QuranGoalCardProps {
  /** Today's read pages. */
  pages: number;
  /** Daily page goal (0 = off). */
  goal: number;
  /** Saved resume position. */
  lastSurah?: number;
  lastAyah?: number;
  /** Persists {lastSurah, lastAyah} via saveQuranPrefs in the parent. */
  onSaveResume: (surah: number, ayah: number) => void;
}

/** কুরআন লক্ষ্য + "শেষ অবস্থান" resume card.
 *  Goal ring/bar for today plus a manual resume-position row (surah/ayah
 *  steppers + save button). No auto/session tracking by design. */
export default function QuranGoalCard({
  pages,
  goal,
  lastSurah,
  lastAyah,
  onSaveResume,
}: QuranGoalCardProps) {
  const [surah, setSurah] = useState<number>(lastSurah ?? 1);
  const [ayah, setAyah] = useState<number>(lastAyah ?? 1);
  const [saved, setSaved] = useState(false);

  const goalOn = goal > 0;
  const pct = goalOn ? Math.max(0, Math.min(100, Math.round((pages / goal) * 100))) : 0;
  const met = goalOn && pages >= goal;

  const step = (v: number, d: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v + d));

  const changeAyah = (d: number) =>
    setAyah((a) => step(a, d, 1, surahAyahs(surah)));

  const shownSurah = saved ? surah : (lastSurah ?? 0);
  const shownAyah = saved ? ayah : (lastAyah ?? 0);

  return (
    <div className="mt-3 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-900/30">
      {/* Goal ring / bar */}
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 36 36" className="h-14 w-14 shrink-0 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#d1fae5" strokeWidth="4" className="dark:opacity-30" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke="#059669" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${pct} ${100 - pct}`}
            pathLength={100}
          />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            আজকের লক্ষ্য {bnNum(pct)}%
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {goalOn ? `দৈনিক ${bnNum(goal)} পৃষ্ঠা` : "লক্ষ্য বন্ধ আছে — সেটিংসে সেট করুন"}
          </p>
        </div>
      </div>

      {/* Resume position */}
      <p className="mb-2 mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400">শেষ অবস্থান</p>
      <div className="flex items-stretch gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">সূরা</span>
          <select
            value={surah}
            onChange={(e) => {
              const next = Number(e.target.value);
              setSurah(next);
              setAyah((a) => Math.min(a, surahAyahs(next)));
              setSaved(false);
            }}
            className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-11 pr-7 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            {Array.from({ length: 114 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}. {surahName(n)}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">▼</span>
        </label>
        <label className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">আয়াত</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={surahAyahs(surah)}
            value={ayah}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isNaN(v)) return;
              setAyah(Math.max(1, Math.min(surahAyahs(surah), Math.floor(v))));
              setSaved(false);
            }}
            onBlur={() => setAyah((a) => Math.max(1, Math.min(surahAyahs(surah), a || 1)))}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-8 text-sm font-semibold tabular-nums text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 flex-col leading-none">
            <button type="button" aria-label="আয়াত বাড়ান" onClick={() => changeAyah(1)} className="px-1 text-[9px] text-emerald-600">▲</button>
            <button type="button" aria-label="আয়াত কমান" onClick={() => changeAyah(-1)} className="px-1 text-[9px] text-gray-400">▼</button>
          </span>
        </label>
      </div>
      <p className="mt-1 text-[10px] text-gray-400">
        {surahName(surah)} — মোট {bnNum(surahAyahs(surah))} আয়াত · সরাসরি টাইপ করা যাবে
      </p>
      <button
        onClick={() => { onSaveResume(surah, ayah); setSaved(true); }}
        className="mt-2 min-h-[44px] w-full rounded-xl bg-[#059669] text-sm font-semibold text-white active:scale-[0.99]"
      >
        💾 অবস্থান সেভ করুন
      </button>
      {shownSurah > 0 && (
        <p className="mt-2 text-center text-xs font-medium text-emerald-700 dark:text-emerald-300">
          যেখানে থেমেছিলেন: সূরা {surahName(shownSurah)}, আয়াত {bnNum(shownAyah)}
        </p>
      )}
    </div>
  );
}
