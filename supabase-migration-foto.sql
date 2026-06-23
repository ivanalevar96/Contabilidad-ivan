-- Agrega columna de foto a personas y tarjetas
alter table public.personas  add column if not exists foto_url text;
alter table public.tarjetas  add column if not exists foto_url text;
