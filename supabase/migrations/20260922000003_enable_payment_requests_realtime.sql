-- Permite que el cliente del usuario reciba en vivo el cambio de estado
-- de su propia solicitud de pago (aprobado/rechazado) vía Supabase
-- Realtime, para disparar el festejo de "Pro activado" sin recargar la
-- página. Realtime respeta las policies de RLS ya existentes
-- (payment_requests_select_own) — cada cliente solo recibe cambios de
-- sus propias filas, sin importar que la aprobación la haga el admin
-- vía el cliente `service_role`.
alter publication supabase_realtime add table public.payment_requests;
