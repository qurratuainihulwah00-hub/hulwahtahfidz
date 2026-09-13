-- Full PIN-protected Settings Data Center CRUD and reliable derived memorization progress.

create or replace function private.hulwah_rebuild_surah_progress(
  p_teacher_id uuid,
  p_student_id uuid,
  p_surah_name text
)
returns void
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'private'
as $$
declare
  v_last_ayah int;
  v_last_submitted_at timestamptz;
  v_last_reviewed_at timestamptz;
  v_latest_type public.submission_type;
begin
  delete from public.student_surah_progress
  where teacher_id = p_teacher_id
    and student_id = p_student_id
    and surah_name = p_surah_name;

  select
    max(ms.end_ayah),
    max(ms.submitted_at) filter (where ms.type = 'hafalan_baru'::public.submission_type),
    max(ms.submitted_at) filter (where ms.type = 'murajaah'::public.submission_type),
    (array_agg(ms.type order by ms.submitted_at desc, ms.created_at desc))[1]
  into v_last_ayah, v_last_submitted_at, v_last_reviewed_at, v_latest_type
  from public.memorization_submissions ms
  where ms.teacher_id = p_teacher_id
    and ms.student_id = p_student_id
    and ms.surah_name = p_surah_name;

  if v_last_ayah is not null then
    insert into public.student_surah_progress(
      teacher_id, student_id, surah_name, last_ayah, status,
      last_submitted_at, last_reviewed_at, updated_at
    ) values (
      p_teacher_id,
      p_student_id,
      p_surah_name,
      v_last_ayah,
      case when v_latest_type = 'murajaah'::public.submission_type then 'murajaah' else 'setor' end,
      v_last_submitted_at,
      v_last_reviewed_at,
      now()
    );
  end if;
end;
$$;

create or replace function private.hulwah_sync_surah_progress_trigger()
returns trigger
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'private'
as $$
begin
  if tg_op = 'DELETE' then
    perform private.hulwah_rebuild_surah_progress(old.teacher_id, old.student_id, old.surah_name);
    return old;
  end if;

  if tg_op = 'UPDATE' and (
    old.teacher_id is distinct from new.teacher_id or
    old.student_id is distinct from new.student_id or
    old.surah_name is distinct from new.surah_name
  ) then
    perform private.hulwah_rebuild_surah_progress(old.teacher_id, old.student_id, old.surah_name);
  end if;

  perform private.hulwah_rebuild_surah_progress(new.teacher_id, new.student_id, new.surah_name);
  return new;
end;
$$;

drop trigger if exists trg_sync_surah_progress on public.memorization_submissions;
create trigger trg_sync_surah_progress
after insert or update or delete on public.memorization_submissions
for each row execute function private.hulwah_sync_surah_progress_trigger();

drop function if exists public.sync_surah_progress();

