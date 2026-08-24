# Vercel Environment Variables — Supabase Auth & Cloud Sync

The app now supports optional login (Google + magic link) with offline-first cloud sync via Supabase.
It works 100% without these variables (localStorage only), but to enable sync on the live site,
add the two variables below in the **Vercel dashboard**:

> Project → Settings → Environment Variables (add for Production, Preview, and Development)

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ueqqgjvsuotifgucsvdk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_IdJ5o7aa0seFQz9_zPm8TQ_0CjD2tP3` |

Notes:
- The publishable key is safe for client-side use — all table access is protected by Row Level Security (`supabase-schema.sql`). Run that SQL once in Supabase Dashboard → SQL Editor.
- In Supabase Dashboard → Authentication → Providers: enable **Google** and **Email (magic link)**.
- For Google OAuth redirect on the live site, add `https://ibadahtrackcom.vercel.app/**` (and your final production domain) to Supabase → Authentication → URL Configuration → Redirect URLs. Set the Site URL there too.
- After saving env vars in Vercel, trigger a redeploy (Deployments → ⋯ → Redeploy) so they take effect.
