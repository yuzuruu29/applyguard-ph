-- PostgreSQL / pgTAP Integration Test Suite for 004_atomic_budget_and_quota_ledger.sql

begin;

-- Create mock user profiles and entitlements for testing
insert into public.profiles (id, email)
values 
  ('00000000-0000-0000-0000-000000000001', 'user1@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'user2@example.com')
on conflict do nothing;

-- 1. Test null & expired current_period_end
insert into public.entitlements (user_id, tier, status, current_period_end)
values ('00000000-0000-0000-0000-000000000001', 'premium', 'active', null)
on conflict (user_id) do update set tier = 'premium', status = 'active', current_period_end = null;

do $$
declare
  v_rec record;
  v_err boolean := false;
begin
  begin
    perform * from public.reserve_ai_feature_usage('00000000-0000-0000-0000-000000000001', 'message', 'req-null-period');
  exception when others then
    -- Should fail under trial or treat as trial because current_period_end is null
    v_err := true;
  end;
end $$;

-- 2. Test Paid Pro 60 Monthly Limit
update public.entitlements 
set tier = 'premium', status = 'active', current_period_end = (current_date + interval '30 days')
where user_id = '00000000-0000-0000-0000-000000000001';

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

-- 3. Test Daily Budget Ceiling ($10.00)
insert into public.daily_ai_budget (budget_date, reserved_usd, settled_usd)
values (current_date, 9.990000, 0.000000)
on conflict (budget_date) do update set reserved_usd = 9.990000, settled_usd = 0.000000;

do $$
declare
  v_caught boolean := false;
begin
  begin
    -- Max reserved cost for 'resume' is 0.038, pushing 9.990 + 0.038 = 10.028 > 10.00
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

-- 4. Test Stale Reservation Cleanup
insert into public.ai_usage_ledger (
  request_id, user_id, entitlement_type, feature, status, reserved_cost_usd, created_at
) values (
  'stale-req-1', '00000000-0000-0000-0000-000000000002', 'trial', 'message', 'reserved', 0.013000, now() - interval '10 minutes'
);

do $$
declare
  v_cleaned integer;
begin
  v_cleaned := public.release_stale_ai_reservations();
  if v_cleaned < 1 then
    raise exception 'Test failed: Stale reservation was not released';
  end if;
end $$;

rollback;
