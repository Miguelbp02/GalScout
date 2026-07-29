-- Ojeo: categoría opcional del jugador.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

alter table public.jugadores
  add column if not exists categoria text;

alter table public.jugadores
  drop constraint if exists jugadores_categoria_check;

alter table public.jugadores
  add constraint jugadores_categoria_check
  check (categoria is null or categoria in ('Cadete', 'Juvenil', 'Senior'));

-- Un jugador puede estar adelantado a su categoría, pero no atrasado.
alter table public.jugadores
  drop constraint if exists jugadores_categoria_edad_check;

alter table public.jugadores
  add constraint jugadores_categoria_edad_check
  check (
    categoria is null
    or categoria = 'Senior'
    or (categoria = 'Juvenil' and edad <= 18)
    or (categoria = 'Cadete' and edad <= 15)
  );
