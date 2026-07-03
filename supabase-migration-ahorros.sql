-- ============================================================
-- Ahorros: cuentas de ahorro (Tenpo, APV, Ahorro a la Vivienda, etc.)
-- y sus aportes/ajustes de saldo.
--
-- cuentas_ahorro: la entidad de ahorro en sí. Puede tener un
-- aporte automático mensual (monto_automatico) activo desde
-- mes_inicio_automatico hasta mes_fin_automatico (null = indefinido).
--
-- aportes_ahorro: movimientos manuales ('manual') y ajustes de
-- saldo por interés u otras correcciones ('ajuste'). Los aportes
-- automáticos NO generan fila acá — se calculan al vuelo igual
-- que las cuotas de una subscripción en `compras`.
-- ============================================================

create table if not exists public.cuentas_ahorro (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  nombre                 text not null,
  entidad                text not null default '',
  tipo                   text not null default 'otro',
  color                  text not null default '#64748b',
  archivada              boolean not null default false,
  automatico             boolean not null default false,
  monto_automatico       integer not null default 0,
  mes_inicio_automatico  text,
  mes_fin_automatico     text,
  created_at             timestamptz not null default now()
);

create index if not exists cuentas_ahorro_user_archivada_idx on public.cuentas_ahorro (user_id, archivada);

alter table public.cuentas_ahorro enable row level security;

create policy "Users see own cuentas_ahorro"
  on public.cuentas_ahorro for select using (auth.uid() = user_id);
create policy "Users insert own cuentas_ahorro"
  on public.cuentas_ahorro for insert with check (auth.uid() = user_id);
create policy "Users update own cuentas_ahorro"
  on public.cuentas_ahorro for update using (auth.uid() = user_id);
create policy "Users delete own cuentas_ahorro"
  on public.cuentas_ahorro for delete using (auth.uid() = user_id);

create table if not exists public.aportes_ahorro (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  cuenta_ahorro_id  uuid not null references public.cuentas_ahorro(id) on delete cascade,
  mes_ym            text not null,
  tipo              text not null default 'manual' check (tipo in ('manual', 'ajuste')),
  monto             integer not null default 0,
  descripcion       text not null default '',
  created_at        timestamptz not null default now()
);

create index if not exists aportes_ahorro_user_mes_idx on public.aportes_ahorro (user_id, mes_ym);
create index if not exists aportes_ahorro_cuenta_idx on public.aportes_ahorro (cuenta_ahorro_id);

alter table public.aportes_ahorro enable row level security;

create policy "Users see own aportes_ahorro"
  on public.aportes_ahorro for select using (auth.uid() = user_id);
create policy "Users insert own aportes_ahorro"
  on public.aportes_ahorro for insert with check (auth.uid() = user_id);
create policy "Users update own aportes_ahorro"
  on public.aportes_ahorro for update using (auth.uid() = user_id);
create policy "Users delete own aportes_ahorro"
  on public.aportes_ahorro for delete using (auth.uid() = user_id);
