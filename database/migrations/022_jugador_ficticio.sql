-- Ojeo: marca de jugadores ficticios para pruebas.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

alter table public.jugadores
  add column if not exists es_ficticio boolean not null default false;
