-- Tahfidz with Hulwah: personal workspace bootstrap, class targets, and teacher avatar support.

alter table public.profiles add column if not exists avatar_url text;

create table if not exists public.class_targets (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_name text not null,
  segment_no int not null check(segment_no > 0),
  start_label text not null,
  end_label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(teacher_id, class_name, segment_no)
);

create index if not exists idx_class_targets_teacher_class on public.class_targets(teacher_id, class_name, segment_no);
alter table public.class_targets enable row level security;
create policy "class targets self all" on public.class_targets for all using(teacher_id=auth.uid()) with check(teacher_id=auth.uid());
create trigger trg_class_targets_updated before update on public.class_targets for each row execute procedure public.touch_updated_at();

create or replace function public.bootstrap_hulwah_workspace() returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_teacher uuid := auth.uid();
  v_student uuid;
  v_created int := 0;
  r record;
begin
  if v_teacher is null then raise exception 'Not authenticated'; end if;

  insert into public.profiles(id, display_name)
  values(v_teacher, 'Hulwah Qurratu Aini, S.Pd.')
  on conflict(id) do update set display_name='Hulwah Qurratu Aini, S.Pd.', updated_at=now();

  if not exists(select 1 from public.teacher_students where teacher_id=v_teacher and is_active) then
    for r in
      select * from (values
        ('1 Ar Rahman','Shanum',1), ('1 Ar Rahman','Raina',2), ('1 Ar Rahman','Alif',3),
        ('1 Ar Rahman','Feiza',4), ('1 Ar Rahman','Aba',5), ('1 Ar Rahman','Adiba',6),
        ('2 An Nur','Farzan',1), ('2 An Nur','Khaidar Ali',2), ('2 An Nur','Asyifa',3),
        ('2 An Nur','Shareen',4), ('2 An Nur','Valdis',5), ('2 An Nur','Azka',6),
        ('2 An Nur','Rajab',7), ('2 An Nur','Fikra',8),
        ('3 Az Zukhruf','Kayla',1), ('3 Az Zukhruf','Shanum',2), ('3 Az Zukhruf','Medina',3),
        ('3 Az Zukhruf','Aisyah',4), ('3 Az Zukhruf','Adel',5), ('3 Az Zukhruf','Amira',6)
      ) as x(class_name, full_name, sort_no)
      order by class_name, sort_no
    loop
      insert into public.students(full_name, class_name) values(r.full_name, r.class_name) returning id into v_student;
      insert into public.teacher_students(teacher_id, student_id) values(v_teacher, v_student);
      v_created := v_created + 1;
    end loop;
  end if;

  insert into public.class_targets(teacher_id, class_name, segment_no, start_label, end_label)
  values
    (v_teacher,'1 Ar Rahman',1,'An-Naba','Al-Fajr'),
    (v_teacher,'1 Ar Rahman',2,'Al-Balad','An-Nas'),
    (v_teacher,'2 An Nur',1,'Al-Mulk','Al-Jinn'),
    (v_teacher,'2 An Nur',2,'Al-Muzzammil','Al-Baqarah: 29'),
    (v_teacher,'3 Az Zukhruf',1,'Al-Baqarah: 30','Al-Baqarah: 112'),
    (v_teacher,'3 Az Zukhruf',2,'Al-Baqarah: 113','Al-Baqarah: 190')
  on conflict(teacher_id, class_name, segment_no) do update set start_label=excluded.start_label,end_label=excluded.end_label,updated_at=now();

  return jsonb_build_object('teacher_id',v_teacher,'students_created',v_created);
end; $$;

revoke all on function public.bootstrap_hulwah_workspace() from public;
grant execute on function public.bootstrap_hulwah_workspace() to authenticated;
