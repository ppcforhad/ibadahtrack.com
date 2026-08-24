"use client";

import { useEffect, useState } from "react";
import { CustomDeed, DayLog, dateKey, getDay, loadDeeds, saveDeeds, updateDay } from "@/lib/storage";

const bnNum = (n: number) => n.toLocaleString("bn-BD");
const newId = () => "d_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const FIXED_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha", "tahajjud"];

interface Item {
  key: string;
  bn: string;
  en?: string;
  pts?: number;
}

const FIXED: Item[] = [
  { key: "fajr", bn: "ফজর", en: "Fajr", pts: 15 },
  { key: "dhuhr", bn: "যোহর", en: "Dhuhr", pts: 10 },
  { key: "asr", bn: "আসর", en: "Asr", pts: 10 },
  { key: "maghrib", bn: "মগরিব", en: "Maghrib", pts: 10 },
  { key: "isha", bn: "ইশা", en: "Isha", pts: 10 },
  { key: "tahajjud", bn: "তাহাজ্জুদ", en: "ঐচ্ছিক" },
];

/** "আমার আমল" — unified daily deed checklist: fard salahs first, then every
 *  other amol (custom deeds included). Ticking moves an item into the collapsed
 *  সম্পন্ন section below; points accrue via scoring.ts as before. */
export default function MyAmolList({ onChanged }: { onChanged?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [log, setLog] = useState<DayLog>({});
  const [deeds, setDeeds] = useState<CustomDeed[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [name, setName] = useState("");
  const [pts, setPts] = useState(5);

  const reload = () => {
    setLog(getDay(dateKey()));
    setDeeds(loadDeeds());
  };

  useEffect(() => {
    setMounted(true);
    reload();
  }, []);

  if (!mounted) return null;

  const boolLog = log as unknown as Record<string, boolean | undefined>;
  const doneIds = new Set(log.deedsDone ?? []);

  const isChecked = (key: string) =>
    FIXED_KEYS.includes(key) ? !!boolLog[key] : doneIds.has(key);

  const act = (fn: () => void) => {
    fn();
    onChanged?.();
    reload();
  };

  const toggleItem = (item: Item) => {
    act(() => {
      if (FIXED_KEYS.includes(item.key)) {
        updateDay(dateKey(), (d) => ({ ...d, [item.key]: !(d as unknown as Record<string, boolean | undefined>)[item.key] }));
      } else {
        updateDay(dateKey(), (d) => {
          const curList = d.deedsDone ?? [];
          const next = curList.includes(item.key)
            ? curList.filter((x) => x !== item.key)
            : [...curList, item.key];
          return { ...d, deedsDone: next };
        });
      }
    });
  };

  const addDeed = () => {
    const label = name.trim();
    if (!label) return;
    const item: CustomDeed = { id: newId(), bn: label, pts: Math.min(100, Math.max(1, pts || 5)) };
    act(() => saveDeeds([...deeds, item]));
    setName("");
    setPts(5);
    setShowAdd(false);
  };

  const fixedPending = FIXED.filter((f) => !isChecked(f.key));
  const fixedDone = FIXED.filter((f) => isChecked(f.key));
  const custPending = deeds.filter((d) => !doneIds.has(d.id));
  const custDone = deeds.filter((d) => doneIds.has(d.id));
  const doneCount = fixedDone.length + custDone.length;
  const remaining = FIXED.length + deeds.length - doneCount;

  const Row = ({ item }: { item: Item }) => {
    const checked = isChecked(item.key);
    return (
      <button
        onClick={() => toggleItem(item)}
        aria-pressed={checked}
        className={
          "flex min-h-[48px] w-full items-center gap-3 rounded-xl px-1 py-2 text-left transition active:scale-[0.99] " +
          (checked ? "bg-emerald-50 dark:bg-emerald-900/30" : "")
        }
      >
        <span
          className={
            "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs " +
            (checked
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-gray-300 text-transparent dark:border-gray-600")
          }
        >
          ✓
        </span>
        <span className="min-w-0 flex-1 truncate text-sm">
          <span className="font-semibold">{item.bn}</span>{" "}
          {item.en && <span className="text-xs text-gray-400">{item.en}</span>}
        </span>
        {typeof item.pts === "number" && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            +{bnNum(item.pts)}
          </span>
        )}
      </button>
    );
  };

  return (
    <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">🌱 আমার আমল</h3>
        <span className="text-xs text-gray-400">{bnNum(remaining)}টি বাকি</span>
      </div>

      {fixedPending.map((f) => <Row key={f.key} item={f} />)}
      {custPending.map((c) => (
        <Row key={c.id} item={{ key: c.id, bn: c.bn, pts: c.pts }} />
      ))}

      {custPending.length === 0 && fixedPending.length === 0 && (
        <p className="py-2 text-sm font-medium text-emerald-600">মাশাআল্লাহ! আজকের সব আমল সম্পন্ন ✅</p>
      )}

      {doneCount > 0 && (
        <div className="mt-2 border-t border-gray-100 pt-1 dark:border-gray-800">
          <button
            onClick={() => setShowDone(!showDone)}
            className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-1 py-2"
          >
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              ✅ সম্পন্ন হয়েছে ({bnNum(doneCount)})
            </span>
            <span className="text-xs text-gray-400">{showDone ? "▲" : "▼"}</span>
          </button>
          {showDone && (
            <div className="space-y-0.5 opacity-80">
              {fixedDone.map((f) => <Row key={f.key} item={f} />)}
              {custDone.map((c) => (
                <Row key={c.id} item={{ key: c.id, bn: c.bn, pts: c.pts }} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="min-h-[44px] w-full rounded-xl border border-dashed border-emerald-300 py-2 text-sm font-medium text-emerald-700 active:scale-[0.99] dark:border-emerald-700 dark:text-emerald-400"
          >
            + নতুন আমল যোগ করুন
          </button>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addDeed();
            }}
            className="space-y-2"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="নতুন আমলের নাম…"
              className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900"
            />
            <div className="flex items-center gap-2">
              <div className="flex min-h-[44px] flex-1 items-center rounded-xl border border-gray-200 px-1 dark:border-gray-700">
                <button type="button" onClick={() => setPts((p) => Math.max(1, p - 1))} aria-label="পয়েন্ট কমান" className="h-9 w-9 text-lg leading-none text-gray-500 dark:text-gray-400">
                  −
                </button>
                <span className="flex-1 text-center text-sm font-semibold tabular-nums">{bnNum(pts)} পয়েন্ট</span>
                <button type="button" onClick={() => setPts((p) => Math.min(100, p + 1))} aria-label="পয়েন্ট বাড়ান" className="h-9 w-9 text-lg leading-none text-gray-500 dark:text-gray-400">
                  +
                </button>
              </div>
              <button type="submit" className="min-h-[44px] rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white active:scale-95">
                যোগ
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="min-h-[44px] px-2 text-sm text-gray-400">
                বাতিল
              </button>
            </div>
          </form>
        )}
        <p className="mt-2 text-center text-[11px] text-gray-400">৫ নামাজ সম্পূর্ণ করলে +২০ বোনাস · ফজরে +৫ বোনাস</p>
      </div>
    </section>
  );
}
