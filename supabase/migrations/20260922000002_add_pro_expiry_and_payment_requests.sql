-- Pro es un pago manual recurrente (Yape, S/ 5 semanales) sin cobro
-- automático — necesita una fecha de expiración explícita en vez de
-- "una vez Pro, Pro para siempre".
alter table public.profiles
  add column pro_expires_at timestamptz;

-- Reemplaza el trigger de la migración anterior: ahora protege tanto
-- `plan` como `pro_expires_at` contra que el propio usuario se
-- autoextienda el Pro llamando a Supabase directo desde el cliente.
-- Solo `service_role` (la acción de aprobación del admin) puede
-- cambiar cualquiera de las dos columnas.
create or replace function public.protect_profile_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() <> 'service_role' then
    if new.plan is distinct from old.plan then
      new.plan := old.plan;
    end if;
    if new.pro_expires_at is distinct from old.pro_expires_at then
      new.pro_expires_at := old.pro_expires_at;
    end if;
  end if;
  return new;
end;
$$;

-- Solicitudes de pago manual por Yape. El usuario sube un comprobante;
-- un admin (identificado por email vía `ADMIN_EMAILS`, no por un rol en
-- la base de datos) aprueba o rechaza desde /admin/pagos usando el
-- cliente con `service_role`, que activa el Pro al aprobar.
create table public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_pen numeric(6, 2) not null default 5.00,
  period text not null default 'weekly' check (period in ('weekly')),
  proof_storage_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

alter table public.payment_requests enable row level security;

create policy "payment_requests_select_own"
  on public.payment_requests for select
  using (auth.uid() = user_id);

create policy "payment_requests_insert_own"
  on public.payment_requests for insert
  with check (auth.uid() = user_id);

-- Sin policy de update/delete para usuarios: solo `service_role` (que
-- bypassa RLS) puede cambiar el estado de una solicitud — la revisión
-- del admin nunca pasa por el cliente autenticado normal.

-- Bucket privado para las capturas de comprobantes de pago.
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "payment_proofs_storage_select_own"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "payment_proofs_storage_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
