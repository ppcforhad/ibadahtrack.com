-- ============================================================
--  ইবাদত ট্র্যাকার — Supabase ক্লাউড সিঙ্ক স্কিমা
--
--  কীভাবে চালাবেন:
--    ১) https://supabase.com/dashboard → আপনার প্রজেক্ট (ueqqgjvsuotifgucsvdk)
--    ২) বাম মেনু থেকে "SQL Editor" খুলুন → "New query"
--    ৩) নিচের পুরো SQL টি পেস্ট করে "Run" চাপুন
--
--  এটি ৩টি টেবিল তৈরি করবে এবং RLS (Row Level Security) চালু করবে,
--  যাতে প্রত্যেক ইউজার শুধু নিজের ডেটা পড়তে/লিখতে পারে।
-- ============================================================

-- ---------- daily_logs: প্রতিদিনের আমলের রেকর্ড (এক দিন = এক row) ----------
create table if not exists public.daily_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date text not null,                       -- 'YYYY-MM-DD'
  data jsonb not null default '{}'::jsonb,      -- DayLog object (namaz ticks, quranPages…)
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

-- ---------- user_deeds: ইউজারের নিজের আমল তালিকা ----------
create table if not exists public.user_deeds (
  user_id uuid not null primary key references auth.users(id) on delete cascade,
  deeds jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- user_settings: শহর, নামাজের পদ্ধতি ইত্যাদি ----------
create table if not exists public.user_settings (
  user_id uuid not null primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.daily_logs enable row level security;
alter table public.user_deeds enable row level security;
alter table public.user_settings enable row level security;

-- ---------- RLS policies: auth.uid() = user_id for ALL operations ----------

drop policy if exists "daily_logs_owner_all" on public.daily_logs;
create policy "daily_logs_owner_all" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_deeds_owner_all" on public.user_deeds;
create policy "user_deeds_owner_all" on public.user_deeds
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_settings_owner_all" on public.user_settings;
create policy "user_settings_owner_all" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- auto-update updated_at on every write ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_daily_logs_touch on public.daily_logs;
create trigger trg_daily_logs_touch before update on public.daily_logs
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_user_deeds_touch on public.user_deeds;
create trigger trg_user_deeds_touch before update on public.user_deeds
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_user_settings_touch on public.user_settings;
create trigger trg_user_settings_touch before update on public.user_settings
  for each row execute function public.touch_updated_at();
