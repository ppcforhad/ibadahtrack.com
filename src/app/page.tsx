"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DayLog, Settings, dateKey, getDay, loadDeeds, loadLogs, loadSettings, updateDay } from "@/lib/storage";
import { PRAYER_BN, nextPrayer } from "@/lib/prayers";
import { currentStreak, dayPoints, monthStats } from "@/lib/scoring";
import CustomDeeds from "@/components/CustomDeeds";
import MonthReport from "@/components/MonthReport";

const FARD = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const EN: Record<string, string> = { fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" };
const bnNum = (n: number) => n.toLocaleString("bn-BD");
const pad = (n: number) => String(n).padStart(2, "0");

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [log, setLog] = useState<DayLog>({});
  const [settings, setSettings] = useState<Settings | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [hijri, setHijri] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function refresh() {
    setLog(getDay(dateKey()));
    setSettings(loadSettings());
    let h = "";
    try {
      h = new Intl.DateTimeFormat("bn-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
    } catch {
      try {
        h = new Intl.DateTimeFormat("en-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(new Date()) + " AH";
      } catch { h = ""; }
    }
    setHijri(h);
  }

  useEffect(() => {
    setMounted(true);
    refresh();
    const iv = setInterval(() => setNow(new Date()), 1000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Local prayer notifications (v1: while the app stays open; real push = future work)
  useEffect(() => {
    if (!mounted || !settings?.notify) return;
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const np = nextPrayer(settings.lat, settings.lng, settings.method);
    const ms = np.time.getTime() - Date.now();
    if (ms > 0 && ms < 2147483647) {
      timers.current.push(setTimeout(() => {
        new Notification("🕌 " + PRAYER_BN[np.name] + " এর সময় হয়েছে", {
          body: np.time.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }),
        });
      }, ms));
    }
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [mounted, settings]);

  if (!mounted || !settings) return <p className="py-20 text-center text-gray-400">লোড হচ্ছে…</p>;

  const np = nextPrayer(settings.lat, settings.lng, settings.method, now);
  const rem = Math.max(0, np.time.getTime() - now.getTime());
  const hh = Math.floor(rem / 3600000);
  const mm = Math.floor((rem % 3600000) / 60000);
  const ss = Math.floor((rem % 60000) / 1000);

  const logs = loadLogs();
  const deedsMap = new Map(loadDeeds().map((x) => [x.id, x.pts]));
  const pts = dayPoints(log, deedsMap);
  const streak = currentStreak(logs, dateKey());
  const nowD = new Date();
  const mStats = monthStats(logs, nowD.getFullYear(), nowD.getMonth(), deedsMap);
  const daysInMonth = new Date(nowD.getFullYear(), nowD.getMonth() + 1, 0).getDate();

  const act = (fn: () => void) => { fn(); refresh(); };
  const toggleSalah = (k: (typeof FARD)[number]) =>
    act(() => updateDay(dateKey(), (d) => ({ ...d, [k]: !d[k] })));
  const toggleTahajjud = () => act(() => updateDay(dateKey(), (d) => ({ ...d, tahajjud: !d.tahajjud })));
  const setQuran = (v: number) =>
    act(() => updateDay(dateKey(), (d) => ({ ...d, quranPages: Math.max(0, v || 0) })));

  return (
    <>
      <header className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold">আসসালামু আলাইকুম 👋</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {hijri ? " · " + hijri : ""}
          </p>
        </div>
        <Link href="/settings" aria-label="সেটিংস" className="rounded-full border border-gray-200 bg-white p-2 text-lg dark:border-gray-700 dark:bg-gray-900">
          ⚙️
        </Link>
      </header>

      <section className="mb-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-lg">
        <p className="text-sm opacity-80">পরবর্তী নামাজ</p>
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-2xl font-bold">{PRAYER_BN[np.name]}</h2>
          <span className="text-xl font-semibold tabular-nums">{hh}:{pad(mm)}:{pad(ss)} বাকি</span>
        </div>
        <p className="mt-1 text-sm opacity-90">
          সময়: {np.time.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </section>

      <section className="mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">আজকের নামাজ</h3>
        {FARD.map((k, i) => (
          <button
            key={k}
            onClick={() => toggleSalah(k)}
            className={
              "flex min-h-[52px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] " +
              (log[k]
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900")
            }
          >
            <span>
              <span className="font-semibold">{PRAYER_BN[k]}</span>{" "}
              <span className="text-xs text-gray-400">{EN[k]}</span>
              {k === "fajr" && <span className="ml-1 text-xs font-medium text-emerald-600">+৫ বোনাস</span>}
            </span>
            <span
              className={
                "grid h-7 w-7 place-items-center rounded-full border text-sm " +
                (log[k]
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-300 text-transparent dark:border-gray-600")
              }
            >
              ✓
            </span>
          </button>
        ))}
        <button
          onClick={toggleTahajjud}
          className={
            "min-h-[48px] w-full rounded-2xl border px-4 py-3 text-left text-sm " +
            (log.tahajjud
              ? "border-emerald-500 bg-emerald-50 font-medium dark:bg-emerald-900/30"
              : "border-dashed border-gray-300 dark:border-gray-700")
          }
        >
          🌙 তাহাজ্জুদ (ঐচ্ছিক)
        </button>
      </section>

      <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold">📖 কুরআন পড়া (পৃষ্ঠা)</h3>
        <div className="flex items-center justify-center gap-8">
          <button onClick={() => setQuran((log.quranPages ?? 0) - 1)} className="h-12 w-12 rounded-full bg-gray-100 text-2xl active:scale-95 dark:bg-gray-800">−</button>
          <span className="min-w-[3rem] text-center text-2xl font-bold tabular-nums">{bnNum(log.quranPages ?? 0)}</span>
          <button onClick={() => setQuran((log.quranPages ?? 0) + 1)} className="h-12 w-12 rounded-full bg-emerald-600 text-2xl text-white active:scale-95">+</button>
        </div>
        {(log.quranPages ?? 0) > 0 && <p className="mt-2 text-center text-xs font-medium text-emerald-600">✅ +৫ পয়েন্ট</p>}
      </section>

      <CustomDeeds onChanged={refresh} />

      <section className="grid grid-cols-2 gap-3 pb-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">আজকের পয়েন্ট</p>
          <p className="text-2xl font-bold text-emerald-600">{bnNum(pts)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">🔥 স্ট্রিক</p>
          <p className="text-2xl font-bold text-emerald-600">{bnNum(streak)} দিন</p>
        </div>
      </section>

      <MonthReport stats={mStats} daysInMonth={daysInMonth} />
    </>
  );
}
