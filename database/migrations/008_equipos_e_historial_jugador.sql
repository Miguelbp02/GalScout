-- GalScout: equipos e historial deportivo de cada jugador.
-- Ejecutar este archivo desde Supabase: SQL Editor > New query > Run.

-- Un equipo se crea una sola vez y puede reutilizarse en muchos historiales.
-- El nombre se mantiene libre para poder registrar cualquier equipo que aparezca.
create table if not exists public.equipos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) > 0),
  created_at timestamptz not null default now()
);

-- Evita duplicados que solo se diferencien por mayúsculas, minúsculas o espacios.
create unique index if not exists equipos_nombre_normalizado_idx
  on public.equipos (lower(trim(nombre)));

-- Cada registro representa una etapa de un jugador en un equipo.
-- Las cifras se dejan en null cuando no se conocen: no es lo mismo que cero goles o minutos.
create table if not exists public.jugadores_equipos (
  id uuid primary key default gen_random_uuid(),
  jugador_id uuid not null references public.jugadores (id) on delete cascade,
  equipo_id uuid not null references public.equipos (id) on delete restrict,
  temporada text,
  fecha_inicio date,
  fecha_fin date,
  goles integer check (goles is null or goles >= 0),
  minutos integer check (minutos is null or minutos >= 0),
  notas text not null default '',
  es_actual boolean not null default false,
  created_at timestamptz not null default now(),
  check (fecha_fin is null or fecha_inicio is null or fecha_fin >= fecha_inicio)
);

-- Un jugador no puede tener dos equipos actuales al mismo tiempo.
create unique index if not exists jugadores_equipos_un_equipo_actual_idx
  on public.jugadores_equipos (jugador_id)
  where es_actual;

create index if not exists jugadores_equipos_jugador_idx
  on public.jugadores_equipos (jugador_id, es_actual desc, fecha_inicio desc nulls last);

create index if not exists jugadores_equipos_equipo_idx
  on public.jugadores_equipos (equipo_id);

alter table public.equipos enable row level security;
alter table public.jugadores_equipos enable row level security;

-- Este MVP es una herramienta privada y compartida: los ojeadores autenticados
-- pueden consultar y mantener el catálogo de equipos y los historiales.
drop policy if exists "Ojeadores autenticados pueden ver equipos" on public.equipos;
drop policy if exists "Ojeadores autenticados pueden crear equipos" on public.equipos;
drop policy if exists "Ojeadores autenticados pueden editar equipos" on public.equipos;
drop policy if exists "Ojeadores autenticados pueden eliminar equipos" on public.equipos;

create policy "Ojeadores autenticados pueden ver equipos"
on public.equipos
for select
to authenticated
using (true);

create policy "Ojeadores autenticados pueden crear equipos"
on public.equipos
for insert
to authenticated
with check (true);

create policy "Ojeadores autenticados pueden editar equipos"
on public.equipos
for update
to authenticated
using (true)
with check (true);

create policy "Ojeadores autenticados pueden eliminar equipos"
on public.equipos
for delete
to authenticated
using (true);

drop policy if exists "Ojeadores autenticados pueden ver historiales de equipos" on public.jugadores_equipos;
drop policy if exists "Ojeadores autenticados pueden crear historiales de equipos" on public.jugadores_equipos;
drop policy if exists "Ojeadores autenticados pueden editar historiales de equipos" on public.jugadores_equipos;
drop policy if exists "Ojeadores autenticados pueden eliminar historiales de equipos" on public.jugadores_equipos;

create policy "Ojeadores autenticados pueden ver historiales de equipos"
on public.jugadores_equipos
for select
to authenticated
using (true);

create policy "Ojeadores autenticados pueden crear historiales de equipos"
on public.jugadores_equipos
for insert
to authenticated
with check (true);

create policy "Ojeadores autenticados pueden editar historiales de equipos"
on public.jugadores_equipos
for update
to authenticated
using (true)
with check (true);

create policy "Ojeadores autenticados pueden eliminar historiales de equipos"
on public.jugadores_equipos
for delete
to authenticated
using (true);

-- Comprobación opcional tras ejecutar:
-- select tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
--   and tablename in ('equipos', 'jugadores_equipos');
