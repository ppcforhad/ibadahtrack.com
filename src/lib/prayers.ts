import { Coordinates, CalculationMethod, PrayerTimes, CalculationParameters } from "adhan";

export type MethodId = "Karachi" | "MWL" | "Egypt" | "ISNA";

export const CITIES = [
  { name: "ঢাকা", lat: 23.8103, lng: 90.4125 },
  { name: "চট্টগ্রাম", lat: 22.3569, lng: 91.7832 },
  { name: "সিলেট", lat: 24.8949, lng: 91.8687 },
  { name: "খুলনা", lat: 22.8456, lng: 89.5403 },
  { name: "রাজশাহী", lat: 24.3745, lng: 88.6042 },
];

export const METHODS: { id: MethodId; label: string }[] = [
  { id: "Karachi", label: "University of Karachi" },
  { id: "MWL", label: "Muslim World League" },
  { id: "Egypt", label: "Egyptian General Authority" },
  { id: "ISNA", label: "ISNA (North America)" },
];

function paramsOf(method: MethodId): CalculationParameters {
  switch (method) {
    case "MWL": return CalculationMethod.MuslimWorldLeague();
    case "Egypt": return CalculationMethod.Egyptian();
    case "ISNA": return CalculationMethod.NorthAmerica();
    default: return CalculationMethod.Karachi();
  }
}

export function timesFor(lat: number, lng: number, date: Date, method: MethodId): PrayerTimes {
  return new PrayerTimes(new Coordinates(lat, lng), date, paramsOf(method));
}

export const PRAYER_BN: Record<string, string> = {
  fajr: "ফজর", sunrise: "সূর্যোদয়", dhuhr: "যোহর", asr: "আসর", maghrib: "মগরিব", isha: "ইশা",
};

const ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const SCHEDULE_ORDER = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;

export type ScheduleEntry = { name: string; time: Date };

/** All of today's prayer times (+ sunrise) in display order. */
export function todayTimes(lat: number, lng: number, method: MethodId, now: Date = new Date()): ScheduleEntry[] {
  const t = timesFor(lat, lng, now, method);
  return SCHEDULE_ORDER.map((k) => ({ name: k, time: t[k] }));
}

export function nextPrayer(lat: number, lng: number, method: MethodId, now: Date = new Date()): { name: string; time: Date } {
  const t = timesFor(lat, lng, now, method);
  for (const k of ORDER) {
    if (t[k].getTime() > now.getTime()) return { name: k, time: t[k] };
  }
  const tm = new Date(now);
  tm.setDate(tm.getDate() + 1);
  return { name: "fajr", time: timesFor(lat, lng, tm, method).fajr };
}
