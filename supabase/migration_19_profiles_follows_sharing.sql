-- ══════════════════════════════════════════════════════════════════
--  Migration 19 — Profile, Follows, Sichtbarkeit, Direktes Teilen
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Profiles erweitern ────────────────────────────────────────
alter table profiles
  add column if not exists bio          text,
  add column if not exists avatar_url   text,
  add column if not exists avatar_color text default '#eef0e0';

-- ── 2. Avatare-Bucket ────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

create policy "Avatare öffentlich lesbar"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Eigenen Avatar hochladen"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Eigenen Avatar aktualisieren"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── 3. RLS für profiles ──────────────────────────────────────────
-- Bestehende Policies ggf. droppen
drop policy if exists "Profile öffentlich lesbar" on profiles;
drop policy if exists "Eigenes Profil bearbeiten" on profiles;

create policy "Profile öffentlich lesbar"
  on profiles for select using (true);

create policy "Eigenes Profil bearbeiten"
  on profiles for update using (auth.uid() = id);

-- ── 4. follows-Tabelle ───────────────────────────────────────────
create table if not exists follows (
  id            uuid default gen_random_uuid() primary key,
  follower_id   uuid references auth.users(id) on delete cascade,
  following_id  uuid references auth.users(id) on delete cascade,
  created_at    timestamptz default now(),
  unique (follower_id, following_id),
  check (follower_id != following_id)
);

alter table follows enable row level security;

create policy "Follows lesen"
  on follows for select using (true);

create policy "Folgen erstellen"
  on follows for insert
  with check (auth.uid() = follower_id);

create policy "Entfolgen"
  on follows for delete
  using (auth.uid() = follower_id);

-- ── 5. Freunde-Funktion ──────────────────────────────────────────
create or replace function are_friends(user_a uuid, user_b uuid)
returns boolean as $$
  select exists (
    select 1 from follows
    where follower_id = user_a and following_id = user_b
  ) and exists (
    select 1 from follows
    where follower_id = user_b and following_id = user_a
  );
$$ language sql stable security definer;

-- ── 6. Sichtbarkeit: is_public → visibility ──────────────────────
alter table recipes add column if not exists visibility text default 'private'
  check (visibility in ('private', 'friends', 'public'));

-- Bestehende Daten migrieren
update recipes set visibility = 'public'  where is_public = true  and visibility = 'private';
update recipes set visibility = 'private' where is_public = false and visibility = 'private';

-- is_public noch nicht droppen — erst wenn alle alten Queries
-- auf visibility umgestellt sind. Spalte wird ignoriert.
-- alter table recipes drop column is_public;

-- ── 7. recipe_shares-Tabelle ─────────────────────────────────────
create table if not exists recipe_shares (
  id          uuid default gen_random_uuid() primary key,
  recipe_id   uuid references recipes(id) on delete cascade,
  shared_by   uuid references auth.users(id) on delete cascade,
  shared_with uuid references auth.users(id) on delete cascade,
  seen        boolean default false,
  created_at  timestamptz default now(),
  unique (recipe_id, shared_with)
);

alter table recipe_shares enable row level security;

create policy "Shares lesen"
  on recipe_shares for select
  using (shared_by = auth.uid() or shared_with = auth.uid());

create policy "Rezept teilen"
  on recipe_shares for insert
  with check (
    shared_by = auth.uid()
    and exists (
      select 1 from recipes
      where id = recipe_id and user_id = auth.uid()
    )
  );

create policy "Share entfernen"
  on recipe_shares for delete
  using (shared_by = auth.uid());

-- ── 8. Rezepte-RLS aktualisieren ─────────────────────────────────
drop policy if exists "Öffentliche Rezepte lesen" on recipes;
drop policy if exists "Rezepte lesen nach Sichtbarkeit" on recipes;

create policy "Rezepte lesen nach Sichtbarkeit"
  on recipes for select
  using (
    auth.uid() = user_id
    or visibility = 'public'
    or (visibility = 'friends' and are_friends(auth.uid(), user_id))
    or exists (
      select 1 from recipe_shares
      where recipe_id = recipes.id and shared_with = auth.uid()
    )
  );

-- ── 9. Likes-Policy aktualisieren ────────────────────────────────
drop policy if exists "Like erstellen" on likes;
drop policy if exists "Like erstellen wenn Rezept sichtbar" on likes;

create policy "Like erstellen wenn Rezept sichtbar"
  on likes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from recipes r
      where r.id = recipe_id
      and (
        r.user_id = auth.uid()
        or r.visibility = 'public'
        or (r.visibility = 'friends' and are_friends(auth.uid(), r.user_id))
        or exists (
          select 1 from recipe_shares
          where recipe_id = r.id and shared_with = auth.uid()
        )
      )
    )
  );
