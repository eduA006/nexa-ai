-- Documentos subidos por el usuario.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  original_filename text not null,
  file_type text not null,
  storage_path text not null unique,
  processed_storage_path text,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'processed', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_user_id_created_at_idx
  on public.documents (user_id, created_at desc);

alter table public.documents enable row level security;

create policy "documents_select_own"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "documents_insert_own"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "documents_update_own"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "documents_delete_own"
  on public.documents for delete
  using (auth.uid() = user_id);

-- Reutiliza la función creada en la migración de profiles.
create trigger documents_set_updated_at
  before update on public.documents
  for each row
  execute function public.set_updated_at();
