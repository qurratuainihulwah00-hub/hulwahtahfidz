-- Keep fast read snapshot RPCs available for the public single-user dashboard while restricting all other callers.
-- This migration is intentionally small and idempotent.

revoke all on function public.hulwah_dashboard_snapshot() from public;
revoke all on function public.hulwah_attendance_snapshot(date) from public;
revoke all on function public.hulwah_student_overviews_snapshot() from public;
revoke all on function public.hulwah_submission_queue_snapshot(date) from public;

grant execute on function public.hulwah_dashboard_snapshot() to anon, authenticated;
grant execute on function public.hulwah_attendance_snapshot(date) to anon, authenticated;
grant execute on function public.hulwah_student_overviews_snapshot() to anon, authenticated;
grant execute on function public.hulwah_submission_queue_snapshot(date) to anon, authenticated;
