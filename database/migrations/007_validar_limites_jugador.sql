-- Ojeo: evita jugadores fuera de los rangos visibles de la app.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

-- Si existen datos antiguos fuera de rango, detenemos la migracion para que
-- se corrijan conscientemente antes de aplicar las restricciones.
do $$
begin
  if exists (
    select 1
    from public.jugadores
    where edad not between 10 and 30
       or altura_cm not between 130 and 220
  ) then
    raise exception
      'Hay jugadores fuera de los rangos permitidos (edad 10-30, altura 130-220). Corrigelos antes de continuar.';
  end if;
end;
$$;

alter table public.jugadores
  drop constraint if exists jugadores_edad_check,
  drop constraint if exists jugadores_altura_cm_check;

alter table public.jugadores
  add constraint jugadores_edad_check
    check (edad between 10 and 30),
  add constraint jugadores_altura_cm_check
    check (altura_cm between 130 and 220);
