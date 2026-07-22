-- 003_trial_and_usage_ledger.sql — ApplyGuard PH trial lifecycle, usage ledger, & abuse controls.

------------------------------------------------------------
-- 1. Extend entitlements table with trial lifecycle fields
------------------------------------------------------------
alter table public.entitlements
  add column if not exists trial_eligible boolean not null default true,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_expires_at timestamptz,
  add column if not exists trial_consumed_at timestamptz,
  add column if not exists trial_status text not null default 'eligible'
    check (trial_status in ('eligible', 'active', 'exhausted', 'expired', 'converted', 'ineligible'));

------------------------------------------------------------
-- 2. Create detailed ai_usage_ledger table
------------------------------------------------------------
create table if not exists public.ai_usage_ledger (
  id                    uuid primary key default uuid_generate_v4(),
  request_id            text not null,
  user_id               uuid not null references public.profiles(id) on delete cascade,
  entitlement_type      text not null check (entitlement_type in ('paid', 'trial')),
  feature               text not null,
  model                 text not null default 'claude-haiku-4-5-20251001',
  status                text not null default 'reserved' check (status in ('reserved', 'completed', 'released', 'failed')),
  input_tokens          integer not null default 0,
  output_tokens         integer not null default 0,
  cache_creation_tokens integer not null default 0,
  cache_read_tokens     integer not null default 0,
  estimated_cost_usd    numeric(10, 6) not null default 0.000000,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);

alter table public.ai_usage_ledger enable row level security;

create policy "users_select_own_usage_ledger"
  on public.ai_usage_ledger for select
  using (auth.uid() = user_id);

------------------------------------------------------------
-- 3. Atomic RPC: reserve_ai_feature_usage
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
begin
  select * into v_ent
    from public.entitlements
    where user_id = p_user_id
    for update;

  if not found then
    insert into public.entitlements (user_id) values (p_user_id);
    select * into v_ent from public.entitlements where user_id = p_user_id for update;
  end if;

  -- 1. Check paid access precedence
  if v_ent.tier = 'premium' and v_ent.status = 'active' and coalesce(v_ent.current_period_end, current_date) >= current_date then
    v_ent_type := 'paid';
    v_remaining := 9999;
  else
    v_ent_type := 'trial';

    -- 2. Handle trial expiration
    if v_ent.trial_status = 'active' and v_ent.trial_expires_at is not null and now() > v_ent.trial_expires_at then
      update public.entitlements
        set trial_status = 'expired', updated_at = now()
        where user_id = p_user_id;
      v_ent.trial_status := 'expired';
    end if;

    -- 3. Auto-start trial on first eligible feature call
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

    -- 4. Check feature limits during trial
    case p_feature
      when 'deep_scan' then v_max_allowance := 3;
      when 'resume' then v_max_allowance := 2;
      when 'resume_tailor' then v_max_allowance := 2;
      when 'outreach' then v_max_allowance := 5;
      when 'interview_voice' then v_max_allowance := 1;
      when 'mock_interview' then v_max_allowance := 1;
      when 'backgroundcheck' then v_max_allowance := 2;
      else v_max_allowance := 3;
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

  -- 5. Reserve usage entry
  insert into public.ai_usage_ledger (
    request_id, user_id, entitlement_type, feature, status
  ) values (
    p_request_id, p_user_id, v_ent_type, p_feature, 'reserved'
  )
  returning id into v_ledger_id;

  return query select v_ledger_id, v_ent_type, v_remaining, v_ent.trial_status, v_ent.trial_expires_at;
end;
$$;

revoke all on function public.reserve_ai_feature_usage(uuid, text, text) from public, anon, authenticated;
grant execute on function public.reserve_ai_feature_usage(uuid, text, text) to service_role;

------------------------------------------------------------
-- 4. Atomic RPC: settle_ai_feature_usage
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
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ledger record;
begin
  select * into v_ledger
    from public.ai_usage_ledger
    where request_id = p_request_id
    for update;

  if not found then
    return;
  end if;

  update public.ai_usage_ledger
    set status = p_status,
        input_tokens = greatest(0, p_input_tokens),
        output_tokens = greatest(0, p_output_tokens),
        cache_read_tokens = greatest(0, p_cache_read_tokens),
        cache_creation_tokens = greatest(0, p_cache_create_tokens),
        estimated_cost_usd = greatest(0.000000, p_cost_usd),
        completed_at = now()
    where request_id = p_request_id;
end;
$$;

revoke all on function public.settle_ai_feature_usage(text, text, integer, integer, integer, integer, numeric) from public, anon, authenticated;
grant execute on function public.settle_ai_feature_usage(text, text, integer, integer, integer, integer, numeric) to service_role;

