-- Tahfidz with Hulwah — single-user workspace mode.
-- Dashboard is open (no email login); only Settings is protected by a PIN session.

-- The personal workspace profile is no longer tied to auth.users.
alter table public.profiles drop constraint if exists profiles_id_fkey;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.bootstrap_hulwah_workspace();

-- Stable workspace owner. This UUID is an application identifier, not a secret.
insert into public.profiles(id, display_name, email, avatar_url)
values ('31a9adbd-b5bf-4e14-ac56-d73d605363a5', 'Hulwah Qurratu Aini, S.Pd.', null, null)
on conflict(id) do update set
  display_name = excluded.display_name,
  email = null,
  updated_at = now();

-- Seed the 20 current students idempotently by class + name.
with seed(class_name, full_name, sort_no) as (
  values
    ('1 Ar Rahman','Shanum',1), ('1 Ar Rahman','Raina',2), ('1 Ar Rahman','Alif',3),
    ('1 Ar Rahman','Feiza',4), ('1 Ar Rahman','Aba',5), ('1 Ar Rahman','Adiba',6),
    ('2 An Nur','Farzan',1), ('2 An Nur','Khaidar Ali',2), ('2 An Nur','Asyifa',3),
    ('2 An Nur','Shareen',4), ('2 An Nur','Valdis',5), ('2 An Nur','Azka',6),
    ('2 An Nur','Rajab',7), ('2 An Nur','Fikra',8),
    ('3 Az Zukhruf','Kayla',1), ('3 Az Zukhruf','Shanum',2), ('3 Az Zukhruf','Medina',3),
    ('3 Az Zukhruf','Aisyah',4), ('3 Az Zukhruf','Adel',5), ('3 Az Zukhruf','Amira',6)
)
insert into public.students(full_name, class_name)
select seed.full_name, seed.class_name
from seed
where not exists (
  select 1 from public.students s
  where s.full_name = seed.full_name and s.class_name = seed.class_name
);

with seed(class_name, full_name) as (
  values
    ('1 Ar Rahman','Shanum'), ('1 Ar Rahman','Raina'), ('1 Ar Rahman','Alif'),
    ('1 Ar Rahman','Feiza'), ('1 Ar Rahman','Aba'), ('1 Ar Rahman','Adiba'),
    ('2 An Nur','Farzan'), ('2 An Nur','Khaidar Ali'), ('2 An Nur','Asyifa'),
    ('2 An Nur','Shareen'), ('2 An Nur','Valdis'), ('2 An Nur','Azka'),
    ('2 An Nur','Rajab'), ('2 An Nur','Fikra'),
    ('3 Az Zukhruf','Kayla'), ('3 Az Zukhruf','Shanum'), ('3 Az Zukhruf','Medina'),
    ('3 Az Zukhruf','Aisyah'), ('3 Az Zukhruf','Adel'), ('3 Az Zukhruf','Amira')
)
insert into public.teacher_students(teacher_id, student_id, is_active)
select '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid, s.id, true
from seed
join public.students s on s.class_name = seed.class_name and s.full_name = seed.full_name
on conflict(teacher_id, student_id) do update set is_active = true, unassigned_at = null;

insert into public.class_targets(teacher_id, class_name, segment_no, start_label, end_label)
values
  ('31a9adbd-b5bf-4e14-ac56-d73d605363a5','1 Ar Rahman',1,'An-Naba','Al-Fajr'),
  ('31a9adbd-b5bf-4e14-ac56-d73d605363a5','1 Ar Rahman',2,'Al-Balad','An-Nas'),
  ('31a9adbd-b5bf-4e14-ac56-d73d605363a5','2 An Nur',1,'Al-Mulk','Al-Jinn'),
  ('31a9adbd-b5bf-4e14-ac56-d73d605363a5','2 An Nur',2,'Al-Muzzammil','Al-Baqarah: 29'),
  ('31a9adbd-b5bf-4e14-ac56-d73d605363a5','3 Az Zukhruf',1,'Al-Baqarah: 30','Al-Baqarah: 112'),
  ('31a9adbd-b5bf-4e14-ac56-d73d605363a5','3 Az Zukhruf',2,'Al-Baqarah: 113','Al-Baqarah: 190')
