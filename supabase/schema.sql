-- 회사 비품 공유 · 사무실 맵
-- Supabase SQL Editor에서 전체 실행

-- 회사(워크스페이스) — 가입 코드로 입장
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
drop policy if exists "orgs_all" on public.organizations;
create policy "orgs_all" on public.organizations for all using (true) with check (true);

create table if not exists public.storage_spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null default '사무실',
  kind text not null default 'desk',
  parent_id uuid references public.storage_spots(id) on delete cascade,
  note text,
  sort_order integer not null default 0,
  map_key text,
  x numeric,
  y numeric,
  w numeric,
  h numeric,
  color text,
  rotation integer default 0,
  org_id uuid references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists storage_spots_parent_idx on public.storage_spots (parent_id);
create index if not exists storage_spots_org_idx on public.storage_spots (org_id);
create unique index if not exists storage_spots_org_map_key
  on public.storage_spots (org_id, map_key)
  where map_key is not null;

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '기타',
  quantity integer not null default 0 check (quantity >= 0),
  min_stock integer not null default 5 check (min_stock >= 0),
  unit text not null default '개',
  location text not null default '사무실',
  storage_spot_id uuid references public.storage_spots(id) on delete set null,
  notes text,
  org_id uuid references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_items_name_idx on public.inventory_items (name);
create index if not exists inventory_items_spot_idx on public.inventory_items (storage_spot_id);
create index if not exists inventory_items_org_idx on public.inventory_items (org_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists inventory_items_set_updated_at on public.inventory_items;
create trigger inventory_items_set_updated_at
before update on public.inventory_items
for each row execute function public.set_updated_at();

alter table public.storage_spots enable row level security;
alter table public.inventory_items enable row level security;

drop policy if exists "storage_spots_all" on public.storage_spots;
drop policy if exists "inventory_all" on public.inventory_items;
create policy "storage_spots_all" on public.storage_spots for all using (true) with check (true);
create policy "inventory_all" on public.inventory_items for all using (true) with check (true);

-- 실무: 사용 기록 · 비품 요청 (기존 DB는 아래만 추가 실행해도 됨)
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.inventory_items(id) on delete set null,
  item_name text not null,
  action text not null,
  delta integer not null default 0,
  actor text,
  note text,
  org_id uuid references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_idx on public.activity_log (created_at desc);
create index if not exists activity_log_org_idx on public.activity_log (org_id);

create table if not exists public.supply_requests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.inventory_items(id) on delete set null,
  item_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  requester text not null default '직원',
  status text not null default 'pending',
  note text,
  org_id uuid references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists supply_requests_status_idx on public.supply_requests (status);
create index if not exists supply_requests_org_idx on public.supply_requests (org_id);

alter table public.activity_log enable row level security;
alter table public.supply_requests enable row level security;

drop policy if exists "activity_all" on public.activity_log;
drop policy if exists "requests_all" on public.supply_requests;
create policy "activity_all" on public.activity_log for all using (true) with check (true);
create policy "requests_all" on public.supply_requests for all using (true) with check (true);

-- 기존 DB 마이그레이션 (이미 테이블이 있을 때)
alter table public.storage_spots add column if not exists org_id uuid references public.organizations(id) on delete cascade;
alter table public.inventory_items add column if not exists org_id uuid references public.organizations(id) on delete cascade;
alter table public.activity_log add column if not exists org_id uuid references public.organizations(id) on delete cascade;
alter table public.supply_requests add column if not exists org_id uuid references public.organizations(id) on delete cascade;
-- map_key 전역 unique 제거(회사별 unique로 대체) — 없으면 무시됨
do $$ begin
  alter table public.storage_spots drop constraint if exists storage_spots_map_key_key;
exception when undefined_object then null;
end $$;
