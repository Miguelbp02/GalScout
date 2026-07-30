-- Ojeo: numero de partidos jugados en cada etapa del historial, para cuando
-- no se conocen los minutos exactos pero si el numero de partidos.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

alter table public.jugadores_equipos
  add column if not exists partidos integer check (partidos is null or partidos >= 0);
