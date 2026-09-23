-- Plan de suscripción del usuario. Por ahora solo gating de acceso a
-- herramientas (sin cobro real todavía — se integra en una fase separada).
alter table public.profiles
  add column plan text not null default 'free' check (plan in ('free', 'pro'));

-- La policy "profiles_update_own" permite al usuario actualizar cualquier
-- columna de su propia fila (la usa, por ejemplo, el formulario de rol).
-- Sin este trigger, cualquier usuario autenticado podría auto-otorgarse
-- el plan Pro llamando a Supabase directo desde el cliente. Solo se
-- permite cambiar `plan` fuera de este trigger vía el rol `service_role`
-- (dashboard de Supabase, o el webhook de pagos cuando se integre).
create or replace function public.protect_profile_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.plan is distinct from old.plan and auth.role() <> 'service_role' then
    new.plan := old.plan;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_plan
  before update on public.profiles
  for each row
  execute function public.protect_profile_plan();
