-- Ojeo: permitir al grupo interno eliminar informes de scouting.
-- Las valoraciones de una observación se eliminan automáticamente por la FK
-- observacion_id con ON DELETE CASCADE.

drop policy if exists "Ojeadores autenticados pueden eliminar observaciones" on public.observaciones_jugador;

create policy "Ojeadores autenticados pueden eliminar observaciones"
on public.observaciones_jugador
for delete
to authenticated
using (true);

drop policy if exists "Ojeadores autenticados pueden eliminar valoraciones generales" on public.valoraciones_generales;

create policy "Ojeadores autenticados pueden eliminar valoraciones generales"
on public.valoraciones_generales
for delete
to authenticated
using (true);
