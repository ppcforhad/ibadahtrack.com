"use client";

import { useState } from "react";
import QuranReader from "./quran-reader";
import HadithSection from "@/components/HadithSection";
import MaulikSection from "@/components/MaulikSection";

type Tab = "quran" | "hadith" | "maulik";

const TABS: { id: Tab; label: string }[] = [
  { id: "quran", label: "📖 কুরআন" },
  { id: "hadith", label: "🕌 হাদিস" },
  { id: "maulik", label: "📚 মৌলিক ইলম" },
];

/** ইলম — ৩টি সেকশন: কুরআন (রিডার), হাদিস (ড্রপডাউন+কার্ড), মৌলিক ইলম (কোলাপসিবল)। */
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

      {tab === "quran" && <QuranReader />}
      {tab === "hadith" && <HadithSection />}
      {tab === "maulik" && <MaulikSection />}

      <p className="pb-2 pt-1 text-center text-xs text-gray-400">
        প্রতিদিন একটি করে শিখুন — টিকে থাকবে ইনশাআল্লাহ 🌱
      </p>
    </>
  );
}
