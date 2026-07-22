-- 004_atomic_budget_and_quota_ledger.sql — Atomic budget accounting, strict quota enforcement, & stale reservation cleanup.

------------------------------------------------------------
-- 1. Unique constraint on ai_usage_ledger request_id & reserved_cost column
------------------------------------------------------------
alter table public.ai_usage_ledger 
  add column if not exists reserved_cost_usd numeric(10, 6) not null default 0.000000;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ai_usage_ledger_request_id_key'
  ) then
    alter table public.ai_usage_ledger add constraint ai_usage_ledger_request_id_key unique (request_id);
  end if;
end $$;

------------------------------------------------------------
-- 2. Create daily_ai_budget table for atomic daily cost tracking
------------------------------------------------------------
create table if not exists public.daily_ai_budget (
  budget_date    date primary key,
  reserved_usd   numeric(10, 6) not null default 0.000000 check (reserved_usd >= 0),
  settled_usd    numeric(10, 6) not null default 0.000000 check (settled_usd >= 0),
  updated_at     timestamptz not null default now()
);

alter table public.daily_ai_budget enable row level security;
revoke all on public.daily_ai_budget from public, anon, authenticated;

------------------------------------------------------------
-- 3. Function to release stale reservations older than 5 minutes
------------------------------------------------------------
create or replace function public.release_stale_ai_reservations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rec record;
  v_count integer := 0;
  v_budget_date date;
begin
  for v_rec in
    select id, request_id, created_at, reserved_cost_usd
    from public.ai_usage_ledger
    where status = 'reserved'
      and created_at < (now() - interval '5 minutes')
    for update skip locked
  loop
    update public.ai_usage_ledger
      set status = 'failed',
          completed_at = now()
      where id = v_rec.id;

    v_budget_date := (v_rec.created_at at time zone 'UTC')::date;

    update public.daily_ai_budget
      set reserved_usd = greatest(0.000000, reserved_usd - v_rec.reserved_cost_usd),
          updated_at = now()
      where budget_date = v_budget_date;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.release_stale_ai_reservations() from public, anon, authenticated;
grant execute on function public.release_stale_ai_reservations() to service_role;

