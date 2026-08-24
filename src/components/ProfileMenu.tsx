"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import AuthSheet from "@/components/AuthSheet";
import ProfileEdit from "@/components/ProfileEdit";
import { fileToAvatarDataUrl, loadProfile, saveProfile, type Profile } from "@/lib/profile";
import { getCurrentUser, getSupabase, type SyncUser } from "@/lib/supabase";

/** Header profile button (replaces the ⚙️ gear link).
 *  Guest → 👤 circle with "লগইন" label opens AuthSheet.
 *  Logged in → avatar (photo or email initial) opens the profile menu:
 *  edit profile, change photo (localStorage), settings, stats, backup, logout.
 *  Also kicks off background sync exactly like the old SyncChip did. */
export default function ProfileMenu() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SyncUser | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [photoSaved, setPhotoSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    import("@/lib/sync").then((m) => m.initSync());
    getCurrentUser().then(setUser);
    setProfile(loadProfile());
  }, []);

  if (!mounted) return null;

  const refreshProfile = () => setProfile(loadProfile());

  const onPhotoPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file after a failure
    if (!file) return;
    const photo = await fileToAvatarDataUrl(file);
    if (!photo) return;
    const next: Profile = { ...loadProfile(), photo };
    saveProfile(next);
    setProfile(next);
    setPhotoSaved(true);
    setTimeout(() => setPhotoSaved(false), 1500);
  };

  const logout = async () => {
    setMenuOpen(false);
    try {
      await getSupabase()?.auth.signOut();
    } catch {
      /* already signed out locally */
    }
    setUser(null);
  };

  const itemCls =
    "flex min-h-[44px] w-full items-center gap-3 px-4 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800";

  return (
    <div className="relative">
      {/* Trigger */}
      {user ? (
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="প্রোফাইল মেনু"
          aria-expanded={menuOpen}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-gray-200 bg-white p-1.5 transition active:scale-95 dark:border-gray-700 dark:bg-gray-900"
        >
          {profile.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- base64 dataURL cannot go through next/image
            <img src={profile.photo} alt="প্রোফাইল ছবি" className="h-7 w-7 rounded-full object-cover ring-2 ring-emerald-500/40" />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-xs font-bold text-white">
              {(profile.name || user.email || "?").trim().charAt(0).toUpperCase()}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={() => setAuthOpen(true)}
          aria-label="লগইন"
          className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 transition active:scale-95 dark:border-gray-700 dark:bg-gray-900"
        >
          <span className="text-base leading-none">👤</span>
          <span className="text-[10px] font-semibold leading-none text-emerald-600">লগইন</span>
        </button>
      )}

      {/* Dropdown menu */}
      {menuOpen && user && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <p className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <span className="block truncate text-sm font-semibold">{profile.name || "আমার প্রোফাইল"}</span>
              <span className="block truncate text-[11px] text-gray-500 dark:text-gray-400">{user.email}</span>
            </p>
            <button
              className={itemCls}
              onClick={() => {
                setMenuOpen(false);
                setEditOpen(true);
              }}
            >
              <span>👤</span> প্রোফাইল সম্পাদনা
            </button>
            <button className={itemCls} onClick={() => fileRef.current?.click()}>
              <span>📷</span> প্রোফাইল ছবি
              {photoSaved && <span className="ml-auto text-xs font-semibold text-emerald-600">সেভ ✓</span>}
            </button>
            <Link href="/settings" className={itemCls} onClick={() => setMenuOpen(false)}>
              <span>⚙️</span> সেটিংস
            </Link>
            <Link href="/stats" className={itemCls} onClick={() => setMenuOpen(false)}>
              <span>📊</span> আমার স্ট্যাটস
            </Link>
            <Link href="/stats" className={itemCls} onClick={() => setMenuOpen(false)}>
              <span>📤</span> ব্যাকআপ
            </Link>
            <button
              className={itemCls + " border-t border-gray-100 text-red-600 hover:bg-red-50 dark:border-gray-800 dark:text-red-400 dark:hover:bg-red-950/30"}
              onClick={logout}
            >
              <span>🚪</span> লগআউট
            </button>
          </div>
        </>
      )}

      {/* Hidden image picker (gallery + camera via OS chooser) */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoPicked} />

      <ProfileEdit open={editOpen} onClose={() => { setEditOpen(false); refreshProfile(); }} />
      <AuthSheet open={authOpen} onClose={() => { setAuthOpen(false); getCurrentUser().then(setUser); }} />
    </div>
  );
}
