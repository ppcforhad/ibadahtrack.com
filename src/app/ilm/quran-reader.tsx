"use client";

/**
 * Full Quran reader — lives inside the Ilm page's কুরআন tab.
 * Entry card → full-screen overlay: searchable 114-surah list ↔ continuous
 * Arabic Uthmani reading view (Hafezi-style flow, Bangla ayah markers,
 * prev/next navigation). Text cached offline via src/lib/quran-api.ts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SURAHS, surahName } from "@/lib/surahs";
import { fetchSurah, type SurahText } from "@/lib/quran-api";

const bnNum = (n: number) => n.toLocaleString("bn-BD");

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
/** Uthmani bismillah the primary API prepends to ayah 1 (all surahs except 1 & 9). */
const BISMILLAH_PREFIX = new RegExp(
  "^بِسْمِ\\s*ٱللَّهِ\\s*ٱلرَّحْمَٰنِ\\s*ٱلرَّحِيمِ\\s*"
);

type View = "list" | "read";

const BOOKMARKS_KEY = "it_quran_bookmarks_v1";
const LAST_KEY = "it_quran_last_v1";

interface AyahBookmark { s: number; a: number }

function loadBookmarks(): number[] {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]"); } catch { return []; }
}
function saveBookmarks(b: number[]): void {
  try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(b)); } catch { /* ignore */ }
}
function loadAyahBookmarks(): AyahBookmark[] {
  try { return JSON.parse(localStorage.getItem("it_quran_ayah_marks_v1") || "[]"); } catch { return []; }
}
function saveAyahBookmarks(b: AyahBookmark[]): void {
  try { localStorage.setItem("it_quran_ayah_marks_v1", JSON.stringify(b)); } catch { /* ignore */ }
}
function loadLast(): { surah: number } | null {
  try { return JSON.parse(localStorage.getItem(LAST_KEY) || "null"); } catch { return null; }
}
function saveLast(surah: number): void {
  try { localStorage.setItem(LAST_KEY, JSON.stringify({ surah, ts: Date.now() })); } catch { /* ignore */ }
}

