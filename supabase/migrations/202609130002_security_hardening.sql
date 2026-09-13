-- Tahfidz with Hulwah — hardening after the initial schema.
-- Adds consistent timestamps, safe RLS checks, reusable student RPCs,
-- and a security-invoker progress view.

alter table public.teacher_students add column if not exists unassigned_at timestamptz;
alter table public.tahfidz_sessions add column if not exists updated_at timestamptz not null default now();
alter table public.tahfidz_attendance add column if not exists created_at timestamptz not null default now();
alter table public.memorization_submissions add column if not exists updated_at timestamptz not null default now();
alter table public.focus_items add column if not exists updated_at timestamptz not null default now();
alter table public.weekly_targets add column if not exists updated_at timestamptz not null default now();
alter table public.student_notes add column if not exists source_submission_id uuid references public.memorization_submissions(id) on delete set null;

create index if not exists idx_attendance_student on public.tahfidz_attendance(student_id);
create index if not exists idx_targets_teacher_student_week on public.weekly_targets(teacher_id, student_id, week_start desc);
create index if not exists idx_reports_teacher_period on public.report_snapshots(teacher_id, period_type, period_key);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path=public as $$
begin
  new.updated_at = now();
  return new;
end; $$;

do $$
begin
  if not exists(select 1 from pg_trigger where tgname='trg_profiles_updated') then create trigger trg_profiles_updated before update on public.profiles for each row execute procedure public.touch_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='trg_students_updated') then create trigger trg_students_updated before update on public.students for each row execute procedure public.touch_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='trg_sessions_updated') then create trigger trg_sessions_updated before update on public.tahfidz_sessions for each row execute procedure public.touch_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='trg_attendance_updated') then create trigger trg_attendance_updated before update on public.tahfidz_attendance for each row execute procedure public.touch_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='trg_submissions_updated') then create trigger trg_submissions_updated before update on public.memorization_submissions for each row execute procedure public.touch_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='trg_notes_updated') then create trigger trg_notes_updated before update on public.student_notes for each row execute procedure public.touch_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='trg_focus_updated') then create trigger trg_focus_updated before update on public.focus_items for each row execute procedure public.touch_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='trg_targets_updated') then create trigger trg_targets_updated before update on public.weekly_targets for each row execute procedure public.touch_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='trg_reports_updated') then create trigger trg_reports_updated before update on public.report_snapshots for each row execute procedure public.touch_updated_at(); end if;
end $$;

drop policy if exists "teacher can update assigned students" on public.students;
create policy "teacher can update assigned students" on public.students for update using(exists(select 1 from public.teacher_students ts where ts.student_id=students.id and ts.teacher_id=auth.uid() and ts.is_active)) with check(exists(select 1 from public.teacher_students ts where ts.student_id=students.id and ts.teacher_id=auth.uid() and ts.is_active));

drop policy if exists "attendance self write" on public.tahfidz_attendance;
create policy "attendance self write" on public.tahfidz_attendance for all using(recorded_by=auth.uid() and exists(select 1 from public.tahfidz_sessions s where s.id=tahfidz_attendance.session_id and s.teacher_id=auth.uid()) and exists(select 1 from public.teacher_students ts where ts.student_id=tahfidz_attendance.student_id and ts.teacher_id=auth.uid() and ts.is_active)) with check(recorded_by=auth.uid() and exists(select 1 from public.tahfidz_sessions s where s.id=tahfidz_attendance.session_id and s.teacher_id=auth.uid()) and exists(select 1 from public.teacher_students ts where ts.student_id=tahfidz_attendance.student_id and ts.teacher_id=auth.uid() and ts.is_active));

drop policy if exists "submissions self all" on public.memorization_submissions;
create policy "submissions self all" on public.memorization_submissions for all using(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=memorization_submissions.student_id and ts.teacher_id=auth.uid() and ts.is_active)) with check(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=memorization_submissions.student_id and ts.teacher_id=auth.uid() and ts.is_active));

drop policy if exists "notes self all" on public.student_notes;
create policy "notes self all" on public.student_notes for all using(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=student_notes.student_id and ts.teacher_id=auth.uid() and ts.is_active)) with check(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=student_notes.student_id and ts.teacher_id=auth.uid() and ts.is_active));

drop policy if exists "focus self all" on public.focus_items;
create policy "focus self all" on public.focus_items for all using(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=focus_items.student_id and ts.teacher_id=auth.uid() and ts.is_active)) with check(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=focus_items.student_id and ts.teacher_id=auth.uid() and ts.is_active));

