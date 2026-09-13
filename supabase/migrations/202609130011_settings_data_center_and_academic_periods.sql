create table if not exists public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  label text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_periods_date_check check (end_date >= start_date),
  constraint academic_periods_teacher_code_key unique (teacher_id, code)
);

create index if not exists academic_periods_teacher_dates_idx
  on public.academic_periods(teacher_id, start_date, end_date);

drop trigger if exists academic_periods_touch_updated_at on public.academic_periods;
create trigger academic_periods_touch_updated_at
before update on public.academic_periods
for each row execute function public.touch_updated_at();

alter table public.academic_periods enable row level security;
grant select on public.academic_periods to anon, authenticated;
drop policy if exists academic_periods_public_read on public.academic_periods;
create policy academic_periods_public_read
on public.academic_periods for select to anon, authenticated using (true);

with teacher as (
  select id from public.profiles order by created_at asc limit 1
)
insert into public.academic_periods (teacher_id, code, label, start_date, end_date, is_active)
select id, '2026-ganjil', '2026/2027 · Semester Ganjil', date '2026-07-01', date '2026-12-31', true from teacher
on conflict (teacher_id, code) do nothing;

with teacher as (
  select id from public.profiles order by created_at asc limit 1
)
insert into public.academic_periods (teacher_id, code, label, start_date, end_date, is_active)
select id, '2026-genap', '2026/2027 · Semester Genap', date '2027-01-01', date '2027-06-30', false from teacher
on conflict (teacher_id, code) do nothing;

