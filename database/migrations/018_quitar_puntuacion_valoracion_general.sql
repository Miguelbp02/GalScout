-- Ojeo: las valoraciones generales pasan a llamarse "informes generales" y
-- dejan de llevar una puntuación numérica de 0 a 20. Esos números eran para
-- uso interno del ojeador y podían malinterpretarse si se entregan tal cual
-- a un equipo en una exportación; el informe general debe quedar como texto
-- limpio, sin cifras que necesiten contexto para interpretarse.
-- Ejecutar desde Supabase: SQL Editor > New query > Run.

alter table public.valoraciones_generales
  drop column if exists puntuacion;

-- Comprobación opcional tras ejecutar:
-- select column_name from information_schema.columns
-- where table_schema = 'public' and table_name = 'valoraciones_generales';
