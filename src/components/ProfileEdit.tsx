"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { CITIES } from "@/lib/prayers";
import type { Settings } from "@/lib/storage";
import { loadSettings, saveSettings } from "@/lib/storage";
import { fileToAvatarDataUrl, loadProfile, saveProfile, type Profile } from "@/lib/profile";
import { getCurrentUser, type SyncUser } from "@/lib/supabase";

/** Bottom-sheet profile editor: photo picker (canvas pipeline), display name,
 *  readonly email when signed in, city quick-pick.
 *  Save → it_profile_v1 (+ settings city/lat/lng when a new city is picked) + toast. */
export default function ProfileEdit({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<SyncUser | null>(null);
  const [city, setCity] = useState(""); // "" = leave unchanged
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const p = loadProfile();
    setName(p.name ?? "");
    setPhoto(p.photo ?? "");
    setEmail(p.email ?? "");
    setCity("");
    setToast("");
    getCurrentUser().then((u) => {
      setUser(u);
      if (u?.email && !p.email) setEmail(u.email);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-seed form each time the sheet opens
  }, [open]);

  if (!open) return null;

  const onPhotoPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await fileToAvatarDataUrl(file);
    if (url) setPhoto(url);
  };

  const onSave = () => {
    const next: Profile = { ...loadProfile(), name: name.trim(), email: email || user?.email || "" };
    if (photo) next.photo = photo;
    else delete next.photo;
    saveProfile(next);

    if (city) {
      const c = CITIES.find((x) => x.name === city);
      const s = loadSettings();
      if (c && s) {
        const merged: Settings = { ...s, city: c.name, lat: c.lat, lng: c.lng };
        saveSettings(merged);
      }
    }

    setToast("সেভ হয়েছে ✓");
    setTimeout(onClose, 900);
  };

  const inputCls =
    "min-h-[48px] w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white p-5 pb-8 shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="প্রোফাইল সম্পাদনা"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
        <h2 className="mb-4 text-lg font-bold">👤 প্রোফাইল সম্পাদনা</h2>

        {/* Photo picker */}
        <div className="mb-4 flex flex-col items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="প্রোফাইল ছবি পরিবর্তন"
            className="group relative h-20 w-20 overflow-hidden rounded-full transition active:scale-95"
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- base64 dataURL cannot go through next/image
              <img src={photo} alt="প্রোফাইল ছবি" className="h-20 w-20 rounded-full object-cover ring-2 ring-emerald-500/50" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-2xl font-bold text-white">
                {(name || email || "👤").trim().charAt(0).toUpperCase()}
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 flex h-6 items-center justify-center bg-black/45 text-[10px] font-semibold text-white">
              📷 ছবি
            </span>
          </button>
          <p className="text-[11px] text-gray-400">ছবিটি শুধু আপনার ফোনেই সেভ থাকবে</p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs text-gray-500 dark:text-gray-400">
            নাম
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="আপনার নাম"
              className={`${inputCls} mt-1`}
            />
          </label>

          <label className="block text-xs text-gray-500 dark:text-gray-400">
            ইমেইল{user ? " (লগইন করা — অপরিবর্তনযোগ্য)" : ""}
            <input
              value={email}
              readOnly={!!user}
              inputMode="email"
              placeholder="ইমেইল (ঐচ্ছিক)"
              className={`${inputCls} mt-1 ${user ? "opacity-60" : ""}`}
            />
          </label>

          <label className="block text-xs text-gray-500 dark:text-gray-400">
            শহর
            <select value={city} onChange={(e) => setCity(e.target.value)} className={`${inputCls} mt-1`}>
              <option value="">
                {loadSettings()?.city ? `অপরিবর্তিত (${loadSettings()!.city})` : "শহর নির্বাচন করুন"}
              </option>
              {CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {toast && (
          <div className="mt-3 rounded-xl bg-emerald-50 py-2 text-center text-sm font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {toast}
          </div>
        )}

        <button
          onClick={onSave}
          className="mt-3 min-h-[48px] w-full rounded-2xl bg-emerald-600 text-sm font-semibold text-white transition active:scale-[0.99]"
        >
          💾 সেভ করুন
        </button>
        <button onClick={onClose} className="mt-1 min-h-[44px] w-full text-sm text-gray-400">
          বাতিল
        </button>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoPicked} />
      </div>
    </div>
  );
}
