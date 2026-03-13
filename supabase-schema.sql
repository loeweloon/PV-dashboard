-- ═══════════════════════════════════════════════════════════════
--  PV Executive Dashboard — Supabase Schema
--  Run this entire file in: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Projects ────────────────────────────────────────────────────────────────
create table if not exists projects (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  "group"      text not null default '',
  company      text not null default '',
  location     text not null default '',
  dev_type     text not null default '',
  land_tenure  text not null default '',
  units        integer,                          -- null = TBC
  gdv          text not null default 'TBC',
  launch       text not null default 'TBC',
  completion   text not null default 'TBC',
  status       text not null default 'planning'
                 check (status in ('completed','construction','launched','planning','pending','stop','hold')),
  description  text not null default '',
  pm           text not null default '',
  team         text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── Sales Records ───────────────────────────────────────────────────────────
create table if not exists sales_records (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete set null,
  project_name text not null,
  "group"      text not null default '',
  units        integer not null default 0,
  booked       integer not null default 0,
  spa          integer not null default 0,
  cancelled    integer not null default 0,
  value        bigint  not null default 0,       -- RM in whole numbers
  updated_at   timestamptz not null default now()
);

-- ─── Salespersons ────────────────────────────────────────────────────────────
create table if not exists salespersons (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  project    text not null default '',
  booked     integer not null default 0,
  target     integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ─── Ad Campaigns ────────────────────────────────────────────────────────────
create table if not exists ad_campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  platform    text not null default 'Facebook',
  start_date  date,
  end_date    date,
  budget      numeric not null default 0,
  spend       numeric not null default 0,
  impressions bigint  not null default 0,
  leads       integer not null default 0,
  status      text not null default 'live'
                check (status in ('live','scheduled','ended')),
  updated_at  timestamptz not null default now()
);

-- ─── Events ──────────────────────────────────────────────────────────────────
create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  date       date not null,
  location   text not null default '',
  type       text not null default 'own' check (type in ('own','join')),
  updated_at timestamptz not null default now()
);

-- ─── Lead Campaigns ──────────────────────────────────────────────────────────
create table if not exists lead_campaigns (
  id         uuid primary key default gen_random_uuid(),
  campaign   text not null,
  platform   text not null default '',
  project    text not null default '',
  leads      integer not null default 0,
  cpl        numeric  not null default 0,
  budget     numeric  not null default 0,
  updated_at timestamptz not null default now()
);

-- ─── Platform Stats ──────────────────────────────────────────────────────────
create table if not exists platform_stats (
  id          uuid primary key default gen_random_uuid(),
  name        text    not null unique,
  icon        text    not null default '',
  color       text    not null default '#000000',
  impressions bigint  not null default 0,
  updated_at  timestamptz not null default now()
);

-- ─── Chart Widgets ───────────────────────────────────────────────────────────
create table if not exists chart_widgets (
  id         uuid primary key default gen_random_uuid(),
  type       text    not null,
  title      text    not null,
  sub        text    not null default '',
  span       integer not null default 2 check (span in (1,2,3)),
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ─── Auto-update updated_at ──────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$ declare t text;
begin
  foreach t in array array[
    'projects','sales_records','salespersons','ad_campaigns',
    'events','lead_campaigns','platform_stats','chart_widgets'
  ] loop
    execute format(
      'create trigger trg_%s_updated before update on %s for each row execute function update_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ─── Row Level Security (enable after confirming auth works) ─────────────────
-- alter table projects       enable row level security;
-- alter table sales_records  enable row level security;
-- alter table salespersons   enable row level security;
-- alter table ad_campaigns   enable row level security;
-- alter table events         enable row level security;
-- alter table lead_campaigns enable row level security;
-- alter table platform_stats enable row level security;
-- alter table chart_widgets  enable row level security;

-- Uncomment below policies once you set up Supabase Auth:
-- create policy "Authenticated users can read all" on projects
--   for select using (auth.role() = 'authenticated');
-- create policy "Authenticated users can write" on projects
--   for all using (auth.role() = 'authenticated');

-- ─── Seed default chart widgets ──────────────────────────────────────────────
insert into chart_widgets (type, title, sub, span, sort_order) values
  ('donuts',   'Per-Project Sales Donuts',      'Units: Booked · SPA · Remaining',   3, 0),
  ('funnel',   'Sales Funnel',                   'Overall pipeline conversion',        1, 1),
  ('spa-bar',  'SPA Signed by Project',          'Top projects by SPA count',          2, 2),
  ('conv-bar', 'Conversion Rate by Project',     'Booking → SPA %',                   2, 3),
  ('val-bar',  'SPA Value by Project',           'RM value of signed units',           2, 4)
on conflict do nothing;

-- ─── Seed platform stats ─────────────────────────────────────────────────────
insert into platform_stats (name, icon, color, impressions) values
  ('Facebook',     '📘', '#1877F2', 1460000),
  ('Instagram',    '📷', '#E4405F',  590000),
  ('TikTok',       '🎵', '#010101',  510000),
  ('Google',       '🔍', '#4285F4',  478000),
  ('YouTube',      '▶️', '#FF0000',   95000),
  ('PropertyGuru', '🏠', '#f59e0b',  145000),
  ('iProperty',    '🔑', '#dc2626',   62000),
  ('WhatsApp',     '💬', '#25D366',   18000)
on conflict (name) do nothing;
