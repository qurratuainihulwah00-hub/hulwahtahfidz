-- Tahfidz with Hulwah — Data API grants for authenticated teacher access.
-- RLS remains the authorization boundary; anonymous access is intentionally not granted.

grant usage on schema public to authenticated;

grant select, update on table public.profiles to authenticated;
grant select, update on table public.students to authenticated;
grant select on table public.teacher_students to authenticated;
grant select, insert, update, delete on table public.tahfidz_sessions to authenticated;
grant select, insert, update, delete on table public.tahfidz_attendance to authenticated;
grant select, insert, update, delete on table public.memorization_submissions to authenticated;
grant select, insert, update, delete on table public.student_notes to authenticated;
grant select, insert, update, delete on table public.focus_items to authenticated;
grant select, insert, update, delete on table public.weekly_targets to authenticated;
grant select, insert, update, delete on table public.student_surah_progress to authenticated;
grant select, insert, update, delete on table public.report_snapshots to authenticated;
grant select, insert, update, delete on table public.class_targets to authenticated;
grant select on table public.student_progress_summary to authenticated;

revoke all on table public.profiles from anon;
revoke all on table public.students from anon;
revoke all on table public.teacher_students from anon;
revoke all on table public.tahfidz_sessions from anon;
revoke all on table public.tahfidz_attendance from anon;
revoke all on table public.memorization_submissions from anon;
revoke all on table public.student_notes from anon;
revoke all on table public.focus_items from anon;
revoke all on table public.weekly_targets from anon;
revoke all on table public.student_surah_progress from anon;
revoke all on table public.report_snapshots from anon;
revoke all on table public.class_targets from anon;
revoke all on table public.student_progress_summary from anon;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_surah_progress() from public, anon, authenticated;
