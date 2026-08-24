"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logs, dateKey, loadDeeds, loadLogs, loadQuranPrefs, shiftDays } from "@/lib/storage";
import { bestStreak, currentStreak, dayPoints, lifetimePoints } from "@/lib/scoring";
import { PRAYER_BN } from "@/lib/prayers";
import StatsMore from "@/components/StatsMore";

const bnNum = (n: number) => n.toLocaleString("bn-BD");

const ROWS: { label: string; test: (d: Record<string, unknown>) => boolean }[] = [];

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<Logs>({});
  const [view, setView] = useState<"week" | "month">("week");

  useEffect(() => {
    setMounted(true);
    setLogs(loadLogs());
  }, []);

  if (!mounted) return <p className="py-20 text-center text-gray-400">লোড হচ্ছে…</p>;

  const today = dateKey();
  const deedsMap = new Map(loadDeeds().map((x) => [x.id, x.pts]));
  const qGoal = loadQuranPrefs().goalPagesPerDay ?? 0;

  const done = (d: Logs[string] | undefined, kind: string): boolean => {
    if (!d) return false;
    switch (kind) {
      case "fajr": case "dhuhr": case "asr": case "maghrib": case "isha": case "tahajjud":
        return !!d[kind as keyof typeof d];
      case "quran": return (d.quranPages ?? 0) >= 1;
      case "zikr": return Object.values(d.zikrCounts ?? {}).reduce((a, b) => a + b, 0) >= 100;
      case "dua": return (d.duasRead?.length ?? 0) >= 1;
      default: return false;
    }
  };

  const kinds = ["fajr", "dhuhr", "asr", "maghrib", "isha", "tahajjud", "quran", "zikr", "dua"];
  const kindLabels: Record<string, string> = {
    fajr: "ফজর", dhuhr: "যোহর", asr: "আসর", maghrib: "মগরিব", isha: "ইশা",
    tahajjud: "তাহাজ্জুদ", quran: "কুরআন", zikr: "যিকির", dua: "দুআ",
  };

  const last7 = [6, 5, 4, 3, 2, 1, 0].map((i) => shiftDays(today, -i));

  // Monthly heatmap
  const nowD = new Date();
  const y = nowD.getFullYear(), m = nowD.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstOffset = new Date(y, m, 1).getDay();

  const fardCount = (d?: Logs[string]): number =>
    ["fajr", "dhuhr", "asr", "maghrib", "isha"].reduce((a, k) => a + (done(d, k) ? 1 : 0), 0);

  // Most-missed salah insight — trailing 30 days, LOGGED days only
  // (logged day = dateKey present in logs; unticked fard on never-logged days doesn't count).
  const FARD_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
  const logged30 = Array.from({ length: 30 }, (_, i) => shiftDays(today, -i))
    .map((k) => logs[k])
    .filter((d): d is NonNullable<Logs[string]> => !!d);
  const missedTally = FARD_KEYS.map((k) => ({
    k,
    missed: logged30.filter((d) => !d[k]).length,
  }));
  const worstFard = [...missedTally].sort((a, b) => b.missed - a.missed)[0];
  const bestFard = [...missedTally].sort((a, b) => a.missed - b.missed)[0];
  const showInsight = logged30.length >= 7 && !!worstFard && !!bestFard && worstFard.missed > 0;

  void ROWS;

  return (
    <>
      <h1 className="mb-3 text-lg font-bold">📊 স্ট্যাটস</h1>

      <section className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "মোট পয়েন্ট", val: bnNum(lifetimePoints(logs, deedsMap, qGoal)) },
          { label: "🔥 চলতি স্ট্রিক", val: bnNum(currentStreak(logs, today)) },
          { label: "🏆 সেরা স্ট্রিক", val: bnNum(bestStreak(logs)) },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-3 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{c.label}</p>
            <p className="text-xl font-bold text-emerald-600">{c.val}</p>
          </div>
        ))}
      </section>

      {showInsight && (
        <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">গত ৩০ দিনের ইনসাইট</p>
          <p className="mt-1 text-sm">
            ⚠️ সবচেয়ে বেশি বাদ: <span className="font-semibold text-red-500">{PRAYER_BN[worstFard.k]}</span>{" "}
            ({bnNum(worstFard.missed)}/{bnNum(logged30.length)})
          </p>
          <p className="text-sm">
            ✅ সবচেয়ে নিয়মিত: <span className="font-semibold text-emerald-600">{PRAYER_BN[bestFard.k]}</span>{" "}
            ({bnNum(logged30.length - bestFard.missed)}/{bnNum(logged30.length)})
          </p>
        </section>
      )}

      <div className="mb-3 flex gap-2">
        {([
          { id: "week", label: "📅 সপ্তাহ" },
          { id: "month", label: "🗓️ মাস" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            aria-pressed={view === t.id}
            className={
              "min-h-[44px] flex-1 rounded-2xl border text-sm font-semibold transition active:scale-[0.99] " +
              (view === t.id
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-gray-200 bg-white text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "week" && (
      <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold">শেষ ৭ দিন</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="text-gray-400">
                <th></th>
                {last7.map((k) => {
                  const dt = new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)));
                  return <th key={k} className="pb-2 font-normal">{dt.toLocaleDateString("bn-BD", { weekday: "short" })}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {kinds.map((kd) => (
                <tr key={kd}>
                  <td className="py-1 pr-2 text-left whitespace-nowrap">{kindLabels[kd]}</td>
                  {last7.map((k) => (
                    <td key={k} className="p-1">
                      <span
                        className={
                          "inline-block h-5 w-5 rounded-md " +
                          (done(logs[k], kd) ? "bg-emerald-500" : "bg-gray-100 dark:bg-gray-800")
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {view === "month" && (
      <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold">
          {nowD.toLocaleDateString("bn-BD", { month: "long", year: "numeric" })} — ৫ নামাজ ক্যালেন্ডার
        </h3>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-gray-400">
          {["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstOffset }).map((_, i) => <span key={"e" + i} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const key = dateKey(new Date(y, m, i + 1));
            const c = fardCount(logs[key]);
            return (
              <span
                key={key}
                className={
                  "grid aspect-square place-items-center rounded-lg text-[10px] font-medium tabular-nums " +
                  (c === 0 ? "bg-gray-100 text-gray-400 dark:bg-gray-800" : "bg-emerald-500 text-white")
                }
                style={c > 0 ? { opacity: 0.45 + 0.55 * (c / 5) } : undefined}
              >
                {bnNum(i + 1)}
              </span>
            );
          })}
        </div>
      </section>
      )}

      <StatsMore />

      <p className="pb-2 text-center text-xs text-gray-400">🔒 এই তথ্য শুধু আপনার ডিভাইসে সংরক্ষিত — সম্পূর্ণ প্রাইভেট। ইবাদতের স্কোর লোক দেখানোর জন্য নয়, নিজের হিসাবের জন্য।</p>
      <p className="pb-2 text-center text-xs">
        <Link href="/leaderboard" className="font-medium text-emerald-600 hover:underline">
          লিডারবোর্ড প্রিভিউ দেখুন →
        </Link>
      </p>
    </>
  );
}
