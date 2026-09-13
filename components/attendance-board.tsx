"use client";
import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, Users } from "lucide-react";
import { saveAttendanceAction } from "@/app/actions";
import type { AttendanceStatus, Student } from "@/lib/types";
import { cn } from "@/lib/utils";

const options: Array<{ value: AttendanceStatus; label: string; style: string }> = [
  { value: "hadir", label: "Hadir", style: "data-[active=true]:bg-emerald-600 data-[active=true]:text-white" },
  { value: "izin", label: "Izin", style: "data-[active=true]:bg-sky-600 data-[active=true]:text-white" },
  { value: "sakit", label: "Sakit", style: "data-[active=true]:bg-amber-500 data-[active=true]:text-white" },
  { value: "alfa", label: "Alfa", style: "data-[active=true]:bg-red-600 data-[active=true]:text-white" },
];

export function AttendanceBoard({ students, initial, date }: { students: Student[]; initial: Record<string, AttendanceStatus>; date: string }) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() =>
    Object.fromEntries(students.map((student) => [student.id, initial[student.id] ?? "hadir"])),
  );
  const [classFilter, setClassFilter] = useState("all");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
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

  return (
    <div className="space-y-4">
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
    </div>
  );
}
