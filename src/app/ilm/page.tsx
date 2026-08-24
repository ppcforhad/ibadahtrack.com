"use client";

import { AYATUL_KURSI, HADITHS, KALIMAS, QULS } from "@/lib/data";

export default function IlmPage() {
  return (
    <>
      <h1 className="mb-3 text-lg font-bold">📚 ইলম</h1>

      <section className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <p className="border-b border-gray-100 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800 dark:border-gray-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          ✨ আয়াতুল কুরসি
        </p>
        <p className="arabic-text px-4 py-4 text-right font-semibold leading-loose">{AYATUL_KURSI}</p>
      </section>

      <details className="mb-2 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <summary className="cursor-pointer list-none px-4 py-3 font-semibold">🕋 ছয় কালেমা</summary>
        <div className="space-y-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          {KALIMAS.map((k) => (
            <div key={k.name}>
              <p className="mb-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{k.name}</p>
              <p className="arabic-text mb-1 text-right font-medium">{k.arabic}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{k.meaning}</p>
            </div>
          ))}
        </div>
      </details>

      <details className="mb-2 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <summary className="cursor-pointer list-none px-4 py-3 font-semibold">📖 চার কুল শরীফ</summary>
        <div className="space-y-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          {QULS.map((s) => (
            <div key={s.name}>
              <p className="mb-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{s.name}</p>
              <p className="arabic-text mb-1 text-right font-medium">{s.arabic}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.meaning}</p>
            </div>
          ))}
        </div>
      </details>

      <details className="mb-2 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" open>
        <summary className="cursor-pointer list-none px-4 py-3 font-semibold">🌿 ১০টি সংক্ষিপ্ত হাদিস</summary>
        <ol className="space-y-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          {HADITHS.map((h, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{i + 1}</span>
              <span>
                {h.bn} <span className="text-xs text-gray-400">({h.src})</span>
              </span>
            </li>
          ))}
        </ol>
      </details>

      <p className="pb-2 pt-1 text-center text-xs text-gray-400">প্রতিদিন একটি করে শিখুন — টিকে থাকবে ইনশাআল্লাহ 🌱</p>
    </>
  );
}
