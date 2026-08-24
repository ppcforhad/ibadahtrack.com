import type { CustomDeed, DayLog, Logs, Settings } from "./storage";
import { loadDeeds, loadLogs, loadSettings, saveDeeds, saveLogs, saveSettings } from "./storage";
import { getCurrentUser, getSupabase, type SyncUser } from "./supabase";

/**
 * Offline-first cloud sync.
 *
 * Rules:
 * - localStorage is ALWAYS the source of truth for the UI; sync never blocks a tap.
 * - On login: push everything local → pull remote → merge (last-write-wins per
 *   day-key using per-entity updated_at stamps kept in it_sync_meta_v1).
 * - After any local change while signed in: debounced push (3s).
 * - If Supabase is not configured or the user is logged out, every function here
 *   is a silent no-op — the app keeps working from localStorage alone.
 *
 * Cloud tables (see supabase-schema.sql):
 *   daily_logs(user_id uuid, log_date text, data jsonb, updated_at timestamptz)
 *   user_deeds(user_id uuid, deeds jsonb, updated_at)
 *   user_settings(user_id uuid, settings jsonb, updated_at)
 */

const SYNC_META_KEY = "it_sync_meta_v1"; // append-only NEW key: { [entity]: ISO timestamp }
const PUSH_DEBOUNCE_MS = 3000;
const UPSERT_CHUNK = 200;

type SyncMeta = Record<string, string>;

function readMeta(): SyncMeta {
  try { return JSON.parse(localStorage.getItem(SYNC_META_KEY) || "{}"); } catch { return {}; }
}

function writeMeta(meta: SyncMeta): void {
  try { localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta)); } catch { /* quota/private mode */ }
}

function stamp(entity: string, iso: string): void {
  const meta = readMeta();
  meta[entity] = iso;
  writeMeta(meta);
}

function stampedTime(entity: string): number {
  const iso = readMeta()[entity];
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? -1 : t;
}

function remoteTime(iso?: string | null): number {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? -1 : t;
}

/* ---------------- status broadcast (UI chips listen via subscribe) ---------------- */

export type SyncStatus = "idle" | "syncing" | "done" | "error";

let lastStatus: SyncStatus = "idle";
let lastError = "";
let lastSyncedAt = "";
const listeners = new Set<(s: SyncStatus) => void>();

export function getSyncStatus() { return { status: lastStatus, error: lastError, at: lastSyncedAt }; }

export function subscribeSync(fn: (s: SyncStatus) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setStatus(s: SyncStatus, err = "") {
  lastStatus = s;
  lastError = err;
  if (s === "done") lastSyncedAt = new Date().toISOString();
  listeners.forEach((fn) => { try { fn(s); } catch { /* listener bug must not break sync */ } });
}

/* ---------------- push / pull ---------------- */

async function pushAll(userId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const now = new Date().toISOString();

  const logs = loadLogs();
  const rows = Object.entries(logs).map(([log_date, data]) => ({
    user_id: userId, log_date, data, updated_at: now,
  }));
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const { error } = await sb.from("daily_logs")
      .upsert(rows.slice(i, i + UPSERT_CHUNK), { onConflict: "user_id,log_date" });
    if (error) { setStatus("error", error.message); return false; }
  }

  const deeds: CustomDeed[] = loadDeeds();
  const { error: eD } = await sb.from("user_deeds")
    .upsert({ user_id: userId, deeds, updated_at: now }, { onConflict: "user_id" });
  if (eD) { setStatus("error", eD.message); return false; }

  const settings: Settings = loadSettings();
  const { error: eS } = await sb.from("user_settings")
    .upsert({ user_id: userId, settings, updated_at: now }, { onConflict: "user_id" });
  if (eS) { setStatus("error", eS.message); return false; }

  rows.forEach((r) => stamp(`log:${r.log_date}`, now));
  stamp("deeds", now);
  stamp("settings", now);
  return true;
}

/** True while merge() is writing remote data into localStorage — suppresses the
 *  change-listener so an inbound pull doesn't schedule its own echo-push. */
let merging = false;

