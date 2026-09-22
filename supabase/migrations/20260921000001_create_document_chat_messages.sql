-- Historial de conversación de "Chat con documentos" (Fase 9). Un
-- documento puede tener múltiples mensajes (usuario/asistente) que
-- forman una sola conversación continua asociada a ese documento.
create table public.document_chat_messages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index document_chat_messages_document_id_created_at_idx
  on public.document_chat_messages (document_id, created_at);

alter table public.document_chat_messages enable row level security;

create policy "document_chat_messages_select_own"
  on public.document_chat_messages for select
  using (auth.uid() = user_id);

create policy "document_chat_messages_insert_own"
  on public.document_chat_messages for insert
  with check (auth.uid() = user_id);

create policy "document_chat_messages_delete_own"
  on public.document_chat_messages for delete
  using (auth.uid() = user_id);
