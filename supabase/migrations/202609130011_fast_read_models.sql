-- Fast one-round-trip read models for daily attendance, submission/murajaah queue, and progress.
create or replace function public.hulwah_attendance_snapshot(p_day date default ((now() at time zone 'Asia/Makassar')::date)) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
with students_cte as (
  select s.id,s.full_name,s.class_name,s.nis,s.avatar_url,ts.assigned_at
  from public.teacher_students ts join public.students s on s.id=ts.student_id
  where ts.teacher_id='31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and ts.is_active
), session_cte as (
  select id from public.tahfidz_sessions where teacher_id='31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and session_date=p_day limit 1
), attendance_cte as (
  select a.student_id,a.status from public.tahfidz_attendance a join session_cte s on s.id=a.session_id
)
select jsonb_build_object(
  'students',coalesce((select jsonb_agg(jsonb_build_object('id',id,'full_name',full_name,'class_name',class_name,'nis',nis,'avatar_url',avatar_url) order by assigned_at,full_name) from students_cte),'[]'::jsonb),
  'statuses',coalesce((select jsonb_object_agg(student_id::text,status) from attendance_cte),'{}'::jsonb)
);
$$;

create or replace function public.hulwah_submission_queue_snapshot(p_day date default ((now() at time zone 'Asia/Makassar')::date)) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
with students_cte as (
  select s.id,s.full_name,s.class_name,s.nis,s.avatar_url,ts.assigned_at
  from public.teacher_students ts join public.students s on s.id=ts.student_id
  where ts.teacher_id='31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and ts.is_active
), session_cte as (
  select id from public.tahfidz_sessions where teacher_id='31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and session_date=p_day limit 1
), attendance_cte as (
  select a.student_id,a.status from public.tahfidz_attendance a join session_cte s on s.id=a.session_id
), submitted_cte as (
  select distinct student_id from public.memorization_submissions where teacher_id='31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and submitted_at>=p_day::timestamp and submitted_at<(p_day+1)::timestamp
), focus_cte as (
  select distinct on (student_id) student_id,title from public.focus_items where teacher_id='31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and status='active' order by student_id,created_at desc
)
select coalesce(jsonb_agg(jsonb_build_object(
  'id',s.id,'full_name',s.full_name,'class_name',s.class_name,'nis',s.nis,'avatar_url',s.avatar_url,
  'present',coalesce(a.status='hadir',false),'submitted',sub.student_id is not null,
  'lastMemorization',coalesce(ps.last_memorization,'Belum ada setoran'),'focus',f.title
) order by s.assigned_at,s.full_name),'[]'::jsonb)
from students_cte s
left join attendance_cte a on a.student_id=s.id
left join submitted_cte sub on sub.student_id=s.id
left join public.student_progress_summary ps on ps.student_id=s.id and ps.teacher_id='31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid
left join focus_cte f on f.student_id=s.id;
$$;

create or replace function public.hulwah_student_overviews_snapshot() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
with students_cte as (
  select s.id,s.full_name,s.class_name,s.nis,s.avatar_url,ts.assigned_at
  from public.teacher_students ts join public.students s on s.id=ts.student_id
  where ts.teacher_id='31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and ts.is_active
), focus_cte as (
  select distinct on (student_id) student_id,title from public.focus_items where teacher_id='31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and status='active' order by student_id,created_at desc
)
select coalesce(jsonb_agg(jsonb_build_object(
  'id',s.id,'full_name',s.full_name,'class_name',s.class_name,'nis',s.nis,'avatar_url',s.avatar_url,
  'attendanceRate',coalesce(ps.attendance_rate,0),'progressPercent',coalesce(ps.progress_percent,0),
  'averageScore',coalesce(ps.average_score,0),'lastMemorization',coalesce(ps.last_memorization,'Belum ada setoran'),
  'trend',coalesce(ps.trend,'stabil'),'focus',f.title
) order by s.assigned_at,s.full_name),'[]'::jsonb)
from students_cte s
left join public.student_progress_summary ps on ps.student_id=s.id and ps.teacher_id='31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid
left join focus_cte f on f.student_id=s.id;
$$;

revoke all on function public.hulwah_attendance_snapshot(date) from public;
revoke all on function public.hulwah_submission_queue_snapshot(date) from public;
revoke all on function public.hulwah_student_overviews_snapshot() from public;
grant execute on function public.hulwah_attendance_snapshot(date) to anon, authenticated;
grant execute on function public.hulwah_submission_queue_snapshot(date) to anon, authenticated;
grant execute on function public.hulwah_student_overviews_snapshot() to anon, authenticated;
