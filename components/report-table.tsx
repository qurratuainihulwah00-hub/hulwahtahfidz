"use client";

import { useMemo, useState } from "react";
import { Download, FileArchive, FileText, Loader2 } from "lucide-react";
import type { ReportRow } from "@/lib/types";
import { Badge } from "@/components/ui";

export function ReportTable({ rows, title, period }: { rows: ReportRow[]; title: string; period: string }) {
  const classes = useMemo(() => Array.from(new Set(rows.map((row) => row.className))).sort(), [rows]);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const visible = filter === "all" ? rows : rows.filter((row) => row.className === filter);

  const pdf = async (row: ReportRow) => {
    setBusy(`pdf-${row.studentId}`);
    try {
      const { jsPDF } = await import("jspdf");
      makePdf(jsPDF, row, title, period).save(`${safe(row.studentName)}_${safe(period)}.pdf`);
    } finally {
      setBusy(null);
    }
  };

  const excel = async () => {
    setBusy("excel");
    try {
      const XLSX = await import("xlsx");
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
      const summarySheet = XLSX.utils.json_to_sheet(summary);
      summarySheet["!cols"] = [
        { wch: 5 }, { wch: 24 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
        { wch: 11 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 42 },
      ];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");

      const narrativeSheet = XLSX.utils.json_to_sheet(
        visible.map((row) => ({
          Nama: row.studentName,
          Kelas: row.className,
          Analisis: row.analysis,
          Narasi: row.narrative,
          Catatan: row.reportNotes.join(" | "),
          Rekomendasi: row.nextFocus,
        })),
      );
      narrativeSheet["!cols"] = [
        { wch: 24 }, { wch: 18 }, { wch: 60 }, { wch: 70 }, { wch: 60 }, { wch: 48 },
      ];
      XLSX.utils.book_append_sheet(workbook, narrativeSheet, "Narasi & Analisis");
      XLSX.writeFile(workbook, `Rekap_Tahfidz_${safe(period)}_${filter === "all" ? "Semua_Kelas" : safe(filter)}.xlsx`);
    } finally {
      setBusy(null);
    }
  };

  const allPdf = async () => {
    setBusy("zip");
    try {
      const [{ default: JSZip }, { jsPDF }] = await Promise.all([import("jszip"), import("jspdf")]);
      const zip = new JSZip();
      visible.forEach((row) => zip.file(`${safe(row.studentName)}.pdf`, makePdf(jsPDF, row, title, period).output("arraybuffer")));
      const blob = await zip.generateAsync({ type: "blob" });
      const anchor = document.createElement("a");
      const url = URL.createObjectURL(blob);
      anchor.href = url;
      anchor.download = `Laporan_PDF_${safe(period)}_${filter === "all" ? "Semua_Kelas" : safe(filter)}.zip`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <select className="input w-full sm:w-auto sm:min-w-44" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Semua kelas</option>
          {classes.map((className) => <option key={className} value={className}>Kelas {className}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2 sm:ml-auto sm:flex sm:flex-wrap">
          <button type="button" onClick={allPdf} disabled={!visible.length || busy !== null} className="button-secondary min-h-11 px-3 disabled:opacity-50">
            {busy === "zip" ? <Loader2 className="animate-spin" size={16} /> : <FileArchive size={16} />}
            <span className="truncate">Semua PDF</span>
          </button>
          <button type="button" onClick={excel} disabled={!visible.length || busy !== null} className="button-primary min-h-11 px-3 disabled:opacity-50">
            {busy === "excel" ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            <span className="truncate">Excel Kelas</span>
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {visible.map((row) => (
          <article key={row.studentId} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-extrabold">{row.studentName}</h3>
                <div className="mt-1"><Badge>Kelas {row.className}</Badge></div>
              </div>
              <button type="button" onClick={() => void pdf(row)} disabled={busy !== null} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 disabled:opacity-50">
                {busy === `pdf-${row.studentId}` ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />} PDF
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Metric label="Kehadiran" value={`${row.attendanceRate}%`} />
              <Metric label="Nilai" value={row.averageScore.toFixed(1)} />
              <Metric label="Setoran" value={row.submissions} />
              <Metric label="Progress" value={`${row.progressPercent}%`} />
            </div>
            <p className="mt-3 line-clamp-3 text-xs leading-5 text-muted">{row.narrative}</p>
          </article>
        ))}
      </div>

      <div className="card hidden overflow-hidden md:block">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-muted">
              <tr>
                {["Siswa", "Kelas", "Hadir", "Setoran", "Hafalan", "Murajaah", "Nilai", "Progress", "Laporan"].map((heading) => (
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
                    <button type="button" onClick={() => void pdf(row)} disabled={busy !== null} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 disabled:opacity-50">
                      {busy === `pdf-${row.studentId}` ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />} PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!visible.length && <div className="card p-8 text-center text-sm text-muted">Belum ada data laporan untuk filter ini.</div>}
    </div>
  );
}

function makePdf(JsPdf: any, row: ReportRow, title: string, period: string) {
  const doc = new JsPdf();
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
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] font-semibold text-muted">{label}</div><div className="mt-1 font-extrabold">{value}</div></div>;
}

function safe(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "_");
}
