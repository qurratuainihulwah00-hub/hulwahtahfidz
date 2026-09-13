import { endOfMonth, endOfYear, format, startOfMonth, startOfYear } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";
import { demoClassTargets, demoDashboard, demoReports, demoStudents } from "@/lib/demo";
import { buildAnalysis, buildNarrative, buildNextFocus } from "@/lib/reporting";
import type { ClassTarget, DashboardData, ReportRow, Student, StudentOverview } from "@/lib/types";
import { pct } from "@/lib/utils";

async function getTeacherId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, teacherId: user?.id ?? null, email: user?.email ?? null };
}

export async function ensureHulwahWorkspace() {
  if (!isSupabaseConfigured || isDemoMode) return;
  const { supabase, teacherId } = await getTeacherId();
  if (!teacherId) return;
  await supabase.rpc("bootstrap_hulwah_workspace");
}

export async function getTeacherProfile() {
  if (!isSupabaseConfigured || isDemoMode) return { name: "Hulwah Qurratu Aini, S.Pd.", email: "", avatarUrl: null as string | null };
  const { supabase, teacherId, email } = await getTeacherId();
  if (!teacherId) return { name: "Hulwah Qurratu Aini, S.Pd.", email: email ?? "", avatarUrl: null as string | null };
  const { data } = await supabase.from("profiles").select("display_name,email,avatar_url").eq("id", teacherId).maybeSingle();
  return { name: data?.display_name || "Hulwah Qurratu Aini, S.Pd.", email: data?.email || email || "", avatarUrl: data?.avatar_url ?? null };
}

export async function getClassTargets(): Promise<ClassTarget[]> {
  if (!isSupabaseConfigured || isDemoMode) return demoClassTargets;
  const { supabase, teacherId } = await getTeacherId();
  if (!teacherId) return [];
  const { data, error } = await supabase
    .from("class_targets")
    .select("id,class_name,segment_no,start_label,end_label")
    .eq("teacher_id", teacherId)
    .order("class_name", { ascending: true })
    .order("segment_no", { ascending: true });
  if (error) return [];
  return (data ?? []).map((row: any) => ({
    id: row.id,
    className: row.class_name,
    segmentNo: row.segment_no,
    startLabel: row.start_label,
    endLabel: row.end_label,
  }));
}

export async function getAssignedStudents(): Promise<Student[]> {
  if (!isSupabaseConfigured || isDemoMode) return demoStudents;
  const { supabase, teacherId } = await getTeacherId();
  if (!teacherId) return [];
  const { data, error } = await supabase
    .from("teacher_students")
    .select("students(id,full_name,class_name,nis,avatar_url)")
    .eq("teacher_id", teacherId)
    .eq("is_active", true)
    .order("assigned_at", { ascending: true });
  if (error) return [];
  return (data ?? []).map((r: any) => r.students).filter(Boolean) as Student[];
}