async function pullAndMerge(userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const [{ data: logRows, error: eL }, { data: deedRow, error: eD }, { data: setRow, error: eS }] =
    await Promise.all([
      sb.from("daily_logs").select("log_date,data,updated_at").eq("user_id", userId),
      sb.from("user_deeds").select("deeds,updated_at").eq("user_id", userId).maybeSingle(),
      sb.from("user_settings").select("settings,updated_at").eq("user_id", userId).maybeSingle(),
    ]);
  if (eL || eD || eS) {
    setStatus("error", (eL || eD || eS)?.message || "sync failed");
    return;
  }

  merging = true;
  try {
    // Daily logs: last-write-wins per day-key. Remote wins only when strictly newer
    // than our last local change; unknown/empty local days always take remote data
    // (covers restore-on-new-device).
    const logs = loadLogs();
    let logsChanged = false;
    for (const row of logRows ?? []) {
      const day = row.log_date as string;
      const remote = (row.data ?? {}) as DayLog;
      const rt = remoteTime(row.updated_at);
      const hasLocal = logs[day] && Object.keys(logs[day]).length > 0;
      if (!hasLocal || rt > stampedTime(`log:${day}`)) {
        logs[day] = remote;
        stamp(`log:${day}`, row.updated_at as string);
        logsChanged = true;
      }
    }
    if (logsChanged) saveLogs(logs);

    // Deeds: single blob — remote wins if newer than local stamp or nothing local yet.
    const rdt = remoteTime(deedRow?.updated_at);
    if (deedRow && (rdt > stampedTime("deeds") || loadDeeds().length === 0)) {
      saveDeeds((deedRow.deeds ?? []) as CustomDeed[]);
      stamp("deeds", deedRow.updated_at as string);
    }

    // Settings: same rule; keep DEFAULT_SETTINGS fallback intact via spread inside saveSettings callers.
    const rst = remoteTime(setRow?.updated_at);
    if (setRow && (rst > stampedTime("settings") || !localStorage.getItem("it_settings_v1"))) {
      saveSettings({ ...loadSettings(), ...(setRow.settings as object) });
      stamp("settings", setRow.updated_at as string);
    }
  } finally {
    // Let the current task finish writing before re-arming the push listener.
    setTimeout(() => { merging = false; }, 0);
  }
}

/**
 * Full sync used right after login (and by the manual "এখনই সিঙ্ক করুন" button):
 * push everything local first, then pull+merge anything newer from the cloud.
 */
export async function fullSync(user?: SyncUser | null): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const u = user ?? (await getCurrentUser());
  if (!u) return false;
  setStatus("syncing");
  try {
    const pushedAll = await pushAll(u.id); // stamps local entities with push time
    await pullAndMerge(u.id);              // applies only STRICTLY newer remote rows
    if (pushedAll) { setStatus("done"); return true; }
    return false;
  } catch (e) {
    setStatus("error", e instanceof Error ? e.message : String(e));
    return false;
  }
}

/* ---------------- debounced push after local edits ---------------- */

let timer: ReturnType<typeof setTimeout> | null = null;

/** Call after any local data change; pushes 3s later when signed in. */
export function schedulePush(delayMs = PUSH_DEBOUNCE_MS): void {
  if (!getSupabase()) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void getCurrentUser().then((u) => (u ? pushAll(u.id) : undefined));
  }, delayMs);
}

/* ---------------- wiring (idempotent, call once from a mounted component) ---------------- */

let wired = false;
let lastFullSyncAt = 0;

export function initSync(): void {
  const sb = getSupabase();
  if (wired || typeof window === "undefined") return;
  wired = true;

  // Local edits (saveLogs/saveSettings/saveDeeds dispatch this) → debounced push.
  window.addEventListener("it:data-updated", () => {
    if (!merging) schedulePush();
  });

  if (!sb) return;
  sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") return; // local data stays on the phone
    if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
      // INITIAL_SESSION fires on every cold start with a stored session — throttle.
      if (Date.now() - lastFullSyncAt < 60_000) return;
      lastFullSyncAt = Date.now();
      void fullSync(session.user);
    }
  });
}
