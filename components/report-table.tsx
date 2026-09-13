"use client";
import { useMemo, useState } from "react";
import { Download, FileArchive, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import type { ReportRow } from "@/lib/types";
import { Badge } from "@/components/ui";

export function ReportTable({ rows, title, period }: { rows: ReportRow[]; title: string; period: string }) {
  const classes = useMemo(() => Array.from(new Set(rows.map((row) => row.className))).sort(), [rows]);
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? rows : rows.filter((row) => row.className === filter);

  const makePdf = (row: ReportRow) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, 20, 20);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Nama: ${row.studentName}`, 20, 32);
    doc.text(`Kelas: ${row.className}`, 20, 39);
    doc.text(`Periode: ${period}`, 20, 46);
    doc.setDrawColor(220);
    doc.line(20, 52, 190, 52);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan", 20, 62);
    doc.setFont("helvetica", "normal");
    doc.text(`Kehadiran: ${row.attendanceRate}% (${row.present}/${row.meetings})`, 20, 71);
    doc.text(`Setoran: ${row.submissions} | Hafalan baru: ${row.newMemorization} | Murajaah: ${row.murajaah}`, 20, 78);
    doc.text(`Kelancaran: ${row.fluency.toFixed(1)} | Tajwid: ${row.tajwid.toFixed(1)} | Makhraj: ${row.makhraj.toFixed(1)}`, 20, 85);
    doc.text(`Progress target: ${row.progressPercent}%`, 20, 92);
    doc.setFont("helvetica", "bold");
    doc.text("Analisis Perkembangan", 20, 105);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(row.analysis, 170), 20, 113);
    doc.setFont("helvetica", "bold");
    doc.text("Narasi Perkembangan", 20, 145);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(row.narrative, 170), 20, 153);
    doc.setFont("helvetica", "bold");
    doc.text("Fokus Pembinaan Berikutnya", 20, 183);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(row.nextFocus, 170), 20, 191);
    if (row.reportNotes.length) {
      doc.setFont("helvetica", "bold");
      doc.text("Catatan Guru", 20, 220);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(row.reportNotes.join(" • "), 170), 20, 228);
    }
    return doc;
  };

  const pdf = (row: ReportRow) => makePdf(row).save(`${safe(row.studentName)}_${safe(period)}.pdf`);

  const excel = () => {
    const workbook = XLSX.utils.book_new();
    const summary = visible.map((row, index) => ({
      No: index + 1,
      Nama: row.studentName,
      Kelas: row.className,
      Kehadiran: `${row.attendanceRate}%`,
      Setoran: row.submissions,
      "Hafalan Baru": row.newMemorization,
      Murajaah: row.murajaah,
      Kelancaran: +row.fluency.toFixed(2),
      Tajwid: +row.tajwid.toFixed(2),
      Makhraj: +row.makhraj.toFixed(2),
      "Nilai Rata-rata": +row.averageScore.toFixed(2),
      "Progress Target": `${row.progressPercent}%`,
      "Fokus Pembinaan": row.nextFocus,
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), "Ringkasan");
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        visible.map((row) => ({
          Nama: row.studentName,
          Kelas: row.className,
          Analisis: row.analysis,
          Narasi: row.narrative,
          Catatan: row.reportNotes.join(" | "),
          Rekomendasi: row.nextFocus,
        })),
      ),
      "Narasi & Analisis",
    );
    XLSX.writeFile(workbook, `Rekap_Tahfidz_${safe(period)}_${filter === "all" ? "Semua_Kelas" : safe(filter)}.xlsx`);
  };

  const allPdf = async () => {
    const zip = new JSZip();
    visible.forEach((row) => zip.file(`${safe(row.studentName)}.pdf`, makePdf(row).output("arraybuffer")));
    const blob = await zip.generateAsync({ type: "blob" });
    const anchor = document.createElement("a");
    const url = URL.createObjectURL(blob);
    anchor.href = url;
    anchor.download = `Laporan_PDF_${safe(period)}_${safe(filter)}.zip`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <select className="input w-full sm:w-auto sm:min-w-40" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Semua kelas</option>
          {classes.map((className) => <option key={className} value={className}>Kelas {className}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2 sm:ml-auto sm:flex sm:flex-wrap">
          <button onClick={allPdf} disabled={!visible.length} className="button-secondary min-h-11 px-3 disabled:opacity-50">
            <FileArchive size={16} /> <span className="truncate">Semua PDF</span>
          </button>
          <button onClick={excel} disabled={!visible.length} className="button-primary min-h-11 px-3 disabled:opacity-50">
            <Download size={16} /> <span className="truncate">Excel Kelas</span>
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-muted">
              <tr>
                {['Siswa', 'Kelas', 'Hadir', 'Setoran', 'Hafalan', 'Murajaah', 'Nilai', 'Progress', 'Laporan'].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-bold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((row) => (
                <tr key={row.studentId} className="hover:bg-teal-50/30">
                  <td className="px-4 py-4 font-bold">{row.studentName}</td>
                  <td className="px-4 py-4"><Badge>{row.className}</Badge></td>
                  <td className="px-4 py-4">{row.attendanceRate}%</td>
                  <td className="px-4 py-4">{row.submissions}</td>
                  <td className="px-4 py-4">{row.newMemorization}</td>
                  <td className="px-4 py-4">{row.murajaah}</td>
                  <td className="px-4 py-4 font-bold">{row.averageScore.toFixed(1)}</td>
                  <td className="px-4 py-4">{row.progressPercent}%</td>
                  <td className="px-4 py-4">
                    <button onClick={() => pdf(row)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100">
                      <FileText size={14} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visible.length && <div className="p-8 text-center text-sm text-muted">Belum ada data laporan untuk filter ini.</div>}
      </div>
      <p className="text-[11px] leading-5 text-muted sm:hidden">Geser tabel ke samping untuk melihat seluruh kolom laporan.</p>
    </div>
  );
}

function safe(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "_");
}
