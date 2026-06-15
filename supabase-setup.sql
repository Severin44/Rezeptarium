-- ─────────────────────────────────────────────
--  Rezeptarium · Supabase Setup
--  Einmalig im Supabase SQL Editor ausführen
--  supabase.com → SQL Editor → New Query
-- ─────────────────────────────────────────────

-- 1. Tabelle erstellen
create table if not exists recipes (
  id               uuid default gen_random_uuid() primary key,
  name             text not null,
  category         text,
  prep_time        integer,
  cook_time        integer,
  servings         integer,
  ingredients      text,
  instructions     text,
  notes            text,
  cover_image_url  text,
  is_favorite      boolean default false,
  created_at       timestamptz default now()
);

-- 2. Row Level Security aktivieren (aber offen lassen, kein Login nötig)
alter table recipes enable row level security;

create policy "Alle dürfen lesen"
  on recipes for select using (true);

create policy "Alle dürfen schreiben"
  on recipes for insert with check (true);

create policy "Alle dürfen updaten"
  on recipes for update using (true);

create policy "Alle dürfen löschen"
  on recipes for delete using (true);

-- 3. Storage Bucket erstellen (für Bilder)
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict do nothing;

create policy "Bilder sind öffentlich lesbar"
  on storage.objects for select
  using ( bucket_id = 'recipe-images' );

create policy "Bilder hochladen erlaubt"
  on storage.objects for insert
  with check ( bucket_id = 'recipe-images' );

create policy "Bilder löschen erlaubt"
  on storage.objects for delete
  using ( bucket_id = 'recipe-images' );
