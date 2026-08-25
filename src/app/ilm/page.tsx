"use client";

import { useState } from "react";
import { KALIMAS } from "@/lib/data";
import QuranReader from "./quran-reader";
import HadithSection from "@/components/HadithSection";
import {
  HADITHS_25,
  MAULIK_ILM,
} from "@/lib/ilm";

const bnNum = (n: number) => n.toLocaleString("bn-BD");

type Tab = "quran" | "hadith" | "maulik";

const TABS: { id: Tab; label: string }[] = [
  { id: "quran", label: "📖 কুরআন" },
  { id: "hadith", label: "🕌 হাদিস" },
  { id: "maulik", label: "📚 মৌলিক ইলম" },
];

/** ইলম — ৩টি সেকশন: কুরআন (ফুল রিডার + ফজিলতপূর্ণ সূরা/আয়াত),
 *  হাদিস (২৫টি, ৫ থিম), মৌলিক ইলম (৫ স্তম্ভ, ৭ ঈমান, রাকাত টেবিল, ওজু-গুসল, কালেমা)। */
export default function IlmPage() {
  const [tab, setTab] = useState<Tab>("quran");

  return (
    <>
      <h1 className="mb-3 text-lg font-bold">📚 ইলম</h1>

      {/* Section tabs */}
      <div className="sticky top-0 z-10 -mx-4 mb-4 bg-gray-50/95 px-4 py-2 backdrop-blur dark:bg-gray-950/95">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "min-h-[40px] flex-1 rounded-full px-3 text-xs font-semibold transition " +
                (tab === t.id
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-300")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- কুরআন: শুধু রিডার (ফুল-হাইট) ---------------- */}
      {tab === "quran" && (
        <QuranReader />
      )}

      {/* ---------------- হাদিস (dropdown + reader cards) ---------------- */}
      {tab === "hadith" && <HadithSection />}

      {/* ---------------- মৌলিক ইলম ---------------- */}
      {tab === "maulik" && (
        <div className="space-y-2 pb-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 font-semibold text-emerald-700 dark:text-emerald-400">🕋 ইসলামের ৫ স্তম্ভ</h3>
            <ol className="space-y-1.5">
              {MAULIK_ILM.islam5.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">{bnNum(i + 1)}</span>
                  {s}
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 font-semibold text-emerald-700 dark:text-emerald-400">💚 ঈমানের ৭টি মৌলিক বিষয়</h3>
            <ol className="space-y-1.5">
              {MAULIK_ILM.iman7.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{bnNum(i + 1)}</span>
                  {s}
                </li>
              ))}
            </ol>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <h3 className="border-b border-gray-100 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800 dark:border-gray-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              🕐 ৫ ওয়াক্ত নামাজের রাকাত
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <th className="px-4 py-2 font-medium">ওয়াক্ত</th>
                  <th className="px-2 py-2 font-medium">সুন্নত</th>
                  <th className="px-4 py-2 font-medium">ফরজ</th>
                </tr>
              </thead>
              <tbody>
                {MAULIK_ILM.rakat.map((r) => (
                  <tr key={r.waqt} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2.5 font-semibold">{r.waqt}</td>
                    <td className="px-2 py-2.5 text-xs text-gray-500 dark:text-gray-400">{r.sunnah}</td>
                    <td className="px-4 py-2.5 font-bold text-emerald-600">{r.fard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 font-semibold text-emerald-700 dark:text-emerald-400">💧 ওজুর ফরজ (৪টি)</h3>
            <ol className="space-y-1.5">
              {MAULIK_ILM.wudu4.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">{bnNum(i + 1)}</span>
                  {s}
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 font-semibold text-emerald-700 dark:text-emerald-400">🚿 গুসলের ফরজ (৩টি)</h3>
            <ol className="space-y-1.5">
              {MAULIK_ILM.gusal3.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">{bnNum(i + 1)}</span>
                  {s}
                </li>
              ))}
            </ol>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <summary className="block border-b border-gray-100 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800 dark:border-gray-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              🕋 ছয় কালেমা
            </summary>
            <div className="space-y-3 px-4 py-3">
              {KALIMAS.map((k) => (
                <div key={k.name}>
                  <p className="mb-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{k.name}</p>
                  <p className="arabic-text mb-1 text-right font-medium">{k.arabic}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{k.meaning}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <p className="pb-2 pt-1 text-center text-xs text-gray-400">
        প্রতিদিন একটি করে শিখুন — টিকে থাকবে ইনশাআল্লাহ 🌱
      </p>
    </>
  );
}
