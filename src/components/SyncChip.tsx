"use client";

import { useEffect, useState } from "react";
import AuthSheet from "@/components/AuthSheet";
import { getCurrentUser, type SyncUser } from "@/lib/supabase";
import { getSyncStatus, subscribeSync } from "@/lib/sync";

/** Header chip: shows login state; opens the AuthSheet. Also wires initSync(). */
export default function SyncChip() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SyncUser | null>(null);
  const [open, setOpen] = useState(false);
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

  if (!mounted) return null;

  const label = user
    ? status || (user.email ? user.email[0].toUpperCase() : "👤")
    : "☁️";

  return (
    <>
      <button
        onClick={() => (user ? undefined : setOpen(true))}
        aria-label={user ? "সিঙ্ক হয়েছে" : "লগইন করুন"}
        className={
          "grid h-10 w-10 place-items-center rounded-full border text-sm font-bold transition active:scale-95 " +
          (user
            ? "border-emerald-500 bg-emerald-600 text-white"
            : "border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400")
        }
      >
        {label}
      </button>
      <AuthSheet open={open} onClose={() => { setOpen(false); getCurrentUser().then(setUser); }} />
    </>
  );
}
