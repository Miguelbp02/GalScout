-- Ojeo: cada etapa del historial deportivo pasa a poder registrar en qué
-- categoría (Cadete/Juvenil/Senior) y en qué liga/división jugaba el equipo
-- esa temporada, y en qué grupo provincial (para las divisiones de Futgal
-- que se juegan por provincia: 1ª/2ª/3ª Futgal y sus equivalentes juvenil y
-- cadete). Los valores válidos de liga y grupo los controla la aplicación
-- (listas cerradas), no hace falta una restricción en BD.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

alter table public.jugadores_equipos
  add column if not exists categoria text,
  add column if not exists liga text,
  add column if not exists grupo_provincia text,
  add column if not exists dorsal smallint;

-- Comprobación opcional tras ejecutar:
-- select column_name from information_schema.columns
-- where table_schema = 'public' and table_name = 'jugadores_equipos';