drop policy if exists "targets self all" on public.weekly_targets;
create policy "targets self all" on public.weekly_targets for all using(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=weekly_targets.student_id and ts.teacher_id=auth.uid() and ts.is_active)) with check(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=weekly_targets.student_id and ts.teacher_id=auth.uid() and ts.is_active));

drop policy if exists "progress self all" on public.student_surah_progress;
create policy "progress self all" on public.student_surah_progress for all using(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=student_surah_progress.student_id and ts.teacher_id=auth.uid() and ts.is_active)) with check(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=student_surah_progress.student_id and ts.teacher_id=auth.uid() and ts.is_active));

drop policy if exists "reports self all" on public.report_snapshots;
create policy "reports self all" on public.report_snapshots for all using(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=report_snapshots.student_id and ts.teacher_id=auth.uid() and ts.is_active)) with check(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=report_snapshots.student_id and ts.teacher_id=auth.uid() and ts.is_active));

create or replace function public.create_assigned_student(p_full_name text,p_class_name text,p_nis text default null) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_teacher uuid := auth.uid(); v_student uuid;
begin
  if v_teacher is null then raise exception 'Not authenticated'; end if;
  if char_length(trim(p_full_name)) < 2 then raise exception 'Nama siswa tidak valid'; end if;
  if char_length(trim(p_class_name)) < 1 then raise exception 'Kelas tidak valid'; end if;
  insert into public.students(full_name,class_name,nis) values(trim(p_full_name),trim(p_class_name),nullif(trim(coalesce(p_nis,'')),'')) returning id into v_student;
  insert into public.teacher_students(teacher_id,student_id) values(v_teacher,v_student);
  return v_student;
end; $$;

create or replace function public.unassign_student(p_student_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  update public.teacher_students set is_active=false, unassigned_at=now() where teacher_id=auth.uid() and student_id=p_student_id and is_active=true;
end; $$;

revoke all on function public.create_assigned_student(text,text,text) from public;
revoke all on function public.unassign_student(uuid) from public;
grant execute on function public.create_assigned_student(text,text,text) to authenticated;
grant execute on function public.unassign_student(uuid) to authenticated;

drop view if exists public.student_progress_summary;
create view public.student_progress_summary with (security_invoker = true) as
select ts.teacher_id,s.id as student_id,coalesce(att.attendance_rate,0)::numeric as attendance_rate,least(100,coalesce(prog.progress_percent,0))::int as progress_percent,coalesce(scores.average_score,0)::numeric as average_score,coalesce(last_sub.last_memorization,'Belum ada setoran') as last_memorization,case when coalesce(scores.current_28,0)>=coalesce(scores.previous_28,0)+0.15 then 'meningkat' when coalesce(scores.current_28,0)<=coalesce(scores.previous_28,0)-0.15 then 'menurun' else 'stabil' end::text as trend
from public.teacher_students ts join public.students s on s.id=ts.student_id
left join lateral (select round(100.0*count(*) filter(where a.status='hadir')/nullif(count(*),0)) as attendance_rate from public.tahfidz_sessions sess join public.tahfidz_attendance a on a.session_id=sess.id and a.student_id=s.id where sess.teacher_id=ts.teacher_id) att on true
left join lateral (select round(100.0*count(*) filter(where sp.status<>'belum')/37.0) as progress_percent from public.student_surah_progress sp where sp.teacher_id=ts.teacher_id and sp.student_id=s.id) prog on true
left join lateral (select round(avg((ms.fluency_score+ms.tajwid_score+ms.makhraj_score)/3)::numeric,2) as average_score,round(avg((ms.fluency_score+ms.tajwid_score+ms.makhraj_score)/3) filter(where ms.submitted_at>=now()-interval '28 days')::numeric,2) as current_28,round(avg((ms.fluency_score+ms.tajwid_score+ms.makhraj_score)/3) filter(where ms.submitted_at<now()-interval '28 days' and ms.submitted_at>=now()-interval '56 days')::numeric,2) as previous_28 from public.memorization_submissions ms where ms.teacher_id=ts.teacher_id and ms.student_id=s.id) scores on true
left join lateral (select ms.surah_name||' '||ms.start_ayah||'–'||ms.end_ayah as last_memorization from public.memorization_submissions ms where ms.teacher_id=ts.teacher_id and ms.student_id=s.id order by ms.submitted_at desc limit 1) last_sub on true
where ts.is_active=true and s.is_active=true;

grant select on public.student_progress_summary to authenticated;
