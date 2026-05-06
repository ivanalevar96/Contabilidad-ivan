-- ============================================================
-- Migración: soft-delete de tarjetas
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table public.tarjetas
  add column if not exists archivada boolean not null default false;

create index if not exists tarjetas_user_archivada_idx
  on public.tarjetas (user_id, archivada);
