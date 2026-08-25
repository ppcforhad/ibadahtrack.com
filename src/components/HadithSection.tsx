"use client";

import { useMemo, useState } from "react";
import {
  HADITHS_25,
  HADITH_THEMES,
  type HadithTheme,
} from "@/lib/ilm";

const bnNum = (n: number) => n.toLocaleString("bn-BD");

/** হাদিস সেকশন: dropdown বিষয় নির্বাচন + ক্লিক করলে full-screen reader card
 *  (আগের/পরের নেভিগেশন, ক্লোজ, রেফারেন্স + সংক্ষিপ্ত ব্যাখ্যা)। */
export default function HadithSection() {
  const [theme, setTheme] = useState<HadithTheme | "">("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const list = useMemo(
    () => (theme === "" ? HADITHS_25 : HADITHS_25.filter((h) => h.theme === theme)),
    [theme]
  );

  const open = openIdx !== null ? list[openIdx] : null;
  const go = (d: 1 | -1) => {
    if (openIdx === null) return;
    const next: number = (openIdx as number) + d;
    if (next >= 0 && next < list.length) setOpenIdx(next);
  };

  return (
    <div className="pb-4">
      {/* Theme dropdown */}
      <div className="relative mb-3">
        <select
          value={theme}
          onChange={(e) => {
            setTheme(e.target.value as HadithTheme | "");
            setOpenIdx(null);
          }}
          className="min-h-[48px] w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 pr-10 text-sm font-medium outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">সব বিষয় ({bnNum(HADITHS_25.length)} হাদিস)</option>
          {HADITH_THEMES.map((t) => {
            const c = HADITHS_25.filter((h) => h.theme === t).length;
            return (
              <option key={t} value={t}>
                {t} ({bnNum(c)})
              </option>
            );
          })}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▼</span>
      </div>

      {/* Hadith list — tap to open card */}
      <div className="space-y-1.5">
        {list.map((h, i) => (
          <button
            key={i}
            onClick={() => setOpenIdx(i)}
            className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left transition active:scale-[0.99] dark:border-gray-800 dark:bg-gray-900"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
              {bnNum(i + 1)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
              {h.bn}
            </span>
            <span className="shrink-0 text-[10px] text-gray-400">{h.theme}</span>
            <span className="shrink-0 text-gray-300 dark:text-gray-600">›</span>
          </button>
        ))}
      </div>
      <p className="pt-3 text-center text-[11px] text-gray-400">সব হাদিস সহিহ কিতাবসমূহ থেকে যাচাইকৃত 📚</p>

      {/* ---------- Full-screen reader card ---------- */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950">
          <header className="border-b border-gray-200 bg-white px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpenIdx(null)}
                aria-label="বন্ধ করুন"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-100 text-lg text-gray-600 transition active:scale-95 dark:bg-gray-800 dark:text-gray-300"
              >
                ✕
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-emerald-700 dark:text-emerald-400">🕌 হাদিস</p>
                <p className="text-[11px] text-gray-400">
                  হাদিস {bnNum((openIdx ?? 0) + 1)} / {bnNum(list.length)} • {open.theme}
                </p>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <article className="mx-auto max-w-md">
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-5 dark:border-emerald-800 dark:from-emerald-900/30 dark:to-gray-900">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  {open.theme}
                </p>
                <p className="mt-3 text-lg font-semibold leading-relaxed text-gray-900 dark:text-gray-50">
                  “{open.bn}”
                </p>
                <p className="mt-4 inline-block rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white">
                  📚 {open.src}
                </p>
              </div>

              {open.detail && (
                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">📖 সংক্ষিপ্ত ব্যাখ্যা</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-200">{open.detail}</p>
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4 dark:border-emerald-700 dark:bg-emerald-900/20">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">💡 আমলের উপায়</p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-200">{open.action}</p>
              </div>
            </article>
          </div>

          <nav className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
            <div className="flex items-stretch">
              <button
                disabled={openIdx === null || openIdx === 0}
                onClick={() => go(-1)}
                className="min-h-[52px] flex-1 px-2 text-sm font-semibold text-emerald-700 transition active:scale-95 disabled:text-gray-300 dark:text-emerald-400 dark:disabled:text-gray-700"
              >
                ◀ আগের হাদিস
              </button>
              <button
                onClick={() => setOpenIdx(null)}
                className="my-1.5 flex min-h-[44px] items-center rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition active:scale-95"
              >
                📋 তালিকা
              </button>
              <button
                disabled={openIdx === null || openIdx === list.length - 1}
                onClick={() => go(1)}
                className="min-h-[52px] flex-1 px-2 text-sm font-semibold text-emerald-700 transition active:scale-95 disabled:text-gray-300 dark:text-emerald-400 dark:disabled:text-gray-700"
              >
                পরের হাদিস ▶
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
