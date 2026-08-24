"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Mode = "login" | "signup";

/** Bottom-sheet auth: Google one-tap + email/password login & signup.
 *  Optional by design — without an account everything stays on the device. */
export default function AuthSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setErr("");
      setMsg("");
      setPassword("");
    }
  }, [open, mode]);

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
  };

  const submitEmail = async () => {
    const sb = getSupabase();
    if (!sb) return;
    const em = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setErr("সঠিক ইমেইল দিন");
      return;
    }
    if (password.length < 6) {
      setErr("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }
    setBusy(true);
    setErr("");
    setMsg("");

    if (mode === "signup") {
      const { data, error } = await sb.auth.signUp({
        email: em,
        password,
        options: { data: { full_name: name.trim() || undefined } },
      });
      setBusy(false);
      if (error) {
        setErr(
          error.message.includes("already registered")
            ? "এই ইমেইলে অ্যাকাউন্ট আছে — লগইন ট্যাব ব্যবহার করুন"
            : "সাইনআপ ব্যর্থ: " + error.message
        );
        return;
      }
      if (data.session) {
        setMsg("✅ অ্যাকাউন্ট তৈরি হয়েছে! আপনি লগইন অবস্থায় আছেন।");
        setTimeout(onClose, 1200);
      } else {
        setMsg("📧 সাফল্ক! ইমেইলে ভেরিফিকেশন লিংক পাঠানো হয়েছে — সেটি ক্লিক করুন।");
      }
      return;
    }

    const { error } = await sb.auth.signInWithPassword({ email: em, password });
    setBusy(false);
    if (error) {
      setErr(
        error.message.includes("Invalid login")
          ? "ইমেইল বা পাসওয়ার্ড ভুল"
          : "লগইন ব্যর্থ: " + error.message
      );
      return;
    }
    setMsg("✅ লগইন সফল!");
    setTimeout(onClose, 800);
  };

  const inputCls =
    "min-h-[48px] w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white p-5 pb-8 shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
        <h2 className="mb-1 text-lg font-bold">
          {mode === "login" ? "🔐 লগইন করুন" : "✨ অ্যাকাউন্ট খুলুন"}
        </h2>
        <p className="mb-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          লগইন করলে আপনার আমলের হিসাব ক্লাউডে সেভ থাকবে — ফোন হারালেও ডেটা নিরাপদ।
        </p>

        {/* Login / Signup tabs */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={
                "min-h-[40px] rounded-xl text-sm font-semibold transition " +
                (mode === m
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-400"
                  : "text-gray-500 dark:text-gray-400")
              }
            >
              {m === "login" ? "লগইন" : "সাইনআপ"}
            </button>
          ))}
        </div>

        {msg ? (
          <div className="rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-900/30">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{msg}</p>
            {!msg.includes("লগইন অবস্থায়") && !msg.includes("সফল") && (
              <button onClick={onClose} className="mt-3 min-h-[44px] w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white active:scale-[0.99]">
                ঠিক আছে
              </button>
            )}
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
              গুগল দিয়ে চালিয়ে যান
            </button>

            <div className="my-4 flex items-center gap-3 text-[11px] text-gray-400">
              <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              অথবা ইমেইল দিয়ে
              <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="space-y-2">
              {mode === "signup" && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার নাম (ঐচ্ছিক)"
                  className={inputCls}
                />
              )}
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ইমেইল"
                className={inputCls}
              />
              <input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
                className={inputCls}
              />
              <button
                onClick={submitEmail}
                disabled={busy}
                className="min-h-[48px] w-full rounded-2xl bg-emerald-600 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
              >
                {busy
                  ? "অপেক্ষা করুন…"
                  : mode === "login"
                    ? "লগইন করুন"
                    : "অ্যাকাউন্ট তৈরি করুন"}
              </button>
            </div>
          </>
        )}

        {err && <p className="mt-2 text-center text-xs font-medium text-red-500">{err}</p>}

        <p className="mt-4 text-center text-[11px] leading-relaxed text-gray-400">
          🔒 অ্যাকাউন্ট ছাড়াও পুরো অ্যাপ ব্যবহার করা যাবে — লগইন না করলে সব ডেটা আপনার ফোনেই থাকবে।
        </p>
        <button onClick={onClose} className="mt-2 min-h-[44px] w-full text-sm text-gray-400">
          পরে করব
        </button>
      </div>
    </div>
  );
}
