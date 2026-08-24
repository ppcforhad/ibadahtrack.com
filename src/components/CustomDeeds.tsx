"use client";

import { useEffect, useState } from "react";
import { CustomDeed, dateKey, getDay, loadDeeds, saveDeeds, updateDay } from "@/lib/storage";

const bnNum = (n: number) => n.toLocaleString("bn-BD");
const newId = () => "d_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** "নিজের আমল" — user-defined good deeds with custom point values.
 *  Toggling writes today's dateKey deedsDone via updateDay; adding/removing
 *  deeds edits the it_deeds_v1 list only (past log IDs stay, score falls back to 0). */
export default function CustomDeeds({ onChanged }: { onChanged?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [deeds, setDeeds] = useState<CustomDeed[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [pts, setPts] = useState(5);

  useEffect(() => {
    setMounted(true);
    setDeeds(loadDeeds());
    setDone(getDay(dateKey()).deedsDone ?? []);
  }, []);

  if (!mounted) return null;

  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    updateDay(dateKey(), (d) => ({ ...d, deedsDone: next }));
    onChanged?.();
  };

  const addDeed = () => {
    const label = name.trim();
    if (!label) return;
    const item: CustomDeed = { id: newId(), bn: label, pts: Math.min(100, Math.max(1, pts || 5)) };
    const next = [...deeds, item];
    setDeeds(next);
    saveDeeds(next);
    setName("");
    setPts(5);
  };

  const removeDeed = (id: string) => {
    const next = deeds.filter((d) => d.id !== id);
    setDeeds(next);
    saveDeeds(next);
    onChanged?.();
  };

  return (
    <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold">✅ নিজের আমল</h3>

      <div className="space-y-1">
        {deeds.map((d) => {
          const checked = done.includes(d.id);
          return (
            <div key={d.id} className="flex items-center justify-between gap-1">
              <button
                onClick={() => toggle(d.id)}
                aria-pressed={checked}
                className={
                  "flex min-h-[44px] flex-1 items-center gap-3 rounded-xl px-1 py-2 text-left transition active:scale-[0.99] " +
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
                <span className={"flex-1 truncate text-sm " + (checked ? "font-medium" : "")}>{d.bn}</span>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  +{bnNum(d.pts)}
                </span>
              </button>
              <button
                onClick={() => removeDeed(d.id)}
                aria-label={d.bn + " মুছুন"}
                className="grid min-h-[44px] w-9 shrink-0 place-items-center rounded-xl text-sm text-gray-400 hover:text-red-500 dark:text-gray-500"
              >
                🗑
              </button>
            </div>
          );
        })}
        {deeds.length === 0 && (
          <p className="py-2 text-xs text-gray-400">
            এখনো কোনো আমল নেই। নিচ থেকে যেকোনো ভালো কাজ পয়েন্টসহ যোগ করুন 🌱
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addDeed();
        }}
        className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="নতুন আমলের নাম…"
          className="min-h-[44px] flex-1 rounded-2xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900"
        />
        <div className="flex min-h-[44px] items-center rounded-2xl border border-gray-200 px-1 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setPts((p) => Math.max(1, p - 1))}
            aria-label="পয়েন্ট কমান"
            className="h-9 w-7 text-lg leading-none text-gray-500 dark:text-gray-400"
          >
            −
          </button>
          <span className="w-7 text-center text-sm font-semibold tabular-nums">{bnNum(pts)}</span>
          <button
            type="button"
            onClick={() => setPts((p) => Math.min(100, p + 1))}
            aria-label="পয়েন্ট বাড়ান"
            className="h-9 w-7 text-lg leading-none text-gray-500 dark:text-gray-400"
          >
            +
          </button>
        </div>
        <button
          type="submit"
          className="min-h-[44px] shrink-0 rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white active:scale-95"
        >
          যোগ করুন
        </button>
      </form>
    </section>
  );
}
