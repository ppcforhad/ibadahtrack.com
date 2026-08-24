import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Optional Supabase browser client.
 *
 * - Reads NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
 * - Missing/invalid env vars ⇒ getSupabase() returns null and every auth/sync
 *   call site treats that as a no-op: the app remains 100% offline/localStorage.
 * - Server-side (SSR/prerender) always returns null — client-only by design.
 */

let cached: SupabaseClient | null | undefined;

function init(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(); // legacy var name fallback
    if (!url || !key) return null;
    return createClient(url, key, {
      auth: {
        persistSession: true, // session survives reloads (localStorage)
        autoRefreshToken: true,
        detectSessionInUrl: true, // completes Google OAuth / magic-link redirects
        storageKey: "it_supabase_auth",
      },
    });
  } catch {
    return null;
  }
}

/** Browser-only client, or null when unconfigured / on the server. */
export function getSupabase(): SupabaseClient | null {
  if (cached === undefined) cached = init();
  return cached;
}

/** True when env vars are present and a client exists (safe to call anywhere). */
export function supabaseConfigured(): boolean {
  return getSupabase() !== null;
}

export interface SyncUser {
  id: string;
  email?: string | null;
}

/** Current signed-in user, or null. Never throws. */
export async function getCurrentUser(): Promise<SyncUser | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    const u = data.session?.user;
    return u ? { id: u.id, email: u.email ?? null } : null;
  } catch {
    return null;
  }
}

/** Convenience passthrough of the raw session (null when logged out). */
export async function getSession(): Promise<Session | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    return data.session ?? null;
  } catch {
    return null;
  }
}
