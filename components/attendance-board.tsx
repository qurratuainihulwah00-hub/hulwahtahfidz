"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Download, FileSpreadsheet, Loader2, Users, X } from "lucide-react";
import { saveAttendanceAction } from "@/app/actions";
import type { AttendanceStatus, Student } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const options: Array<{ value: AttendanceStatus; label: string; style: string }> = [
  { value: "hadir", label: "Hadir", style: "data-[active=true]:bg-emerald-600 data-[active=true]:text-white" },
  { value: "izin", label: "Izin", style: "data-[active=true]:bg-sky-600 data-[active=true]:text-white" },
  { value: "sakit", label: "Sakit", style: "data-[active=true]:bg-amber-500 data-[active=true]:text-white" },
  { value: "alfa", label: "Alfa", style: "data-[active=true]:bg-red-600 data-[active=true]:text-white" },
];

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function AttendanceBoard({ students, initial, date }: { students: Student[]; initial: Record<string, AttendanceStatus>; date: string }) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() =>
    Object.fromEntries(students.map((student) => [student.id, initial[student.id] ?? "hadir"])),
  );
  const [classFilter, setClassFilter] = useState("all");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const classes = useMemo(() => Array.from(new Set(students.map((student) => student.class_name))).sort(), [students]);
  const visible = classFilter === "all" ? students : students.filter((student) => student.class_name === classFilter);

  const allPresent = () =>
    setStatuses((previous) => ({
      ...previous,
      ...Object.fromEntries(visible.map((student) => [student.id, "hadir"])),
    }));

  const save = () =>
    startTransition(async () => {
      setMessage("");
      const result = await saveAttendanceAction({
        date,
        rows: students.map((student) => ({ studentId: student.id, status: statuses[student.id] ?? "hadir" })),
      });
      setMessage(result.ok ? "Absensi berhasil disimpan." : result.message ?? "Gagal menyimpan absensi.");
    });

  const changeDate = (nextDate: string) => {
    if (!nextDate || nextDate === date) return;
    router.push(`/attendance?date=${encodeURIComponent(nextDate)}`);
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-1.5 block text-xs font-bold text-slate-600">Tanggal Pertemuan</label>
          <div className="relative max-w-sm">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="date"
              value={date}
              onChange={(event) => changeDate(event.target.value)}
              className="input pl-10"
            />
          </div>
          <p className="mt-2 text-[11px] leading-5 text-muted">Bisa memilih tanggal sebelumnya bila absensi baru sempat diinput hari ini.</p>
        </div>
        <button type="button" onClick={() => setExportOpen(true)} className="button-secondary w-full lg:w-auto">
          <Download size={16} /> Download Absensi Bulanan
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <button
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-xs font-bold",
              classFilter === "all" ? "bg-teal-700 text-white" : "border border-line bg-white",
            )}
            onClick={() => setClassFilter("all")}
          >
            Semua
          </button>
          {classes.map((className) => (
            <button
              key={className}
              className={cn(
                "shrink-0 rounded-xl px-3 py-2 text-xs font-bold",
                classFilter === className ? "bg-teal-700 text-white" : "border border-line bg-white",
              )}
              onClick={() => setClassFilter(className)}
            >
              Kelas {className}
            </button>
          ))}
        </div>
        <button className="button-secondary w-full sm:ml-auto sm:w-auto" onClick={allPresent}>
          <Users size={16} /> Tandai semua hadir
        </button>
      </div>

      <div className="card divide-y divide-line overflow-hidden">
        {visible.map((student) => (
          <div key={student.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-sm font-extrabold text-teal-800">
                {student.full_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{student.full_name}</div>
                <div className="text-xs text-muted">Kelas {student.class_name}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-50 p-1 sm:grid-cols-4">
              {options.map((option) => (
                <button
                  key={option.value}
                  data-active={statuses[student.id] === option.value}
                  onClick={() => setStatuses((previous) => ({ ...previous, [student.id]: option.value }))}
                  className={cn(
                    "min-h-10 rounded-lg px-2 py-2 text-xs font-bold text-slate-500 transition sm:px-3",
                    option.style,
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {message ? (
          <p className="text-sm font-semibold text-teal-700">{message}</p>
        ) : (
          <p className="text-xs leading-5 text-muted">Tip: tandai semua hadir lalu ubah hanya siswa yang izin, sakit, atau alfa.</p>
        )}
        <button onClick={save} disabled={pending || !students.length} className="button-primary w-full sm:min-w-36 sm:w-auto">
          {pending ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Simpan Absensi
        </button>
      </div>

      {exportOpen && <AttendanceExportModal students={students} onClose={() => setExportOpen(false)} />}
    </div>
  );
}

function AttendanceExportModal({ students, onClose }: { students: Student[]; onClose: () => void }) {
  const current = new Date();
  const [year, setYear] = useState(current.getFullYear());
  const [months, setMonths] = useState<number[]>([current.getMonth() + 1]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const toggleMonth = (month: number) => {
    setMonths((previous) => previous.includes(month) ? previous.filter((item) => item !== month) : [...previous, month].sort((a, b) => a - b));
  };

  async function download() {
    if (!months.length) {
      setMessage("Pilih minimal satu bulan.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      const { data: sessions, error: sessionError } = await supabase
        .from("tahfidz_sessions")
        .select("id,session_date")
        .gte("session_date", start)
        .lte("session_date", end)
        .order("session_date");
      if (sessionError) throw sessionError;

      const selectedSessions = (sessions ?? []).filter((session: any) => months.includes(Number(String(session.session_date).slice(5, 7))));
      const sessionIds = selectedSessions.map((session: any) => session.id);
      let attendance: any[] = [];
      if (sessionIds.length) {
        const { data, error } = await supabase
          .from("tahfidz_attendance")
          .select("session_id,student_id,status,note")
          .in("session_id", sessionIds);
        if (error) throw error;
        attendance = data ?? [];
      }

      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      const sessionDateById = new Map(selectedSessions.map((session: any) => [session.id, String(session.session_date)]));
      const attendanceByKey = new Map(attendance.map((row: any) => [`${row.session_id}:${row.student_id}`, row]));

      const summaryRows = students.map((student) => {
        const rows = attendance.filter((row: any) => row.student_id === student.id);
        const hadir = rows.filter((row: any) => row.status === "hadir").length;
        const izin = rows.filter((row: any) => row.status === "izin").length;
        const sakit = rows.filter((row: any) => row.status === "sakit").length;
        const alfa = rows.filter((row: any) => row.status === "alfa").length;
        const total = rows.length;
        return {
          Nama: student.full_name,
          Kelas: student.class_name,
          Hadir: hadir,
          Izin: izin,
          Sakit: sakit,
          Alfa: alfa,
          "Total Pertemuan": total,
          "Kehadiran (%)": total ? Math.round((hadir / total) * 100) : 0,
        };
      });
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      summarySheet["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Rekap");

      for (const month of months) {
        const monthSessions = selectedSessions.filter((session: any) => Number(String(session.session_date).slice(5, 7)) === month);
        const dates = monthSessions.map((session: any) => String(session.session_date));
        const rows = students.map((student) => {
          const detail: Record<string, string | number> = {
            Nama: student.full_name,
            Kelas: student.class_name,
          };
          let hadir = 0;
          let izin = 0;
          let sakit = 0;
          let alfa = 0;
          for (const session of monthSessions) {
            const row = attendanceByKey.get(`${session.id}:${student.id}`) as any;
            const status = row?.status as AttendanceStatus | undefined;
            detail[String(session.session_date).slice(8, 10)] = status ? status.charAt(0).toUpperCase() : "-";
            if (status === "hadir") hadir += 1;
            if (status === "izin") izin += 1;
            if (status === "sakit") sakit += 1;
            if (status === "alfa") alfa += 1;
          }
          const total = hadir + izin + sakit + alfa;
          detail.Hadir = hadir;
          detail.Izin = izin;
          detail.Sakit = sakit;
          detail.Alfa = alfa;
          detail["Kehadiran (%)"] = total ? Math.round((hadir / total) * 100) : 0;
          return detail;
        });

        const sheet = XLSX.utils.json_to_sheet(rows);
        sheet["!cols"] = [
          { wch: 24 },
          { wch: 18 },
          ...dates.map(() => ({ wch: 6 })),
          { wch: 9 },
          { wch: 9 },
          { wch: 9 },
          { wch: 9 },
          { wch: 16 },
        ];
        XLSX.utils.book_append_sheet(workbook, sheet, monthNames[month - 1].slice(0, 20));
      }

      const labels = months.map((month) => monthNames[month - 1]).join("-");
      XLSX.writeFile(workbook, `Absensi_Tahfidz_${year}_${labels}.xlsx`);
      setMessage("File absensi berhasil dibuat.");
    } catch (error: any) {
      setMessage(error?.message ?? "Gagal membuat file absensi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-sm md:items-center md:p-5">
      <div className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[26px] bg-white p-5 shadow-2xl md:rounded-[26px] md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label">Export Absensi</p>
            <h3 className="mt-1 text-xl font-extrabold">Pilih Bulan yang Ingin Diunduh</h3>
            <p className="mt-1 text-xs leading-5 text-muted">Bisa pilih beberapa bulan sekaligus, misalnya Mei, Juni, dan Agustus. Setiap bulan dibuatkan sheet sendiri plus satu sheet rekap.</p>
          </div>
          <button type="button" aria-label="Tutup" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
            <X size={17} />
          </button>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-xs font-bold">Tahun</label>
          <input type="number" min="2020" max="2100" value={year} onChange={(event) => setYear(Number(event.target.value))} className="input max-w-40" />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="text-xs font-bold">Bulan</label>
            <button type="button" onClick={() => setMonths(months.length === 12 ? [] : Array.from({ length: 12 }, (_, index) => index + 1))} className="text-xs font-bold text-teal-700">
              {months.length === 12 ? "Kosongkan" : "Pilih semua"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {monthNames.map((name, index) => {
              const month = index + 1;
              const active = months.includes(month);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleMonth(month)}
                  className={cn(
                    "min-h-11 rounded-xl border px-3 py-2 text-xs font-bold transition",
                    active ? "border-teal-700 bg-teal-700 text-white" : "border-line bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50",
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {message && <div className="mt-4 rounded-xl bg-teal-50 px-3 py-2.5 text-xs font-semibold text-teal-800">{message}</div>}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="button-secondary">Batal</button>
          <button type="button" onClick={download} disabled={busy || !months.length} className="button-primary">
            {busy ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
            {busy ? "Menyiapkan..." : "Download Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}
