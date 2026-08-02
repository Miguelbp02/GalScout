-- Ojeo: reequilibra el catalogo de etiquetas de accion de campo.
-- Se anaden mas etiquetas negativas (para no sesgar el perfil hacia lo
-- positivo) y dos ejes nuevos (tiro a puerta / centro), y se retiran dos
-- etiquetas que se solapaban con otras o alargaban demasiado el chip.
-- No se borran filas: puede haber acciones ya guardadas que las referencian.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

insert into public.etiquetas_accion (nombre, categoria, perfil, orden, activo)
values
  ('Pase clave', 'positiva', 'campo', 1, true),
  ('Centro preciso', 'positiva', 'campo', 2, true),
  ('Regate exitoso', 'positiva', 'campo', 3, true),
  ('Duelo ganado', 'positiva', 'campo', 4, true),
  ('Recuperación clave', 'positiva', 'campo', 5, true),
  ('Tiro a puerta', 'positiva', 'campo', 6, true),
  ('Asistencia', 'positiva', 'campo', 7, true),
  ('Gol', 'positiva', 'campo', 8, true),
  ('Pérdida', 'negativa', 'campo', 9, true),
  ('Regate fallido', 'negativa', 'campo', 10, true),
  ('Duelo perdido', 'negativa', 'campo', 11, true),
  ('Ocasión fallada', 'negativa', 'campo', 12, true),
  ('Falta cometida', 'negativa', 'campo', 13, true),
  ('Tarjeta', 'negativa', 'campo', 14, true)
on conflict (perfil, nombre) do update
set categoria = excluded.categoria,
    orden = excluded.orden,
    activo = true;

-- Se retiran del selector (quedan inactivas, no se borran).
update public.etiquetas_accion
set activo = false
where perfil = 'campo'
  and es_sustitucion = false
  and nombre in ('Cambio de orientación exitoso', 'Error no forzado');

-- Comprobación opcional tras ejecutar:
-- select nombre, categoria, orden, activo from public.etiquetas_accion
-- where perfil = 'campo' and es_sustitucion = false
-- order by activo desc, orden;