------------------------------------------------------------
-- 4. Atomic RPC: reserve_ai_feature_usage (v2 with atomic budget & strict limits)
------------------------------------------------------------
create or replace function public.reserve_ai_feature_usage(
  p_user_id uuid,
  p_feature text,
  p_request_id text
)
returns table (
  ledger_id uuid,
  entitlement_type text,
  remaining_allowance integer,
  trial_status text,
  trial_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ent record;
  v_ent_type text;
  v_max_allowance integer;
  v_used_count integer;
  v_remaining integer;
  v_ledger_id uuid;
  v_reserved_cost numeric(10, 6);
  v_today date;
  v_budget record;
  v_existing record;
begin
  -- 0. Clean stale reservations first
  perform public.release_stale_ai_reservations();

  -- 1. Idempotency check: if request_id already exists, return existing record
  select id, entitlement_type, status into v_existing
    from public.ai_usage_ledger
    where request_id = p_request_id;

  if found then
    select * into v_ent from public.entitlements where user_id = p_user_id;
    return query select v_existing.id, v_existing.entitlement_type, 0, coalesce(v_ent.trial_status, 'eligible'), v_ent.trial_expires_at;
    return;
  end if;

  -- 2. Determine conservative maximum reserved cost based on feature limits
  case p_feature
    when 'message'          then v_reserved_cost := 0.013000;
    when 'deepscan'         then v_reserved_cost := 0.021000;
    when 'resume'           then v_reserved_cost := 0.038000;
    when 'interview'        then v_reserved_cost := 0.025000;
    when 'interview_voice'  then v_reserved_cost := 0.021500;
    when 'backgroundcheck'  then v_reserved_cost := 0.020000;
    else raise exception using errcode = '22023', message = 'invalid_feature';
  end case;

  -- 3. Atomic daily budget serialization and check
  v_today := (now() at time zone 'UTC')::date;

  insert into public.daily_ai_budget (budget_date, reserved_usd, settled_usd, updated_at)
    values (v_today, 0.000000, 0.000000, now())
    on conflict (budget_date) do nothing;

  select * into v_budget
    from public.daily_ai_budget
    where budget_date = v_today
    for update;

  if (v_budget.reserved_usd + v_budget.settled_usd + v_reserved_cost) > 10.000000 then
    raise exception using errcode = '22023', message = 'daily_budget_reached';
  end if;

  -- 4. Check user entitlement with row locking
  select * into v_ent
    from public.entitlements
    where user_id = p_user_id
    for update;

  if not found then
    insert into public.entitlements (user_id) values (p_user_id);
    select * into v_ent from public.entitlements where user_id = p_user_id for update;
  end if;

  -- 5. Paid vs Trial quota checks
  if v_ent.tier = 'premium' 
     and v_ent.status = 'active' 
     and v_ent.current_period_end is not null 
     and v_ent.current_period_end >= current_date then
    v_ent_type := 'paid';

    select count(*) into v_used_count
      from public.ai_usage_ledger
      where user_id = p_user_id
        and entitlement_type = 'paid'
        and status in ('reserved', 'completed')
        and created_at >= date_trunc('month', now() at time zone 'UTC');

    if v_used_count >= 60 then
      raise exception using errcode = '22023', message = 'monthly_cap_reached';
    end if;

    v_remaining := 60 - v_used_count - 1;
  else
    v_ent_type := 'trial';

    if v_ent.trial_status = 'active' and v_ent.trial_expires_at is not null and now() > v_ent.trial_expires_at then
      update public.entitlements
        set trial_status = 'expired', updated_at = now()
        where user_id = p_user_id;
      v_ent.trial_status := 'expired';
    end if;

    if v_ent.trial_status = 'eligible' then
      update public.entitlements
        set trial_status = 'active',
            trial_started_at = now(),
            trial_expires_at = now() + interval '7 days',
            updated_at = now()
        where user_id = p_user_id
        returning * into v_ent;
    end if;

    if v_ent.trial_status <> 'active' then
      raise exception using errcode = '22023', message = 'trial_' || v_ent.trial_status;
    end if;

    case p_feature
      when 'message'          then v_max_allowance := 5;
      when 'deepscan'         then v_max_allowance := 3;
      when 'resume'           then v_max_allowance := 2;
      when 'interview'        then v_max_allowance := 1;
      when 'interview_voice'  then v_max_allowance := 1;
      when 'backgroundcheck'  then v_max_allowance := 2;
    end case;

    select count(*) into v_used_count
      from public.ai_usage_ledger
      where user_id = p_user_id
        and feature = p_feature
        and entitlement_type = 'trial'
        and status in ('reserved', 'completed');

    if v_used_count >= v_max_allowance then
      raise exception using errcode = '22023', message = 'feature_quota_reached';
    end if;

    v_remaining := v_max_allowance - v_used_count - 1;
  end if;

  -- 6. Reserve budget & ledger entry
  update public.daily_ai_budget
    set reserved_usd = reserved_usd + v_reserved_cost,
        updated_at = now()
    where budget_date = v_today;

  insert into public.ai_usage_ledger (
    request_id, user_id, entitlement_type, feature, status, reserved_cost_usd
  ) values (
    p_request_id, p_user_id, v_ent_type, p_feature, 'reserved', v_reserved_cost
  )
  returning id into v_ledger_id;

  return query select v_ledger_id, v_ent_type, v_remaining, v_ent.trial_status, v_ent.trial_expires_at;
end;
$$;

revoke all on function public.reserve_ai_feature_usage(uuid, text, text) from public, anon, authenticated;
grant execute on function public.reserve_ai_feature_usage(uuid, text, text) to service_role;

------------------------------------------------------------
-- 5. Atomic RPC: settle_ai_feature_usage (v2 with budget settlement)
------------------------------------------------------------
create or replace function public.settle_ai_feature_usage(
  p_request_id text,
  p_status text,
  p_input_tokens integer default 0,
  p_output_tokens integer default 0,
  p_cache_read_tokens integer default 0,
  p_cache_create_tokens integer default 0,
  p_cost_usd numeric default 0.000000
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ledger record;
  v_budget_date date;
  v_actual_cost numeric(10, 6);
begin
  if p_status not in ('completed', 'failed', 'released') then
    raise exception using errcode = '22023', message = 'invalid_settlement_status';
  end if;

  select * into v_ledger
    from public.ai_usage_ledger
    where request_id = p_request_id
    for update;

  if not found or v_ledger.status in ('completed', 'failed', 'released') then
    return false;
  end if;

  v_actual_cost := greatest(0.000000, p_cost_usd);

  update public.ai_usage_ledger
    set status = p_status,
        input_tokens = greatest(0, p_input_tokens),
        output_tokens = greatest(0, p_output_tokens),
        cache_read_tokens = greatest(0, p_cache_read_tokens),
        cache_creation_tokens = greatest(0, p_cache_create_tokens),
        estimated_cost_usd = v_actual_cost,
        completed_at = now()
    where request_id = p_request_id;

  v_budget_date := (v_ledger.created_at at time zone 'UTC')::date;

  update public.daily_ai_budget
    set reserved_usd = greatest(0.000000, reserved_usd - v_ledger.reserved_cost_usd),
        settled_usd = settled_usd + (case when p_status = 'completed' then v_actual_cost else 0.000000 end),
        updated_at = now()
    where budget_date = v_budget_date;

  return true;
end;
$$;

revoke all on function public.settle_ai_feature_usage(text, text, integer, integer, integer, integer, numeric) from public, anon, authenticated;
grant execute on function public.settle_ai_feature_usage(text, text, integer, integer, integer, integer, numeric) to service_role;
