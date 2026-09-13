import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";
import { demoReports, demoStudents } from "@/lib/demo";
import { buildAnalysis, buildNarrative, buildNextFocus } from "@/lib/reporting";
import type { ReportRow, Student } from "@/lib/types";
import { pct } from "@/lib/utils";

const HULWAH_WORKSPACE_ID = "31a9adbd-b5bf-4e14-ac56-d73d605363a5";

export type AcademicPeriod = {
  id: string;
  code: string;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export async function getAcademicPeriods(): Promise<AcademicPeriod[]> {
  if (!isSupabaseConfigured || isDemoMode) {
    return [
      {
        id: "demo-period",
        code: "2026-ganjil",
        label: "2026/2027 · Semester Ganjil",
        startDate: "2026-07-01",
        endDate: "2026-12-31",
        isActive: true,
      },
    ];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_periods")
    .select("id,code,label,start_date,end_date,is_active")
    .eq("teacher_id", HULWAH_WORKSPACE_ID)
    .order("start_date", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row: any) => ({
    id: row.id,
    code: row.code,
    label: row.label,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active,
  }));
}

async function getStudents(supabase: any): Promise<Student[]> {
  const { data, error } = await supabase
    .from("teacher_students")
    .select("students(id,full_name,class_name,nis,avatar_url)")
    .eq("teacher_id", HULWAH_WORKSPACE_ID)
    .eq("is_active", true)
    .order("assigned_at", { ascending: true });

  if (error) return [];
  return (data ?? []).map((row: any) => row.students).filter(Boolean) as Student[];
}

export async function getSemesterReportRows(periodCode: string, className?: string): Promise<ReportRow[]> {
  if (!isSupabaseConfigured || isDemoMode) {
    return className && className !== "all" ? demoReports.filter((row) => row.className === className) : demoReports;
  }

  const supabase = await createClient();
  const { data: period, error: periodError } = await supabase
    .from("academic_periods")
    .select("code,label,start_date,end_date")
    .eq("teacher_id", HULWAH_WORKSPACE_ID)
    .eq("code", periodCode)
    .maybeSingle();

  if (periodError || !period) return [];

  let students = await getStudents(supabase);
  if (className && className !== "all") students = students.filter((student) => student.class_name === className);

  const start = startOfDay(parseISO(period.start_date));
  const end = endOfDay(parseISO(period.end_date));
  const startDay = format(start, "yyyy-MM-dd");
  const endDay = format(end, "yyyy-MM-dd");

  const { data: sessions } = await supabase
    .from("tahfidz_sessions")
    .select("id,session_date")
    .eq("teacher_id", HULWAH_WORKSPACE_ID)
    .gte("session_date", startDay)
    .lte("session_date", endDay)
    .order("session_date", { ascending: true });

  const sessionIds = (sessions ?? []).map((session: any) => session.id);
  const [{ data: attendance }, { data: submissions }, { data: notes }, { data: progress }] = await Promise.all([
    sessionIds.length
      ? supabase.from("tahfidz_attendance").select("student_id,status,session_id").in("session_id", sessionIds)
      : Promise.resolve({ data: [] } as any),
    supabase
      .from("memorization_submissions")
      .select("student_id,type,surah_name,start_ayah,end_ayah,fluency_score,tajwid_score,makhraj_score,submitted_at")
      .eq("teacher_id", HULWAH_WORKSPACE_ID)
      .gte("submitted_at", start.toISOString())
      .lte("submitted_at", end.toISOString())
      .order("submitted_at", { ascending: false }),
    supabase
      .from("student_notes")
      .select("student_id,note")
      .eq("teacher_id", HULWAH_WORKSPACE_ID)
      .eq("visibility", "report")
      .gte("note_date", startDay)
      .lte("note_date", endDay),
    supabase
      .from("student_progress_summary")
      .select("student_id,progress_percent,last_memorization")
      .eq("teacher_id", HULWAH_WORKSPACE_ID),
  ]);

  return students.map((student) => {
    const studentAttendance = (attendance ?? []).filter((row: any) => row.student_id === student.id);
    const studentSubmissions = (submissions ?? []).filter((row: any) => row.student_id === student.id);
    const reportNotes = (notes ?? []).filter((row: any) => row.student_id === student.id).map((row: any) => row.note);
    const summary = (progress ?? []).find((row: any) => row.student_id === student.id);
    const average = (key: string) =>
      studentSubmissions.length
        ? studentSubmissions.reduce((sum: number, row: any) => sum + Number(row[key] ?? 0), 0) / studentSubmissions.length
        : 0;
    const latest = studentSubmissions[0];

    const base = {
      studentId: student.id,
      studentName: student.full_name,
      className: student.class_name,
      meetings: sessions?.length ?? 0,
      present: studentAttendance.filter((row: any) => row.status === "hadir").length,
      izin: studentAttendance.filter((row: any) => row.status === "izin").length,
      sakit: studentAttendance.filter((row: any) => row.status === "sakit").length,
      alfa: studentAttendance.filter((row: any) => row.status === "alfa").length,
      attendanceRate: pct(studentAttendance.filter((row: any) => row.status === "hadir").length, sessions?.length ?? 0),
      submissions: studentSubmissions.length,
      newMemorization: studentSubmissions.filter((row: any) => row.type === "hafalan_baru").length,
      murajaah: studentSubmissions.filter((row: any) => row.type === "murajaah").length,
      fluency: average("fluency_score"),
      tajwid: average("tajwid_score"),
      makhraj: average("makhraj_score"),
      averageScore: (average("fluency_score") + average("tajwid_score") + average("makhraj_score")) / 3,
      progressPercent: Number(summary?.progress_percent ?? 0),
      lastMemorization:
        summary?.last_memorization ??
        (latest ? `${latest.surah_name} ${latest.start_ayah}–${latest.end_ayah}` : "Belum ada setoran"),
      reportNotes,
    };

    return {
      ...base,
      analysis: buildAnalysis(base as any),
      narrative: buildNarrative(base as any),
      nextFocus: buildNextFocus(base as any),
    };
  });
}
