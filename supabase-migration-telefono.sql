-- Agrega columna telefono a la tabla personas
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS telefono TEXT;