export async function getDashboardData(date = new Date()): Promise<DashboardData> {
  if (!isSupabaseConfigured || isDemoMode) return demoDashboard;
  const { supabase, teacherId } = await getTeacherId();
  if (!teacherId) return { teacherName: "Guru Tahfidz", students: [], present: 0, submitted: 0, waiting: 0, izin: 0, sakit: 0, classes: [], attention: [] };
  const [profile, students] = await Promise.all([getTeacherProfile(), getAssignedStudents()]);
  const day = format(date, "yyyy-MM-dd");
  const { data: session } = await supabase.from("tahfidz_sessions").select("id").eq("teacher_id", teacherId).eq("session_date", day).maybeSingle();
  let attendance: any[] = [];
  if (session?.id) {
    const res = await supabase.from("tahfidz_attendance").select("student_id,status").eq("session_id", session.id);
    attendance = res.data ?? [];
  }
  const start = `${day}T00:00:00`;
  const end = `${day}T23:59:59`;
  const { data: submissions } = await supabase.from("memorization_submissions").select("student_id").eq("teacher_id", teacherId).gte("submitted_at", start).lte("submitted_at", end);
  const statusMap = new Map(attendance.map((a) => [a.student_id, a.status]));
  const submittedSet = new Set((submissions ?? []).map((s) => s.student_id));
  const presentStudents = students.filter((s) => statusMap.get(s.id) === "hadir");
  const classes = Array.from(new Set(students.map((s) => s.class_name))).sort().map((name) => {
    const classStudents = students.filter((s) => s.class_name === name);
    return {
      name,
      total: classStudents.length,
      present: classStudents.filter((s) => statusMap.get(s.id) === "hadir").length,
      submitted: classStudents.filter((s) => submittedSet.has(s.id)).length,
    };
  });
  const { data: focusRows } = await supabase.from("focus_items").select("id,student_id,title,students(full_name,class_name)").eq("teacher_id", teacherId).eq("status", "active").limit(5);
  const attention = (focusRows ?? []).map((r: any) => ({ id: r.id, studentId: r.student_id, studentName: r.students?.full_name ?? "Siswa", className: r.students?.class_name ?? "-", text: r.title, kind: "Fokus" }));
  return {
    teacherName: profile.name,
    students,
    present: presentStudents.length,
    submitted: presentStudents.filter((s) => submittedSet.has(s.id)).length,
    waiting: presentStudents.filter((s) => !submittedSet.has(s.id)).length,
    izin: students.filter((s) => statusMap.get(s.id) === "izin").length,
    sakit: students.filter((s) => statusMap.get(s.id) === "sakit").length,
    classes,
    attention,
  };
}

export async function getStudentOverviews(): Promise<StudentOverview[]> {
  if (!isSupabaseConfigured || isDemoMode) return demoStudents;
  const { supabase, teacherId } = await getTeacherId();
  if (!teacherId) return [];
  const students = await getAssignedStudents();
  const result: StudentOverview[] = [];
  for (const student of students) {
    const [{ data: progress }, { data: submissions }, { data: focus }] = await Promise.all([
      supabase.from("student_progress_summary").select("attendance_rate,progress_percent,average_score,last_memorization,trend").eq("teacher_id", teacherId).eq("student_id", student.id).maybeSingle(),
      supabase.from("memorization_submissions").select("surah_name,start_ayah,end_ayah").eq("teacher_id", teacherId).eq("student_id", student.id).order("submitted_at", { ascending: false }).limit(1),
      supabase.from("focus_items").select("title").eq("teacher_id", teacherId).eq("student_id", student.id).eq("status", "active").limit(1),
    ]);
    const last = submissions?.[0];
    result.push({
      ...student,
      attendanceRate: Number(progress?.attendance_rate ?? 0),
      progressPercent: Number(progress?.progress_percent ?? 0),
      averageScore: Number(progress?.average_score ?? 0),
      lastMemorization: progress?.last_memorization || (last ? `${last.surah_name} ${last.start_ayah}–${last.end_ayah}` : "Belum ada setoran"),
      trend: (progress?.trend ?? "stabil") as StudentOverview["trend"],
      focus: focus?.[0]?.title ?? null,
    });
  }
  return result;
}

export async function getAttendanceForDate(day: string) {
  const students = await getAssignedStudents();
  if (!isSupabaseConfigured || isDemoMode) return { students, statuses: {} };
  const { supabase, teacherId } = await getTeacherId();
  if (!teacherId) return { students, statuses: {} };
  const { data: session } = await supabase.from("tahfidz_sessions").select("id").eq("teacher_id", teacherId).eq("session_date", day).maybeSingle();
  if (!session) return { students, statuses: {} };
  const { data } = await supabase.from("tahfidz_attendance").select("student_id,status").eq("session_id", session.id);
  return { students, statuses: Object.fromEntries((data ?? []).map((r) => [r.student_id, r.status])) };
}