------------------------------------------------------------
-- 5. Update PayPal fulfillment to mark trial converted
------------------------------------------------------------
create or replace function public.fulfill_paypal_capture(
  p_capture_id text,
  p_order_id text,
  p_user_id uuid,
  p_plan_id text,
  p_amount integer,
  p_currency text,
  p_capture_status text,
  p_raw jsonb default '{}'::jsonb
)
returns public.entitlements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected_amount integer;
  v_days integer;
  v_inserted integer;
  v_existing_payment public.payments%rowtype;
  v_entitlement public.entitlements%rowtype;
begin
  case p_plan_id
    when 'monthly' then v_expected_amount := 29900; v_days := 30;
    when 'yearly' then v_expected_amount := 299000; v_days := 365;
    when 'pack' then v_expected_amount := 14900; v_days := 0;
    else raise exception using errcode = '22023', message = 'invalid_plan';
  end case;

  if p_capture_status <> 'COMPLETED' then
    raise exception using errcode = '22023', message = 'capture_not_completed';
  end if;
  if p_currency <> 'PHP' or p_amount <> v_expected_amount then
    raise exception using errcode = '22023', message = 'capture_total_mismatch';
  end if;

  insert into public.payments (
    id, user_id, provider_event, provider_event_type, amount,
    currency, status, plan_id, raw
  ) values (
    p_capture_id, p_user_id, p_order_id, 'paypal.capture.completed', p_amount,
    p_currency, p_capture_status, p_plan_id, coalesce(p_raw, '{}'::jsonb)
  )
  on conflict (id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    select * into v_existing_payment
      from public.payments
      where id = p_capture_id;

    if v_existing_payment.user_id <> p_user_id
      or v_existing_payment.plan_id is distinct from p_plan_id
      or v_existing_payment.amount is distinct from p_amount
      or v_existing_payment.currency is distinct from p_currency then
      raise exception using errcode = '23505', message = 'capture_id_conflict';
    end if;

    select * into v_entitlement
      from public.entitlements
      where user_id = p_user_id;
    return v_entitlement;
  end if;

  insert into public.entitlements (user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;

  select * into v_entitlement
    from public.entitlements
    where user_id = p_user_id
    for update;

  if p_plan_id = 'pack' then
    update public.entitlements
      set has_message_pack = true,
          updated_at = now()
      where user_id = p_user_id
      returning * into v_entitlement;
  else
    update public.entitlements
      set tier = 'premium',
          status = 'active',
          trial_status = 'converted',
          trial_consumed_at = coalesce(trial_consumed_at, now()),
          current_period_end = greatest(coalesce(current_period_end, current_date), current_date) + v_days,
          provider_payment_id = p_capture_id,
          plan_id = p_plan_id,
          updated_at = now()
      where user_id = p_user_id
      returning * into v_entitlement;
  end if;

  return v_entitlement;
end;
$$;

------------------------------------------------------------
-- 6. ip_rate_limits & audit_logs table for Phase 5 abuse protection
------------------------------------------------------------
create table if not exists public.ip_rate_limits (
  ip            text primary key,
  request_count integer not null default 1,
  window_start  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.ip_rate_limits enable row level security;
revoke all on public.ip_rate_limits from public, anon, authenticated;

create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete set null,
  ip          text,
  event_type  text not null,
  severity    text not null default 'info' check (severity in ('info', 'warn', 'alert', 'critical')),
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from public, anon, authenticated;

------------------------------------------------------------
-- Atomic RPC: check_and_increment_ip_limit
------------------------------------------------------------
create or replace function public.check_and_increment_ip_limit(
  p_ip text,
  p_max_requests integer default 20,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rec record;
  v_now timestamptz := now();
begin
  select * into v_rec from public.ip_rate_limits where ip = p_ip for update;

  if not found then
    insert into public.ip_rate_limits (ip, request_count, window_start, updated_at)
    values (p_ip, 1, v_now, v_now);
    return true;
  end if;

  if v_now > v_rec.window_start + (p_window_seconds || ' seconds')::interval then
    update public.ip_rate_limits
      set request_count = 1, window_start = v_now, updated_at = v_now
      where ip = p_ip;
    return true;
  elsif v_rec.request_count >= p_max_requests then
    insert into public.audit_logs (ip, event_type, severity, details)
    values (p_ip, 'ip_rate_limit_exceeded', 'warn', jsonb_build_object('count', v_rec.request_count));
    return false;
  else
    update public.ip_rate_limits
      set request_count = request_count + 1, updated_at = v_now
      where ip = p_ip;
    return true;
  end if;
end;
$$;

revoke all on function public.check_and_increment_ip_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_and_increment_ip_limit(text, integer, integer) to service_role;
