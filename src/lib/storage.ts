import type { MethodId } from "./prayers";
import type { ZikrPreset } from "./data";

export interface DayLog {
  fajr?: boolean; dhuhr?: boolean; asr?: boolean; maghrib?: boolean; isha?: boolean;
  tahajjud?: boolean; quranPages?: number;
  zikrCounts?: Record<string, number>;
  duasRead?: string[];
  deedsDone?: string[];
}

/** User-defined good deed with its own point value ("নিজের আমল"). */
export interface CustomDeed { id: string; bn: string; pts: number }

export type Logs = Record<string, DayLog>;

export interface Settings {
  city: string; lat: number; lng: number; method: MethodId; notify: boolean;
}

const LOGS_KEY = "it_logs_v1";
const SETTINGS_KEY = "it_settings_v1";
const DEEDS_KEY = "it_deeds_v1";
const ZIKR_CUSTOM_KEY = "it_zikr_custom_v1";

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

export function shiftDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return dateKey(dt);
}

export function loadLogs(): Logs {
  try { return JSON.parse(localStorage.getItem(LOGS_KEY) || "{}"); } catch { return {}; }
}

/** Fired after any synced dataset changes in localStorage; cloud sync listens
 *  for this event to schedule a debounced push (see src/lib/sync.ts). */
function notifyDataChanged(source: string): void {
  try { window.dispatchEvent(new CustomEvent("it:data-updated", { detail: source })); } catch { /* non-browser */ }
}

export function saveLogs(l: Logs): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(l));
  notifyDataChanged(LOGS_KEY);
}

export function getDay(key: string): DayLog {
  return loadLogs()[key] || {};
}

export function updateDay(key: string, fn: (d: DayLog) => DayLog): void {
  const l = loadLogs();
  l[key] = fn(l[key] || {});
  saveLogs(l);
}

export const DEFAULT_SETTINGS: Settings = {
  city: "ঢাকা", lat: 23.8103, lng: 90.4125, method: "Karachi", notify: false,
};

export function loadSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch { return DEFAULT_SETTINGS; }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  notifyDataChanged(SETTINGS_KEY);
}

export function loadDeeds(): CustomDeed[] {
  try { return JSON.parse(localStorage.getItem(DEEDS_KEY) || "[]"); } catch { return []; }
}

export function saveDeeds(d: CustomDeed[]): void {
  localStorage.setItem(DEEDS_KEY, JSON.stringify(d));
  notifyDataChanged(DEEDS_KEY);
}

export function loadCustomZikr(): ZikrPreset[] {
  try { return JSON.parse(localStorage.getItem(ZIKR_CUSTOM_KEY) || "[]"); } catch { return []; }
}

export function saveCustomZikr(z: ZikrPreset[]): void {
  localStorage.setItem(ZIKR_CUSTOM_KEY, JSON.stringify(z));
}

/* ---------- Quran goal & resume prefs (append-only v1 key) ---------- */

export interface QuranPrefs {
  goalPagesPerDay?: number;
  lastSurah?: number;
  lastAyah?: number;
}

const QURAN_PREFS_KEY = "it_quran_prefs_v1";

/** NOT part of BACKUP_KEYS on purpose: importData rejects backups missing any
 *  BACKUP_KEYS entry, so adding this key would break restoring every existing
 *  backup file. Prefs are optional user preferences, not essential data. */
export function loadQuranPrefs(): QuranPrefs {
  try { return JSON.parse(localStorage.getItem(QURAN_PREFS_KEY) || "{}"); } catch { return {}; }
}

export function saveQuranPrefs(p: QuranPrefs): void {
  try { localStorage.setItem(QURAN_PREFS_KEY, JSON.stringify(p)); } catch { /* quota/private mode */ }
}

/* ---------- Zikr prefs (append-only v1 key) ---------- */

export interface ZikrPrefs {
  selId?: string;
  target?: number;
}

const ZIKR_PREFS_KEY = "it_zikr_prefs_v1";

/** NOT part of BACKUP_KEYS on purpose — same reason as QuranPrefs above:
 *  prefs are optional user preferences, not essential data. */
export function loadZikrPrefs(): ZikrPrefs {
  try { return JSON.parse(localStorage.getItem(ZIKR_PREFS_KEY) || "{}"); } catch { return {}; }
}

export function saveZikrPrefs(p: ZikrPrefs): void {
  try { localStorage.setItem(ZIKR_PREFS_KEY, JSON.stringify(p)); } catch { /* quota/private mode */ }
}

/* ---------- Leaderboard state (append-only v1 schema) ---------- */

export interface LeaderboardState { optedIn: boolean; groups: string[] }

export const DEFAULT_LEADERBOARD: LeaderboardState = { optedIn: false, groups: [] };

const LEADERBOARD_KEY = "it_leaderboard_v1";

export function loadLeaderboard(): LeaderboardState {
  try {
    return { ...DEFAULT_LEADERBOARD, ...JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "{}") };
  } catch { return DEFAULT_LEADERBOARD; }
}

export function saveLeaderboard(s: LeaderboardState): void {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(s));
}

/* ---------- Backup / restore (append-only v1 schema) ---------- */

export const BACKUP_KEYS = [LOGS_KEY, SETTINGS_KEY, DEEDS_KEY, ZIKR_CUSTOM_KEY] as const;

/** Raw localStorage values of the 4 backup keys (null when never saved). */
export function exportData(): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const k of BACKUP_KEYS) out[k] = localStorage.getItem(k);
  return out;
}

/** Validate all 4 backup keys are present in obj with string|null values
 *  (each non-null value must JSON.parse). Writes only after EVERY key passes
 *  validation — returns false without touching localStorage otherwise. */
export function importData(obj: Record<string, unknown>): boolean {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  for (const k of BACKUP_KEYS) {
    const v = obj[k];
    if (!(k in obj) || (v !== null && typeof v !== "string")) return false;
    if (typeof v === "string") {
      try { JSON.parse(v); } catch { return false; }
    }
  }
  for (const k of BACKUP_KEYS) {
    const v = obj[k];
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v as string);
  }
  return true;
}
