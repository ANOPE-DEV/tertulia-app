-- Fix: recursão infinita nas policies admin.
-- A policy admin_all em profiles consultava profiles → RLS reentrada → loop.
-- Solução: função SECURITY DEFINER `is_admin()` que bypassa RLS internamente.
--
-- Este arquivo é idempotente — pode rodar múltiplas vezes sem quebrar nada.

-- 1. Helper que checa admin sem cair em RLS
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- 2. Refazer todas as policies admin usando is_admin()
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders for all
  using (public.is_admin());

drop policy if exists order_items_admin_all on public.order_items;
create policy order_items_admin_all on public.order_items for all
  using (public.is_admin());

drop policy if exists points_tx_admin_all on public.points_transactions;
create policy points_tx_admin_all on public.points_transactions for all
  using (public.is_admin());

drop policy if exists rewards_admin_all on public.rewards;
create policy rewards_admin_all on public.rewards for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists redemptions_admin_all on public.redemptions;
create policy redemptions_admin_all on public.redemptions for all
  using (public.is_admin());

drop policy if exists plans_admin_all on public.subscription_plans;
create policy plans_admin_all on public.subscription_plans for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists subs_admin_all on public.subscriptions;
create policy subs_admin_all on public.subscriptions for all
  using (public.is_admin());

-- 3. Policies public_select unificadas com is_admin()
drop policy if exists products_public_select on public.products;
create policy products_public_select on public.products for select
  using (active = true or public.is_admin());

drop policy if exists rewards_public_select on public.rewards;
create policy rewards_public_select on public.rewards for select
  using (active = true or public.is_admin());

drop policy if exists plans_public_select on public.subscription_plans;
create policy plans_public_select on public.subscription_plans for select
  using (active = true or public.is_admin());
