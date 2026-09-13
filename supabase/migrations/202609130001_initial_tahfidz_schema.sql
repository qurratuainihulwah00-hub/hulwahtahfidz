-- Tahfidz with Hulwah — initial schema
-- Apply through Supabase migration tooling. All teacher-facing tables are protected by RLS.

create extension if not exists pgcrypto;

create type public.attendance_status as enum ('hadir','izin','sakit','alfa');
create type public.submission_type as enum ('hafalan_baru','murajaah');
create type public.note_visibility as enum ('internal','report');
create type public.focus_status as enum ('active','resolved');
create type public.target_status as enum ('active','done','carried');
create type public.report_status as enum ('draft','reviewed','final');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Guru Tahfidz',
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  class_name text not null,
  nis text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_students (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  is_active boolean not null default true,
  assigned_at timestamptz not null default now(),
  primary key (teacher_id, student_id)
);

create table public.tahfidz_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  session_date date not null,
  note text,
  created_at timestamptz not null default now(),
  unique(teacher_id, session_date)
);

create table public.tahfidz_attendance (
  session_id uuid not null references public.tahfidz_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status public.attendance_status not null,
  note text,
  recorded_by uuid not null references public.profiles(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (session_id, student_id)
);

create table public.memorization_submissions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  session_id uuid references public.tahfidz_sessions(id) on delete set null,
  type public.submission_type not null,
  surah_name text not null,
  start_ayah int not null check(start_ayah > 0),
  end_ayah int not null check(end_ayah >= start_ayah),
  fluency_score numeric(3,2) not null check(fluency_score between 1 and 5),
  tajwid_score numeric(3,2) not null check(tajwid_score between 1 and 5),
  makhraj_score numeric(3,2) not null check(makhraj_score between 1 and 5),
  mistake_count int not null default 0 check(mistake_count >= 0),
  note text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.student_notes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  note_date date not null default current_date,
  category text not null,
  note text not null,
  visibility public.note_visibility not null default 'internal',
  pinned boolean not null default false,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.focus_items (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  status public.focus_status not null default 'active',
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.weekly_targets (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  week_start date not null,
  target_text text not null,
  progress int not null default 0 check(progress between 0 and 100),
  status public.target_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.student_surah_progress (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  surah_name text not null,
  last_ayah int not null default 0,
  status text not null default 'proses' check(status in ('belum','proses','setor','lancar','murajaah','perlu_diulang')),
  last_submitted_at timestamptz,
  last_reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(teacher_id, student_id, surah_name)
);

create table public.report_snapshots (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  period_type text not null check(period_type in ('monthly','semester')),
  period_key text not null,
  analysis text,
  narrative text,
  next_focus text,
  status public.report_status not null default 'draft',
  snapshot_data jsonb not null default '{}'::jsonb,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(teacher_id, student_id, period_type, period_key)
);

create index idx_teacher_students_teacher on public.teacher_students(teacher_id) where is_active;
create index idx_sessions_teacher_date on public.tahfidz_sessions(teacher_id, session_date desc);
create index idx_submissions_teacher_student_date on public.memorization_submissions(teacher_id, student_id, submitted_at desc);
create index idx_notes_teacher_student_date on public.student_notes(teacher_id, student_id, note_date desc);
create index idx_focus_teacher_active on public.focus_items(teacher_id, status);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,display_name,email)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,'Guru Tahfidz'),'@',1)), new.email)
  on conflict(id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.sync_surah_progress() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.student_surah_progress(teacher_id,student_id,surah_name,last_ayah,status,last_submitted_at,last_reviewed_at)
  values(new.teacher_id,new.student_id,new.surah_name,new.end_ayah,
    case when new.type='murajaah' then 'murajaah' else 'setor' end,
    case when new.type='hafalan_baru' then new.submitted_at else null end,
    case when new.type='murajaah' then new.submitted_at else null end)
  on conflict(teacher_id,student_id,surah_name) do update set
    last_ayah=greatest(public.student_surah_progress.last_ayah,excluded.last_ayah),
    status=excluded.status,
    last_submitted_at=coalesce(excluded.last_submitted_at,public.student_surah_progress.last_submitted_at),
    last_reviewed_at=coalesce(excluded.last_reviewed_at,public.student_surah_progress.last_reviewed_at),
    updated_at=now();
  return new;
end; $$;
create trigger trg_sync_surah_progress after insert on public.memorization_submissions for each row execute procedure public.sync_surah_progress();

create or replace view public.student_progress_summary as
select
  ts.teacher_id,
  s.id as student_id,
  coalesce(round(100.0 * count(a.*) filter(where a.status='hadir') / nullif(count(distinct sess.id),0)),0) as attendance_rate,
  least(100, coalesce(count(distinct sp.surah_name) * 3,0))::int as progress_percent,
  coalesce(round(avg((ms.fluency_score+ms.tajwid_score+ms.makhraj_score)/3)::numeric,2),0) as average_score,
  coalesce((array_agg(ms.surah_name || ' ' || ms.start_ayah || '–' || ms.end_ayah order by ms.submitted_at desc) filter(where ms.id is not null))[1],'Belum ada setoran') as last_memorization,
  'stabil'::text as trend
from public.teacher_students ts
join public.students s on s.id=ts.student_id
left join public.tahfidz_sessions sess on sess.teacher_id=ts.teacher_id
left join public.tahfidz_attendance a on a.session_id=sess.id and a.student_id=s.id
left join public.memorization_submissions ms on ms.teacher_id=ts.teacher_id and ms.student_id=s.id
left join public.student_surah_progress sp on sp.teacher_id=ts.teacher_id and sp.student_id=s.id
where ts.is_active=true
group by ts.teacher_id,s.id;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.teacher_students enable row level security;
alter table public.tahfidz_sessions enable row level security;
alter table public.tahfidz_attendance enable row level security;
alter table public.memorization_submissions enable row level security;
alter table public.student_notes enable row level security;
alter table public.focus_items enable row level security;
alter table public.weekly_targets enable row level security;
alter table public.student_surah_progress enable row level security;
alter table public.report_snapshots enable row level security;

create policy "profile self read" on public.profiles for select using(id=auth.uid());
create policy "profile self update" on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy "teacher assignments self" on public.teacher_students for select using(teacher_id=auth.uid());
create policy "teacher can read assigned students" on public.students for select using(exists(select 1 from public.teacher_students ts where ts.student_id=students.id and ts.teacher_id=auth.uid() and ts.is_active));
create policy "sessions self all" on public.tahfidz_sessions for all using(teacher_id=auth.uid()) with check(teacher_id=auth.uid());
create policy "attendance self read" on public.tahfidz_attendance for select using(exists(select 1 from public.tahfidz_sessions s where s.id=tahfidz_attendance.session_id and s.teacher_id=auth.uid()));
create policy "attendance self write" on public.tahfidz_attendance for all using(recorded_by=auth.uid()) with check(recorded_by=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=tahfidz_attendance.student_id and ts.teacher_id=auth.uid() and ts.is_active));
create policy "submissions self all" on public.memorization_submissions for all using(teacher_id=auth.uid()) with check(teacher_id=auth.uid() and exists(select 1 from public.teacher_students ts where ts.student_id=memorization_submissions.student_id and ts.teacher_id=auth.uid() and ts.is_active));
create policy "notes self all" on public.student_notes for all using(teacher_id=auth.uid()) with check(teacher_id=auth.uid());
create policy "focus self all" on public.focus_items for all using(teacher_id=auth.uid()) with check(teacher_id=auth.uid());
create policy "targets self all" on public.weekly_targets for all using(teacher_id=auth.uid()) with check(teacher_id=auth.uid());
create policy "progress self all" on public.student_surah_progress for all using(teacher_id=auth.uid()) with check(teacher_id=auth.uid());
create policy "reports self all" on public.report_snapshots for all using(teacher_id=auth.uid()) with check(teacher_id=auth.uid());

grant select on public.student_progress_summary to authenticated;
