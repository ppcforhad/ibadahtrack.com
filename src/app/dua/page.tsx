"use client";

import { useEffect, useMemo, useState } from "react";
import { DayLog, dateKey, getDay, updateDay } from "@/lib/storage";
import { DUAS } from "@/lib/data";
import { QURAN_DUAS } from "@/lib/quran-duas";
import { QURAN_ESSENTIALS } from "@/lib/quran-essentials";

const bnNum = (n: number) => n.toLocaleString("bn-BD");

type Tab = "library" | "quran";

const TABS: { id: Tab; label: string }[] = [
  { id: "library", label: "🤲 দুআ লাইব্রেরি" },
  { id: "quran", label: "📖 কুরআনের দুআ" },
];

export default function DuaPage() {
  const [mounted, setMounted] = useState(false);
  const [log, setLog] = useState<DayLog>({});
  const [tab, setTab] = useState<Tab>("library");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setLog(getDay(dateKey()));
  }, []);

  const cats = useMemo(() => Array.from(new Set(DUAS.map((d) => d.cat))), []);
  const filtered = useMemo(
    () =>
      DUAS.filter((d) => (cat === "" || d.cat === cat) &&
        (q === "" ||
          d.title.toLowerCase().includes(q.toLowerCase()) ||
          d.meaning.includes(q) ||
          d.arabic.includes(q))),
    [q, cat]
  );
  const filteredQuran = useMemo(
    () =>
      QURAN_DUAS.filter(
        (d) =>
          q === "" ||
          d.meaning.includes(q) ||
          d.arabic.includes(q) ||
          d.surahRef.includes(q)
      ),
    [q]
  );

  if (!mounted) return <p className="py-20 text-center text-gray-400">লোড হচ্ছে…</p>;

  const read = new Set(log.duasRead ?? []);

  const toggleRead = (id: string) => {
    updateDay(dateKey(), (d) => {
      const cur = new Set(d.duasRead ?? []);
      if (cur.has(id)) cur.delete(id); else cur.add(id);
      return { ...d, duasRead: Array.from(cur) };
    });
    setLog(getDay(dateKey()));
  };

  return (
    <>
      <h1 className="mb-3 text-lg font-bold">🤲 দুআ</h1>

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

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="দুআ খুঁজুন…"
        className="mb-3 min-h-[44px] w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900"
      />

      {/* ---------------- দুআ লাইব্রেরি ---------------- */}
      {tab === "library" && (
        <>
          <div className="relative mb-4">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="min-h-[48px] w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 pr-10 text-sm font-medium outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">সব ক্যাটাগরি</option>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▼</span>
          </div>

          <div className="space-y-2 pb-4">
            {filtered.map((d) => {
              const open = openId === d.id;
              const isRead = read.has(d.id);
              return (
                <article key={d.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                  <button
                    onClick={() => setOpenId(open ? null : d.id)}
                    className="flex min-h-[56px] w-full items-center justify-between gap-2 px-4 py-3 text-left"
                  >
                    <span>
                      <span className="font-semibold">{d.title}</span>{" "}
                      <span className="text-xs text-gray-400">· {d.cat}</span>
                    </span>
                    <span className="shrink-0 text-lg">{isRead ? "✅" : open ? "▲" : "▼"}</span>
                  </button>
                  {open && (
                    <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                      <p className="arabic-text mb-3 text-right font-semibold text-emerald-800 dark:text-emerald-300">{d.arabic}</p>
                      <p className="mb-2 text-sm leading-relaxed">{d.meaning}</p>
                      <p className="mb-3 text-xs text-gray-400">সূত্র: {d.src}</p>
                      <button
                        onClick={() => toggleRead(d.id)}
                        className={
                          "min-h-[40px] rounded-full px-4 text-sm font-medium active:scale-95 " +
                          (isRead ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-emerald-600 text-white")
                        }
                      >
                        {isRead ? "✅ পড়া হয়েছে" : "পড়া হয়েছে ✓ (+১ পয়েন্ট)"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-gray-400">কিছু পাওয়া যায়নি।</p>}
            <p className="pt-1 text-center text-xs text-gray-400">আজ পড়া হয়েছে: {bnNum(read.size)}টি দুআ (প্রথম ৫টিতে পয়েন্ট)</p>
          </div>
        </>
      )}

      {/* ---------------- কুরআনের দুআ ---------------- */}
      {tab === "quran" && (
        <div className="space-y-2 pb-4">
          {/* গ্রুপ ১: ফজিলতপূর্ণ সূরা ও আয়াত */}
          <h3 className="pt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            ✨ ফজিলতপূর্ণ সূরা ও আয়াত — কেন ও কতবার পড়বেন
          </h3>
          {QURAN_ESSENTIALS.map((e) => {
            const open = openId === e.id;
            const isRead = read.has(e.id);
            return (
              <article key={e.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <button
                  onClick={() => setOpenId(open ? null : e.id)}
                  className="flex min-h-[56px] w-full items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="font-semibold">{e.title}</span>{" "}
                    <span className="text-[10px] text-gray-400">{e.ref}</span>
                  </span>
                  <span className="shrink-0 text-lg">{isRead ? "✅" : open ? "▲" : "▼"}</span>
                </button>
                {open && (
                  <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                    <div className="mb-3 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/30">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">✨ ফজিলত</p>
                      <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-200">{e.fazilat}</p>
                    </div>
                    <p className="arabic-text mb-3 text-right font-semibold text-emerald-800 dark:text-emerald-300">{e.arabic}</p>
                    <p className="mb-3 text-sm leading-relaxed">{e.meaning}</p>
                    <div className="mb-3 rounded-xl border border-emerald-200 p-3 dark:border-emerald-800">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">📌 কীভাবে / কতবার</p>
                      <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">{e.howto}</p>
                    </div>
                    <button
                      onClick={() => toggleRead(e.id)}
                      className={
                        "min-h-[40px] rounded-full px-4 text-sm font-medium active:scale-95 " +
                        (isRead ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-emerald-600 text-white")
                      }
                    >
                      {isRead ? "✅ পড়া হয়েছে" : "পড়া হয়েছে ✓ (+১ পয়েন্ট)"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}

          {/* গ্রুপ ২: রব্বানা দুআসমূহ */}
          <h3 className="pt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            🤲 রব্বানা দুআসমূহ — কুরআন থেকে
          </h3>
          <p className="text-center text-[11px] text-gray-400">
            সরাসরি কুরআন থেকে নেওয়া দুআসমূহ — রাসূল ﷺ এগুলো পড়তেন ও শেখাতেন
          </p>
          {filteredQuran.map((d) => {
            const open = openId === d.id;
            const isRead = read.has(d.id);
            return (
              <article key={d.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <button
                  onClick={() => setOpenId(open ? null : d.id)}
                  className="flex min-h-[56px] w-full items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">{d.surahRef}</span>
                  <span className="shrink-0 text-lg">{isRead ? "✅" : open ? "▲" : "▼"}</span>
                </button>
                {open && (
                  <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                    <p className="arabic-text mb-3 text-right font-semibold text-emerald-800 dark:text-emerald-300">{d.arabic}</p>
                    <p className="mb-3 text-sm leading-relaxed">{d.meaning}</p>
                    <button
                      onClick={() => toggleRead(d.id)}
                      className={
                        "min-h-[40px] rounded-full px-4 text-sm font-medium active:scale-95 " +
                        (isRead ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-emerald-600 text-white")
                      }
                    >
                      {isRead ? "✅ পড়া হয়েছে" : "পড়া হয়েছে ✓ (+১ পয়েন্ট)"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
          {filteredQuran.length === 0 && <p className="py-8 text-center text-sm text-gray-400">কিছু পাওয়া যায়নি।</p>}
        </div>
      )}
    </>
  );
}
