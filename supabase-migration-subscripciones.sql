-- ============================================================
-- Migración: subscripciones (cargos mensuales recurrentes)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table public.compras
  add column if not exists es_subscripcion boolean not null default false,
  add column if not exists mes_fin text,
  add column if not exists periodos jsonb not null default '[]'::jsonb;

create index if not exists compras_user_subs_idx
  on public.compras (user_id, es_subscripcion);

-- Modelo de subscripción:
--   periodos = [{ inicio: 'YYYY-MM', fin: 'YYYY-MM' | null }, ...]
--   Cada objeto representa un ciclo activo. fin null = ciclo aún abierto.
--   Permite ciclos discontinuos: ej. [{Ene-Feb}, {Abr-null}].
--
-- mes_inicio / mes_fin se mantienen por compatibilidad con código previo:
--   mes_inicio = inicio del primer ciclo
--   mes_fin    = fin del último ciclo (null si está abierto)
-- Las compras normales no usan periodos ni mes_fin.
