# ইবাদাত ট্র্যাকার · Ibadah Tracker

Mobile-first Islamic ibadah tracking PWA. Namaz, Zikr, Dua, Quran, Ilm + private points/streak.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 on your phone browser (same WiFi) or desktop.

## Stack
- Next.js 14 App Router + Tailwind + TypeScript
- 100% client-side: data in localStorage (v1). Backend-ready via `src/lib/storage.ts`.

## Roadmap
- Phase 2: accounts + sync, weekly/monthly review reports, group leaderboards (opt-in)
- Phase 3: Fajr Rescue (auto voice call + buddy call network), madrasa dashboard

## Features v1
- Prayer times (adhan.js, Dhaka default, 4 calculation methods)
- 5 fard salah + tahajjud tracker, Quran pages log
- Zikr counter (haptic), Dua library (20, BN+Arabic+source), Ilm (Kalima, Ayatul Kursi, 4 Quls, 10 hadith)
- Weekly/monthly stats, points & streak (private by design)
- Local prayer notifications (while app open), dark mode, PWA install
