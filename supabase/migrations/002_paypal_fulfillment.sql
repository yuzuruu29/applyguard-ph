-- Atomic, idempotent PayPal fulfillment.
-- Only the service_role used by trusted Edge Functions can execute this RPC.

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

revoke all on function public.fulfill_paypal_capture(text, text, uuid, text, integer, text, text, jsonb) from public;
revoke all on function public.fulfill_paypal_capture(text, text, uuid, text, integer, text, text, jsonb) from anon;
revoke all on function public.fulfill_paypal_capture(text, text, uuid, text, integer, text, text, jsonb) from authenticated;
grant execute on function public.fulfill_paypal_capture(text, text, uuid, text, integer, text, text, jsonb) to service_role;
