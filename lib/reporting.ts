import { scoreLabel } from "./utils";
import type { ReportRow } from "./types";

export function buildAnalysis(row: Omit<ReportRow, "analysis" | "narrative" | "nextFocus">) {
  if (!row.meetings && !row.submissions) {
    return `Belum ada data aktivitas Tahfidz ${row.studentName} pada periode ini. Analisis akan muncul setelah absensi, setoran, atau murajaah mulai tercatat.`;
  }
  const strongest = [
    ["kelancaran", row.fluency],
    ["tajwid", row.tajwid],
    ["makhraj", row.makhraj],
  ].sort((a, b) => Number(b[1]) - Number(a[1]));
  const weakest = [...strongest].reverse()[0];
  const scoreText = row.submissions ? ` Nilai rata-rata ${row.averageScore.toFixed(2)} (${scoreLabel(row.averageScore)}). Aspek yang paling menonjol adalah ${strongest[0][0]}, sedangkan ${weakest[0]} menjadi area yang masih perlu diperkuat.` : " Belum ada setoran yang dapat digunakan untuk analisis kualitas bacaan.";
  return `Selama periode ini, ${row.studentName} mengikuti ${row.present} dari ${row.meetings} pertemuan dengan tingkat kehadiran ${row.attendanceRate}%. Tercatat ${row.submissions} aktivitas setoran yang terdiri atas ${row.newMemorization} hafalan baru dan ${row.murajaah} murajaah.${scoreText}`;
}

export function buildNarrative(row: Omit<ReportRow, "analysis" | "narrative" | "nextFocus">) {
  if (!row.meetings && !row.submissions && !row.reportNotes.length) {
    return `Narasi perkembangan ${row.studentName} akan tersusun setelah data pembelajaran mulai terkumpul.`;
  }
  const progressTone = row.progressPercent >= 85 ? "sangat baik" : row.progressPercent >= 70 ? "baik" : row.progressPercent > 0 ? "bertahap" : "masih pada tahap awal pencatatan";
  const note = row.reportNotes[0] ? ` Catatan pembinaan utama: ${row.reportNotes[0]}` : "";
  return `${row.studentName} menunjukkan perkembangan Tahfidz yang ${progressTone} dengan capaian target ${row.progressPercent}%. Aktivitas setoran dan murajaah menjadi dasar evaluasi untuk menjaga hafalan baru sekaligus menguatkan hafalan sebelumnya.${note}`;
}

export function buildNextFocus(row: Omit<ReportRow, "analysis" | "narrative" | "nextFocus">) {
  if (!row.submissions) return "Mulai pencatatan setoran dan murajaah secara konsisten untuk membentuk baseline perkembangan siswa.";
  const values = [
    ["kelancaran", row.fluency],
    ["tajwid", row.tajwid],
    ["makhraj", row.makhraj],
  ].sort((a, b) => Number(a[1]) - Number(b[1]));
  const focus = values[0][0];
  return `Fokus periode berikutnya diarahkan pada penguatan ${focus}, konsistensi murajaah, dan penyelesaian target hafalan berikutnya secara bertahap.`;
}
