-- 기존 DB에 레이아웃 컬럼만 추가할 때
alter table public.storage_spots add column if not exists map_key text;
alter table public.storage_spots add column if not exists x numeric;
alter table public.storage_spots add column if not exists y numeric;
alter table public.storage_spots add column if not exists w numeric;
alter table public.storage_spots add column if not exists h numeric;
alter table public.storage_spots add column if not exists color text;
alter table public.storage_spots add column if not exists rotation integer default 0;

create unique index if not exists storage_spots_map_key_uidx
  on public.storage_spots (map_key)
  where map_key is not null;
