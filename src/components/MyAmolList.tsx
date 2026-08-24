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

/** Suggested amal library — one tap adds to today's list. */
const SUGGESTED: Item[] = [
  { key: "s_quran_tilawat", bn: "কুরআন তিলাওয়াত", pts: 10 },
  { key: "s_dan_sadaka", bn: "দান সদকা", pts: 10 },
  { key: "s_mosjid_jamat", bn: "মসজিদে জামাত", pts: 10 },
  { key: "s_roza", bn: "রোজা (নফল)", pts: 20 },
  { key: "s_parents", bn: "মা-বাবার সেবা", pts: 15 },
  { key: "s_istighfar100", bn: "ইস্তিগফার ১০০ বার", pts: 10 },
  { key: "s_durood100", bn: "দুরুদ ১০০ বার", pts: 10 },
  { key: "s_good_words", bn: "ভালো কথা বলা", pts: 5 },
  { key: "s_smile_salam", bn: "হাসিমুখে সালাম", pts: 5 },
  { key: "s_help_others", bn: "অন্যকে সাহায্য", pts: 10 },
  { key: "s_tahajjud_read", bn: "তাহাজ্জুদ পড়া", pts: 20 },
  { key: "s_night_ibadah", bn: "রাত জাগা ইবাদত", pts: 15 },
  { key: "s_wudu_sahih", bn: "ওজু সহিহ করা", pts: 5 },
  { key: "s_mosjid_before_azan", bn: "মসজিদে আজানের আগে পৌঁছানো", pts: 10 },
  { key: "s_surah_kahf", bn: "সূরা কাহফ তিলাওয়াত (শুক্রবার)", pts: 15 },
  { key: "s_sissta", bn: "সিস্তা (নখ/দাড়ি)", pts: 5 },
  { key: "s_miswak", bn: "মিসওয়াক", pts: 5 },
  { key: "s_mosjid_nafl", bn: "বিনা কারণে মসজিদে যাওয়া", pts: 10 },
  { key: "s_zikr_morning_evening", bn: "দুই বেলা সকাল-সন্ধ্যার জিকির", pts: 10 },
  { key: "s_ilm_study", bn: "পড়াশোনা/ইলম অর্জন", pts: 10 },
  { key: "s_children_rights", bn: "সন্তানের অধিকার পালন", pts: 10 },
  { key: "s_spouse_rights", bn: "স্বামী-স্ত্রীর হক আদায়", pts: 10 },
  { key: "s_silatur_rahim", bn: "আত্মীয়তা বাঁধা (সিলাতুর রাহিম)", pts: 15 },
  { key: "s_orphan_kindness", bn: "এতিমের প্রতি দয়া", pts: 15 },
];

/** "আমার আমল" — unified daily deed checklist: fard salahs first, then every
 *  other amol (suggested + custom). Ticking moves an item into the collapsed
 *  সম্পন্ন section; the ➕ আমল যোগ করুন panel is collapsible (default minimized). */
export default function MyAmolList({ onChanged }: { onChanged?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [log, setLog] = useState<DayLog>({});
  const [deeds, setDeeds] = useState<CustomDeed[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
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
    setShowCustom(false);
  };

  /** One tap adds to my list; another tap removes it again. */
  const addSuggested = (item: Item) => {
    if (deeds.some((d) => d.id === item.key)) {
      act(() => saveDeeds(deeds.filter((d) => d.id !== item.key)));
      return;
    }
    act(() => saveDeeds([...deeds, { id: item.key, bn: item.bn, pts: item.pts ?? 5 }]));
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

      {/* ➕ আমল যোগ করুন — collapsible panel (default minimized) */}
      <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-800">
        <button
          onClick={() => setShowAdd(!showAdd)}
          aria-expanded={showAdd}
          className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-1"
        >
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            ➕ আমল যোগ করুন
          </span>
          <span className="text-xs text-gray-400">{showAdd ? "▲" : "▼"}</span>
        </button>

        {showAdd && (
          <div className="space-y-3 pb-1 pt-1">
            {/* Suggested amal chips — one tap to add */}
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">📋 সাধারণ আমল — ট্যাপ করলেই যোগ হবে</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED.map((s) => {
                  const added = deeds.some((d) => d.id === s.key);
                  return (
                    <button
                      key={s.key}
                      onClick={() => addSuggested(s)}
                      title={added ? "আবার ট্যাপ করলে বাদ যাবে" : "ট্যাপ করলে যোগ হবে"}
                      className={
                        "min-h-[36px] rounded-full border px-3 py-1.5 text-xs transition active:scale-95 " +
                        (added
                          ? "border-emerald-500 bg-emerald-600 font-medium text-white dark:border-emerald-500"
                          : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200")
                      }
                    >
                      {added ? "✓ " : "+ "}
                      {s.bn} <span className="opacity-60">+{bnNum(s.pts ?? 5)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom amal form */}
            <div>
              <button
                onClick={() => setShowCustom(!showCustom)}
                className="min-h-[40px] text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
              >
                ✏️ নিজের আমল {showCustom ? "লুকান" : "বানান"}
              </button>
              {showCustom && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addDeed();
                  }}
                  className="mt-1 space-y-2"
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
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        <p className="mt-2 text-center text-[11px] text-gray-400">৫ নামাজ সম্পূর্ণ করলে +২০ বোনাস · ফজরে +৫ বোনাস</p>
      </div>
    </section>
  );
}
