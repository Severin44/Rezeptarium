-- ─────────────────────────────────────────────────────────────────
--  Migration 18: Eigene Filter-Tabs + Sidebar Customization
-- ─────────────────────────────────────────────────────────────────

-- ── Eigene Filter-Tabs ───────────────────────────────────────────

create table if not exists custom_filters (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  categories   text[] default '{}',
  seasons      text[] default '{}',
  tags         text[] default '{}',
  favorites_only boolean default false,
  sort_order   int default 0,
  created_at   timestamptz default now()
);

alter table custom_filters enable row level security;

create policy "Eigene Filter lesen"     on custom_filters for select using (auth.uid() = user_id);
create policy "Eigene Filter erstellen" on custom_filters for insert with check (auth.uid() = user_id);
create policy "Eigene Filter bearbeiten" on custom_filters for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Eigene Filter löschen"  on custom_filters for delete using (auth.uid() = user_id);

-- ── Sidebar-Layout pro User ───────────────────────────────────────

create table if not exists sidebar_layout (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users(id) on delete cascade not null,
  item_key         text,                    -- z.B. 'all', 'category:Frühstück', 'discovery'
  custom_filter_id uuid references custom_filters(id) on delete cascade,
  section          text not null,           -- 'sammlung' | 'kapitel' | 'social' | 'custom_filters'
  visible          boolean default true,
  sort_order       int not null,
  created_at       timestamptz default now(),
  unique (user_id, item_key),
  check (item_key is not null or custom_filter_id is not null)
);

alter table sidebar_layout enable row level security;
create policy "Eigenes Layout verwalten" on sidebar_layout for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Sektions-Reihenfolge ─────────────────────────────────────────

create table if not exists sidebar_section_order (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  section    text not null,
  sort_order int not null,
  unique (user_id, section)
);

alter table sidebar_section_order enable row level security;
create policy "Eigene Sektionsreihenfolge verwalten" on sidebar_section_order for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
