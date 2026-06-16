-- ─────────────────────────────────────────────
--  Rezeptarium · Migration 003: Fix RLS-Rekursion
--  Im Supabase SQL Editor ausführen (nach 002)
--
--  Ursache: Die Admin-Policies auf profiles/recipes/quotes
--  prüfen "exists (select 1 from profiles where ...)". Diese
--  Subquery auf profiles muss selbst wieder die RLS-Policies
--  von profiles auswerten — inklusive der Admin-Policy auf
--  profiles selbst. Das führt zu unendlicher Rekursion und
--  einem 500-Fehler bei jedem Zugriff auf profiles/recipes/quotes.
--
--  Lösung: is_admin() als SECURITY DEFINER Funktion, die RLS
--  beim Nachschlagen umgeht.
-- ─────────────────────────────────────────────

create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  );
$$;

-- profiles
drop policy if exists "Admin liest alle Profile" on profiles;
create policy "Admin liest alle Profile"
  on profiles for select
  using (is_admin());

-- recipes
drop policy if exists "Admin sieht alle" on recipes;
create policy "Admin sieht alle"
  on recipes for select
  using (is_admin());

drop policy if exists "Eigene Rezepte bearbeiten" on recipes;
create policy "Eigene Rezepte bearbeiten"
  on recipes for update
  using (auth.uid() = user_id or is_admin());

drop policy if exists "Eigene Rezepte löschen" on recipes;
create policy "Eigene Rezepte löschen"
  on recipes for delete
  using (auth.uid() = user_id or is_admin());

-- quotes
drop policy if exists "Admin verwaltet Quotes" on quotes;
create policy "Admin verwaltet Quotes"
  on quotes for all
  using (is_admin());
