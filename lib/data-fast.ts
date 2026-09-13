import { createClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";
import { demoDashboard, demoStudents } from "@/lib/demo";
import { getAttendanceForDate, getDashboardData, getSubmissionQueue, getStudentOverviews } from "@/lib/data";
import type { AttendanceStatus, DashboardData, StudentOverview } from "@/lib/types";

export async function getDashboardDataFast(): Promise<DashboardData> {
  if (!isSupabaseConfigured || isDemoMode) return demoDashboard;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hulwah_dashboard_snapshot");
  if (error || !data) return getDashboardData();
  return data as DashboardData;
}

export async function getAttendanceForDateFast(day: string) {
  if (!isSupabaseConfigured || isDemoMode) {
    return { students: demoStudents, statuses: {} as Record<string, AttendanceStatus> };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hulwah_attendance_snapshot", { p_day: day });
  if (error || !data) return getAttendanceForDate(day);
  const payload = data as { students?: typeof demoStudents; statuses?: Record<string, AttendanceStatus> };
  return {
    students: payload.students ?? [],
    statuses: payload.statuses ?? {},
  };
}

export async function getStudentOverviewsFast(): Promise<StudentOverview[]> {
  if (!isSupabaseConfigured || isDemoMode) return demoStudents;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hulwah_student_overviews_snapshot");
  if (error || !data) return getStudentOverviews();
  return data as StudentOverview[];
}

export async function getSubmissionQueueFast(day: string) {
  if (!isSupabaseConfigured || isDemoMode) {
    return demoStudents.map((student) => ({
      ...student,
      present: false,
      submitted: false,
      lastMemorization: (student as any).lastMemorization ?? "Belum ada setoran",
      focus: (student as any).focus ?? null,
    }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hulwah_submission_queue_snapshot", { p_day: day });
  if (error || !data) return getSubmissionQueue(day);
  return data as Array<{
    id: string;
    full_name: string;
    class_name: string;
    nis?: string | null;
    avatar_url?: string | null;
    present: boolean;
    submitted: boolean;
    lastMemorization: string;
    focus?: string | null;
  }>;
}
