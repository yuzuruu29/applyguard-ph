-- PostgreSQL / pgTAP Integration Test Suite for 004_atomic_budget_and_quota_ledger.sql

begin;

-- 0. Insert mock auth.users records first (required by profiles FK)
insert into auth.users (id, email, instance_id, aud, role, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', 'user1@example.com', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'user2@example.com', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now())
on conflict (id) do nothing;

-- Create mock user profiles and entitlements for testing
insert into public.profiles (id, email)
values
  ('00000000-0000-0000-0000-000000000001', 'user1@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'user2@example.com')
on conflict (id) do nothing;

------------------------------------------------------------
-- 1. Test null & expired current_period_end
------------------------------------------------------------
insert into public.entitlements (user_id, tier, status, current_period_end)
values ('00000000-0000-0000-0000-000000000001', 'premium', 'active', null)
on conflict (user_id) do update set tier = 'premium', status = 'active', current_period_end = null;

do $$
declare
  v_rec record;
  v_ent_type text;
begin
  for v_rec in perform * from public.reserve_ai_feature_usage('00000000-0000-0000-0000-000000000001', 'message', 'req-null-period') loop
    v_ent_type := v_rec.entitlement_type;
  end loop;

  -- Since current_period_end is null, entitlement_type MUST be 'trial', not 'paid'
  select entitlement_type into v_ent_type from public.ai_usage_ledger where request_id = 'req-null-period';
  if v_ent_type <> 'trial' then
    raise exception 'Test failed: null current_period_end granted paid tier access!';
  end if;
end $$;

------------------------------------------------------------
-- 2. Test Paid Pro 60 Monthly Limit
------------------------------------------------------------
update public.entitlements
set tier = 'premium', status = 'active', current_period_end = (current_date + interval '30 days')
where user_id = '00000000-0000-0000-0000-000000000001';

-- Delete prior test ledger rows
delete from public.ai_usage_ledger where user_id = '00000000-0000-0000-0000-000000000001';

-- Simulate 60 completed requests
do $$
declare
  i integer;
begin
  for i in 1..60 loop
    insert into public.ai_usage_ledger (
      request_id, user_id, entitlement_type, feature, status, created_at
    ) values (
      'sim-paid-req-' || i, '00000000-0000-0000-0000-000000000001', 'paid', 'message', 'completed', now()
    );
  end loop;
end $$;

-- 61st paid request must fail with monthly_cap_reached
do $$
declare
  v_caught boolean := false;
begin
  begin
    perform * from public.reserve_ai_feature_usage('00000000-0000-0000-0000-000000000001', 'message', 'sim-paid-req-61');
  exception when others then
    if SQLERRM like '%monthly_cap_reached%' then
      v_caught := true;
    end if;
  end;
  if not v_caught then
    raise exception 'Test failed: 61st paid request was not rejected with monthly_cap_reached';
  end if;
end $$;

------------------------------------------------------------
-- 3. Test Daily Budget Ceiling ($10.00)
------------------------------------------------------------
insert into public.daily_ai_budget (budget_date, reserved_usd, settled_usd)
values (current_date, 9.990000, 0.000000)
on conflict (budget_date) do update set reserved_usd = 9.990000, settled_usd = 0.000000;

do $$
declare
  v_caught boolean := false;
begin
  begin
    -- Max reserved cost for 'resume' is 0.040, pushing 9.990 + 0.040 = 10.030 > 10.00
    perform * from public.reserve_ai_feature_usage('00000000-0000-0000-0000-000000000002', 'resume', 'sim-budget-exceeded-req');
  exception when others then
    if SQLERRM like '%daily_budget_reached%' then
      v_caught := true;
    end if;
  end;
  if not v_caught then
    raise exception 'Test failed: Daily budget circuit breaker did not block request exceeding $10.00';
  end if;
end $$;

------------------------------------------------------------
-- 4. Test Stale Reservation Cleanup
------------------------------------------------------------
insert into public.ai_usage_ledger (
  request_id, user_id, entitlement_type, feature, status, reserved_cost_usd, created_at
) values (
  'stale-req-1', '00000000-0000-0000-0000-000000000002', 'trial', 'message', 'reserved', 0.015000, now() - interval '10 minutes'
);

do $$
declare
  v_cleaned integer;
  v_stale_status text;
begin
  v_cleaned := public.release_stale_ai_reservations();
  if v_cleaned < 1 then
    raise exception 'Test failed: Stale reservation was not released';
  end if;

  select status into v_stale_status from public.ai_usage_ledger where request_id = 'stale-req-1';
  if v_stale_status <> 'failed' then
    raise exception 'Test failed: Stale reservation status was not updated to failed';
  end if;
end $$;

------------------------------------------------------------
-- 5. Test Settlement Lifecycle and Idempotency
------------------------------------------------------------
insert into public.ai_usage_ledger (
  request_id, user_id, entitlement_type, feature, status, reserved_cost_usd, created_at
) values (
  'test-settle-req-1', '00000000-0000-0000-0000-000000000002', 'trial', 'message', 'reserved', 0.015000, now()
);

do $$
declare
  v_res boolean;
  v_status text;
begin
  -- Provider completed step
  v_res := public.settle_ai_feature_usage('test-settle-req-1', 'provider_completed', 100, 50, 0, 0, 0.001000);
  if not v_res then raise exception 'Test failed: provider_completed settlement failed'; end if;

  -- Final completed step
  v_res := public.settle_ai_feature_usage('test-settle-req-1', 'completed', 100, 50, 0, 0, 0.001000);
  if not v_res then raise exception 'Test failed: final completed settlement failed'; end if;

  select status into v_status from public.ai_usage_ledger where request_id = 'test-settle-req-1';
  if v_status <> 'completed' then raise exception 'Test failed: final status not completed'; end if;

  -- Duplicate settlement attempt should return true (idempotent guard)
  v_res := public.settle_ai_feature_usage('test-settle-req-1', 'completed', 100, 50, 0, 0, 0.001000);
  if not v_res then raise exception 'Test failed: duplicate settlement guard failed'; end if;
end $$;

rollback;
