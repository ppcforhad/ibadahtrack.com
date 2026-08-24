"use client";

import { useEffect, useState } from "react";
import AuthSheet from "@/components/AuthSheet";
import { getSupabase, getCurrentUser, type SyncUser } from "@/lib/supabase";
import { getSyncStatus, subscribeSync } from "@/lib/sync";

/** Header account button: ☁️ লগইন (guest) → modern profile avatar (signed in).
 *  Tapping the avatar opens a profile menu (email, sync status, logout). */
export default function SyncChip() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SyncUser | null>(null);
  const [open, setOpen] = useState(false); // login sheet
  const [menu, setMenu] = useState(false); // profile menu
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    import("@/lib/sync").then((m) => m.initSync());
    getCurrentUser().then(setUser);
    const unsub = subscribeSync((s) => {
      if (s === "done") {
        setStatus("✓");
        setTimeout(() => setStatus(""), 2500);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menu]);

  if (!mounted) return null;

  const logout = async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setUser(null);
    setMenu(false);
  };

  const initial = user?.email ? user.email[0].toUpperCase() : "👤";

  return (
    <>
      {/* Guest: clear "লগইন" pill — obvious entry point */}
      {!user && (
        <button
          onClick={() => setOpen(true)}
          className="flex min-h-[38px] items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-95"
        >
          🔐 লগইন
        </button>
      )}

      {/* Signed in: modern gradient avatar with sync dot */}
      {user && (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenu(!menu)}
            aria-label="প্রোফাইল"
            className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-bold text-white shadow-md ring-2 ring-white transition active:scale-95 dark:ring-gray-900"
          >
            {status || initial}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-gray-900" />
          </button>

          {menu && (
            <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-gray-100 bg-emerald-50 p-4 dark:border-gray-800 dark:bg-emerald-900/30">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">মাশাআল্লাহ 👋</p>
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {status ? "সিঙ্ক হচ্ছে…" : "☁️ ক্লাউডে সেভ হচ্ছে"}
                </p>
              </div>
              <button
                onClick={logout}
                className="flex min-h-[48px] w-full items-center gap-2 px-4 text-left text-sm font-medium text-red-500 active:bg-red-50 dark:active:bg-red-900/20"
              >
                🚪 লগআউট
              </button>
            </div>
          )}
        </div>
      )}

      <AuthSheet open={open} onClose={() => { setOpen(false); getCurrentUser().then(setUser); }} />
    </>
  );
}
