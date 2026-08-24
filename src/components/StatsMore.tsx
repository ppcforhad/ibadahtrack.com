"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  BACKUP_KEYS,
  CustomDeed,
  Logs,
  exportData,
  importData,
  loadDeeds,
  loadLogs,
  saveDeeds,
  loadQuranPrefs,
} from "@/lib/storage";
import { QURAN_TOTAL_PAGES, percentKhatam } from "@/lib/quran";
import { computeBadges, topDays } from "@/lib/badges";

const bnNum = (n: number) => n.toLocaleString("bn-BD");

type PanelId = "top" | "badges" | "backup" | "deeds";

const OPTIONS: { id: PanelId; emoji: string; title: string; sub: string }[] = [
  { id: "top", emoji: "🏆", title: "সেরা দিন", sub: "আমার সেরা ১০ দিন" },
  { id: "badges", emoji: "🏅", title: "অ্যাচিভমেন্ট", sub: "অর্জনের ব্যাজ" },
  { id: "backup", emoji: "📤", title: "ব্যাকআপ ও রিস্টোর", sub: "JSON এক্সপোর্ট / ইমপোর্ট" },
  { id: "deeds", emoji: "✅", title: "আমল ম্যানেজ", sub: "নিজের আমল দেখুন / মুছুন" },
];

const RANK_CLS = [
  "bg-amber-400 text-white",
  "bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-100",
  "bg-orange-300 text-white",
];

/** Stats page → "আরও অপশন" hub: personal top-days leaderboard, achievement
 *  badges, JSON backup/restore, and custom-deed management. Reads storage
 *  itself after mount; fully private (no share actions anywhere). */
