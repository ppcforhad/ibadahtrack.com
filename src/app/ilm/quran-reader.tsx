"use client";

/**
 * Quran reader — lives inside the Ilm page's কুরআন tab.
 * 114-surah list (direct, no entry card). Only সূরা আল-ফাতিহা is readable
 * right now (full, beautiful Hafezi-style rendering); all other surahs show
 * an honest "শীঘ্রই আসছে" state. Bookmarks + last-read kept.
 */

import { useEffect, useMemo, useState } from "react";
import { SURAHS, surahName } from "@/lib/surahs";

const bnNum = (n: number) => n.toLocaleString("bn-BD");

const BOOKMARKS_KEY = "it_quran_bookmarks_v1";
const LAST_KEY = "it_quran_last_v1";

function loadBookmarks(): number[] {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]"); } catch { return []; }
}
function saveBookmarks(b: number[]): void {
  try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(b)); } catch { /* ignore */ }
}
function loadLast(): number | null {
  try { return JSON.parse(localStorage.getItem(LAST_KEY) || "null"); } catch { return null; }
}
function saveLast(surah: number): void {
  try { localStorage.setItem(LAST_KEY, JSON.stringify({ surah, ts: Date.now() })); } catch { /* ignore */ }
}

/** সূরা আল-ফাতিহা — হিফজ মাদরাসা স্টাইল (প্রতি আয়াত আলাদা লাইনে, স্পষ্ট) */
const FATIHA_AYAHS: { n: number; text: string; meaning: string }[] = [
  { n: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", meaning: "পরম করুণাময় অসীম দয়ালু আল্লাহর নামে।" },
  { n: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", meaning: "সকল প্রশংসা আল্লাহর, যিনি সকল সৃষ্টিজগতের রব।" },
  { n: 3, text: "الرَّحْمَٰنِ الرَّحِيمِ", meaning: "পরম করুণাময়, অসীম দয়ালু।" },
  { n: 4, text: "مَالِكِ يَوْمِ الدِّينِ", meaning: "বিচার দিবসের মালিক।" },
  { n: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", meaning: "আমরা কেবল আপনারই ইবাদত করি এবং কেবল আপনারই সাহায্য প্রার্থনা করি।" },
  { n: 6, text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", meaning: "আমাদের সরল পথ দেখান।" },
  { n: 7, text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", meaning: "তাঁদের পথ, যাঁদের প্রতি আপনি অনুগ্রহ করেছেন; ক্রোধের শিকার ও পথভ্রষ্টদের পথ নয়।" },
];

type View = "list" | "read" | "soon";

export default function QuranReader() {
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState(1);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [last, setLast] = useState<number | null>(null);

  useEffect(() => {
    setBookmarks(loadBookmarks());
    const l = loadLast();
    if (l) setLast(l);
  }, []);

  const filtered = useMemo(() => {
    const en = query.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).trim();
    let list = SURAHS.map((s, i) => ({ ...s, num: i + 1 }));
    if (onlyBookmarked) list = list.filter((s) => bookmarks.includes(s.num));
    if (!en) return list;
    return list.filter(
      ({ bn, num }) =>
        bn.includes(query.trim()) ||
        String(num).includes(en) ||
        bnNum(num).includes(query.trim())
    );
  }, [query, onlyBookmarked, bookmarks]);

  const toggleBookmark = (n: number) => {
    const cur = bookmarks.includes(n) ? bookmarks.filter((x) => x !== n) : [...bookmarks, n];
    setBookmarks(cur);
    saveBookmarks(cur);
  };

  const openSurah = (n: number) => {
    setCurrent(n);
    setView(n === 1 ? "read" : "soon");
    saveLast(n);
    setLast(n);
  };

  return (
    <div className="flex h-[calc(100vh-15rem)] min-h-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-3 py-2.5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="flex items-center gap-2">
          {!(view === "list") && (
            <button
              onClick={() => setView("list")}
              aria-label="পিছনে"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-100 text-lg text-gray-600 transition active:scale-95 dark:bg-gray-800 dark:text-gray-300"
            >
              ←
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-emerald-700 dark:text-emerald-400">
              📖 {view === "list" ? "সম্পূর্ণ কুরআন" : surahName(current)}
            </p>
            <p className="text-[11px] text-gray-400">
              {view === "list"
                ? `${bnNum(SURAHS.length)}টি সূরা • ফাতিহা পড়ার জন্য প্রস্তুত`
                : view === "read"
                  ? `সূরা ${bnNum(current)} • ${bnNum(SURAHS[current - 1]?.ayahs ?? 0)} আয়াত`
                  : "শীঘ্রই আসছে"}
            </p>
          </div>
          {view === "read" && (
            <button
              onClick={() => toggleBookmark(current)}
              aria-label="বুকমার্ক"
              className={
                "grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg transition active:scale-95 " +
                (bookmarks.includes(current)
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300")
              }
            >
              🔖
            </button>
          )}
        </div>
      </header>

      {/* ---------- Surah list ---------- */}
      {view === "list" && (
        <>
          <div className="border-b border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="সূরা খুঁজুন… (নাম বা নম্বর)"
              className="min-h-[42px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-emerald-900"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setOnlyBookmarked(!onlyBookmarked)}
                className={
                  "min-h-[34px] rounded-full px-3 text-xs font-semibold transition " +
                  (onlyBookmarked
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300")
                }
              >
                🔖 বুকমার্ক ({bnNum(bookmarks.length)})
              </button>
              {last !== null && (
                <button
                  onClick={() => openSurah(last)}
                  className="min-h-[34px] rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition active:scale-95 dark:bg-emerald-900/40 dark:text-emerald-300"
                >
                  📖 শেষ পড়া: {surahName(last)} — চালিয়ে যান
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2">
            {filtered.length === 0 && (
              <p className="pt-8 text-center text-sm text-gray-400">কোনো সূরা মেলেনি 🔍</p>
            )}
            <div className="space-y-1.5">
              {filtered.map(({ bn, ayahs, num }) => {
                const available = num === 1;
                return (
                  <button
                    key={num}
                    onClick={() => openSurah(num)}
                    className={
                      "flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition active:scale-[0.99] " +
                      (num === current
                        ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30"
                        : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900")
                    }
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      {bnNum(num)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {bookmarks.includes(num) && <span className="mr-1">🔖</span>}
                      {bn}
                      {!available && (
                        <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-400 dark:bg-gray-800">
                          শীঘ্রই
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-400">{bnNum(ayahs)} আয়াত</span>
                  </button>
                );
              })}
            </div>
            <p className="py-3 text-center text-[11px] text-gray-400">
              📖 বাকি সূরাগুলো শীঘ্রই যোগ হবে, ইনশাআল্লাহ
            </p>
          </div>
        </>
      )}

      {/* ---------- ফাতিহা reading view (available) ---------- */}
      {view === "read" && current === 1 && (
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 pt-3">
          <article className="mx-auto max-w-md">
            {/* Surah medallion */}
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white py-4 text-center dark:border-emerald-800 dark:from-emerald-900/30 dark:to-gray-900">
              <p className="quran-text !text-2xl font-bold text-emerald-800 dark:text-emerald-200">سُورَةُ الْفَاتِحَة</p>
              <p className="mt-1 text-[11px] text-gray-400">সূরা নং {bnNum(1)} • {bnNum(7)} আয়াত • মাক্কী</p>
            </div>

            {/* Each ayah: own card — hifz madrasa style, crystal clear */}
            <div className="space-y-3">
              {FATIHA_AYAHS.map((a) => (
                <div key={a.n} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      {bnNum(a.n)}
                    </span>
                    <span className="quran-text text-lg text-emerald-700 dark:text-emerald-400">﴿{bnNum(a.n)}﴾</span>
                  </div>
                  <p className="quran-text text-right text-[1.9rem] leading-[2.4] font-semibold text-gray-900 dark:text-gray-50">
                    {a.text}
                  </p>
                  <p className="mt-3 border-t border-gray-100 pt-2.5 text-sm font-medium leading-relaxed text-gray-700 dark:border-gray-800 dark:text-gray-200">
                    {a.meaning}
                  </p>
                </div>
              ))}
            </div>

            <p className="py-4 text-center text-[11px] text-gray-400">
              ☾ সূরা আল-ফাতিহা সম্পন্ন ☽
            </p>
          </article>
        </div>
      )}

      {/* ---------- Coming soon ---------- */}
      {view === "soon" && current !== 1 && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="mb-4 text-5xl">📖</span>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">সূরা {surahName(current)}</h3>
          <p className="mt-1 text-xs text-gray-400">সূরা নং {bnNum(current)} • {bnNum(SURAHS[current - 1]?.ayahs ?? 0)} আয়াত</p>
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/30">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">🚧 শীঘ্রই আসছে</p>
            <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              এই সূরাটি খুব শীঘ্রই যোগ করা হবে, ইনশাআল্লাহ। আপাতত সূরা আল-ফাতিহা পড়ুন।
            </p>
            <button
              onClick={() => { setCurrent(1); setView("read"); }}
              className="mt-4 min-h-[44px] rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white transition active:scale-95"
            >
              📖 সূরা আল-ফাতিহা পড়ুন
            </button>
          </div>
        </div>
      )}

      {/* ---------- Bottom nav (reading views) ---------- */}
      {view !== "list" && (
        <nav className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
          <div className="flex items-stretch">
            <button
              disabled={current <= 1}
              onClick={() => openSurah(current - 1)}
              className="min-h-[52px] flex-1 px-2 text-sm font-semibold text-emerald-700 transition active:scale-95 disabled:text-gray-300 dark:text-emerald-400 dark:disabled:text-gray-700"
            >
              ◀ আগের সূরা
            </button>
            <button
              onClick={() => setView("list")}
              className="my-1.5 flex min-h-[44px] items-center rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition active:scale-95"
            >
              📚 সূরা তালিকা
            </button>
            <button
              disabled={current >= 114}
              onClick={() => openSurah(current + 1)}
              className="min-h-[52px] flex-1 px-2 text-sm font-semibold text-emerald-700 transition active:scale-95 disabled:text-gray-300 dark:text-emerald-400 dark:disabled:text-gray-700"
            >
              পরের সূরা ▶
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
