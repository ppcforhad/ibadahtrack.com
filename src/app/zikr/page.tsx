"use client";

import { useEffect, useState } from "react";
import { DayLog, dateKey, getDay, loadCustomZikr, saveCustomZikr, updateDay } from "@/lib/storage";
import { ZIKR_PRESETS, ZikrPreset } from "@/lib/data";

const TARGETS = [33, 99, 100];
const bnNum = (n: number) => n.toLocaleString("bn-BD");

export default function ZikrPage() {
  const [mounted, setMounted] = useState(false);
  const [log, setLog] = useState<DayLog>({});
  const [chips, setChips] = useState<ZikrPreset[]>(ZIKR_PRESETS);
  const [sel, setSel] = useState<ZikrPreset>(ZIKR_PRESETS[0]);
  const [target, setTarget] = useState(33);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    setMounted(true);
    setLog(getDay(dateKey()));
    // Merge persisted custom presets with built-ins (skip ids already present).
    const builtinIds = new Set(ZIKR_PRESETS.map((p) => p.id));
    const extra: ZikrPreset[] = [];
    for (const z of loadCustomZikr()) {
      if (!builtinIds.has(z.id) && !extra.some((e) => e.id === z.id)) extra.push(z);
    }
    if (extra.length !== loadCustomZikr().length) saveCustomZikr(extra); // heal dupes
    setChips([...ZIKR_PRESETS, ...extra]);
  }, []);

  const refresh = () => setLog(getDay(dateKey()));

  if (!mounted) return <p className="py-20 text-center text-gray-400">লোড হচ্ছে…</p>;

  const count = log.zikrCounts?.[sel.id] ?? 0;
  const pct = Math.min(1, count / target);
  const R = 84;
  const C = 2 * Math.PI * R;

  const inc = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    updateDay(dateKey(), (d) => ({ ...d, zikrCounts: { ...(d.zikrCounts ?? {}), [sel.id]: (d.zikrCounts?.[sel.id] ?? 0) + 1 } }));
    refresh();
  };

  const reset = () => {
    updateDay(dateKey(), (d) => ({ ...d, zikrCounts: { ...(d.zikrCounts ?? {}), [sel.id]: 0 } }));
    refresh();
  };

  const addCustom = () => {
    const label = custom.trim();
    if (!label) return;
    const item: ZikrPreset = { id: "c_" + label, ar: label, bn: label };
    const existing = chips.find((z) => z.id === item.id);
    const nextChips = existing ? chips : [...chips, item];
    setChips(nextChips);
    setSel(existing ?? item);
    setCustom("");
    // Persist only user-added presets (built-ins live in code).
    saveCustomZikr(nextChips.filter((z) => !ZIKR_PRESETS.some((p) => p.id === z.id)));
  };

  return (
    <>
      <h1 className="mb-3 text-lg font-bold">📿 যিকির</h1>

      <div className="relative mb-4">
        <select
          value={sel.id}
          onChange={(e) => {
            const found = chips.find((z) => z.id === e.target.value);
            if (found) setSel(found);
          }}
          className="min-h-[48px] w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 pr-10 text-sm font-medium outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900"
        >
          {chips.map((z) => (
            <option key={z.id} value={z.id}>
              {z.bn}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▼</span>
      </div>

      <p className="arabic-text mb-1 text-center font-semibold">{sel.ar}</p>

      <div className="mb-4 flex justify-center gap-2">
        {TARGETS.map((t) => (
          <button
            key={t}
            onClick={() => setTarget(t)}
            className={
              "rounded-full px-4 py-1.5 text-sm min-h-[36px] " +
              (target === t ? "bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "text-gray-500 dark:text-gray-400")
            }
          >
            {bnNum(t)}
          </button>
        ))}
      </div>

      <div className="relative mx-auto mb-4 h-56 w-56">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" strokeWidth="10" className="stroke-gray-200 dark:stroke-gray-800" />
          <circle
            cx="100" cy="100" r={R} fill="none" strokeWidth="10" strokeLinecap="round"
            className="stroke-emerald-500 transition-all duration-200"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
          />
        </svg>
        <button
          onClick={inc}
          className="absolute inset-6 grid place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl transition active:scale-95"
        >
          <span className="text-center">
            <span className="block text-4xl font-bold tabular-nums">{bnNum(count)}</span>
            <span className="block text-xs opacity-80">/{bnNum(target)} · ট্যাপ করুন</span>
          </span>
        </button>
      </div>

      <button onClick={reset} className="mx-auto mb-6 block rounded-full px-5 py-2 text-sm text-gray-500 underline dark:text-gray-400">
        এই যিকির রিসেট করুন
      </button>

      <div className="mb-4 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="নিজের যিকির লিখুন…"
          className="min-h-[44px] flex-1 rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900"
        />
        <button onClick={addCustom} className="min-h-[44px] rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white active:scale-95">
          যোগ করুন
        </button>
      </div>

      <section className="space-y-1.5 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">আজকের মোট</h3>
        {Object.entries(log.zikrCounts ?? {}).filter(([, v]) => v > 0).map(([id, v]) => {
          const chip = chips.find((c) => c.id === id);
          return (
            <div key={id} className="flex items-center justify-between text-sm">
              <span>{chip?.bn ?? id}</span>
              <span className="font-semibold tabular-nums text-emerald-600">{bnNum(v)}</span>
            </div>
          );
        })}
        {!Object.values(log.zikrCounts ?? {}).some((v) => v > 0) && (
          <p className="text-xs text-gray-400">আজ কোনো যিকির হয়নি। বিসমিল্লাহ শুরু করুন 🌱</p>
        )}
      </section>
    </>
  );
}