export default function StatsMore() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<PanelId | null>(null);
  const [logs, setLogs] = useState<Logs>({});
  const [deeds, setDeeds] = useState<CustomDeed[]>([]);
  const [qGoal, setQGoal] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setLogs(loadLogs());
    setDeeds(loadDeeds());
    setQGoal(loadQuranPrefs().goalPagesPerDay ?? 0);
  }, []);

  if (!mounted) return null;

  const deedsMap = new Map(deeds.map((d) => [d.id, d.pts]));
  const top = topDays(logs, deedsMap, 10, qGoal);
  const badges = computeBadges(logs);

  // Lifetime khatam progress: pure math over loaded logs (604-page mushaf).
  const totalPages = Object.values(logs).reduce((a, d) => a + (d.quranPages ?? 0), 0);
  const khatamPct = Math.round(percentKhatam(totalPages));
  const nowD = new Date();
  const monthPrefix =
    nowD.getFullYear() + "-" + String(nowD.getMonth() + 1).padStart(2, "0") + "-";
  const monthPages = Object.keys(logs)
    .filter((k) => k.startsWith(monthPrefix))
    .reduce((a, k) => a + (logs[k].quranPages ?? 0), 0);

  const doExport = () => {
    try {
      const blob = new Blob([JSON.stringify(exportData(), null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const t = new Date();
      const stamp =
        String(t.getFullYear()) +
        String(t.getMonth() + 1).padStart(2, "0") +
        String(t.getDate()).padStart(2, "0");
      a.href = url;
      a.download = "ibadah-backup-" + stamp + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("ব্যাকআপ ফাইল তৈরি করা গেল না।");
    }
  };

  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await f.text());
    } catch {
      alert("ফাইলটি সঠিক JSON নয়। এক্সপোর্ট করা ব্যাকআপ ফাইল ব্যবহার করুন।");
      return;
    }
    const rec = parsed as Record<string, unknown>;
    const validShape =
      !!rec && typeof rec === "object" && !Array.isArray(rec) &&
      BACKUP_KEYS.every((k) => k in rec);
    if (!validShape) {
      alert("এই ফাইলে প্রয়োজনীয় ব্যাকআপ ডেটা নেই।");
      return;
    }
    if (!confirm("ইমপোর্ট করলে আগের সব ডেটা প্রতিস্থাপিত হবে। চালিয়ে যাবেন?")) return;
    if (!importData(rec)) {
      alert("ডেটা ইমপোর্ট করা যায়নি — ফাইলটি ক্ষতিগ্রস্ত মনে হচ্ছে।");
      return;
    }
    window.location.reload();
  };

  const removeDeed = (id: string) => {
    const next = deeds.filter((d) => d.id !== id);
    setDeeds(next);
    saveDeeds(next);
  };

  const panelCls =
    "mt-2 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900";

  return (
    <section className="mb-4">
      <h3 className="mb-2 text-sm font-semibold">🔽 আরও অপশন</h3>

      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => setOpen(open === o.id ? null : o.id)}
            aria-expanded={open === o.id}
            className={
              "min-h-[44px] rounded-2xl border p-3 text-left transition active:scale-[0.99] " +
              (open === o.id
                ? "border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/30"
                : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900")
            }
          >
            <span className="text-lg">{o.emoji}</span>
            <span className="block text-sm font-semibold">{o.title}</span>
            <span className="block text-[10px] text-gray-400">{o.sub}</span>
          </button>
        ))}
      </div>

      {/* Lifetime Quran khatam progress */}
      <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/30">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">📖 খতম অগ্রগতি</span>
          <span className="shrink-0 rounded-full bg-[#059669] px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
            প্রায় {bnNum(khatamPct)}% খতম
          </span>
        </div>
        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          মোট {bnNum(totalPages)} পৃষ্ঠা · এই মাস {bnNum(monthPages)} পৃষ্ঠা ({bnNum(QURAN_TOTAL_PAGES)} পৃষ্ঠায় ১ খতম)
        </p>
      </div>

      {open === "top" && (
        <section className={panelCls}>
          <h4 className="text-sm font-semibold">🏆 আমার সেরা ১০ দিন</h4>
          <p className="mb-3 text-[10px] text-gray-400">🔒 সম্পূর্ণ প্রাইভেট — শুধু আপনি দেখবেন।</p>
          {top.length === 0 ? (
            <p className="py-2 text-xs text-gray-400">
              এখনো কোনো পয়েন্ট অর্জিত হয়নি। আজকের ইবাদত দিয়ে শুরু করুন 🌱
            </p>
          ) : (
            <ol className="space-y-1.5">
              {top.map((t, i) => {
                const dt = new Date(
                  Number(t.key.slice(0, 4)),
                  Number(t.key.slice(5, 7)) - 1,
                  Number(t.key.slice(8, 10))
                );
                return (
                  <li
                    key={t.key}
                    className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-1.5 dark:bg-gray-800/60"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <span
                        className={
                          "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums " +
                          (RANK_CLS[i] ?? "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300")
                        }
                      >
                        {bnNum(i + 1)}
                      </span>
                      <span className="tabular-nums">
                        {dt.toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {bnNum(t.pts)} পয়েন্ট
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}

      {open === "badges" && (
        <section className={panelCls}>
          <h4 className="mb-3 text-sm font-semibold">🏅 অ্যাচিভমেন্ট ব্যাজ</h4>
          <div className="grid grid-cols-2 gap-2">
            {badges.map((b) => (
              <div
                key={b.id}
                className={
                  "rounded-xl border p-3 " +
                  (b.unlocked
                    ? "border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/30"
                    : "border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-800/40")
                }
              >
                <p className="text-lg leading-none">{b.unlocked ? "✅" : "🔒"} {b.emoji}</p>
                <p
                  className={
                    "mt-1.5 text-xs font-semibold " +
                    (b.unlocked ? "text-emerald-700 dark:text-emerald-300" : "")
                  }
                >
                  {b.bn}
                </p>
                <p className="text-[10px] text-gray-400">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {open === "backup" && (
        <section className={panelCls}>
          <h4 className="text-sm font-semibold">📤 ব্যাকআপ ও রিস্টোর</h4>
          <p className="mb-3 text-[10px] text-gray-400">
            আপনার সব ডেটা একটি JSON ফাইলে সংরক্ষণ করুন, বা আগের ব্যাকআপ ফিরিয়ে আনুন।
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={doExport}
              className="min-h-[44px] flex-1 rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white active:scale-95"
            >
              ⬇️ এক্সপোর্ট
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="min-h-[44px] flex-1 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold active:scale-95 dark:border-gray-700 dark:bg-gray-900"
            >
              ⬆️ ইমপোর্ট
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={onImportFile}
              className="hidden"
            />
          </div>
        </section>
      )}

      {open === "deeds" && (
        <section className={panelCls}>
          <h4 className="mb-3 text-sm font-semibold">✅ আমল ম্যানেজ</h4>
          {deeds.length === 0 ? (
            <p className="py-2 text-xs text-gray-400">
              এখনো কোনো নিজের আমল নেই। হোম পেজ থেকে যোগ করুন 🌱
            </p>
          ) : (
            <ul className="space-y-1">
              {deeds.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-0.5 dark:bg-gray-800/60"
                >
                  <span className="flex-1 truncate py-2 text-sm">{d.bn}</span>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    +{bnNum(d.pts)}
                  </span>
                  <button
                    onClick={() => removeDeed(d.id)}
                    aria-label={d.bn + " মুছুন"}
                    className="grid min-h-[44px] w-9 shrink-0 place-items-center rounded-xl text-sm text-gray-400 hover:text-red-500 dark:text-gray-500"
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  );
}
