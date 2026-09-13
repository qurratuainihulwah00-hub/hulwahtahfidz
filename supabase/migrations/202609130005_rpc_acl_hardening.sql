-- Tahfidz with Hulwah — harden SECURITY DEFINER RPC ACLs.
-- Teacher RPCs remain callable only after authentication; internal trigger/event functions are not API-callable.

revoke all on function public.bootstrap_hulwah_workspace() from public, anon;
revoke all on function public.create_assigned_student(text,text,text) from public, anon;
revoke all on function public.unassign_student(uuid) from public, anon;

grant execute on function public.bootstrap_hulwah_workspace() to authenticated;
grant execute on function public.create_assigned_student(text,text,text) to authenticated;
grant execute on function public.unassign_student(uuid) to authenticated;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_surah_progress() from public, anon, authenticated;
