-- Ojeo: eliminación completa de un jugador.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

-- Las observaciones y valoraciones ya usan ON DELETE CASCADE.
-- Aseguramos el mismo comportamiento para el perfil posicional.
do $$
declare
  restriccion text;
begin
  select conname into restriccion
  from pg_constraint
  where conrelid = 'public.jugadores_posiciones'::regclass
    and contype = 'f'
    and confrelid = 'public.jugadores'::regclass
  limit 1;

  if restriccion is not null then
    execute format(
      'alter table public.jugadores_posiciones drop constraint %I',
      restriccion
    );
  end if;
end $$;

alter table public.jugadores_posiciones
  add constraint jugadores_posiciones_jugador_id_fkey
  foreign key (jugador_id)
  references public.jugadores (id)
  on delete cascade;

drop policy if exists "Ojeadores autenticados pueden eliminar jugadores"
  on public.jugadores;

create policy "Ojeadores autenticados pueden eliminar jugadores"
on public.jugadores
for delete
to authenticated
using (true);
