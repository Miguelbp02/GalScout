-- GalScout: los nombres de equipo se guardan siempre en MAYÚSCULAS.
-- Ejecutar una sola vez desde Supabase: SQL Editor > New query > Run.

-- Actualiza los equipos que ya existan.
update public.equipos
set nombre = upper(trim(nombre));

-- Protege la regla también ante cambios hechos fuera del frontend.
create or replace function public.normalizar_nombre_equipo()
returns trigger
language plpgsql
as $$
begin
  new.nombre := upper(trim(new.nombre));
  return new;
end;
$$;

drop trigger if exists normalizar_nombre_equipo_antes_de_guardar on public.equipos;

create trigger normalizar_nombre_equipo_antes_de_guardar
before insert or update of nombre on public.equipos
for each row
execute function public.normalizar_nombre_equipo();

-- Comprobación opcional:
-- select nombre from public.equipos order by nombre;
