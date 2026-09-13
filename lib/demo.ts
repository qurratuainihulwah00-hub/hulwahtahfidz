import type { ClassTarget, DashboardData, ReportRow, StudentOverview } from "./types";

const classStudents: Array<{ className: string; names: string[] }> = [
  { className: "1 Ar Rahman", names: ["Shanum", "Raina", "Alif", "Feiza", "Aba", "Adiba"] },
  { className: "2 An Nur", names: ["Farzan", "Khaidar Ali", "Asyifa", "Shareen", "Valdis", "Azka", "Rajab", "Fikra"] },
  { className: "3 Az Zukhruf", names: ["Kayla", "Shanum", "Medina", "Aisyah", "Adel", "Amira"] },
];

export const demoStudents: StudentOverview[] = classStudents.flatMap(({ className, names }) =>
  names.map((full_name, index) => ({
    id: `demo-${className.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`,
    full_name,
    class_name: className,
    attendanceRate: 0,
    progressPercent: 0,
    averageScore: 0,
    lastMemorization: "Belum ada setoran",
    trend: "stabil" as const,
    focus: null,
  })),
);

export const demoClassTargets: ClassTarget[] = [
  { id: "target-1-1", className: "1 Ar Rahman", segmentNo: 1, startLabel: "An-Naba", endLabel: "Al-Fajr" },
  { id: "target-1-2", className: "1 Ar Rahman", segmentNo: 2, startLabel: "Al-Balad", endLabel: "An-Nas" },
  { id: "target-2-1", className: "2 An Nur", segmentNo: 1, startLabel: "Al-Mulk", endLabel: "Al-Jinn" },
  { id: "target-2-2", className: "2 An Nur", segmentNo: 2, startLabel: "Al-Muzzammil", endLabel: "Al-Baqarah: 29" },
  { id: "target-3-1", className: "3 Az Zukhruf", segmentNo: 1, startLabel: "Al-Baqarah: 30", endLabel: "Al-Baqarah: 112" },
  { id: "target-3-2", className: "3 Az Zukhruf", segmentNo: 2, startLabel: "Al-Baqarah: 113", endLabel: "Al-Baqarah: 190" },
];

export const demoDashboard: DashboardData = {
  teacherName: "Hulwah Qurratu Aini, S.Pd.",
  students: demoStudents,
  present: 0,
  submitted: 0,
  waiting: 0,
  izin: 0,
  sakit: 0,
  classes: classStudents.map((c) => ({ name: c.className, total: c.names.length, present: 0, submitted: 0 })),
  attention: [],
};

export const demoReports: ReportRow[] = demoStudents.map((s) => ({
  studentId: s.id,
  studentName: s.full_name,
  className: s.class_name,
  meetings: 0,
  present: 0,
  izin: 0,
  sakit: 0,
  alfa: 0,
  attendanceRate: 0,
  submissions: 0,
  newMemorization: 0,
  murajaah: 0,
  fluency: 0,
  tajwid: 0,
  makhraj: 0,
  averageScore: 0,
  progressPercent: 0,
  lastMemorization: "Belum ada setoran",
  reportNotes: [],
  analysis: "Belum ada data aktivitas Tahfidz pada periode ini.",
  narrative: "Narasi perkembangan akan tersusun setelah data absensi, setoran, murajaah, dan catatan guru mulai tercatat.",
  nextFocus: "Mulai pencatatan aktivitas Tahfidz untuk membentuk baseline perkembangan siswa.",
}));
