-- Tertúlia — initial schema
-- Run this in Supabase SQL Editor. Order: 0001_init.sql, 0002_seed.sql, 0003_plans_rewards.sql

-- ─── PROFILES ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  points integer not null default 0,
  level text not null default 'Apreciador',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  subscription_plan text check (subscription_plan in ('bon_vivant', 'fin_bec')),
  subscription_status text check (subscription_status in ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  subscription_current_period_end timestamptz,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Owner can read/update own profile
drop policy if exists profiles_owner_select on public.profiles;
create policy profiles_owner_select on public.profiles for select
  using (auth.uid() = id);

drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- Admins can read/update all
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ─── PRODUCTS ─────────────────────────────────────────────────
create table if not exists public.products (
  id text primary key,
  cat text not null check (cat in ('queijos', 'vinhos', 'charutos', 'casa', 'kit')),
  name text not null,
  origin text not null,
  price numeric(10,2) not null check (price >= 0),
  old_price numeric(10,2) check (old_price is null or old_price >= price),
  unit text not null,
  stock integer not null default 0 check (stock >= 0),
  rating numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  reviews integer not null default 0 check (reviews >= 0),
  badge text,
  description text not null,
  sommelier_note text,
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_cat_idx on public.products(cat);
create index if not exists products_active_idx on public.products(active);

alter table public.products enable row level security;

drop policy if exists products_public_select on public.products;
create policy products_public_select on public.products for select
  using (active = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ─── ORDERS ───────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  delivery_method text not null check (delivery_method in ('hoje', 'correio')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'delivered', 'canceled')),
  order_message text,
  points_earned integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);

alter table public.orders enable row level security;

drop policy if exists orders_owner_select on public.orders;
create policy orders_owner_select on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists orders_owner_insert on public.orders;
create policy orders_owner_insert on public.orders for insert
  with check (auth.uid() = user_id);

drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ─── ORDER ITEMS ──────────────────────────────────────────────
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.order_items enable row level security;

drop policy if exists order_items_via_parent on public.order_items;
create policy order_items_via_parent on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  ));

drop policy if exists order_items_owner_insert on public.order_items;
create policy order_items_owner_insert on public.order_items for insert
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

drop policy if exists order_items_admin_all on public.order_items;
create policy order_items_admin_all on public.order_items for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ─── POINTS TRANSACTIONS (audit trail) ────────────────────────
create table if not exists public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  reason text not null,
  ref_type text,
  ref_id text,
  created_at timestamptz not null default now()
);

create index if not exists points_tx_user_idx on public.points_transactions(user_id);

alter table public.points_transactions enable row level security;

drop policy if exists points_tx_owner_select on public.points_transactions;
create policy points_tx_owner_select on public.points_transactions for select
  using (auth.uid() = user_id);

drop policy if exists points_tx_admin_all on public.points_transactions;
create policy points_tx_admin_all on public.points_transactions for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ─── REWARDS + REDEMPTIONS ────────────────────────────────────
create table if not exists public.rewards (
  id text primary key,
  name text not null,
  cost integer not null check (cost > 0),
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.rewards enable row level security;

drop policy if exists rewards_public_select on public.rewards;
create policy rewards_public_select on public.rewards for select
  using (active = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists rewards_admin_all on public.rewards;
create policy rewards_admin_all on public.rewards for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id text not null references public.rewards(id) on delete restrict,
  cost_paid integer not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'canceled')),
  created_at timestamptz not null default now()
);

create index if not exists redemptions_user_idx on public.redemptions(user_id);

alter table public.redemptions enable row level security;

drop policy if exists redemptions_owner_select on public.redemptions;
create policy redemptions_owner_select on public.redemptions for select
  using (auth.uid() = user_id);

