-- One-round-trip dashboard read model for the single Hulwah workspace.
create or replace function public.hulwah_dashboard_snapshot(
  p_day date default ((now() at time zone 'Asia/Makassar')::date)
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with student_rows as (
  select s.id, s.full_name, s.class_name, s.nis, s.avatar_url
  from public.teacher_students ts
  join public.students s on s.id = ts.student_id
  where ts.teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid
    and ts.is_active
  order by ts.assigned_at, s.full_name
),
session_row as (
  select id from public.tahfidz_sessions
  where teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and session_date = p_day
  limit 1
),
attendance_rows as (
  select a.student_id, a.status from public.tahfidz_attendance a join session_row sr on sr.id = a.session_id
),
submission_rows as (
  select distinct m.student_id from public.memorization_submissions m
  where m.teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid
    and m.submitted_at >= p_day::timestamp and m.submitted_at < (p_day + 1)::timestamp
),
class_rows as (
  select s.class_name as name, count(*)::int as total,
    count(*) filter (where a.status = 'hadir')::int as present,
    count(*) filter (where sub.student_id is not null and a.status = 'hadir')::int as submitted
  from student_rows s
  left join attendance_rows a on a.student_id = s.id
  left join submission_rows sub on sub.student_id = s.id
  group by s.class_name order by s.class_name
),
attention_rows as (
  select f.id, f.student_id, f.title, s.full_name, s.class_name
  from public.focus_items f join student_rows s on s.id = f.student_id
  where f.teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and f.status = 'active'
  order by f.created_at desc limit 4
)
select jsonb_build_object(
  'teacherName', coalesce((select display_name from public.profiles where id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid), 'Hulwah Qurratu Aini, S.Pd.'),
  'students', coalesce((select jsonb_agg(jsonb_build_object('id',id,'full_name',full_name,'class_name',class_name,'nis',nis,'avatar_url',avatar_url)) from student_rows), '[]'::jsonb),
  'present', (select count(*)::int from student_rows s left join attendance_rows a on a.student_id=s.id where a.status='hadir'),
  'submitted', (select count(*)::int from student_rows s join attendance_rows a on a.student_id=s.id and a.status='hadir' join submission_rows sub on sub.student_id=s.id),
  'waiting', (select count(*)::int from student_rows s join attendance_rows a on a.student_id=s.id and a.status='hadir' left join submission_rows sub on sub.student_id=s.id where sub.student_id is null),
  'izin', (select count(*)::int from student_rows s left join attendance_rows a on a.student_id=s.id where a.status='izin'),
  'sakit', (select count(*)::int from student_rows s left join attendance_rows a on a.student_id=s.id where a.status='sakit'),
  'classes', coalesce((select jsonb_agg(jsonb_build_object('name',name,'total',total,'present',present,'submitted',submitted) order by name) from class_rows), '[]'::jsonb),
  'attention', coalesce((select jsonb_agg(jsonb_build_object('id',id,'studentId',student_id,'studentName',full_name,'className',class_name,'text',title,'kind','Fokus')) from attention_rows), '[]'::jsonb)
);
$$;
revoke all on function public.hulwah_dashboard_snapshot(date) from public;
grant execute on function public.hulwah_dashboard_snapshot(date) to anon, authenticated;
