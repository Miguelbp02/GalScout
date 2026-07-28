-- Ojeo 0.3.4: modelo posicional natural / apta.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.
--
-- Importante: esta migración no elimina todavía las columnas heredadas
-- jugadores.posicion ni jugadores.posicion_principal_id. El frontend actual
-- aún las consulta; se retirarán tras adaptar las pantallas al nuevo modelo.

-- La denominación anterior "ideal" pasa a llamarse "natural".
-- Primero se elimina la restricción para poder actualizar los datos existentes.
alter table public.jugadores_posiciones
  drop constraint if exists jugadores_posiciones_tipo_check;

update public.jugadores_posiciones
set tipo = 'natural'
where tipo = 'ideal';

alter table public.jugadores_posiciones
  add constraint jugadores_posiciones_tipo_check
  check (tipo in ('natural', 'apta'));

-- Al editar el perfil posicional será necesario quitar relaciones existentes.
-- La aplicación seguirá limitada a usuarios que hayan iniciado sesión.
drop policy if exists "Ojeadores autenticados pueden eliminar posiciones de jugadores"
  on public.jugadores_posiciones;

create policy "Ojeadores autenticados pueden eliminar posiciones de jugadores"
on public.jugadores_posiciones
for delete
to authenticated
using (true);

-- Comprobación opcional al terminar:
-- select tipo, count(*) from public.jugadores_posiciones group by tipo order by tipo;
