-- ============================================================
-- Migración: tabla personas + personas_ids en compras
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Tabla personas ────────────────────────────────────────
create table if not exists public.personas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nombre      text not null,
  color       text not null default '#64748b',
  created_at  timestamptz not null default now()
);

create index if not exists personas_user_idx on public.personas (user_id);

alter table public.personas enable row level security;

create policy "Users see own personas"
  on public.personas for select using (auth.uid() = user_id);
create policy "Users insert own personas"
  on public.personas for insert with check (auth.uid() = user_id);
create policy "Users update own personas"
  on public.personas for update using (auth.uid() = user_id);
create policy "Users delete own personas"
  on public.personas for delete using (auth.uid() = user_id);

-- ── 2. Agregar personas_ids a compras ────────────────────────
-- Array de UUIDs de personas seleccionadas en compras compartidas.
-- divididaEntre (text) se mantiene como campo legacy/fallback.
alter table public.compras
  add column if not exists personas_ids jsonb not null default '[]'::jsonb;
