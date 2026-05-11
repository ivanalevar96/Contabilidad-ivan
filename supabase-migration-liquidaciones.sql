-- ============================================================
-- Liquidaciones: cobros recibidos de personas asociadas a
-- compras compartidas. Cada fila es "Persona X me abonó $Y
-- en el mes YYYY-MM, el día Z". Permite reducir el monto
-- pendiente que cada persona te debe.
-- ============================================================

create table if not exists public.liquidaciones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  persona_id  uuid not null references public.personas(id) on delete cascade,
  mes_ym      text not null,                  -- mes al que aplica el cobro
  monto       integer not null default 0,
  fecha       date not null default current_date,
  nota        text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists liquidaciones_user_mes_idx on public.liquidaciones (user_id, mes_ym);
create index if not exists liquidaciones_persona_idx on public.liquidaciones (persona_id);

alter table public.liquidaciones enable row level security;

create policy "Users see own liquidaciones"
  on public.liquidaciones for select using (auth.uid() = user_id);
create policy "Users insert own liquidaciones"
  on public.liquidaciones for insert with check (auth.uid() = user_id);
create policy "Users update own liquidaciones"
  on public.liquidaciones for update using (auth.uid() = user_id);
create policy "Users delete own liquidaciones"
  on public.liquidaciones for delete using (auth.uid() = user_id);
