"use client";

import { useState } from "react";
import { KALIMAS } from "@/lib/data";
import { MAULIK_ILM } from "@/lib/ilm";
import { MAULIK_EXTRA } from "@/lib/maulik-extra";

const bnNum = (n: number) => n.toLocaleString("bn-BD");

/** মৌলিক ইলম — প্রতিটি সেকশন minimize/maximize (collapsible)। */
export default function MaulikSection() {
  const [open, setOpen] = useState<Record<string, boolean>>({ islam5: true });
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const sections: { key: string; title: string; body: React.ReactNode }[] = [
    {
      key: "islam5",
      title: "🕋 ইসলামের ৫ স্তম্ভ",
      body: (
        <ol className="space-y-1.5">
          {MAULIK_ILM.islam5.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">{bnNum(i + 1)}</span>
              {s}
            </li>
          ))}
        </ol>
      ),
    },
    {
      key: "iman7",
      title: "💚 ঈমানের ৭টি মৌলিক বিষয়",
      body: (
        <ol className="space-y-1.5">
          {MAULIK_ILM.iman7.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{bnNum(i + 1)}</span>
              {s}
            </li>
          ))}
        </ol>
      ),
    },
    {
      key: "rakat",
      title: "🕐 ৫ ওয়াক্ত নামাজের রাকাত",
      body: (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <th className="px-4 py-2 font-medium">ওয়াক্ত</th>
              <th className="px-2 py-2 font-medium">সুন্নত</th>
              <th className="px-4 py-2 font-medium">ফরজ</th>
            </tr>
          </thead>
          <tbody>
            {MAULIK_ILM.rakat.map((r) => (
              <tr key={r.waqt} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2.5 font-semibold">{r.waqt}</td>
                <td className="px-2 py-2.5 text-xs text-gray-500 dark:text-gray-400">{r.sunnah}</td>
                <td className="px-4 py-2.5 font-bold text-emerald-600">{r.fard}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      key: "wudu4",
      title: "💧 ওজুর ফরজ (৪টি)",
      body: (
        <ol className="space-y-1.5">
          {MAULIK_ILM.wudu4.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">{bnNum(i + 1)}</span>
              {s}
            </li>
          ))}
        </ol>
      ),
    },
    {
      key: "gusal3",
      title: "🚿 গুসলের ফরজ (৩টি)",
      body: (
        <ol className="space-y-1.5">
          {MAULIK_ILM.gusal3.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">{bnNum(i + 1)}</span>
              {s}
            </li>
          ))}
        </ol>
      ),
    },
    {
      key: "kalima",
      title: "🕋 ছয় কালেমা",
      body: (
        <div className="space-y-3">
          {KALIMAS.map((k) => (
            <div key={k.name}>
              <p className="mb-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{k.name}</p>
              <p className="arabic-text mb-1 text-right font-medium">{k.arabic}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{k.meaning}</p>
            </div>
          ))}
        </div>
      ),
    },
    ...MAULIK_EXTRA.map((x) => ({
      key: x.key,
      title: x.title,
      body: (
        <div className="space-y-2.5">
          {x.items.map((it, i) => (
            <div key={i} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{it.title}</p>
              {it.arabic && <p className="arabic-text mt-1 text-right text-base">{it.arabic}</p>}
              {it.text && <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">{it.text}</p>}
            </div>
          ))}
        </div>
      ),
    })),
  ];

  return (
    <div className="space-y-2 pb-4">
      {sections.map((s) => (
        <section key={s.key} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => toggle(s.key)}
            className="flex min-h-[52px] w-full items-center justify-between gap-2 border-b border-gray-100 bg-emerald-50 px-4 py-3 text-left dark:border-gray-800 dark:bg-emerald-900/30"
          >
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">{s.title}</span>
            <span className={"shrink-0 text-gray-400 transition-transform " + (open[s.key] ? "rotate-180" : "")}>▼</span>
          </button>
          {open[s.key] && <div className="p-4">{s.body}</div>}
        </section>
      ))}
    </div>
  );
}
