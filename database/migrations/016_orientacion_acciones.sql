-- Ojeo: guarda la orientacion del partido en el momento de cada accion.
-- Hasta ahora solo se guardaba la parte (1 o 2), pero el lado que ocupaba
-- el equipo A puede cambiar tanto en el descanso como por una correccion
-- manual a mitad de partido, y sin ese dato las coordenadas x/y de dos
-- acciones no son comparables entre si (una ventana de estadisticas no
-- podria "voltear" el campo para que todas las acciones de un jugador
-- se vean atacando siempre hacia el mismo lado).
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

alter table public.acciones_observacion
  add column if not exists lado_equipo_a text not null default 'izquierda'
  check (lado_equipo_a in ('izquierda', 'derecha'));

comment on column public.acciones_observacion.lado_equipo_a is
  'Lado que ocupaba el equipo A (sesion.ladoEquipoA) en el momento de registrar la accion. Las acciones guardadas antes de esta migracion quedan con el valor por defecto y no se pueden normalizar con certeza.';

-- Comprobación opcional tras ejecutar:
-- select column_name, data_type, column_default from information_schema.columns
-- where table_name = 'acciones_observacion' and column_name = 'lado_equipo_a';
