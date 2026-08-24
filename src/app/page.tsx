"use client";

import { useEffect, useRef, useState } from "react";
import { DayLog, Settings, dateKey, getDay, loadDeeds, loadLogs, loadQuranPrefs, loadSettings, saveQuranPrefs, updateDay } from "@/lib/storage";
import { PRAYER_BN, nextPrayer, todayTimes } from "@/lib/prayers";
import { currentStreak, dayPoints, monthStats } from "@/lib/scoring";
import MyAmolList from "@/components/MyAmolList";
import ProfileMenu from "@/components/ProfileMenu";
import MonthReport from "@/components/MonthReport";
import QuranGoalCard from "@/components/QuranGoalCard";

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
    let cancelled = false;
    // Chain: after each notification fires, immediately arm the following prayer,
    // so a user who leaves the app open gets every reminder, not just one.
    const scheduleNext = () => {
      if (cancelled) return;
      const np = nextPrayer(settings.lat, settings.lng, settings.method);
      const ms = np.time.getTime() - Date.now();
      if (ms <= 0) return;
      const delay = Math.min(ms, 2147483647);
      timers.current.push(
        setTimeout(() => {
          if (cancelled) return;
          try {
            new Notification("🕌 " + PRAYER_BN[np.name] + " এর সময় হয়েছে", {
              body: np.time.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }),
            });
          } catch {
            /* notification may fail on some browsers; still chain the next prayer */
          }
          scheduleNext();
        }, delay)
      );
    };
    scheduleNext();
    return () => {
      cancelled = true;
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
  const qPrefs = loadQuranPrefs();
  const qGoal = qPrefs.goalPagesPerDay ?? 0;
  const qPages = log.quranPages ?? 0;
  const qMet = qGoal > 0 && qPages >= qGoal;
  const pts = dayPoints(log, deedsMap, qGoal);
  const streak = currentStreak(logs, dateKey());
  const remainingFards = FARD.filter((k) => !log[k]);
  const nowD = new Date();
  const mStats = monthStats(logs, nowD.getFullYear(), nowD.getMonth(), deedsMap, qGoal);
  const daysInMonth = new Date(nowD.getFullYear(), nowD.getMonth() + 1, 0).getDate();

  const act = (fn: () => void) => { fn(); refresh(); };
  const toggleSalah = (k: (typeof FARD)[number]) =>
    act(() => updateDay(dateKey(), (d) => ({ ...d, [k]: !d[k] })));
  const toggleTahajjud = () => act(() => updateDay(dateKey(), (d) => ({ ...d, tahajjud: !d.tahajjud })));
  const setQuran = (v: number) =>
    act(() => updateDay(dateKey(), (d) => ({ ...d, quranPages: Math.max(0, v || 0) })));
  // Merge so an existing goalPagesPerDay is never erased by a resume save.
  const saveResume = (surah: number, ayah: number) =>
    act(() => saveQuranPrefs({ ...loadQuranPrefs(), lastSurah: surah, lastAyah: ayah }));

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
        <ProfileMenu />
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

      {new Date().getDay() === 5 && (
        <section className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/30">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">🕌 আজ শুক্রবার — জুমআর তৈরি করুন</p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-800 dark:text-emerald-200">
            গুসল করুন, মসজিদে আগে পৌঁছান (বুখারী ৮৭৭ / মুসলিম ৮৪৬)। “যে ব্যক্তি শুক্রবারে সূরা কাহফ পড়বে,
            দুই শুক্রবারের মধ্যে তার জন্য নূর হবে।” — সিলসিলা সহীহা ৫৮৬
          </p>
        </section>
      )}

      <section aria-label="আজকের নামাজের সময়" className="mb-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">আজকের নামাজের সময়</h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {todayTimes(settings.lat, settings.lng, settings.method, now).map((e) => {
            const passed = e.time.getTime() < now.getTime();
            const isNext = e.name === np.name && !passed;
            return (
              <div
                key={e.name}
                className={
                  "min-w-[4.5rem] flex-1 rounded-xl border px-2 py-2 text-center transition " +
                  (isNext
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : passed
                      ? "border-gray-100 bg-white opacity-50 dark:border-gray-800 dark:bg-gray-900"
                      : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900")
                }
              >
                <p className={"text-[11px] font-medium " + (isNext ? "text-emerald-50" : "text-gray-500 dark:text-gray-400")}>
                  {PRAYER_BN[e.name]}
                </p>
                <p className="mt-0.5 text-xs font-semibold tabular-nums">
                  {e.time.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">আজকের নামাজ</h3>
        <MyAmolList onChanged={refresh} />
      </section>

      <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold">📖 কুরআন পড়া (পৃষ্ঠা)</h3>
        <div className="flex items-center justify-center gap-8">
          <button onClick={() => setQuran(qPages - 1)} className="h-12 w-12 rounded-full bg-gray-100 text-2xl active:scale-95 dark:bg-gray-800">−</button>
          <span className="min-w-[3rem] text-center text-2xl font-bold tabular-nums">{bnNum(qPages)}</span>
          <button onClick={() => setQuran(qPages + 1)} className="h-12 w-12 rounded-full bg-emerald-600 text-2xl text-white active:scale-95">+</button>
        </div>
        {(qPages) > 0 && <p className="mt-2 text-center text-xs font-medium text-emerald-600">✅ +৫ পয়েন্ট</p>}
        {qGoal > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className={qMet ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}>
                আজ {bnNum(qPages)}/{bnNum(qGoal)} পৃষ্ঠা
              </span>
              {qMet && <span className="font-semibold text-emerald-600 dark:text-emerald-400">লক্ষ্য পূরণ ✅ (+১০)</span>}
            </div>
            <div
              role="progressbar"
              aria-valuenow={Math.min(100, Math.round((qPages / qGoal) * 100))}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="আজকের কুরআন লক্ষ্য"
              className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (qPages / qGoal) * 100)}%`, backgroundColor: "#059669" }}
              />
            </div>
          </div>
        )}
        <QuranGoalCard
          pages={qPages}
          goal={qGoal}
          lastSurah={qPrefs.lastSurah}
          lastAyah={qPrefs.lastAyah}
          onSaveResume={saveResume}
        />
      </section>


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

      {streak > 0 && remainingFards.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          🔥 {bnNum(streak)} দিনের স্ট্রিক আজ ঝুঁকিতে — বাকি{" "}
          {remainingFards.map((k) => PRAYER_BN[k]).join(", ")} · এখনই আদায় করুন
        </div>
      )}

      <MonthReport stats={mStats} daysInMonth={daysInMonth} />
    </>
  );
}
