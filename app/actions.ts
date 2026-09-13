"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";
import type { AttendanceStatus, NoteVisibility, SubmissionType } from "@/lib/types";

async function context() {
  if (!isSupabaseConfigured || isDemoMode) return { supabase: null, teacherId: "demo" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi login tidak ditemukan.");
  return { supabase, teacherId: user.id };
}

export async function saveAttendanceAction(payload: { date: string; rows: Array<{ studentId: string; status: AttendanceStatus }> }) {
  const { supabase, teacherId } = await context();
  if (!supabase) return { ok: true };
  const { data: session, error: sessionError } = await supabase.from("tahfidz_sessions").upsert({ teacher_id: teacherId, session_date: payload.date }, { onConflict: "teacher_id,session_date" }).select("id").single();
  if (sessionError) return { ok: false, message: sessionError.message };
  const rows = payload.rows.map((row) => ({ session_id: session.id, student_id: row.studentId, status: row.status, recorded_by: teacherId }));
  const { error } = await supabase.from("tahfidz_attendance").upsert(rows, { onConflict: "session_id,student_id" });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/attendance"); revalidatePath("/dashboard"); revalidatePath("/submissions");
  return { ok: true };
}

export async function createSubmissionAction(payload: { studentId: string; date: string; type: SubmissionType; surahName: string; startAyah: number; endAyah: number; fluency: number; tajwid: number; makhraj: number; mistakes: number; note?: string }) {
  const { supabase, teacherId } = await context();
  if (!supabase) return { ok: true };
  const { data: assignment } = await supabase.from("teacher_students").select("student_id").eq("teacher_id", teacherId).eq("student_id", payload.studentId).eq("is_active", true).maybeSingle();
  if (!assignment) return { ok: false, message: "Siswa tidak termasuk binaan Anda." };
  const { data: session } = await supabase.from("tahfidz_sessions").upsert({ teacher_id: teacherId, session_date: payload.date }, { onConflict: "teacher_id,session_date" }).select("id").single();
  const { error } = await supabase.from("memorization_submissions").insert({
    teacher_id: teacherId, student_id: payload.studentId, session_id: session?.id ?? null,
    type: payload.type, surah_name: payload.surahName, start_ayah: payload.startAyah, end_ayah: payload.endAyah,
    fluency_score: payload.fluency, tajwid_score: payload.tajwid, makhraj_score: payload.makhraj,
    mistake_count: payload.mistakes, note: payload.note || null, submitted_at: `${payload.date}T12:00:00`,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/submissions"); revalidatePath("/murajaah"); revalidatePath("/dashboard"); revalidatePath(`/students/${payload.studentId}`);
  return { ok: true };
}

export async function createStudentNoteAction(payload: { studentId: string; noteDate: string; category: string; note: string; visibility: NoteVisibility; pinned: boolean }) {
  const { supabase, teacherId } = await context();
  if (!supabase) return { ok: true };
  const { error } = await supabase.from("student_notes").insert({ teacher_id: teacherId, student_id: payload.studentId, note_date: payload.noteDate, category: payload.category, note: payload.note, visibility: payload.visibility, pinned: payload.pinned });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/students/${payload.studentId}`); revalidatePath("/reports/monthly"); revalidatePath("/reports/semester");
  return { ok: true };
}

export async function createFocusAction(payload: { studentId: string; title: string }) {
  const { supabase, teacherId } = await context();
  if (!supabase) return { ok: true };
  const { error } = await supabase.from("focus_items").insert({ teacher_id: teacherId, student_id: payload.studentId, title: payload.title, status: "active" });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/students/${payload.studentId}`); revalidatePath("/dashboard");
  return { ok: true };
}
