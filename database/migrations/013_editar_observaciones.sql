-- Ojeo: permite editar informes ya guardados (observaciones_jugador) y sus
-- valoraciones asociadas. La edicion borra las valoraciones antiguas antes
-- de insertar las nuevas, asi que hace falta permiso de borrado ahi tambien.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

drop policy if exists "Ojeadores autenticados pueden editar observaciones" on public.observaciones_jugador;

create policy "Ojeadores autenticados pueden editar observaciones"
on public.observaciones_jugador
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Ojeadores autenticados pueden eliminar valoraciones de informes" on public.valoraciones_observacion;

create policy "Ojeadores autenticados pueden eliminar valoraciones de informes"
on public.valoraciones_observacion
for delete
to authenticated
using (true);

-- Comprobación opcional tras ejecutar:
-- select tablename, policyname, cmd from pg_policies
-- where schemaname = 'public'
--   and tablename in ('observaciones_jugador', 'valoraciones_observacion')
-- order by tablename, cmd;
