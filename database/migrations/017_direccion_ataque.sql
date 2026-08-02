-- Ojeo: corrige el significado de la columna añadida en la migración 016.
-- "lado_equipo_a" (que lado ocupaba el equipo A de la sesion) no basta para
-- normalizar zonas del campo, porque una sesion puede seguir a jugadores de
-- los dos equipos a la vez: hace falta saber hacia que lado atacaba el
-- EQUIPO DEL JUGADOR de cada accion en concreto, no el equipo A en general.
-- Se renombra la columna (mismos datos, mismo tipo) para reflejar ese nuevo
-- significado: a partir de ahora el codigo escribe aqui la direccion de
-- ataque del propio jugador en el momento del clic.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

alter table public.acciones_observacion
  rename column lado_equipo_a to direccion_ataque;

alter table public.acciones_observacion
  drop constraint if exists acciones_observacion_lado_equipo_a_check;

alter table public.acciones_observacion
  add constraint acciones_observacion_direccion_ataque_check
  check (direccion_ataque in ('izquierda', 'derecha'));

comment on column public.acciones_observacion.direccion_ataque is
  'Lado del campo hacia el que atacaba el EQUIPO DEL JUGADOR de esta accion en el momento de registrarla (no el equipo A de la sesion). Si el ojeador corrigio el lado a mitad de parte con el boton "Lados", solo las acciones registradas despues de esa correccion llevan el valor corregido.';

-- Comprobación opcional tras ejecutar:
-- select column_name, data_type from information_schema.columns
-- where table_name = 'acciones_observacion' and column_name = 'direccion_ataque';
