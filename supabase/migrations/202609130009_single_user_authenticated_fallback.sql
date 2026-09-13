-- Compatibility for browsers that still carry a pre-PIN Supabase auth session.
-- The app is intentionally single-user; Settings RPCs must work for both anon and authenticated roles.
grant execute on function public.unlock_hulwah_settings(text) to authenticated;
grant execute on function public.hulwah_settings_session_valid(uuid) to authenticated;
grant execute on function public.lock_hulwah_settings(uuid) to authenticated;
