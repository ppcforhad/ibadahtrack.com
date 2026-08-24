/**
 * Full Quran text fetcher — Arabic Uthmani, all 114 surahs.
 * Primary: api.alquran.cloud (keyless). Fallback: jsdelivr mirror of
 * fawazahmed0/quran-api (edition ara-quranuthmanihaf).
 * Two cache layers: in-memory Map (instant repeat visits) +
 * localStorage it_quran_text_v1 (offline after first read).
 */

import { surahName } from "./surahs";

export type Ayah = { n: number; text: string };
export type SurahText = { name: string; ayahs: Ayah[] };

const LS_KEY = "it_quran_text_v1";
const PRIMARY_URL = (n: number) =>
  `https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`;
const FALLBACK_URL = (n: number) =>
  `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmanihaf/${n}.json`;

const memCache = new Map<number, SurahText>();

/** Strip BOM / zero-width chars that pollute some API responses. */
function cleanText(t: string): string {
  return t.replace(/[\uFEFF\u200B\u200C\u200D]/g, "").trim();
}

type LSCacheEntry = { ayahs: Ayah[]; ts: number };

function readLSCache(): Record<string, LSCacheEntry> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLS(n: number, entry: LSCacheEntry): void {
  try {
    const all = readLSCache();
    all[String(n)] = entry;
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    /* storage full/unavailable — memory cache still works */
  }
}

function cachedSurah(n: number): SurahText | null {
  if (memCache.has(n)) return memCache.get(n)!;
  const hit = readLSCache()[String(n)];
  if (hit && Array.isArray(hit.ayahs) && hit.ayahs.length > 0) {
    const s: SurahText = { name: surahName(n), ayahs: hit.ayahs };
    memCache.set(n, s);
    return s;
  }
  return null;
}

async function tryPrimary(n: number): Promise<SurahText> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(PRIMARY_URL(n), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`primary ${res.status}`);
    const json = await res.json();
    const data = json?.data;
    const list = data?.ayahs;
    if (!Array.isArray(list) || list.length === 0) throw new Error("primary bad shape");
    const ayahs: Ayah[] = list.map(
      (a: { numberInSurah?: number; text?: string }, i: number) => ({
        n: typeof a.numberInSurah === "number" ? a.numberInSurah : i + 1,
        text: cleanText(String(a.text ?? "")),
      })
    );
    return { name: surahName(n), ayahs };
  } finally {
    clearTimeout(timer);
  }
}

async function tryFallback(n: number): Promise<SurahText> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(FALLBACK_URL(n), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`fallback ${res.status}`);
    const json = await res.json();
    // Observed shape: {"chapter":[{chapter,verse,text}]}; also accept spec shape.
    const list: unknown[] = Array.isArray(json?.chapter)
      ? json.chapter
      : Array.isArray(json?.verses)
        ? json.verses
        : [];
    if (list.length === 0) throw new Error("fallback bad shape");
    const ayahs: Ayah[] = list.map((raw, i) => {
      const v = raw as { verse?: number; text?: string };
      return { n: typeof v.verse === "number" ? v.verse : i + 1, text: cleanText(String(v.text ?? "")) };
    });
    return { name: surahName(n), ayahs };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch one full surah (Arabic Uthmani). Order: memory → localStorage →
 * primary API → fallback API. Throws on total failure so callers can show retry.
 */
export async function fetchSurah(n: number): Promise<SurahText> {
  const hit = cachedSurah(n);
  if (hit) return hit;

  let lastErr: unknown;
  for (const attempt of [tryPrimary, tryFallback]) {
    try {
      const s = await attempt(n);
      memCache.set(n, s);
      writeLS(n, { ayahs: s.ayahs, ts: Date.now() });
      return s;
    } catch (e) {
      lastErr = e;
    }
  }
  // Last resort: stale cache if anything exists despite validation above.
  const stale = readLSCache()[String(n)];
  if (stale && Array.isArray(stale.ayahs) && stale.ayahs.length > 0) {
    return { name: surahName(n), ayahs: stale.ayahs };
  }
  throw lastErr instanceof Error ? lastErr : new Error("কুরআন লোড করা যায়নি");
}
