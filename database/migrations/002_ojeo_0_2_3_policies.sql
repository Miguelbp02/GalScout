-- Ojeo 0.2.3: políticas RLS para los datos internos de scouting.
-- Ejecutar después de 001_ojeo_0_2_2.sql.

-- Perfiles: cualquier ojeador autenticado puede conocer el nombre de los demás.
drop policy if exists "Ojeadores autenticados pueden ver perfiles" on public.perfiles;

create policy "Ojeadores autenticados pueden ver perfiles"
on public.perfiles
for select
to authenticated
using (true);

-- Criterios: catálogo de solo lectura dentro de la aplicación.
drop policy if exists "Ojeadores autenticados pueden ver criterios" on public.criterios_scouting;

create policy "Ojeadores autenticados pueden ver criterios"
on public.criterios_scouting
for select
to authenticated
using (true);

-- Observaciones: son compartidas dentro del grupo, pero cada autor solo crea las suyas.
drop policy if exists "Ojeadores autenticados pueden ver observaciones" on public.observaciones_jugador;
drop policy if exists "Ojeadores autenticados pueden crear observaciones propias" on public.observaciones_jugador;

create policy "Ojeadores autenticados pueden ver observaciones"
on public.observaciones_jugador
for select
to authenticated
using (true);

create policy "Ojeadores autenticados pueden crear observaciones propias"
on public.observaciones_jugador
for insert
to authenticated
with check (autor_id = (select auth.uid()));

-- Valoraciones de un informe: son compartidas, pero solo el autor del informe puede añadirlas.
drop policy if exists "Ojeadores autenticados pueden ver valoraciones de informes" on public.valoraciones_observacion;
drop policy if exists "Autores pueden crear valoraciones de sus informes" on public.valoraciones_observacion;

create policy "Ojeadores autenticados pueden ver valoraciones de informes"
on public.valoraciones_observacion
for select
to authenticated
using (true);

create policy "Autores pueden crear valoraciones de sus informes"
on public.valoraciones_observacion
for insert
to authenticated
with check (
  exists (
    select 1
    from public.observaciones_jugador
    where observaciones_jugador.id = observacion_id
      and observaciones_jugador.autor_id = (select auth.uid())
  )
);

-- Valoraciones generales: compartidas, pero cada ojeador solo crea las propias.
drop policy if exists "Ojeadores autenticados pueden ver valoraciones generales" on public.valoraciones_generales;
drop policy if exists "Ojeadores autenticados pueden crear valoraciones generales propias" on public.valoraciones_generales;

create policy "Ojeadores autenticados pueden ver valoraciones generales"
on public.valoraciones_generales
for select
to authenticated
using (true);

create policy "Ojeadores autenticados pueden crear valoraciones generales propias"
on public.valoraciones_generales
for insert
to authenticated
with check (autor_id = (select auth.uid()));
