-- In the PIN-only single-user app, old browsers may still carry an authenticated token.
-- Give anon and authenticated the same fixed-workspace RLS path so every route behaves consistently.
alter policy "hulwah public profile read" on public.profiles to anon, authenticated;
alter policy "hulwah public assignments read" on public.teacher_students to anon, authenticated;
alter policy "hulwah public students read" on public.students to anon, authenticated;
alter policy "hulwah public students update" on public.students to anon, authenticated;
alter policy "hulwah public sessions all" on public.tahfidz_sessions to anon, authenticated;
alter policy "hulwah public attendance all" on public.tahfidz_attendance to anon, authenticated;
alter policy "hulwah public submissions all" on public.memorization_submissions to anon, authenticated;
alter policy "hulwah public notes all" on public.student_notes to anon, authenticated;
alter policy "hulwah public focus all" on public.focus_items to anon, authenticated;
alter policy "hulwah public targets all" on public.weekly_targets to anon, authenticated;
alter policy "hulwah public progress read" on public.student_surah_progress to anon, authenticated;
alter policy "hulwah public reports all" on public.report_snapshots to anon, authenticated;
alter policy "hulwah public class targets read" on public.class_targets to anon, authenticated;
