-- Ojeo: asigna el nombre y apellidos reales a los perfiles de los ojeadores autorizados.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.
--
-- Edita la lista de VALUES con el correo exacto (el mismo con el que inician sesión)
-- y el nombre completo que debe aparecer en los informes. Puedes volver a ejecutar
-- este script cuando quieras corregir o añadir nombres: solo actualiza los correos
-- que incluyas aquí y no toca al resto de perfiles.
--
-- Si un correo autorizado no aparece en esta lista, su perfil sigue mostrando
-- el nombre que ya tuviera (por defecto, la parte inicial del correo, tal y como
-- lo asigna el trigger de 001_ojeo_0_2_2.sql).

with nombres_reales (email, nombre) as (
  values
    ('correo1@ejemplo.com', 'Nombre Apellido1'),
    ('correo2@ejemplo.com', 'Nombre Apellido2')
    -- Añade aquí más filas: ('correo@ejemplo.com', 'Nombre Apellidos'),
)
update public.perfiles
set nombre = nombres_reales.nombre
from nombres_reales
join auth.users on auth.users.email = nombres_reales.email
where perfiles.id = auth.users.id;
