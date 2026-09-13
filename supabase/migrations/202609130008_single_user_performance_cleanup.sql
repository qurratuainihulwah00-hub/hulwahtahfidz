-- Tahfidz with Hulwah: remove obsolete authenticated-era policies after moving to the fixed single-user workspace.
-- Public dashboard policies from migration 006 remain the only RLS path for application data.

drop policy if exists "profile self read" on public.profiles;
drop policy if exists "profile self update" on public.profiles;
drop policy if exists "teacher assignments self" on public.teacher_students;
drop policy if exists "teacher can read assigned students" on public.students;
drop policy if exists "teacher can update assigned students" on public.students;
drop policy if exists "sessions self all" on public.tahfidz_sessions;
drop policy if exists "attendance self read" on public.tahfidz_attendance;
drop policy if exists "attendance self write" on public.tahfidz_attendance;
drop policy if exists "submissions self all" on public.memorization_submissions;
drop policy if exists "notes self all" on public.student_notes;
drop policy if exists "focus self all" on public.focus_items;
drop policy if exists "targets self all" on public.weekly_targets;
drop policy if exists "progress self all" on public.student_surah_progress;
drop policy if exists "reports self all" on public.report_snapshots;
drop policy if exists "class targets self all" on public.class_targets;

create index if not exists idx_teacher_students_student on public.teacher_students(student_id);
create index if not exists idx_attendance_recorded_by on public.tahfidz_attendance(recorded_by);
create index if not exists idx_submissions_student on public.memorization_submissions(student_id);
create index if not exists idx_submissions_session on public.memorization_submissions(session_id) where session_id is not null;
create index if not exists idx_notes_student on public.student_notes(student_id);
create index if not exists idx_notes_source_submission on public.student_notes(source_submission_id) where source_submission_id is not null;
create index if not exists idx_focus_student on public.focus_items(student_id);
create index if not exists idx_targets_student on public.weekly_targets(student_id);
create index if not exists idx_surah_progress_student on public.student_surah_progress(student_id);
create index if not exists idx_reports_student on public.report_snapshots(student_id);

revoke execute on function public.create_assigned_student(text,text,text) from authenticated;
revoke execute on function public.unassign_student(uuid) from authenticated;
revoke execute on function public.unlock_hulwah_settings(text) from authenticated;
revoke execute on function public.hulwah_settings_session_valid(uuid) from authenticated;
revoke execute on function public.lock_hulwah_settings(uuid) from authenticated;