drop policy if exists redemptions_admin_all on public.redemptions;
create policy redemptions_admin_all on public.redemptions for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ─── SUBSCRIPTION PLANS + SUBSCRIPTIONS ───────────────────────
create table if not exists public.subscription_plans (
  id text primary key check (id in ('bon_vivant', 'fin_bec')),
  name text not null,
  tagline text,
  price_cents integer not null,
  description text not null,
  perks jsonb not null default '[]'::jsonb,
  stripe_price_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;

drop policy if exists plans_public_select on public.subscription_plans;
create policy plans_public_select on public.subscription_plans for select
  using (active = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists plans_admin_all on public.subscription_plans;
create policy plans_admin_all on public.subscription_plans for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id),
  status text not null default 'incomplete' check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  stripe_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subs_user_idx on public.subscriptions(user_id);
create index if not exists subs_status_idx on public.subscriptions(status);

alter table public.subscriptions enable row level security;

drop policy if exists subs_owner_select on public.subscriptions;
create policy subs_owner_select on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists subs_owner_insert on public.subscriptions;
create policy subs_owner_insert on public.subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists subs_admin_all on public.subscriptions;
create policy subs_admin_all on public.subscriptions for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ─── FUNCTIONS ────────────────────────────────────────────────

-- Compute level from points
create or replace function public.compute_level(pts integer)
returns text language plpgsql immutable as $$
begin
  if pts >= 4000 then return 'Mestre';
  elsif pts >= 1500 then return 'Connoisseur';
  else return 'Apreciador';
  end if;
end;
$$;

-- Update level whenever points change
create or replace function public.tg_update_level()
returns trigger language plpgsql as $$
begin
  new.level := public.compute_level(new.points);
  return new;
end;
$$;

drop trigger if exists profiles_update_level on public.profiles;
create trigger profiles_update_level
  before insert or update of points on public.profiles
  for each row execute function public.tg_update_level();

-- On new auth.users insert: create profile, credit 50 pts signup bonus
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  bonus_pts constant integer := 50;
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, email, full_name, points)
  values (new.id, new.email, display_name, bonus_pts)
  on conflict (id) do nothing;

  insert into public.points_transactions (user_id, delta, reason)
  values (new.id, bonus_pts, 'signup_bonus');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Credit points transactionally
create or replace function public.credit_points(
  p_delta integer,
  p_reason text,
  p_ref_type text default null,
  p_ref_id text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.points_transactions (user_id, delta, reason, ref_type, ref_id)
  values (uid, p_delta, p_reason, p_ref_type, p_ref_id);

  update public.profiles set points = greatest(0, points + p_delta) where id = uid;
end;
$$;

-- Redeem a reward (atomic: deducts points + creates redemption)
create or replace function public.redeem_reward(p_reward_id text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  reward_cost integer;
  current_pts integer;
  redemption_id uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;

  select cost into reward_cost from public.rewards where id = p_reward_id and active = true;
  if reward_cost is null then raise exception 'Reward not available'; end if;

  select points into current_pts from public.profiles where id = uid;
  if current_pts < reward_cost then raise exception 'Insufficient points'; end if;

  insert into public.redemptions (user_id, reward_id, cost_paid)
  values (uid, p_reward_id, reward_cost)
  returning id into redemption_id;

  update public.profiles set points = points - reward_cost where id = uid;

  insert into public.points_transactions (user_id, delta, reason, ref_type, ref_id)
  values (uid, -reward_cost, 'redemption', 'reward', p_reward_id);

  return redemption_id;
end;
$$;

-- Place order (atomic: creates order + items + credits points + clears would-be cart)
create or replace function public.place_order(
  p_items jsonb,
  p_delivery text,
  p_shipping numeric
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  new_order_id uuid;
  item jsonb;
  subtotal_calc numeric := 0;
  points_calc integer := 0;
  prod record;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_delivery not in ('hoje', 'correio') then raise exception 'Invalid delivery method'; end if;

  -- validate + compute
  for item in select * from jsonb_array_elements(p_items) loop
    select id, price, stock into prod
      from public.products
      where id = item->>'product_id' and active = true
      for update;
    if prod.id is null then raise exception 'Product not found: %', item->>'product_id'; end if;
    if prod.stock < (item->>'quantity')::int then raise exception 'Insufficient stock: %', prod.id; end if;
    subtotal_calc := subtotal_calc + prod.price * (item->>'quantity')::int;
    points_calc := points_calc + (prod.price * (item->>'quantity')::int)::int;
  end loop;

  insert into public.orders (user_id, subtotal, shipping, total, delivery_method, points_earned)
  values (uid, subtotal_calc, p_shipping, subtotal_calc + p_shipping, p_delivery, points_calc)
  returning id into new_order_id;

  for item in select * from jsonb_array_elements(p_items) loop
    select price into prod from public.products where id = item->>'product_id';
    insert into public.order_items (order_id, product_id, quantity, unit_price)
    values (new_order_id, item->>'product_id', (item->>'quantity')::int, prod.price);
    update public.products set stock = stock - (item->>'quantity')::int where id = item->>'product_id';
  end loop;

  update public.profiles set points = points + points_calc where id = uid;
  insert into public.points_transactions (user_id, delta, reason, ref_type, ref_id)
  values (uid, points_calc, 'order', 'order', new_order_id::text);

  return new_order_id;
end;
$$;

-- ─── UPDATED_AT triggers ──────────────────────────────────────
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.tg_set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.tg_set_updated_at();

drop trigger if exists subs_updated_at on public.subscriptions;
create trigger subs_updated_at before update on public.subscriptions
  for each row execute function public.tg_set_updated_at();

-- ─── GRANTS (execute functions) ───────────────────────────────
grant execute on function public.credit_points(integer, text, text, text) to authenticated;
grant execute on function public.redeem_reward(text) to authenticated;
grant execute on function public.place_order(jsonb, text, numeric) to authenticated;