create or replace function public.hulwah_settings_data(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_teacher_id uuid;
begin
  if not exists (
    select 1 from private.settings_sessions
    where token = p_token and expires_at > now()
  ) then
    raise exception 'SETTINGS_SESSION_INVALID';
  end if;

  select id into v_teacher_id from public.profiles order by created_at asc limit 1;
  if v_teacher_id is null then raise exception 'WORKSPACE_NOT_FOUND'; end if;

  return jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = v_teacher_id),
    'students', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.class_name, x.full_name)
      from (
        select s.id, s.full_name, s.class_name, s.nis, s.is_active, s.created_at, s.updated_at
        from public.students s
        join public.teacher_students ts on ts.student_id = s.id
        where ts.teacher_id = v_teacher_id
      ) x
    ), '[]'::jsonb),
    'classTargets', coalesce((
      select jsonb_agg(to_jsonb(ct) order by ct.class_name, ct.segment_no)
      from public.class_targets ct where ct.teacher_id = v_teacher_id
    ), '[]'::jsonb),
    'periods', coalesce((
      select jsonb_agg(to_jsonb(ap) order by ap.start_date desc)
      from public.academic_periods ap where ap.teacher_id = v_teacher_id
    ), '[]'::jsonb),
    'attendance', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.session_date desc, x.student_name)
      from (
        select a.session_id, a.student_id, s.full_name as student_name, s.class_name,
               sess.session_date, a.status, a.note, a.created_at, a.updated_at
        from public.tahfidz_attendance a
        join public.tahfidz_sessions sess on sess.id = a.session_id
        join public.students s on s.id = a.student_id
        where sess.teacher_id = v_teacher_id
        order by sess.session_date desc, s.full_name
        limit 1000
      ) x
    ), '[]'::jsonb),
    'submissions', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.submitted_at desc)
      from (
        select ms.id, ms.student_id, s.full_name as student_name, s.class_name, ms.type,
               ms.surah_name, ms.start_ayah, ms.end_ayah, ms.fluency_score, ms.tajwid_score,
               ms.makhraj_score, ms.mistake_count, ms.note, ms.submitted_at, ms.created_at, ms.updated_at
        from public.memorization_submissions ms
        join public.students s on s.id = ms.student_id
        where ms.teacher_id = v_teacher_id
        order by ms.submitted_at desc
        limit 1000
      ) x
    ), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.note_date desc)
      from (
        select n.id, n.student_id, s.full_name as student_name, s.class_name, n.note_date,
               n.category, n.note, n.visibility, n.pinned, n.resolved, n.created_at, n.updated_at
        from public.student_notes n
        join public.students s on s.id = n.student_id
        where n.teacher_id = v_teacher_id
        order by n.note_date desc
        limit 1000
      ) x
    ), '[]'::jsonb),
    'focusItems', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select f.id, f.student_id, s.full_name as student_name, s.class_name, f.title, f.status,
               f.resolved_at, f.created_at, f.updated_at
        from public.focus_items f
        join public.students s on s.id = f.student_id
        where f.teacher_id = v_teacher_id
        order by f.created_at desc
        limit 1000
      ) x
    ), '[]'::jsonb),
    'weeklyTargets', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.week_start desc)
      from (
        select wt.id, wt.student_id, s.full_name as student_name, s.class_name, wt.week_start,
               wt.target_text, wt.progress, wt.status, wt.created_at, wt.updated_at
        from public.weekly_targets wt
        join public.students s on s.id = wt.student_id
        where wt.teacher_id = v_teacher_id
        order by wt.week_start desc
        limit 1000
      ) x
    ), '[]'::jsonb),
    'reports', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.updated_at desc)
      from (
        select r.id, r.student_id, s.full_name as student_name, s.class_name, r.period_type,
               r.period_key, r.analysis, r.narrative, r.next_focus, r.status, r.finalized_at,
               r.created_at, r.updated_at
        from public.report_snapshots r
        join public.students s on s.id = r.student_id
        where r.teacher_id = v_teacher_id
        order by r.updated_at desc
        limit 1000
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.hulwah_manage_student(
  p_token uuid,
  p_action text,
  p_id uuid default null,
  p_full_name text default null,
  p_class_name text default null,
  p_nis text default null,
  p_is_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_teacher_id uuid;
  v_id uuid;
begin
  if not exists (select 1 from private.settings_sessions where token=p_token and expires_at>now()) then
    raise exception 'SETTINGS_SESSION_INVALID';
  end if;
  select id into v_teacher_id from public.profiles order by created_at asc limit 1;

  if p_action = 'create' then
    if nullif(trim(p_full_name),'') is null or nullif(trim(p_class_name),'') is null then
      raise exception 'NAME_AND_CLASS_REQUIRED';
    end if;
    insert into public.students(full_name,class_name,nis,is_active)
    values(trim(p_full_name),trim(p_class_name),nullif(trim(coalesce(p_nis,'')),''),coalesce(p_is_active,true))
    returning id into v_id;
    insert into public.teacher_students(teacher_id,student_id,is_active)
    values(v_teacher_id,v_id,coalesce(p_is_active,true));
  elsif p_action = 'update' then
    if p_id is null or not exists(select 1 from public.teacher_students where teacher_id=v_teacher_id and student_id=p_id) then
      raise exception 'STUDENT_NOT_FOUND';
    end if;
    update public.students
       set full_name=trim(p_full_name), class_name=trim(p_class_name),
           nis=nullif(trim(coalesce(p_nis,'')),''), is_active=coalesce(p_is_active,true)
     where id=p_id;
    update public.teacher_students
       set is_active=coalesce(p_is_active,true),
           unassigned_at=case when coalesce(p_is_active,true) then null else now() end
     where teacher_id=v_teacher_id and student_id=p_id;
    v_id := p_id;
  elsif p_action = 'delete' then
    if p_id is null or not exists(select 1 from public.teacher_students where teacher_id=v_teacher_id and student_id=p_id) then
      raise exception 'STUDENT_NOT_FOUND';
    end if;
    delete from public.students where id=p_id;
    return jsonb_build_object('ok',true,'deleted',p_id);
  else
    raise exception 'INVALID_ACTION';
  end if;
  return jsonb_build_object('ok',true,'id',v_id);
end;
$$;

create or replace function public.hulwah_manage_class_target(
  p_token uuid,
  p_action text,
  p_id uuid default null,
  p_class_name text default null,
  p_segment_no integer default 1,
  p_start_label text default null,
  p_end_label text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_teacher_id uuid;
  v_id uuid;
begin
  if not exists (select 1 from private.settings_sessions where token=p_token and expires_at>now()) then raise exception 'SETTINGS_SESSION_INVALID'; end if;
  select id into v_teacher_id from public.profiles order by created_at asc limit 1;
  if p_action='create' then
    insert into public.class_targets(teacher_id,class_name,segment_no,start_label,end_label)
    values(v_teacher_id,trim(p_class_name),p_segment_no,trim(p_start_label),trim(p_end_label)) returning id into v_id;
  elsif p_action='update' then
    update public.class_targets set class_name=trim(p_class_name),segment_no=p_segment_no,start_label=trim(p_start_label),end_label=trim(p_end_label)
    where id=p_id and teacher_id=v_teacher_id returning id into v_id;
    if v_id is null then raise exception 'TARGET_NOT_FOUND'; end if;
  elsif p_action='delete' then
    delete from public.class_targets where id=p_id and teacher_id=v_teacher_id returning id into v_id;
    if v_id is null then raise exception 'TARGET_NOT_FOUND'; end if;
    return jsonb_build_object('ok',true,'deleted',v_id);
  else raise exception 'INVALID_ACTION';
  end if;
  return jsonb_build_object('ok',true,'id',v_id);
end;
$$;

create or replace function public.hulwah_manage_period(
  p_token uuid,
  p_action text,
  p_id uuid default null,
  p_code text default null,
  p_label text default null,
  p_start_date date default null,
  p_end_date date default null,
  p_is_active boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_teacher_id uuid;
  v_id uuid;
begin
  if not exists (select 1 from private.settings_sessions where token=p_token and expires_at>now()) then raise exception 'SETTINGS_SESSION_INVALID'; end if;
  select id into v_teacher_id from public.profiles order by created_at asc limit 1;
  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then raise exception 'INVALID_PERIOD_DATES'; end if;
  if coalesce(p_is_active,false) then update public.academic_periods set is_active=false where teacher_id=v_teacher_id; end if;
  if p_action='create' then
    insert into public.academic_periods(teacher_id,code,label,start_date,end_date,is_active)
    values(v_teacher_id,trim(p_code),trim(p_label),p_start_date,p_end_date,coalesce(p_is_active,false)) returning id into v_id;
  elsif p_action='update' then
    update public.academic_periods set code=trim(p_code),label=trim(p_label),start_date=p_start_date,end_date=p_end_date,is_active=coalesce(p_is_active,false)
    where id=p_id and teacher_id=v_teacher_id returning id into v_id;
    if v_id is null then raise exception 'PERIOD_NOT_FOUND'; end if;
  elsif p_action='delete' then
    delete from public.academic_periods where id=p_id and teacher_id=v_teacher_id returning id into v_id;
    if v_id is null then raise exception 'PERIOD_NOT_FOUND'; end if;
    return jsonb_build_object('ok',true,'deleted',v_id);
  else raise exception 'INVALID_ACTION';
  end if;
  return jsonb_build_object('ok',true,'id',v_id);
end;
$$;

create or replace function public.hulwah_settings_update_record(
  p_token uuid,
  p_entity text,
  p_id uuid,
  p_student_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_teacher_id uuid;
begin
  if not exists (select 1 from private.settings_sessions where token=p_token and expires_at>now()) then raise exception 'SETTINGS_SESSION_INVALID'; end if;
  select id into v_teacher_id from public.profiles order by created_at asc limit 1;
  case p_entity
    when 'attendance' then
      update public.tahfidz_attendance a
      set status=(p_payload->>'status')::public.attendance_status,
          note=nullif(p_payload->>'note','')
      from public.tahfidz_sessions sess
      where a.session_id=p_id and a.student_id=p_student_id and sess.id=a.session_id and sess.teacher_id=v_teacher_id;
    when 'submission' then
      update public.memorization_submissions
      set type=coalesce((p_payload->>'type')::public.submission_type,type),
          surah_name=coalesce(nullif(p_payload->>'surah_name',''),surah_name),
          start_ayah=coalesce((p_payload->>'start_ayah')::int,start_ayah),
          end_ayah=coalesce((p_payload->>'end_ayah')::int,end_ayah),
          fluency_score=coalesce((p_payload->>'fluency_score')::numeric,fluency_score),
          tajwid_score=coalesce((p_payload->>'tajwid_score')::numeric,tajwid_score),
          makhraj_score=coalesce((p_payload->>'makhraj_score')::numeric,makhraj_score),
          mistake_count=coalesce((p_payload->>'mistake_count')::int,mistake_count),
          note=case when p_payload ? 'note' then nullif(p_payload->>'note','') else note end,
          submitted_at=coalesce((p_payload->>'submitted_at')::timestamptz,submitted_at)
      where id=p_id and teacher_id=v_teacher_id;
    when 'note' then
      update public.student_notes
      set note_date=coalesce((p_payload->>'note_date')::date,note_date),
          category=coalesce(nullif(p_payload->>'category',''),category),
          note=coalesce(nullif(p_payload->>'note',''),note),
          visibility=coalesce((p_payload->>'visibility')::public.note_visibility,visibility),
          pinned=coalesce((p_payload->>'pinned')::boolean,pinned),
          resolved=coalesce((p_payload->>'resolved')::boolean,resolved)
      where id=p_id and teacher_id=v_teacher_id;
    when 'focus' then
      update public.focus_items
      set title=coalesce(nullif(p_payload->>'title',''),title),
          status=coalesce((p_payload->>'status')::public.focus_status,status),
          resolved_at=case when (p_payload->>'status')='resolved' then coalesce(resolved_at,now()) else null end
      where id=p_id and teacher_id=v_teacher_id;
    when 'weekly_target' then
      update public.weekly_targets
      set week_start=coalesce((p_payload->>'week_start')::date,week_start),
          target_text=coalesce(nullif(p_payload->>'target_text',''),target_text),
          progress=coalesce((p_payload->>'progress')::int,progress),
          status=coalesce((p_payload->>'status')::public.target_status,status)
      where id=p_id and teacher_id=v_teacher_id;
    when 'report' then
      update public.report_snapshots
      set analysis=case when p_payload ? 'analysis' then nullif(p_payload->>'analysis','') else analysis end,
          narrative=case when p_payload ? 'narrative' then nullif(p_payload->>'narrative','') else narrative end,
          next_focus=case when p_payload ? 'next_focus' then nullif(p_payload->>'next_focus','') else next_focus end,
          status=coalesce((p_payload->>'status')::public.report_status,status)
      where id=p_id and teacher_id=v_teacher_id;
    when 'profile' then
      update public.profiles
      set display_name=coalesce(nullif(p_payload->>'display_name',''),display_name),
          avatar_url=case when p_payload ? 'avatar_url' then nullif(p_payload->>'avatar_url','') else avatar_url end
      where id=v_teacher_id;
    else raise exception 'INVALID_ENTITY';
  end case;
  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.hulwah_settings_delete_record(
  p_token uuid,
  p_entity text,
  p_id uuid,
  p_student_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_teacher_id uuid;
begin
  if not exists (select 1 from private.settings_sessions where token=p_token and expires_at>now()) then raise exception 'SETTINGS_SESSION_INVALID'; end if;
  select id into v_teacher_id from public.profiles order by created_at asc limit 1;
  case p_entity
    when 'attendance' then
      delete from public.tahfidz_attendance a using public.tahfidz_sessions sess
      where a.session_id=p_id and a.student_id=p_student_id and sess.id=a.session_id and sess.teacher_id=v_teacher_id;
    when 'submission' then delete from public.memorization_submissions where id=p_id and teacher_id=v_teacher_id;
    when 'note' then delete from public.student_notes where id=p_id and teacher_id=v_teacher_id;
    when 'focus' then delete from public.focus_items where id=p_id and teacher_id=v_teacher_id;
    when 'weekly_target' then delete from public.weekly_targets where id=p_id and teacher_id=v_teacher_id;
    when 'report' then delete from public.report_snapshots where id=p_id and teacher_id=v_teacher_id;
    else raise exception 'INVALID_ENTITY';
  end case;
  return jsonb_build_object('ok',true,'deleted',p_id);
end;
$$;

revoke all on function public.hulwah_settings_data(uuid) from public;
revoke all on function public.hulwah_manage_student(uuid,text,uuid,text,text,text,boolean) from public;
revoke all on function public.hulwah_manage_class_target(uuid,text,uuid,text,integer,text,text) from public;
revoke all on function public.hulwah_manage_period(uuid,text,uuid,text,text,date,date,boolean) from public;
revoke all on function public.hulwah_settings_update_record(uuid,text,uuid,uuid,jsonb) from public;
revoke all on function public.hulwah_settings_delete_record(uuid,text,uuid,uuid) from public;

grant execute on function public.hulwah_settings_data(uuid) to anon, authenticated;
grant execute on function public.hulwah_manage_student(uuid,text,uuid,text,text,text,boolean) to anon, authenticated;
grant execute on function public.hulwah_manage_class_target(uuid,text,uuid,text,integer,text,text) to anon, authenticated;
grant execute on function public.hulwah_manage_period(uuid,text,uuid,text,text,date,date,boolean) to anon, authenticated;
grant execute on function public.hulwah_settings_update_record(uuid,text,uuid,uuid,jsonb) to anon, authenticated;
grant execute on function public.hulwah_settings_delete_record(uuid,text,uuid,uuid) to anon, authenticated;
