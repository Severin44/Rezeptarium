-- ─────────────────────────────────────────────
--  Rezeptarium · Migration 002: Multi-User + Quotes
--  Im Supabase SQL Editor ausführen (nach supabase-setup.sql)
-- ─────────────────────────────────────────────

-- 1. Alte, offene Policies auf recipes entfernen
--    (sonst bleiben Rezepte für alle sichtbar/schreibbar, da
--    Policies permissiv per OR kombiniert werden)
drop policy if exists "Alle dürfen lesen" on recipes;
drop policy if exists "Alle dürfen schreiben" on recipes;
drop policy if exists "Alle dürfen updaten" on recipes;
drop policy if exists "Alle dürfen löschen" on recipes;

-- 2. user_id auf recipes
alter table recipes
  add column if not exists user_id uuid references auth.users(id);

-- 3. profiles Tabelle
create table if not exists profiles (
  id          uuid references auth.users(id) primary key,
  username    text unique not null,
  is_admin    boolean default false,
  created_at  timestamptz default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 4. profiles RLS
alter table profiles enable row level security;

create policy "Eigenes Profil lesen"
  on profiles for select
  using (auth.uid() = id);

create policy "Admin liest alle Profile"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- 5. recipes RLS (Select/Insert/Update/Delete)
alter table recipes enable row level security;

create policy "Eigene Rezepte lesen"
  on recipes for select
  using (auth.uid() = user_id);

create policy "Admin sieht alle"
  on recipes for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Eigene Rezepte erstellen"
  on recipes for insert
  with check (auth.uid() = user_id);

create policy "Eigene Rezepte bearbeiten"
  on recipes for update
  using (
    auth.uid() = user_id
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Eigene Rezepte löschen"
  on recipes for delete
  using (
    auth.uid() = user_id
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- 6. quotes Tabelle
create table if not exists quotes (
  id          uuid default gen_random_uuid() primary key,
  text        text not null,
  from_label  text,
  for_user_id uuid references auth.users(id) default null,
  created_at  timestamptz default now()
);

alter table quotes enable row level security;

create policy "Quotes lesen"
  on quotes for select
  using (for_user_id is null or for_user_id = auth.uid());

create policy "Admin verwaltet Quotes"
  on quotes for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- 7. Bestehende Rezepte ohne user_id müssen manuell einem User
--    zugewiesen werden, sonst sind sie für niemanden mehr sichtbar:
--    update recipes set user_id = '<dein-user-id>' where user_id is null;