on conflict(teacher_id, class_name, segment_no) do update set
  start_label = excluded.start_label,
  end_label = excluded.end_label,
  updated_at = now();

-- Open personal dashboard data to the anonymous app role, scoped only to Hulwah's workspace.
grant usage on schema public to anon;
grant select on public.profiles to anon;
grant select on public.teacher_students to anon;
grant select, update on public.students to anon;
grant select, insert, update, delete on public.tahfidz_sessions to anon;
grant select, insert, update, delete on public.tahfidz_attendance to anon;
grant select, insert, update, delete on public.memorization_submissions to anon;
grant select, insert, update, delete on public.student_notes to anon;
grant select, insert, update, delete on public.focus_items to anon;
grant select, insert, update, delete on public.weekly_targets to anon;
grant select on public.student_surah_progress to anon;
grant select, insert, update, delete on public.report_snapshots to anon;
grant select on public.class_targets to anon;
grant select on public.student_progress_summary to anon;

create policy "hulwah public profile read"
on public.profiles for select to anon
using (id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid);

create policy "hulwah public assignments read"
on public.teacher_students for select to anon
using (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and is_active);

create policy "hulwah public students read"
on public.students for select to anon
using (exists(
  select 1 from public.teacher_students ts
  where ts.student_id = students.id
    and ts.teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid
    and ts.is_active
));

create policy "hulwah public students update"
on public.students for update to anon
using (exists(
  select 1 from public.teacher_students ts
  where ts.student_id = students.id
    and ts.teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid
    and ts.is_active
))
with check (exists(
  select 1 from public.teacher_students ts
  where ts.student_id = students.id
    and ts.teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid
    and ts.is_active
));

create policy "hulwah public sessions all"
on public.tahfidz_sessions for all to anon
using (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid)
with check (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid);

create policy "hulwah public attendance all"
on public.tahfidz_attendance for all to anon
using (
  recorded_by = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid
  and exists(select 1 from public.tahfidz_sessions sess where sess.id = tahfidz_attendance.session_id and sess.teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid)
  and exists(select 1 from public.teacher_students ts where ts.student_id = tahfidz_attendance.student_id and ts.teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and ts.is_active)
)
with check (
  recorded_by = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid
  and exists(select 1 from public.tahfidz_sessions sess where sess.id = tahfidz_attendance.session_id and sess.teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid)
  and exists(select 1 from public.teacher_students ts where ts.student_id = tahfidz_attendance.student_id and ts.teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and ts.is_active)
);

create policy "hulwah public submissions all"
on public.memorization_submissions for all to anon
using (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and exists(select 1 from public.teacher_students ts where ts.student_id = memorization_submissions.student_id and ts.teacher_id = teacher_id and ts.is_active))
with check (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and exists(select 1 from public.teacher_students ts where ts.student_id = memorization_submissions.student_id and ts.teacher_id = teacher_id and ts.is_active));

create policy "hulwah public notes all"
on public.student_notes for all to anon
using (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and exists(select 1 from public.teacher_students ts where ts.student_id = student_notes.student_id and ts.teacher_id = teacher_id and ts.is_active))
with check (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and exists(select 1 from public.teacher_students ts where ts.student_id = student_notes.student_id and ts.teacher_id = teacher_id and ts.is_active));

create policy "hulwah public focus all"
on public.focus_items for all to anon
using (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and exists(select 1 from public.teacher_students ts where ts.student_id = focus_items.student_id and ts.teacher_id = teacher_id and ts.is_active))
with check (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and exists(select 1 from public.teacher_students ts where ts.student_id = focus_items.student_id and ts.teacher_id = teacher_id and ts.is_active));

