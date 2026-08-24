"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Settings, loadSettings, saveSettings } from "@/lib/storage";
import { CITIES, METHODS } from "@/lib/prayers";

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => setS(loadSettings()), []);

  if (!s) return <p className="py-20 text-center text-gray-400">লোড হচ্ছে…</p>;

  const apply = (next: Partial<Settings>) => {
    const merged = { ...s, ...next };
    setS(merged);
    saveSettings(merged);
    setMsg("সেভ হয়েছে ✓");
    setTimeout(() => setMsg(""), 1500);
  };

  const toggleNotify = async () => {
    if (!s.notify) {
      if (!("Notification" in window)) { alert("এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই"); return; }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { alert("নোটিফিকেশন অনুমতি দেওয়া হয়নি"); return; }
      apply({ notify: true });
    } else {
      apply({ notify: false });
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">⚙️ সেটিংস</h1>
        <Link href="/" className="text-sm text-emerald-600">← হোম</Link>
      </div>

      <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 text-sm font-semibold">📍 শহর</h3>
        <select
          value={CITIES.some((c) => c.name === s.city) ? s.city : "custom"}
          onChange={(e) => {
            const c = CITIES.find((x) => x.name === e.target.value);
            if (c) apply({ city: c.name, lat: c.lat, lng: c.lng });
            else apply({ city: "custom" });
          }}
          className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-transparent px-3 dark:border-gray-700"
        >
          {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          <option value="custom">অন্যান্য (ম্যানুয়াল)</option>
        </select>

        {(!CITIES.some((c) => c.name === s.city)) && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-500">
              অক্ষাংশ (lat)
              <input
                type="number" step="any" value={s.lat}
                onChange={(e) => apply({ lat: Number(e.target.value) })}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-gray-200 bg-transparent px-3 dark:border-gray-700"
              />
            </label>
            <label className="text-xs text-gray-500">
              দ্রাঘিমাংশ (lng)
              <input
                type="number" step="any" value={s.lng}
                onChange={(e) => apply({ lng: Number(e.target.value) })}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-gray-200 bg-transparent px-3 dark:border-gray-700"
              />
            </label>
          </div>
        )}
      </section>

      <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 text-sm font-semibold">🧮 নামাজের সময় গণনা পদ্ধতি</h3>
        <select
          value={s.method}
          onChange={(e) => apply({ method: e.target.value as Settings["method"] })}
          className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-transparent px-3 dark:border-gray-700"
        >
          {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </section>

      <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <button onClick={toggleNotify} className="flex w-full items-center justify-between text-left">
          <span>
            <span className="block text-sm font-semibold">🔔 নামাজের নোটিফিকেশন</span>
            <span className="block text-xs text-gray-400">অ্যাপ খোলা থাকলে নামাজের সময়ে জানাবে</span>
          </span>
          <span className={"relative inline-block h-7 w-12 rounded-full transition " + (s.notify ? "bg-emerald-600" : "bg-gray-300 dark:bg-gray-700")}>
            <span className={"absolute top-1 h-5 w-5 rounded-full bg-white transition-all " + (s.notify ? "left-6" : "left-1")} />
          </span>
        </button>
        <p className="mt-2 text-[11px] text-gray-400">v1: ব্রাউজার খোলা থাকলে রিমাইন্ডার। বন্ধ থাকা অবস্থায় push notification শীঘ্রই আসছে।</p>
      </section>

      {msg && <p className="text-center text-sm font-medium text-emerald-600">{msg}</p>}
    </>
  );
}
