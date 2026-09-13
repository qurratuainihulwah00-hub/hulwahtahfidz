import { createClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";
import { demoStudents } from "@/lib/demo";
import { getAssignedStudents } from "@/lib/data";
import type { StudentOverview } from "@/lib/types";

const HULWAH_WORKSPACE_USER_ID = "31a9adbd-b5bf-4e14-ac56-d73d605363a5";

export async function getStudentOverviewsFast(): Promise<StudentOverview[]> {
  if (!isSupabaseConfigured || isDemoMode) return demoStudents;

  const students = await getAssignedStudents();
  if (!students.length) return [];

  const supabase = await createClient();
  const ids = students.map((student) => student.id);

  const [{ data: progressRows }, { data: focusRows }] = await Promise.all([
    supabase
      .from("student_progress_summary")
      .select("student_id,attendance_rate,progress_percent,average_score,last_memorization,trend")
      .eq("teacher_id", HULWAH_WORKSPACE_USER_ID)
      .in("student_id", ids),
    supabase
      .from("focus_items")
      .select("student_id,title,created_at")
      .eq("teacher_id", HULWAH_WORKSPACE_USER_ID)
      .eq("status", "active")
      .in("student_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  const progressByStudent = new Map((progressRows ?? []).map((row: any) => [row.student_id, row]));
  const focusByStudent = new Map<string, string>();
  for (const row of focusRows ?? []) {
    if (!focusByStudent.has(row.student_id)) focusByStudent.set(row.student_id, row.title);
  }

  return students.map((student) => {
    const progress: any = progressByStudent.get(student.id);
    return {
      ...student,
      attendanceRate: Number(progress?.attendance_rate ?? 0),
      progressPercent: Number(progress?.progress_percent ?? 0),
      averageScore: Number(progress?.average_score ?? 0),
      lastMemorization: progress?.last_memorization || "Belum ada setoran",
      trend: (progress?.trend ?? "stabil") as StudentOverview["trend"],
      focus: focusByStudent.get(student.id) ?? null,
    };
  });
}

export async function getSubmissionQueueFast(day: string) {
  const students = await getAssignedStudents();

  if (!isSupabaseConfigured || isDemoMode) {
    return students.map((student) => ({
      ...student,
      present: false,
      submitted: false,
      lastMemorization: (student as any).lastMemorization ?? "Belum ada setoran",
      focus: (student as any).focus ?? null,
    }));
  }

  if (!students.length) return [];

  const supabase = await createClient();
  const ids = students.map((student) => student.id);
  const { data: session } = await supabase
    .from("tahfidz_sessions")
    .select("id")
    .eq("teacher_id", HULWAH_WORKSPACE_USER_ID)
    .eq("session_date", day)
    .maybeSingle();

  const attendancePromise = session?.id
    ? supabase.from("tahfidz_attendance").select("student_id,status").eq("session_id", session.id)
    : Promise.resolve({ data: [] as Array<{ student_id: string; status: string }> });

  const [attendanceResult, todayResult, progressResult, focusResult] = await Promise.all([
    attendancePromise,
    supabase
      .from("memorization_submissions")
      .select("student_id")
      .eq("teacher_id", HULWAH_WORKSPACE_USER_ID)
      .in("student_id", ids)
      .gte("submitted_at", `${day}T00:00:00`)
      .lte("submitted_at", `${day}T23:59:59`),
    supabase
      .from("student_progress_summary")
      .select("student_id,last_memorization")
      .eq("teacher_id", HULWAH_WORKSPACE_USER_ID)
      .in("student_id", ids),
    supabase
      .from("focus_items")
      .select("student_id,title,created_at")
      .eq("teacher_id", HULWAH_WORKSPACE_USER_ID)
      .eq("status", "active")
      .in("student_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  const attendanceByStudent = new Map(
    (attendanceResult.data ?? []).map((row: any) => [row.student_id, row.status]),
  );
  const submitted = new Set((todayResult.data ?? []).map((row: any) => row.student_id));
  const progressByStudent = new Map(
    (progressResult.data ?? []).map((row: any) => [row.student_id, row.last_memorization]),
  );
  const focusByStudent = new Map<string, string>();
  for (const row of focusResult.data ?? []) {
    if (!focusByStudent.has(row.student_id)) focusByStudent.set(row.student_id, row.title);
  }

  return students.map((student) => ({
    ...student,
    present: attendanceByStudent.get(student.id) === "hadir",
    submitted: submitted.has(student.id),
    lastMemorization: progressByStudent.get(student.id) || "Belum ada setoran",
    focus: focusByStudent.get(student.id) ?? null,
  }));
}
