"use client";

import { useEffect, useMemo, useState } from "react";
import { SURAHS, surahAyahs, surahName } from "@/lib/surahs";

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
 *  Goal ring/bar + resume row: searchable dropdown opening BELOW the field
 *  (never covers the page) + freely-typeable ayah input (min 1, clamped on blur). */
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

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [ayahText, setAyahText] = useState<string>(String(lastAyah ?? 1));

  useEffect(() => {
    setAyahText(String(ayah));
  }, [ayah]);

  const goalOn = goal > 0;
  const pct = goalOn ? Math.max(0, Math.min(100, Math.round((pages / goal) * 100))) : 0;

  const step = (v: number, d: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v + d));

  const changeAyah = (d: number) =>
    setAyah((a) => step(a, d, 1, surahAyahs(surah)));

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return SURAHS.map((s, i) => ({ n: i + 1, ...s })).filter(
      (x) =>
        needle === "" ||
        x.bn.toLowerCase().includes(needle) ||
        String(x.n) === needle ||
        String(x.n).startsWith(needle)
    );
  }, [q]);

  const selectSurah = (n: number) => {
    setSurah(n);
    setAyah((a) => Math.min(a, surahAyahs(n)));
    setOpen(false);
    setQ("");
    setSaved(false);
  };

  /** Free typing allowed; hard-clamp to [1, surah max] when leaving the field. */
  const commitAyah = () => {
    const v = parseInt(ayahText, 10);
    const clamped = Number.isNaN(v) ? 1 : Math.max(1, Math.min(surahAyahs(surah), v));
    setAyah(clamped);
    setSaved(false);
  };

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
      <div className="relative flex items-stretch gap-2">
        {/* Surah: custom dropdown opening DOWNWARD */}
        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex h-11 w-full items-center justify-between gap-1 rounded-xl border border-gray-200 bg-white px-3 text-left dark:border-gray-700 dark:bg-gray-900"
          >
            <span className="truncate text-[11px] leading-tight text-gray-400">
              সূরা
              <span className="block truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {surahName(surah)}
              </span>
            </span>
            <span className="shrink-0 text-[10px] text-gray-400">{open ? "▲" : "▼"}</span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-100 p-2 dark:border-gray-800">
                  <input
                    autoFocus
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="সূরা খুঁজুন…"
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto overscroll-contain">
                  {filtered.map((x) => (
                    <button
                      key={x.n}
                      type="button"
                      onClick={() => selectSurah(x.n)}
                      className={
                        "flex min-h-[40px] w-full items-center justify-between px-3 py-2 text-left text-sm " +
                        (x.n === surah
                          ? "bg-emerald-600 font-semibold text-white"
                          : "text-gray-900 active:bg-emerald-50 dark:text-gray-100 dark:active:bg-emerald-900/40")
                      }
                    >
                      <span className="truncate">{x.bn}</span>
                      <span className={"shrink-0 text-[10px] " + (x.n === surah ? "text-emerald-100" : "text-gray-400")}>
                        {bnNum(x.n)} · {bnNum(x.ayahs)} আয়াত
                      </span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="px-3 py-3 text-center text-xs text-gray-400">পাওয়া যায়নি</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Ayah: free typing, min 1 enforced on blur */}
        <label className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">আয়াত</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={ayahText}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              setAyahText(raw);
              const v = parseInt(raw, 10);
              if (!Number.isNaN(v) && v >= 1 && v <= surahAyahs(surah)) {
                setAyah(v);
                setSaved(false);
              }
            }}
            onBlur={commitAyah}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-8 text-sm font-semibold tabular-nums text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 flex-col leading-none">
            <button type="button" aria-label="আয়াত বাড়ান" onClick={() => changeAyah(1)} className="px-1 text-[9px] text-emerald-600">▲</button>
            <button type="button" aria-label="আয়াত কমান" onClick={() => changeAyah(-1)} className="px-1 text-[9px] text-gray-400">▼</button>
          </span>
        </label>
      </div>
      <p className="mt-1 text-[10px] text-gray-400">
        {surahName(surah)} — মোট {bnNum(surahAyahs(surah))} আয়াত · আয়াত সরাসরি টাইপ করুন (সর্বনিম্ন ১)
      </p>
      <button
        onClick={() => { onSaveResume(surah, ayah); setSaved(true); }}
        className="mt-2 min-h-[44px] w-full rounded-xl bg-[#059669] text-sm font-semibold text-white active:scale-[0.99]"
      >
        💾 অবস্থান সেভ করুন
      </button>
      {(saved || (lastSurah && lastAyah)) && (
        <p className="mt-2 text-center text-xs font-medium text-emerald-700 dark:text-emerald-300">
          যেখানে থেমেছিলেন: সূরা {surahName(saved ? surah : (lastSurah as number))}, আয়াত {bnNum(saved ? ayah : (lastAyah as number))}
        </p>
      )}
    </div>
  );
}