create or replace function public.hulwah_settings_data(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'private'
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
        limit 1500
      ) x
    ), '[]'::jsonb),
    'submissions', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.session_date desc, x.submitted_at desc)
      from (
        select ms.id, ms.student_id, s.full_name as student_name, s.class_name, ms.type,
               ms.surah_name, ms.start_ayah, ms.end_ayah, ms.fluency_score, ms.tajwid_score,
               ms.makhraj_score, ms.mistake_count, ms.note, ms.submitted_at,
               coalesce(sess.session_date, ms.submitted_at::date) as session_date,
               ms.created_at, ms.updated_at
        from public.memorization_submissions ms
        join public.students s on s.id = ms.student_id
        left join public.tahfidz_sessions sess on sess.id = ms.session_id
        where ms.teacher_id = v_teacher_id
        order by coalesce(sess.session_date, ms.submitted_at::date) desc, ms.submitted_at desc
        limit 1500
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
        limit 1500
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
        limit 1500
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
        limit 1500
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
        limit 1500
      ) x
    ), '[]'::jsonb),
    'surahProgress', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.class_name, x.student_name, x.surah_name)
      from (
        select sp.id, sp.student_id, s.full_name as student_name, s.class_name,
               sp.surah_name, sp.last_ayah, sp.status, sp.last_submitted_at,
               sp.last_reviewed_at, sp.updated_at
        from public.student_surah_progress sp
        join public.students s on s.id = sp.student_id
        where sp.teacher_id = v_teacher_id
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.hulwah_settings_create_record(
  p_token uuid,
  p_entity text,
  p_student_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'private'
as $$
declare
  v_teacher_id uuid;
  v_id uuid;
  v_session_id uuid;
  v_date date;
  v_type public.submission_type;
  v_status text;
begin
  if not exists (
    select 1 from private.settings_sessions
    where token = p_token and expires_at > now()
  ) then
    raise exception 'SETTINGS_SESSION_INVALID';
  end if;

  select id into v_teacher_id from public.profiles order by created_at asc limit 1;
  if v_teacher_id is null then raise exception 'WORKSPACE_NOT_FOUND'; end if;

  if p_student_id is null or not exists (
    select 1 from public.teacher_students
    where teacher_id = v_teacher_id and student_id = p_student_id
  ) then
    raise exception 'STUDENT_NOT_FOUND';
  end if;

  case p_entity
    when 'attendance' then
      v_date := coalesce(nullif(p_payload->>'session_date','')::date, current_date);
      insert into public.tahfidz_sessions(teacher_id, session_date)
      values (v_teacher_id, v_date)
      on conflict (teacher_id, session_date) do update set updated_at = now()
      returning id into v_session_id;

      insert into public.tahfidz_attendance(session_id, student_id, status, note, recorded_by)
      values (
        v_session_id, p_student_id,
        coalesce(nullif(p_payload->>'status','')::public.attendance_status, 'hadir'::public.attendance_status),
        nullif(p_payload->>'note',''), v_teacher_id
      )
      on conflict (session_id, student_id) do update set
        status = excluded.status,
        note = excluded.note,
        recorded_by = excluded.recorded_by,
        updated_at = now();
      v_id := v_session_id;

    when 'submission' then
      v_date := coalesce(nullif(p_payload->>'session_date','')::date, current_date);
      v_type := coalesce(nullif(p_payload->>'type','')::public.submission_type, 'hafalan_baru'::public.submission_type);
      insert into public.tahfidz_sessions(teacher_id, session_date)
      values (v_teacher_id, v_date)
      on conflict (teacher_id, session_date) do update set updated_at = now()
      returning id into v_session_id;

      insert into public.memorization_submissions(
        teacher_id, student_id, session_id, type, surah_name, start_ayah, end_ayah,
        fluency_score, tajwid_score, makhraj_score, mistake_count, note, submitted_at
      ) values (
        v_teacher_id, p_student_id, v_session_id, v_type,
        nullif(trim(p_payload->>'surah_name'),''),
        greatest(1, coalesce((p_payload->>'start_ayah')::int,1)),
        greatest(greatest(1, coalesce((p_payload->>'start_ayah')::int,1)), coalesce((p_payload->>'end_ayah')::int,1)),
        least(5, greatest(1, coalesce((p_payload->>'fluency_score')::numeric,4))),
        least(5, greatest(1, coalesce((p_payload->>'tajwid_score')::numeric,4))),
        least(5, greatest(1, coalesce((p_payload->>'makhraj_score')::numeric,4))),
        greatest(0, coalesce((p_payload->>'mistake_count')::int,0)),
        nullif(p_payload->>'note',''),
        v_date::timestamp + time '12:00'
      ) returning id into v_id;

    when 'note' then
      insert into public.student_notes(
        teacher_id, student_id, note_date, category, note, visibility, pinned, resolved
      ) values (
        v_teacher_id, p_student_id,
        coalesce(nullif(p_payload->>'note_date','')::date,current_date),
        coalesce(nullif(trim(p_payload->>'category'),''),'Catatan'),
        coalesce(nullif(trim(p_payload->>'note'),''),'Catatan'),
        coalesce(nullif(p_payload->>'visibility','')::public.note_visibility,'internal'::public.note_visibility),
        coalesce((p_payload->>'pinned')::boolean,false),
        coalesce((p_payload->>'resolved')::boolean,false)
      ) returning id into v_id;

    when 'focus' then
      v_status := coalesce(nullif(p_payload->>'status',''),'active');
      insert into public.focus_items(teacher_id, student_id, title, status, resolved_at)
      values (
        v_teacher_id, p_student_id,
        coalesce(nullif(trim(p_payload->>'title'),''),'Fokus pembinaan'),
        v_status::public.focus_status,
        case when v_status='resolved' then now() else null end
      ) returning id into v_id;

    when 'weekly_target' then
      insert into public.weekly_targets(teacher_id, student_id, week_start, target_text, progress, status)
      values (
        v_teacher_id, p_student_id,
        coalesce(nullif(p_payload->>'week_start','')::date,current_date),
        coalesce(nullif(trim(p_payload->>'target_text'),''),'Target mingguan'),
        least(100, greatest(0, coalesce((p_payload->>'progress')::int,0))),
        coalesce(nullif(p_payload->>'status','')::public.target_status,'active'::public.target_status)
      ) returning id into v_id;

    when 'report' then
      if coalesce(nullif(p_payload->>'period_type',''),'') not in ('monthly','semester') then
        raise exception 'INVALID_PERIOD_TYPE';
      end if;
      if nullif(trim(p_payload->>'period_key'),'') is null then raise exception 'PERIOD_KEY_REQUIRED'; end if;
      insert into public.report_snapshots(
        teacher_id, student_id, period_type, period_key, analysis, narrative, next_focus, status, finalized_at
      ) values (
        v_teacher_id, p_student_id, p_payload->>'period_type', trim(p_payload->>'period_key'),
        nullif(p_payload->>'analysis',''), nullif(p_payload->>'narrative',''), nullif(p_payload->>'next_focus',''),
        coalesce(nullif(p_payload->>'status','')::public.report_status,'draft'::public.report_status),
        case when (p_payload->>'status')='final' then now() else null end
      )
      on conflict (teacher_id, student_id, period_type, period_key) do update set
        analysis = excluded.analysis,
        narrative = excluded.narrative,
        next_focus = excluded.next_focus,
        status = excluded.status,
        finalized_at = case when excluded.status='final'::public.report_status then coalesce(public.report_snapshots.finalized_at,now()) else null end,
        updated_at = now()
      returning id into v_id;

    else
      raise exception 'INVALID_ENTITY';
  end case;

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
set search_path = 'pg_catalog', 'public', 'private'
as $$
declare
  v_teacher_id uuid;
  v_old_session_id uuid;
  v_target_session_id uuid;
  v_date date;
  v_attendance_status public.attendance_status;
  v_attendance_note text;
begin
  if not exists (
    select 1 from private.settings_sessions
    where token = p_token and expires_at > now()
  ) then
    raise exception 'SETTINGS_SESSION_INVALID';
  end if;

  select id into v_teacher_id from public.profiles order by created_at asc limit 1;

  case p_entity
    when 'attendance' then
      select a.session_id, a.status, a.note
      into v_old_session_id, v_attendance_status, v_attendance_note
      from public.tahfidz_attendance a
      join public.tahfidz_sessions sess on sess.id=a.session_id
      where a.session_id=p_id and a.student_id=p_student_id and sess.teacher_id=v_teacher_id;

      if v_old_session_id is null then raise exception 'ATTENDANCE_NOT_FOUND'; end if;
      v_attendance_status := coalesce(nullif(p_payload->>'status','')::public.attendance_status, v_attendance_status);
      if p_payload ? 'note' then v_attendance_note := nullif(p_payload->>'note',''); end if;

      if p_payload ? 'session_date' and nullif(p_payload->>'session_date','') is not null then
        v_date := (p_payload->>'session_date')::date;
        insert into public.tahfidz_sessions(teacher_id,session_date)
        values(v_teacher_id,v_date)
        on conflict(teacher_id,session_date) do update set updated_at=now()
        returning id into v_target_session_id;
      else
        v_target_session_id := v_old_session_id;
      end if;

      if v_target_session_id = v_old_session_id then
        update public.tahfidz_attendance
        set status=v_attendance_status, note=v_attendance_note, recorded_by=v_teacher_id
        where session_id=v_old_session_id and student_id=p_student_id;
      else
        insert into public.tahfidz_attendance(session_id,student_id,status,note,recorded_by)
        values(v_target_session_id,p_student_id,v_attendance_status,v_attendance_note,v_teacher_id)
        on conflict(session_id,student_id) do update set
          status=excluded.status,note=excluded.note,recorded_by=excluded.recorded_by,updated_at=now();
        delete from public.tahfidz_attendance where session_id=v_old_session_id and student_id=p_student_id;
        delete from public.tahfidz_sessions sess
        where sess.id=v_old_session_id
          and not exists(select 1 from public.tahfidz_attendance a where a.session_id=sess.id)
          and not exists(select 1 from public.memorization_submissions ms where ms.session_id=sess.id);
      end if;

    when 'submission' then
      if p_payload ? 'session_date' and nullif(p_payload->>'session_date','') is not null then
        v_date := (p_payload->>'session_date')::date;
        insert into public.tahfidz_sessions(teacher_id,session_date)
        values(v_teacher_id,v_date)
        on conflict(teacher_id,session_date) do update set updated_at=now()
        returning id into v_target_session_id;
      end if;

      update public.memorization_submissions
      set type=coalesce(nullif(p_payload->>'type','')::public.submission_type,type),
          session_id=coalesce(v_target_session_id,session_id),
          surah_name=coalesce(nullif(p_payload->>'surah_name',''),surah_name),
          start_ayah=coalesce((p_payload->>'start_ayah')::int,start_ayah),
          end_ayah=coalesce((p_payload->>'end_ayah')::int,end_ayah),
          fluency_score=coalesce((p_payload->>'fluency_score')::numeric,fluency_score),
          tajwid_score=coalesce((p_payload->>'tajwid_score')::numeric,tajwid_score),
          makhraj_score=coalesce((p_payload->>'makhraj_score')::numeric,makhraj_score),
          mistake_count=coalesce((p_payload->>'mistake_count')::int,mistake_count),
          note=case when p_payload ? 'note' then nullif(p_payload->>'note','') else note end,
          submitted_at=case
            when v_date is not null then v_date::timestamp + time '12:00'
            when p_payload ? 'submitted_at' then (p_payload->>'submitted_at')::timestamptz
            else submitted_at
          end
      where id=p_id and teacher_id=v_teacher_id;
      if not found then raise exception 'SUBMISSION_NOT_FOUND'; end if;

    when 'note' then
      update public.student_notes
      set note_date=coalesce((p_payload->>'note_date')::date,note_date),
          category=coalesce(nullif(p_payload->>'category',''),category),
          note=coalesce(nullif(p_payload->>'note',''),note),
          visibility=coalesce(nullif(p_payload->>'visibility','')::public.note_visibility,visibility),
          pinned=coalesce((p_payload->>'pinned')::boolean,pinned),
          resolved=coalesce((p_payload->>'resolved')::boolean,resolved)
      where id=p_id and teacher_id=v_teacher_id;
      if not found then raise exception 'NOTE_NOT_FOUND'; end if;

    when 'focus' then
      update public.focus_items
      set title=coalesce(nullif(p_payload->>'title',''),title),
          status=coalesce(nullif(p_payload->>'status','')::public.focus_status,status),
          resolved_at=case
            when (p_payload->>'status')='resolved' then coalesce(resolved_at,now())
            when (p_payload->>'status')='active' then null
            else resolved_at
          end
      where id=p_id and teacher_id=v_teacher_id;
      if not found then raise exception 'FOCUS_NOT_FOUND'; end if;

    when 'weekly_target' then
      update public.weekly_targets
      set week_start=coalesce((p_payload->>'week_start')::date,week_start),
          target_text=coalesce(nullif(p_payload->>'target_text',''),target_text),
          progress=least(100,greatest(0,coalesce((p_payload->>'progress')::int,progress))),
          status=coalesce(nullif(p_payload->>'status','')::public.target_status,status)
      where id=p_id and teacher_id=v_teacher_id;
      if not found then raise exception 'WEEKLY_TARGET_NOT_FOUND'; end if;

    when 'report' then
      update public.report_snapshots
      set period_type=coalesce(nullif(p_payload->>'period_type',''),period_type),
          period_key=coalesce(nullif(p_payload->>'period_key',''),period_key),
          analysis=case when p_payload ? 'analysis' then nullif(p_payload->>'analysis','') else analysis end,
          narrative=case when p_payload ? 'narrative' then nullif(p_payload->>'narrative','') else narrative end,
          next_focus=case when p_payload ? 'next_focus' then nullif(p_payload->>'next_focus','') else next_focus end,
          status=coalesce(nullif(p_payload->>'status','')::public.report_status,status),
          finalized_at=case
            when (p_payload->>'status')='final' then coalesce(finalized_at,now())
            when (p_payload->>'status') in ('draft','reviewed') then null
            else finalized_at
          end
      where id=p_id and teacher_id=v_teacher_id;
      if not found then raise exception 'REPORT_NOT_FOUND'; end if;

    when 'profile' then
      update public.profiles
      set display_name=coalesce(nullif(p_payload->>'display_name',''),display_name),
          avatar_url=case when p_payload ? 'avatar_url' then nullif(p_payload->>'avatar_url','') else avatar_url end
      where id=v_teacher_id;

    else
      raise exception 'INVALID_ENTITY';
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
set search_path = 'pg_catalog', 'public', 'private'
as $$
declare
  v_teacher_id uuid;
  v_session_id uuid;
begin
  if not exists (
    select 1 from private.settings_sessions
    where token = p_token and expires_at > now()
  ) then
    raise exception 'SETTINGS_SESSION_INVALID';
  end if;
  select id into v_teacher_id from public.profiles order by created_at asc limit 1;

  case p_entity
    when 'attendance' then
      v_session_id := p_id;
      delete from public.tahfidz_attendance a using public.tahfidz_sessions sess
      where a.session_id=p_id and a.student_id=p_student_id
        and sess.id=a.session_id and sess.teacher_id=v_teacher_id;
      if not found then raise exception 'ATTENDANCE_NOT_FOUND'; end if;

    when 'submission' then
      select session_id into v_session_id
      from public.memorization_submissions
      where id=p_id and teacher_id=v_teacher_id;
      delete from public.memorization_submissions where id=p_id and teacher_id=v_teacher_id;
      if not found then raise exception 'SUBMISSION_NOT_FOUND'; end if;

    when 'note' then
      delete from public.student_notes where id=p_id and teacher_id=v_teacher_id;
      if not found then raise exception 'NOTE_NOT_FOUND'; end if;

    when 'focus' then
      delete from public.focus_items where id=p_id and teacher_id=v_teacher_id;
      if not found then raise exception 'FOCUS_NOT_FOUND'; end if;

    when 'weekly_target' then
      delete from public.weekly_targets where id=p_id and teacher_id=v_teacher_id;
      if not found then raise exception 'WEEKLY_TARGET_NOT_FOUND'; end if;

    when 'report' then
      delete from public.report_snapshots where id=p_id and teacher_id=v_teacher_id;
      if not found then raise exception 'REPORT_NOT_FOUND'; end if;

    else
      raise exception 'INVALID_ENTITY';
  end case;

  if v_session_id is not null then
    delete from public.tahfidz_sessions sess
    where sess.id=v_session_id and sess.teacher_id=v_teacher_id
      and not exists(select 1 from public.tahfidz_attendance a where a.session_id=sess.id)
      and not exists(select 1 from public.memorization_submissions ms where ms.session_id=sess.id);
  end if;

  return jsonb_build_object('ok',true,'deleted',p_id);
end;
$$;

revoke all on function public.hulwah_settings_create_record(uuid,text,uuid,jsonb) from public;
grant execute on function public.hulwah_settings_create_record(uuid,text,uuid,jsonb) to anon, authenticated, service_role;

revoke all on function private.hulwah_rebuild_surah_progress(uuid,uuid,text) from public, anon, authenticated;
revoke all on function private.hulwah_sync_surah_progress_trigger() from public, anon, authenticated;
