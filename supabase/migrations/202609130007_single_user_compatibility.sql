-- Compatibility shim for existing server data loader in open single-user mode.
-- The workspace is seeded by migration 006; this RPC is intentionally read-only.
create or replace function public.bootstrap_hulwah_workspace() returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'teacher_id', '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid,
    'students_created', 0
  );
$$;

revoke all on function public.bootstrap_hulwah_workspace() from public;
grant execute on function public.bootstrap_hulwah_workspace() to anon, authenticated;
