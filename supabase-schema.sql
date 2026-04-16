-- ============================================================
-- Finanzas App — Schema para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ============================================================
-- TARJETAS
-- ============================================================
create table public.tarjetas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nombre     text not null,
  tipo       text not null check (tipo in ('tarjeta', 'persona')),
  color      text not null default '#64748b',
  created_at timestamptz not null default now()
);

alter table public.tarjetas enable row level security;

create policy "Users see own tarjetas"
  on public.tarjetas for select using (auth.uid() = user_id);
create policy "Users insert own tarjetas"
  on public.tarjetas for insert with check (auth.uid() = user_id);
create policy "Users update own tarjetas"
  on public.tarjetas for update using (auth.uid() = user_id);
create policy "Users delete own tarjetas"
  on public.tarjetas for delete using (auth.uid() = user_id);

-- ============================================================
-- SUELDOS (una fila por usuario por mes)
-- ============================================================
create table public.sueldos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  ym              text not null,
  sueldo          integer not null default 0,
  ingresos_extra  jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  unique(user_id, ym)
);

alter table public.sueldos enable row level security;

create policy "Users see own sueldos"
  on public.sueldos for select using (auth.uid() = user_id);
create policy "Users insert own sueldos"
  on public.sueldos for insert with check (auth.uid() = user_id);
create policy "Users update own sueldos"
  on public.sueldos for update using (auth.uid() = user_id);
create policy "Users delete own sueldos"
  on public.sueldos for delete using (auth.uid() = user_id);

-- ============================================================
-- COMPRAS
-- ============================================================
create table public.compras (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  tarjeta_id        uuid not null references public.tarjetas(id) on delete cascade,
  descripcion       text not null default '',
  valor_compra      integer not null default 0,
  valor_con_interes integer not null default 0,
  cant_cuotas       integer not null default 1,
  mes_inicio        text not null,
  valor_cuota       integer not null default 0,
  es_compartida     boolean not null default false,
  dividida_entre    text not null default '',
  valor_por_persona integer,
  revisado          jsonb not null default '{}',
  created_at        timestamptz not null default now()
);

alter table public.compras enable row level security;

create policy "Users see own compras"
  on public.compras for select using (auth.uid() = user_id);
create policy "Users insert own compras"
  on public.compras for insert with check (auth.uid() = user_id);
create policy "Users update own compras"
  on public.compras for update using (auth.uid() = user_id);
create policy "Users delete own compras"
  on public.compras for delete using (auth.uid() = user_id);

-- ============================================================
-- PAGOS PUNTUALES
-- ============================================================
create table public.pagos_puntuales (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tarjeta_id  uuid not null references public.tarjetas(id) on delete cascade,
  mes_ym      text not null,
  descripcion text not null default '',
  monto       integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.pagos_puntuales enable row level security;

create policy "Users see own pagos_puntuales"
  on public.pagos_puntuales for select using (auth.uid() = user_id);
create policy "Users insert own pagos_puntuales"
  on public.pagos_puntuales for insert with check (auth.uid() = user_id);
create policy "Users update own pagos_puntuales"
  on public.pagos_puntuales for update using (auth.uid() = user_id);
create policy "Users delete own pagos_puntuales"
  on public.pagos_puntuales for delete using (auth.uid() = user_id);
