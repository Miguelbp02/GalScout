-- Ojeo: evento de sustitucion (entra/sale) en el modo de ojeo de partido.
-- Se modela como dos etiquetas especiales que no representan una jugada en
-- una zona del campo, asi que se marcan aparte para no dibujarlas como
-- puntos sobre el cesped.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

alter table public.etiquetas_accion
  add column if not exists es_sustitucion boolean not null default false;

insert into public.etiquetas_accion (nombre, categoria, perfil, orden, es_sustitucion)
values
  ('Entra al campo', 'neutra', 'campo', 100, true),
  ('Sale del campo', 'neutra', 'campo', 101, true)
on conflict (perfil, nombre) do nothing;

-- Comprobación opcional tras ejecutar:
-- select nombre, perfil, es_sustitucion from public.etiquetas_accion
-- where es_sustitucion = true;
