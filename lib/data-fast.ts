import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isDemoMode, isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";
import { demoClassTargets, demoDashboard, demoStudents } from "@/lib/demo";
import { getAttendanceForDate, getDashboardData, getSubmissionQueue, getStudentOverviews } from "@/lib/data";
import type { AttendanceStatus, ClassTarget, DashboardData, StudentOverview } from "@/lib/types";

const fastClient = isSupabaseConfigured
  ? createSupabaseClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export async function getDashboardDataFast(): Promise<DashboardData> {
  if (!fastClient || isDemoMode) return demoDashboard;
  const { data, error } = await fastClient.rpc("hulwah_dashboard_snapshot");
  if (error || !data) {
    console.error("hulwah_dashboard_snapshot failed", error?.message);
    return getDashboardData();
  }
  return data as DashboardData;
}

export async function getAttendanceForDateFast(day: string) {
  if (!fastClient || isDemoMode) {
    return { students: demoStudents, statuses: {} as Record<string, AttendanceStatus> };
  }
  const { data, error } = await fastClient.rpc("hulwah_attendance_snapshot", { p_day: day });
  if (error || !data) {
    console.error("hulwah_attendance_snapshot failed", error?.message);
    return getAttendanceForDate(day);
  }
  const payload = data as { students?: typeof demoStudents; statuses?: Record<string, AttendanceStatus> };
  return {
    students: payload.students ?? [],
    statuses: payload.statuses ?? {},
  };
}

export async function getStudentOverviewsFast(): Promise<StudentOverview[]> {
  if (!fastClient || isDemoMode) return demoStudents;
  const { data, error } = await fastClient.rpc("hulwah_student_overviews_snapshot");
  if (error || !data) {
    console.error("hulwah_student_overviews_snapshot failed", error?.message);
    return getStudentOverviews();
  }
  return data as StudentOverview[];
}

export async function getSubmissionQueueFast(day: string) {
  if (!fastClient || isDemoMode) {
    return demoStudents.map((student) => ({
      ...student,
      present: false,
      submitted: false,
      lastMemorization: (student as any).lastMemorization ?? "Belum ada setoran",
      focus: (student as any).focus ?? null,
    }));
  }
  const { data, error } = await fastClient.rpc("hulwah_submission_queue_snapshot", { p_day: day });
  if (error || !data) {
    console.error("hulwah_submission_queue_snapshot failed", error?.message);
    return getSubmissionQueue(day);
  }
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

export async function getClassTargetsFast(): Promise<ClassTarget[]> {
  if (!fastClient || isDemoMode) return demoClassTargets;
  const { data, error } = await fastClient
    .from("class_targets")
    .select("id,class_name,segment_no,start_label,end_label")
    .order("class_name", { ascending: true })
    .order("segment_no", { ascending: true });

  if (error) {
    console.error("class target fast read failed", error.message);
    return demoClassTargets;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    className: row.class_name,
    segmentNo: row.segment_no,
    startLabel: row.start_label,
    endLabel: row.end_label,
  }));
}
