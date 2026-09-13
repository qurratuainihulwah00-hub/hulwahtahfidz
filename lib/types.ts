export type AttendanceStatus = "hadir" | "izin" | "sakit" | "alfa";
export type SubmissionType = "hafalan_baru" | "murajaah";
export type NoteVisibility = "internal" | "report";

export type ClassTarget = {
  id: string;
  className: string;
  segmentNo: number;
  startLabel: string;
  endLabel: string;
};

export type Student = {
  id: string;
  full_name: string;
  class_name: string;
  nis?: string | null;
  avatar_url?: string | null;
};

export type StudentOverview = Student & {
  attendanceRate: number;
  progressPercent: number;
  averageScore: number;
  lastMemorization: string;
  trend: "meningkat" | "stabil" | "menurun";
  focus?: string | null;
};

export type DashboardData = {
  teacherName: string;
  students: Student[];
  present: number;
  submitted: number;
  waiting: number;
  izin: number;
  sakit: number;
  classes: Array<{ name: string; total: number; present: number; submitted: number }>;
  attention: Array<{ id: string; studentId: string; studentName: string; className: string; text: string; kind: string }>;
};

export type ReportRow = {
  studentId: string;
  studentName: string;
  className: string;
  meetings: number;
  present: number;
  izin: number;
  sakit: number;
  alfa: number;
  attendanceRate: number;
  submissions: number;
  newMemorization: number;
  murajaah: number;
  fluency: number;
  tajwid: number;
  makhraj: number;
  averageScore: number;
  progressPercent: number;
  lastMemorization: string;
  reportNotes: string[];
  analysis: string;
  narrative: string;
  nextFocus: string;
};