export default function QuranReader() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState(1);
  const [data, setData] = useState<SurahText | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selAyah, setSelAyah] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [last, setLast] = useState<{ surah: number } | null>(null);
  const [ayahMarks, setAyahMarks] = useState<AyahBookmark[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load persisted data on mount
  useEffect(() => {
    setBookmarks(loadBookmarks());
    setAyahMarks(loadAyahBookmarks());
    setLast(loadLast());
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const load = useCallback(async (n: number) => {
    setLoading(true);
    setError("");
    setSelAyah(null);
    try {
      const s = await fetchSurah(n);
      setData(s);
      setCurrent(n);
      setView("read");
      saveLast(n);
      setLast({ surah: n });
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: 0 })
      );
    } catch {
      setError("ইন্টারনেট সংযোগ পাওয়া যায়নি এবং অফলাইন কপিও নেই।");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleBookmark = (n: number) => {
    const cur = bookmarks.includes(n)
      ? bookmarks.filter((x) => x !== n)
      : [...bookmarks, n];
    setBookmarks(cur);
    saveBookmarks(cur);
  };

  const go = (n: number) => {
    if (n >= 1 && n <= 114 && n !== current) void load(n);
  };

  // Split the prepended bismillah out of ayah 1 (Hafezi mushaf style).
  let firstText = data?.ayahs[0]?.text ?? "";
  let showBismillah = false;
  if (data) {
    if (current === 1 || current === 9) {
      showBismillah = false;
    } else {
      showBismillah = true;
      firstText = firstText.replace(BISMILLAH_PREFIX, "").trim();
    }
  }

  if (!open) {
    // Direct mode: the reader IS the কুরআন tab content — list visible immediately.
    return <QuranReaderInner
      open
      setOpen={setOpen}
      view={view}
      setView={setView}
      query={query}
      setQuery={setQuery}
      current={current}
      setCurrent={setCurrent}
      data={data}
      setData={setData}
      loading={loading}
      setLoading={setLoading}
      error={error}
      setError={setError}
      selAyah={selAyah}
      setSelAyah={setSelAyah}
      bookmarks={bookmarks}
      setBookmarks={setBookmarks}
      ayahMarks={ayahMarks}
      setAyahMarks={setAyahMarks}
      onlyBookmarked={onlyBookmarked}
      setOnlyBookmarked={setOnlyBookmarked}
      last={last}
      setLast={setLast}
      scrollRef={scrollRef}
      directMode
    />;
  }

  // Entry-card mode (kept for compatibility if used elsewhere).
  return (
    <button
      onClick={() => {
        setOpen(true);
        setView("list");
        setQuery("");
        setBookmarks(loadBookmarks());
        setLast(loadLast());
      }}
      className="w-full rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-500 p-4 text-left shadow-md transition active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white">📖 সম্পূর্ণ কুরআন পড়ুন</p>
          <p className="mt-0.5 text-xs text-emerald-50/90">
            {bnNum(114)} সূরা • উসমানী লিপি • অফলাইনেও চলে
          </p>
        </div>
        <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">
          খুলুন ›
        </span>
      </div>
    </button>
  );
}

interface ReaderProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  view: View;
  setView: (v: View) => void;
  query: string;
  setQuery: (v: string) => void;
  current: number;
  setCurrent: (n: number) => void;
  data: SurahText | null;
  setData: (d: SurahText | null) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string;
  setError: (v: string) => void;
  selAyah: number | null;
  setSelAyah: (n: number | null) => void;
  bookmarks: number[];
  setBookmarks: (b: number[]) => void;
  ayahMarks: AyahBookmark[];
  setAyahMarks: (b: AyahBookmark[]) => void;
  onlyBookmarked: boolean;
  setOnlyBookmarked: (v: boolean) => void;
  last: { surah: number } | null;
  setLast: (l: { surah: number } | null) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  directMode?: boolean;
}

function QuranReaderInner(p: ReaderProps) {
  const { open, setOpen, view, setView, query, setQuery, current, setCurrent, data, setData, loading, setLoading, error, setError, selAyah, setSelAyah, bookmarks, setBookmarks, ayahMarks, setAyahMarks, onlyBookmarked, setOnlyBookmarked, last, setLast, scrollRef, directMode } = p;
  const localScroll = useRef<HTMLDivElement>(null);
  const scrollEl = scrollRef ?? localScroll;

  /** Bangla-digit-tolerant search: name contains OR number matches. */
  const filtered = useMemo(() => {
    const en = query.replace(/[০-৯]/g, (d) =>
      String("০১২৩৪৫৬৭৮৯".indexOf(d))
    ).trim();
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

  // Load bookmarks + last-read on first mount (direct mode shows list immediately).
  useEffect(() => {
    if (open && bookmarks.length === 0) setBookmarks(loadBookmarks());
    if (open && !last) setLast(loadLast());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const load = useCallback(async (n: number) => {
    setLoading(true);
    setError("");
    setSelAyah(null);
    try {
      const s = await fetchSurah(n);
      setData(s);
      setCurrent(n);
      setView("read");
      saveLast(n);
      setLast({ surah: n });
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: 0 })
      );
    } catch {
      setError("ইন্টারনেট সংযোগ পাওয়া যায়নি এবং অফলাইন কপিও নেই।");
    } finally {
      setLoading(false);
    }
  }, [setCurrent, setData, setView, setError, setLoading, setSelAyah, setLast, scrollRef]);

  const toggleBookmark = (n: number) => {
    const cur = bookmarks.includes(n)
      ? bookmarks.filter((x) => x !== n)
      : [...bookmarks, n];
    setBookmarks(cur);
    saveBookmarks(cur);
  };

  const go = (n: number) => {
    if (n >= 1 && n <= 114 && n !== current) void load(n);
  };

  // Split the prepended bismillah out of ayah 1 (Hafezi mushaf style).
  let firstText = data?.ayahs[0]?.text ?? "";
  let showBismillah = false;
  if (data) {
    if (current === 1 || current === 9) {
      showBismillah = false;
    } else {
      showBismillah = true;
      firstText = firstText.replace(BISMILLAH_PREFIX, "").trim();
    }
  }

  return (
    <div className={directMode
      ? "flex h-[calc(100vh-15rem)] min-h-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950"
      : "fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950"}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-3 py-2.5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="flex items-center gap-2">
          {!(directMode && view === "list") && (
            <button
              onClick={() => {
                if (view === "read") setView("list");
                else setOpen(false);
              }}
              aria-label={view === "read" ? "পিছনে" : "বন্ধ করুন"}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-100 text-lg text-gray-600 transition active:scale-95 dark:bg-gray-800 dark:text-gray-300"
            >
              {view === "read" ? "←" : "✕"}
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-emerald-700 dark:text-emerald-400">
              📖 {view === "read" ? surahName(current) : "সম্পূর্ণ কুরআন"}
            </p>
            <p className="text-[11px] text-gray-400">
              {view === "read" ? `সূরা ${bnNum(current)} • ${bnNum(SURAHS[current - 1]?.ayahs ?? 0)} আয়াত` : `${bnNum(SURAHS.length)}টি সূরা`}
            </p>
          </div>
          {view === "read" && (
            <>
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
                {bookmarks.includes(current) ? "🔖" : "🔖"}
              </button>
              <button
                onClick={() => setView("list")}
                className="min-h-[36px] shrink-0 rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition active:scale-95 dark:bg-emerald-900/40 dark:text-emerald-300"
              >
                📚 তালিকা
              </button>
            </>
          )}
        </div>
      </header>

      {/* ---------- Surah list view ---------- */}
      {view === "list" ? (
        <>
          <div className="border-b border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="সূরা খুঁজুন… (নাম বা নম্বর)"
              className="min-h-[42px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-emerald-900"
            />
            <div className="mt-2 flex gap-2">
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
              {last && (
                <button
                  onClick={() => void load(last.surah)}
                  className="min-h-[34px] rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition active:scale-95 dark:bg-emerald-900/40 dark:text-emerald-300"
                >
                  📖 শেষ পড়া: {surahName(last.surah)} — চালিয়ে যান
                </button>
              )}
            </div>
          </div>
          <div ref={scrollEl as React.RefObject<HTMLDivElement>} className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 pb-24">
            {filtered.length === 0 && (
              <p className="pt-8 text-center text-sm text-gray-400">কোনো সূরা মেলেনি 🔍</p>
            )}
            <div className="space-y-1.5">
              {filtered.map(({ bn, ayahs, num }) => (
                <button
                  key={num}
                  onClick={() => void load(num)}
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
                  </span>
                  <span className="shrink-0 text-[11px] text-gray-400">{bnNum(ayahs)} আয়াত</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* ---------- Reading view ---------- */
        <>
          <div ref={scrollEl as React.RefObject<HTMLDivElement>} className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-28">
            {loading && (
              <div className="flex flex-col items-center gap-3 pt-20">
                <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-emerald-200 border-t-emerald-600" />
                <p className="text-sm text-gray-500">লোড হচ্ছে…</p>
              </div>
            )}

            {!loading && error && (
              <div className="mx-auto mt-16 max-w-xs space-y-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-center dark:border-red-900/40 dark:bg-red-950/40">
                <p className="text-sm text-red-600 dark:text-red-300">⚠️ {error}</p>
                <button
                  onClick={() => void load(current)}
                  className="min-h-[40px] rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white transition active:scale-95"
                >
                  আবার চেষ্টা করুন
                </button>
              </div>
            )}

            {!loading && !error && data && (
              <article className="mx-auto max-w-2xl">
                {/* Surah name medallion */}
                <div className="mb-3 rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white py-3 text-center dark:border-emerald-800 dark:from-emerald-900/30 dark:to-gray-900">
                  <p className="arabic-text !text-xl font-bold">{surahName(current)}</p>
                  <p className="text-[11px] text-gray-400">সূরা নং {bnNum(current)}</p>
                </div>

                {showBismillah && (
                  <p className="arabic-text mb-2 text-center !text-xl font-bold text-emerald-800 dark:text-emerald-300">
                    {BISMILLAH}
                  </p>
                )}

                {/* Continuous Hafezi-style flow — tap an ayah to highlight; long-press/tap again to bookmark */}
                <p className="arabic-text text-right leading-loose">
                  {data.ayahs.map((a) => {
                    const marked = ayahMarks.some((m) => m.s === current && m.a === a.n);
                    return (
                      <span
                        key={a.n}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (selAyah === a.n) {
                            // Second tap on selected ayah → toggle bookmark
                            const cur = ayahMarks.some((m) => m.s === current && m.a === a.n)
                              ? ayahMarks.filter((m) => !(m.s === current && m.a === a.n))
                              : [...ayahMarks, { s: current, a: a.n }];
                            setAyahMarks(cur);
                            saveAyahBookmarks(cur);
                          } else {
                            setSelAyah(a.n);
                          }
                        }}
                        onKeyDown={(e) => e.key === "Enter" && setSelAyah(selAyah === a.n ? null : a.n)}
                        className={
                          "cursor-pointer rounded px-0.5 transition-colors " +
                          (marked
                            ? "bg-amber-200/70 dark:bg-amber-700/40"
                            : selAyah === a.n
                              ? "bg-emerald-200/70 dark:bg-emerald-700/50"
                              : "")
                        }
                      >
                        {a.n === 1 ? firstText : a.text}{" "}
                        <span className={"text-base " + (marked ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                          ﴿{bnNum(a.n)}{marked ? "🔖" : ""}﴾
                        </span>{" "}
                      </span>
                    );
                  })}
                </p>
                {ayahMarks.some((m) => m.s === current) && (
                  <p className="pt-2 text-center text-[11px] text-amber-600 dark:text-amber-400">
                    🔖 বুকমার্ক করা আয়াত: {ayahMarks.filter((m) => m.s === current).map((m) => bnNum(m.a)).join(", ")} — আবার ট্যাপ করলে বুকমার্ক বাদ যাবে
                  </p>
                )}

                <p className="pt-6 text-center text-[11px] text-gray-400">
                  ☾ শেষ — সূরা {surahName(current)} সম্পন্ন ☽
                </p>
              </article>
            )}
          </div>

          {/* Bottom nav bar */}
          <nav className={(directMode ? "sticky bottom-0 " : "safe-bottom fixed inset-x-0 bottom-0 z-10 ") + "border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95"}>
            <div className="mx-auto flex max-w-2xl items-stretch">
              <button
                disabled={current <= 1 || loading}
                onClick={() => go(current - 1)}
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
                disabled={current >= 114 || loading}
                onClick={() => go(current + 1)}
                className="min-h-[52px] flex-1 px-2 text-sm font-semibold text-emerald-700 transition active:scale-95 disabled:text-gray-300 dark:text-emerald-400 dark:disabled:text-gray-700"
              >
                পরের সূরা ▶
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