export async function getSubmissionQueue(day: string) {
  const students = await getAssignedStudents();
  if (!isSupabaseConfigured || isDemoMode) {
    return students.map((s) => ({ ...s, present: false, submitted: false, lastMemorization: (s as any).lastMemorization ?? "Belum ada setoran", focus: (s as any).focus ?? null }));
  }
  const { supabase, teacherId } = await getTeacherId();
  if (!teacherId) return [];
  const { data: session } = await supabase.from("tahfidz_sessions").select("id").eq("teacher_id", teacherId).eq("session_date", day).maybeSingle();
  const statuses = new Map<string, string>();
  if (session) {
    const { data: att } = await supabase.from("tahfidz_attendance").select("student_id,status").eq("session_id", session.id);
    (att ?? []).forEach((r) => statuses.set(r.student_id, r.status));
  }
  const { data: todaySubs } = await supabase.from("memorization_submissions").select("student_id").eq("teacher_id", teacherId).gte("submitted_at", `${day}T00:00:00`).lte("submitted_at", `${day}T23:59:59`);
  const submitted = new Set((todaySubs ?? []).map((s) => s.student_id));
  const rows = [];
  for (const s of students) {
    const [{ data: last }, { data: focus }] = await Promise.all([
      supabase.from("memorization_submissions").select("surah_name,start_ayah,end_ayah").eq("teacher_id", teacherId).eq("student_id", s.id).order("submitted_at", { ascending: false }).limit(1),
      supabase.from("focus_items").select("title").eq("teacher_id", teacherId).eq("student_id", s.id).eq("status", "active").limit(1),
    ]);
    const l = last?.[0];
    rows.push({ ...s, present: statuses.get(s.id) === "hadir", submitted: submitted.has(s.id), lastMemorization: l ? `${l.surah_name} ${l.start_ayah}–${l.end_ayah}` : "Belum ada setoran", focus: focus?.[0]?.title ?? null });
  }
  return rows;
}

export async function getStudentDetail(studentId: string) {
  if (!isSupabaseConfigured || isDemoMode) {
    const student = demoStudents.find((s) => s.id === studentId) ?? demoStudents[0];
    return { student, submissions: [], notes: [], focus: [], targets: [] };
  }
  const { supabase, teacherId } = await getTeacherId();
  if (!teacherId) return null;
  const { data: assignment } = await supabase.from("teacher_students").select("student_id").eq("teacher_id", teacherId).eq("student_id", studentId).eq("is_active", true).maybeSingle();
  if (!assignment) return null;
  const [{ data: student }, { data: submissions }, { data: notes }, { data: focus }, { data: targets }] = await Promise.all([
    supabase.from("students").select("id,full_name,class_name,nis,avatar_url").eq("id", studentId).single(),
    supabase.from("memorization_submissions").select("*").eq("teacher_id", teacherId).eq("student_id", studentId).order("submitted_at", { ascending: false }).limit(50),
    supabase.from("student_notes").select("*").eq("teacher_id", teacherId).eq("student_id", studentId).order("note_date", { ascending: false }).limit(100),
    supabase.from("focus_items").select("*").eq("teacher_id", teacherId).eq("student_id", studentId).order("created_at", { ascending: false }),
    supabase.from("weekly_targets").select("*").eq("teacher_id", teacherId).eq("student_id", studentId).order("week_start", { ascending: false }).limit(10),
  ]);
  return { student, submissions: submissions ?? [], notes: notes ?? [], focus: focus ?? [], targets: targets ?? [] };
}

