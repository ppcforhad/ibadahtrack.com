# 📧 Supabase Email Templates — ibadahtrack.com

Setup guide (Bangla) — একবারই করতে হবে।

## ১) Redirect URLs ঠিক করুন (Vercel focus)

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL:**
  ```
  https://ibadahtrackcom.vercel.app
  ```
- **Redirect URLs** — Add করুন:
  ```
  https://ibadahtrackcom.vercel.app/**
  http://localhost:3000/**
  ```

⚠️ এটা না করলে ভেরিফিকেশন লিংক localhost-এ চলে যাবে।

## ২) Confirm Signup ইমেইল (Subject + Body)

Dashboard → **Authentication → Emails → Templates → Confirm signup**:

**Subject:**
```
ইবাদত ট্র্যাকার — ইমেইল ভেরিফাই করুন (ibadahtrack.com)
```

**Body:** `confirm-signup.html` ফাইলের পুরো কোড কপি করে পেস্ট করুন।

## ৩) Magic Link ইমেইল

একই পেজে **Magic Link** template:

**Subject:**
```
ইবাদত ট্র্যাকার — আপনার লগইন লিংক (ibadahtrack.com)
```

**Body:** `magic-link.html` ফাইলের কোড পেস্ট করুন।

## ৪) Reset Password (পরে লাগলে)

**Subject:**
```
ইবাদত ট্র্যাকার — পাসওয়ার্ড রিসেট করুন (ibadahtrack.com)
```

## ✅ কেন এই ব্র্যান্ডিং?

- Subject-এ **"ইবাদত ট্র্যাকার"** থাকায় user সহজে চিনতে পারবে
- **ibadahtrack.com** দেখে trust তৈরি হবে (spam মনে করবে না)
- Email header-এ app logo + emerald branding — professional look
