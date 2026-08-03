-- Ojeo 0.2.4: tabla de sugerencias (bugs e ideas de mejora) reportadas desde la app.

create table if not exists public.sugerencias (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null default auth.uid() references auth.users (id) on delete restrict,
  tipo text not null check (tipo in ('bug', 'mejora')),
  mensaje text not null,
  created_at timestamptz not null default now()
);

create index if not exists sugerencias_created_at_idx
  on public.sugerencias (created_at desc);

alter table public.sugerencias enable row level security;

drop policy if exists "Ojeadores autenticados pueden ver sugerencias" on public.sugerencias;
drop policy if exists "Ojeadores autenticados pueden crear sugerencias propias" on public.sugerencias;
drop policy if exists "Autores pueden borrar sus sugerencias" on public.sugerencias;

create policy "Ojeadores autenticados pueden ver sugerencias"
on public.sugerencias
for select
to authenticated
using (true);

create policy "Ojeadores autenticados pueden crear sugerencias propias"
on public.sugerencias
for insert
to authenticated
with check (autor_id = (select auth.uid()));

create policy "Autores pueden borrar sus sugerencias"
on public.sugerencias
for delete
to authenticated
using (autor_id = (select auth.uid()));
