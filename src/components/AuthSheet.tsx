"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

/** Bottom-sheet login UI: Google one-tap + email magic link.
 *  Optional by design — without login everything stays on the device. */
export default function AuthSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setSent(false);
      setErr("");
    }
  }, [open]);

  if (!open) return null;

  const signInGoogle = async () => {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setErr("");
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setErr("গুগল লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      setBusy(false);
    }
    // On success the browser redirects; no further action here.
  };

  const sendMagicLink = async () => {
    const sb = getSupabase();
    if (!sb) return;
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErr("সঠিক ইমেইল দিন");
      return;
    }
    setBusy(true);
    setErr("");
    const { error } = await sb.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      setErr("ইমেইল পাঠানো যায়নি। আবার চেষ্টা করুন।");
      return;
    }
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white p-5 pb-8 shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
        <h2 className="mb-1 text-lg font-bold">🔐 লগইন করুন</h2>
        <p className="mb-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          লগইন করলে আপনার আমলের হিসাব ক্লাউডে সেভ থাকবে — ফোন হারালেও ডেটা নিরাপদ।
        </p>

        {sent ? (
          <div className="rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-900/30">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">📧 ইমেইল পাঠানো হয়েছে!</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {email} এ গিয়ে লিংকে ক্লিক করুন — তারপর এই অ্যাপে ফিরে এলেই লগইন হয়ে যাবে।
            </p>
            <button onClick={onClose} className="mt-3 min-h-[44px] w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white active:scale-[0.99]">
              ঠিক আছে
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={signInGoogle}
              disabled={busy}
              className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 shadow-sm transition active:scale-[0.99] disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z" />
                <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5.1L1.3 17C3.3 21.1 7.3 24 12 24z" />
                <path fill="#FBBC05" d="M5.2 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.3 6.7C.5 8.3 0 10.1 0 12s.5 3.7 1.3 5.3l3.9-3z" />
                <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.9 1.3 6.7l3.9 3c.9-2.9 3.6-5 6.8-5z" />
              </svg>
              গুগল দিয়ে লগইন
            </button>

            <div className="my-4 flex items-center gap-3 text-[11px] text-gray-400">
              <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              অথবা ইমেইল দিয়ে
              <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>

            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="আপনার ইমেইল…"
              className="min-h-[48px] w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <button
              onClick={sendMagicLink}
              disabled={busy}
              className="mt-2 min-h-[48px] w-full rounded-2xl bg-emerald-600 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? "পাঠানো হচ্ছে…" : "✉️ লগইন লিংক পাঠান"}
            </button>
          </>
        )}

        {err && <p className="mt-2 text-center text-xs font-medium text-red-500">{err}</p>}

        <p className="mt-4 text-center text-[11px] leading-relaxed text-gray-400">
          🔒 লগইন না করলেও সব ডেটা আপনার ফোনেই থাকবে — অ্যাকাউন্ট ছাড়াও পুরো অ্যাপ ব্যবহার করা যাবে।
        </p>
        <button onClick={onClose} className="mt-2 min-h-[44px] w-full text-sm text-gray-400">
          পরে করব
        </button>
      </div>
    </div>
  );
}
