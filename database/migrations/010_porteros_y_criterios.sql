-- GalScout: soporte para porteros y sus criterios específicos.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

-- Los criterios existentes pasan a ser los de jugadores de campo.
alter table public.criterios_scouting
  add column if not exists perfil text not null default 'campo';

alter table public.criterios_scouting
  drop constraint if exists criterios_scouting_perfil_check;

alter table public.criterios_scouting
  add constraint criterios_scouting_perfil_check
  check (perfil in ('campo', 'portero'));

-- El mismo nombre puede existir en ambos perfiles: por ejemplo, Agilidad.
alter table public.criterios_scouting
  drop constraint if exists criterios_scouting_nombre_key;

alter table public.criterios_scouting
  drop constraint if exists criterios_scouting_perfil_nombre_key;

alter table public.criterios_scouting
  add constraint criterios_scouting_perfil_nombre_key unique (perfil, nombre);

-- Amplía el grupo de posiciones sin asumir el nombre que pudiera tener
-- la restricción anterior, creada manualmente en Supabase.
do $$
declare
  restriccion_grupo text;
begin
  select conname
  into restriccion_grupo
  from pg_constraint
  where conrelid = 'public.posiciones'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%grupo%'
  limit 1;

  if restriccion_grupo is not null then
    execute format(
      'alter table public.posiciones drop constraint %I',
      restriccion_grupo
    );
  end if;
end;
$$;

alter table public.posiciones
  add constraint posiciones_grupo_check
  check (grupo in ('Portería', 'Defensa', 'Centrocampo', 'Ataque'));

-- La zona PT ya existe en el campo interactivo; este registro la habilita.
insert into public.posiciones (codigo, nombre, grupo, orden, activo)
values (
  'portero',
  'Portero',
  'Portería',
  (select coalesce(max(orden), 0) + 1 from public.posiciones),
  true
)
on conflict (codigo) do update
set
  nombre = excluded.nombre,
  grupo = excluded.grupo,
  orden = excluded.orden,
  activo = true;

-- 28 criterios específicos para guardametas.
insert into public.criterios_scouting (nombre, grupo, orden, perfil)
values
  ('Explosividad', 'Físico', 1, 'portero'),
  ('Agilidad', 'Físico', 2, 'portero'),
  ('Potencia de salto', 'Físico', 3, 'portero'),
  ('Alcance aéreo', 'Físico', 4, 'portero'),
  ('Velocidad de desplazamiento', 'Físico', 5, 'portero'),
  ('Blocaje', 'Técnico', 1, 'portero'),
  ('Desvíos y rechaces', 'Técnico', 2, 'portero'),
  ('Estiradas', 'Técnico', 3, 'portero'),
  ('Juego de pies', 'Técnico', 4, 'portero'),
  ('Pase corto', 'Técnico', 5, 'portero'),
  ('Desplazamiento largo', 'Técnico', 6, 'portero'),
  ('Saque de mano', 'Técnico', 7, 'portero'),
  ('Golpeo con pierna no dominante', 'Técnico', 8, 'portero'),
  ('Colocación', 'Táctico', 1, 'portero'),
  ('1 contra 1', 'Táctico', 2, 'portero'),
  ('Dominio del área', 'Táctico', 3, 'portero'),
  ('Salidas aéreas', 'Táctico', 4, 'portero'),
  ('Salidas al espacio', 'Táctico', 5, 'portero'),
  ('Lectura de centros', 'Táctico', 6, 'portero'),
  ('Organización defensiva', 'Táctico', 7, 'portero'),
  ('Inicio de juego', 'Táctico', 8, 'portero'),
  ('Gestión de la línea defensiva', 'Táctico', 9, 'portero'),
  ('Concentración', 'Mental', 1, 'portero'),
  ('Toma de decisiones', 'Mental', 2, 'portero'),
  ('Serenidad bajo presión', 'Mental', 3, 'portero'),
  ('Valentía', 'Mental', 4, 'portero'),
  ('Comunicación y liderazgo', 'Mental', 5, 'portero'),
  ('Capacidad de reacción tras error', 'Mental', 6, 'portero')
on conflict (perfil, nombre) do update
set
  grupo = excluded.grupo,
  orden = excluded.orden,
  activo = true;

-- Comprobación opcional:
-- select perfil, grupo, count(*) from public.criterios_scouting
-- group by perfil, grupo order by perfil, grupo;