export async function getReportRows(kind: "monthly" | "semester", period: string, className?: string): Promise<ReportRow[]> {
  if (!isSupabaseConfigured || isDemoMode) return className && className !== "all" ? demoReports.filter((r) => r.className === className) : demoReports;
  const { supabase, teacherId } = await getTeacherId();
  if (!teacherId) return [];
  let students = await getAssignedStudents();
  if (className && className !== "all") students = students.filter((s) => s.class_name === className);
  let start: Date;
  let end: Date;
  if (kind === "monthly") {
    const base = new Date(`${period}-01T00:00:00`);
    start = startOfMonth(base); end = endOfMonth(base);
  } else {
    const [yearText, semester] = period.split("-");
    const year = Number(yearText);
    if (semester === "ganjil") { start = new Date(year, 6, 1); end = new Date(year, 11, 31, 23, 59, 59); }
    else { start = new Date(year + 1, 0, 1); end = new Date(year + 1, 5, 30, 23, 59, 59); }
  }
  const startDay = format(start, "yyyy-MM-dd");
  const endDay = format(end, "yyyy-MM-dd");
  const { data: sessions } = await supabase.from("tahfidz_sessions").select("id,session_date").eq("teacher_id", teacherId).gte("session_date", startDay).lte("session_date", endDay);
  const sessionIds = (sessions ?? []).map((s) => s.id);
  const [{ data: attendance }, { data: submissions }, { data: notes }, { data: progress }] = await Promise.all([
    sessionIds.length ? supabase.from("tahfidz_attendance").select("student_id,status,session_id").in("session_id", sessionIds) : Promise.resolve({ data: [] } as any),
    supabase.from("memorization_submissions").select("student_id,type,surah_name,start_ayah,end_ayah,fluency_score,tajwid_score,makhraj_score,submitted_at").eq("teacher_id", teacherId).gte("submitted_at", start.toISOString()).lte("submitted_at", end.toISOString()),
    supabase.from("student_notes").select("student_id,note").eq("teacher_id", teacherId).eq("visibility", "report").gte("note_date", startDay).lte("note_date", endDay),
    supabase.from("student_progress_summary").select("student_id,progress_percent,last_memorization").eq("teacher_id", teacherId),
  ]);
  const rows: ReportRow[] = students.map((student) => {
    const att = (attendance ?? []).filter((a: any) => a.student_id === student.id);
    const subs = (submissions ?? []).filter((s: any) => s.student_id === student.id);
    const studentNotes = (notes ?? []).filter((n: any) => n.student_id === student.id).map((n: any) => n.note);
    const p = (progress ?? []).find((x: any) => x.student_id === student.id);
    const avg = (key: string) => subs.length ? subs.reduce((sum: number, x: any) => sum + Number(x[key] ?? 0), 0) / subs.length : 0;
    const base = {
      studentId: student.id,
      studentName: student.full_name,
      className: student.class_name,
      meetings: sessions?.length ?? 0,
      present: att.filter((a: any) => a.status === "hadir").length,
      izin: att.filter((a: any) => a.status === "izin").length,
      sakit: att.filter((a: any) => a.status === "sakit").length,
      alfa: att.filter((a: any) => a.status === "alfa").length,
      attendanceRate: pct(att.filter((a: any) => a.status === "hadir").length, sessions?.length ?? 0),
      submissions: subs.length,
      newMemorization: subs.filter((s: any) => s.type === "hafalan_baru").length,
      murajaah: subs.filter((s: any) => s.type === "murajaah").length,
      fluency: avg("fluency_score"), tajwid: avg("tajwid_score"), makhraj: avg("makhraj_score"),
      averageScore: (avg("fluency_score") + avg("tajwid_score") + avg("makhraj_score")) / 3,
      progressPercent: Number(p?.progress_percent ?? 0),
      lastMemorization: p?.last_memorization ?? (subs[0] ? `${subs[0].surah_name} ${subs[0].start_ayah}–${subs[0].end_ayah}` : "Belum ada setoran"),
      reportNotes: studentNotes,
    };
    return { ...base, analysis: buildAnalysis(base as any), narrative: buildNarrative(base as any), nextFocus: buildNextFocus(base as any) };
  });
  return rows;
}
