-- 001_schema.sql — ApplyGuard PH cloud schema.
-- Run: npx supabase db push (or via Supabase dashboard SQL editor).
-- Tables: profiles, jobs, entitlements, payments, ai_usage.
-- RLS: users own their rows; entitlements are read-only for users
-- (only the webhook with service_role writes them).

-- Extensions (enable in Supabase dashboard if not already on)
create extension if not exists "uuid-ossp";

------------------------------------------------------------
-- profiles — 1:1 with auth.users, provisioned by trigger
------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users_select_own_profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users_update_own_profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

------------------------------------------------------------
-- jobs — cloud mirror of localStorage tracker jobs
------------------------------------------------------------
create table if not exists public.jobs (
  id          text not null,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null default '',
  raw_text    text not null default '',
  intake      jsonb not null default '{}'::jsonb,
  score       integer,
  breakdown   jsonb,
  verdict     text,
  risk_level  text,
  missing_info jsonb,
  flags       jsonb,
  status      text not null default 'Saved',
  follow_up_by text not null default '',
  notes       text not null default '',
  created_at  timestamptz not null,
  updated_at  timestamptz not null,
  primary key (id, user_id)
);

alter table public.jobs enable row level security;

create policy "users_select_own_jobs"
  on public.jobs for select
  using (auth.uid() = user_id);

create policy "users_insert_own_jobs"
  on public.jobs for insert
  with check (auth.uid() = user_id);

create policy "users_update_own_jobs"
  on public.jobs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_delete_own_jobs"
  on public.jobs for delete
  using (auth.uid() = user_id);

------------------------------------------------------------
-- entitlements — 1:1 with profiles, read-only for users
------------------------------------------------------------
create table if not exists public.entitlements (
  user_id                 uuid primary key references public.profiles(id) on delete cascade,
  tier                    text not null default 'free' check (tier in ('free', 'premium')),
  status                  text not null default 'inactive' check (status in ('inactive', 'active', 'past_due', 'cancelled', 'expired')),
  current_period_end      date,
  provider_subscription_id text,
  provider_payment_id     text,
  plan_id                 text,
  has_message_pack        boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.entitlements enable row level security;

-- Users can read their own entitlement but CANNOT write it.
-- Only the webhook (service_role) writes entitlements.
create policy "users_select_own_entitlement"
  on public.entitlements for select
  using (auth.uid() = user_id);

------------------------------------------------------------
-- payments — audit log of all payment events
------------------------------------------------------------
create table if not exists public.payments (
  id                  text primary key,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  provider_event      text not null,
  provider_event_type text not null,
  amount              integer,           -- in centavos
  currency            text default 'PHP',
  status              text,
  plan_id             text,
  raw                 jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "users_select_own_payments"
  on public.payments for select
  using (auth.uid() = user_id);

------------------------------------------------------------
-- ai_usage — one row per AI invocation, metered monthly
------------------------------------------------------------
create table if not exists public.ai_usage (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  feature     text not null,
  tokens_in   integer not null default 0,
  tokens_out  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.ai_usage enable row level security;

create policy "users_select_own_usage"
  on public.ai_usage for select
  using (auth.uid() = user_id);

------------------------------------------------------------
-- Trigger: provision profiles + entitlements on first sign-up
------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.entitlements (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
