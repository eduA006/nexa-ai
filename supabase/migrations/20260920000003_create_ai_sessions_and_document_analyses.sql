-- Registro de cada llamada a un proveedor de IA. Se usa para el límite
-- diario (MAX_AI_REQUESTS_PER_DAY) y para el historial (Fase 12).
create table public.ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  input text,
  result jsonb,
  provider text not null,
  model text not null,
  tokens_used integer,
  created_at timestamptz not null default now()
);

create index ai_sessions_user_id_created_at_idx
  on public.ai_sessions (user_id, created_at desc);

alter table public.ai_sessions enable row level security;

create policy "ai_sessions_select_own"
  on public.ai_sessions for select
  using (auth.uid() = user_id);

create policy "ai_sessions_insert_own"
  on public.ai_sessions for insert
  with check (auth.uid() = user_id);

-- Resultado de un análisis de documento (ej. diagnóstico APA) asociado a
-- una fila de `documents`. Se añade user_id (además de document_id) para
-- que la política RLS sea directa, siguiendo el mismo patrón que el
-- resto de tablas de la app.
create table public.document_analyses (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_type text not null,
  result jsonb not null,
  score integer,
  created_at timestamptz not null default now()
);

create index document_analyses_document_id_idx
  on public.document_analyses (document_id);

alter table public.document_analyses enable row level security;

create policy "document_analyses_select_own"
  on public.document_analyses for select
  using (auth.uid() = user_id);

create policy "document_analyses_insert_own"
  on public.document_analyses for insert
  with check (auth.uid() = user_id);
