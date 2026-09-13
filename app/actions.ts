"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";
import type { AttendanceStatus, NoteVisibility, SubmissionType } from "@/lib/types";

const HULWAH_WORKSPACE_ID = "31a9adbd-b5bf-4e14-ac56-d73d605363a5";

async function context() {
  if (!isSupabaseConfigured || isDemoMode) return { supabase: null, teacherId: "demo" };
  const supabase = await createClient();
  return { supabase, teacherId: HULWAH_WORKSPACE_ID };
}

async function ownsStudent(supabase: any, teacherId: string, studentId: string) {
  const { data } = await supabase
    .from("teacher_students")
    .select("student_id")
    .eq("teacher_id", teacherId)
    .eq("student_id", studentId)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(data);
}

export async function saveAttendanceAction(payload: { date: string; rows: Array<{ studentId: string; status: AttendanceStatus }> }) {
  const { supabase, teacherId } = await context();
  if (!supabase) return { ok: true };
  if (!payload.rows.length) return { ok: false, message: "Tidak ada siswa untuk disimpan." };

  const { data: session, error: sessionError } = await supabase
    .from("tahfidz_sessions")
    .upsert({ teacher_id: teacherId, session_date: payload.date }, { onConflict: "teacher_id,session_date" })
    .select("id")
    .single();
  if (sessionError) return { ok: false, message: sessionError.message };

  const rows = payload.rows.map((row) => ({
    session_id: session.id,
    student_id: row.studentId,
    status: row.status,
    recorded_by: teacherId,
  }));
  const { error } = await supabase.from("tahfidz_attendance").upsert(rows, { onConflict: "session_id,student_id" });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  revalidatePath("/submissions");
  revalidatePath("/progress");
  return { ok: true };
}

export async function createSubmissionAction(payload: { studentId: string; date: string; type: SubmissionType; surahName: string; startAyah: number; endAyah: number; fluency: number; tajwid: number; makhraj: number; mistakes: number; note?: string }) {
  const { supabase, teacherId } = await context();
  if (!supabase) return { ok: true };
  if (!(await ownsStudent(supabase, teacherId, payload.studentId))) return { ok: false, message: "Siswa tidak termasuk binaan Anda." };
  if (!payload.surahName || payload.startAyah < 1 || payload.endAyah < payload.startAyah) return { ok: false, message: "Rentang ayat belum valid." };
  if ([payload.fluency, payload.tajwid, payload.makhraj].some((score) => score < 1 || score > 5)) return { ok: false, message: "Nilai harus antara 1–5." };

  const { data: session, error: sessionError } = await supabase
    .from("tahfidz_sessions")
    .upsert({ teacher_id: teacherId, session_date: payload.date }, { onConflict: "teacher_id,session_date" })
    .select("id")
    .single();
  if (sessionError) return { ok: false, message: sessionError.message };

  const { error } = await supabase.from("memorization_submissions").insert({
    teacher_id: teacherId,
    student_id: payload.studentId,
    session_id: session.id,
    type: payload.type,
    surah_name: payload.surahName,
    start_ayah: payload.startAyah,
    end_ayah: payload.endAyah,
    fluency_score: payload.fluency,
    tajwid_score: payload.tajwid,
    makhraj_score: payload.makhraj,
    mistake_count: Math.max(0, payload.mistakes),
    note: payload.note || null,
    submitted_at: `${payload.date}T12:00:00`,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/submissions");
  revalidatePath("/murajaah");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath(`/students/${payload.studentId}`);
  revalidatePath("/reports/monthly");
  revalidatePath("/reports/semester");
  return { ok: true };
}

export async function createStudentNoteAction(payload: { studentId: string; noteDate: string; category: string; note: string; visibility: NoteVisibility; pinned: boolean }) {
  const { supabase, teacherId } = await context();
  if (!supabase) return { ok: true };
  if (!(await ownsStudent(supabase, teacherId, payload.studentId))) return { ok: false, message: "Siswa tidak ditemukan." };
  if (!payload.note.trim()) return { ok: false, message: "Catatan tidak boleh kosong." };

  const { error } = await supabase.from("student_notes").insert({
    teacher_id: teacherId,
    student_id: payload.studentId,
    note_date: payload.noteDate,
    category: payload.category,
    note: payload.note.trim(),
    visibility: payload.visibility,
    pinned: payload.pinned,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/students/${payload.studentId}`);
  revalidatePath("/reports/monthly");
  revalidatePath("/reports/semester");
  return { ok: true };
}

export async function createFocusAction(payload: { studentId: string; title: string }) {
  const { supabase, teacherId } = await context();
  if (!supabase) return { ok: true };
  if (!(await ownsStudent(supabase, teacherId, payload.studentId))) return { ok: false, message: "Siswa tidak ditemukan." };
  if (!payload.title.trim()) return { ok: false, message: "Fokus pembinaan tidak boleh kosong." };

  const { error } = await supabase.from("focus_items").insert({
    teacher_id: teacherId,
    student_id: payload.studentId,
    title: payload.title.trim(),
    status: "active",
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/students/${payload.studentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  return { ok: true };
}

export async function resolveFocusAction(payload: { studentId: string; focusId: string }) {
  const { supabase, teacherId } = await context();
  if (!supabase) return { ok: true };
  const { error } = await supabase
    .from("focus_items")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", payload.focusId)
    .eq("teacher_id", teacherId)
    .eq("student_id", payload.studentId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/students/${payload.studentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  return { ok: true };
}

export async function createWeeklyTargetAction(payload: { studentId: string; weekStart: string; targetText: string; progress?: number; status?: "active" | "done" | "carried" }) {
  const { supabase, teacherId } = await context();
  if (!supabase) return { ok: true };
  if (!(await ownsStudent(supabase, teacherId, payload.studentId))) return { ok: false, message: "Siswa tidak ditemukan." };
  if (!payload.targetText.trim()) return { ok: false, message: "Target mingguan tidak boleh kosong." };

  const progress = Math.min(100, Math.max(0, Number(payload.progress ?? 0)));
  const status = payload.status ?? (progress >= 100 ? "done" : "active");
  const { error } = await supabase.from("weekly_targets").insert({
    teacher_id: teacherId,
    student_id: payload.studentId,
    week_start: payload.weekStart,
    target_text: payload.targetText.trim(),
    progress,
    status,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/students/${payload.studentId}`);
  revalidatePath("/reports/monthly");
  revalidatePath("/reports/semester");
  return { ok: true };
}

export async function updateWeeklyTargetAction(payload: { studentId: string; targetId: string; progress: number; status: "active" | "done" | "carried" }) {
  const { supabase, teacherId } = await context();
  if (!supabase) return { ok: true };
  const progress = Math.min(100, Math.max(0, Number(payload.progress)));
  const status = progress >= 100 ? "done" : payload.status;
  const { error } = await supabase
    .from("weekly_targets")
    .update({ progress, status })
    .eq("id", payload.targetId)
    .eq("teacher_id", teacherId)
    .eq("student_id", payload.studentId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/students/${payload.studentId}`);
  revalidatePath("/reports/monthly");
  revalidatePath("/reports/semester");
  return { ok: true };
}