create policy "hulwah public targets all"
on public.weekly_targets for all to anon
using (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and exists(select 1 from public.teacher_students ts where ts.student_id = weekly_targets.student_id and ts.teacher_id = teacher_id and ts.is_active))
with check (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and exists(select 1 from public.teacher_students ts where ts.student_id = weekly_targets.student_id and ts.teacher_id = teacher_id and ts.is_active));

create policy "hulwah public progress read"
on public.student_surah_progress for select to anon
using (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and exists(select 1 from public.teacher_students ts where ts.student_id = student_surah_progress.student_id and ts.teacher_id = teacher_id and ts.is_active));

create policy "hulwah public reports all"
on public.report_snapshots for all to anon
using (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and exists(select 1 from public.teacher_students ts where ts.student_id = report_snapshots.student_id and ts.teacher_id = teacher_id and ts.is_active))
with check (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid and exists(select 1 from public.teacher_students ts where ts.student_id = report_snapshots.student_id and ts.teacher_id = teacher_id and ts.is_active));

create policy "hulwah public class targets read"
on public.class_targets for select to anon
using (teacher_id = '31a9adbd-b5bf-4e14-ac56-d73d605363a5'::uuid);

-- Private PIN lock. PIN value itself is configured separately and is never committed to Git.
create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists private.settings_lock (
  singleton boolean primary key default true check(singleton),
  pin_hash text,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

insert into private.settings_lock(singleton) values(true)
on conflict(singleton) do nothing;

create table if not exists private.settings_sessions (
  token uuid primary key default extensions.gen_random_uuid(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now()
);

create or replace function public.unlock_hulwah_settings(p_pin text) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, private, extensions
as $$
declare
  v_hash text;
  v_attempts int;
  v_locked_until timestamptz;
  v_token uuid;
begin
  select pin_hash, failed_attempts, locked_until
  into v_hash, v_attempts, v_locked_until
  from private.settings_lock
  where singleton = true
  for update;

  if v_hash is null then
    return null;
  end if;

  if v_locked_until is not null and v_locked_until > now() then
    return null;
  end if;

  if extensions.crypt(coalesce(p_pin,''), v_hash) = v_hash then
    update private.settings_lock
      set failed_attempts = 0, locked_until = null, updated_at = now()
      where singleton = true;
    delete from private.settings_sessions where expires_at <= now();
    insert into private.settings_sessions default values returning token into v_token;
    return v_token;
  end if;

  v_attempts := coalesce(v_attempts,0) + 1;
  if v_attempts >= 5 then
    update private.settings_lock
      set failed_attempts = 0, locked_until = now() + interval '5 minutes', updated_at = now()
      where singleton = true;
  else
    update private.settings_lock
      set failed_attempts = v_attempts, updated_at = now()
      where singleton = true;
  end if;

  return null;
end;
$$;

create or replace function public.hulwah_settings_session_valid(p_token uuid) returns boolean
language sql
security definer
set search_path = pg_catalog, private
as $$
  select exists(
    select 1 from private.settings_sessions
    where token = p_token and expires_at > now()
  );
$$;

create or replace function public.lock_hulwah_settings(p_token uuid) returns void
language sql
security definer
set search_path = pg_catalog, private
as $$
  delete from private.settings_sessions where token = p_token;
$$;

revoke all on function public.unlock_hulwah_settings(text) from public;
revoke all on function public.hulwah_settings_session_valid(uuid) from public;
revoke all on function public.lock_hulwah_settings(uuid) from public;
grant execute on function public.unlock_hulwah_settings(text) to anon, authenticated;
grant execute on function public.hulwah_settings_session_valid(uuid) to anon, authenticated;
grant execute on function public.lock_hulwah_settings(uuid) to anon, authenticated;
