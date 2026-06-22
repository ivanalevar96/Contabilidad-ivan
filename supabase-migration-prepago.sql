-- ============================================================
-- Finalización anticipada de compras en cuotas (ej: prepago de
-- un crédito de consumo). Guarda el último mes (YYYY-MM) en que
-- la cuota aún debe mostrarse; los meses posteriores se ocultan.
-- El total de cuotas original (cant_cuotas) se conserva.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

alter table public.compras
  add column if not exists mes_fin_anticipado text;
