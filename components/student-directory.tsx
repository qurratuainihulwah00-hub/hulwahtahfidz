"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Minus, Search, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Badge, Card, Progress } from "@/components/ui";
import type { StudentOverview } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StudentDirectory({ students }: { students: StudentOverview[] }) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const classes = useMemo(() => Array.from(new Set(students.map((s) => s.class_name))).sort(), [students]);
  const normalized = query.trim().toLowerCase();
  const visible = students.filter((student) => {
    const inClass = classFilter === "all" || student.class_name === classFilter;
    const inSearch = !normalized || student.full_name.toLowerCase().includes(normalized) || student.class_name.toLowerCase().includes(normalized);
    return inClass && inSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block w-full max-w-lg">
          <span className="sr-only">Cari siswa</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="input pl-10 pr-9"
            placeholder="Cari nama siswa atau kelas..."
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Hapus pencarian"
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ×
            </button>
          )}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:ml-auto sm:pb-0">
          <button
            onClick={() => setClassFilter("all")}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition",
              classFilter === "all" ? "bg-teal-700 text-white" : "border border-line bg-white text-slate-600 hover:bg-teal-50",
            )}
          >
            Semua
          </button>
          {classes.map((className) => (
            <button
              key={className}
              onClick={() => setClassFilter(className)}
              className={cn(
                "shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition",
                classFilter === className ? "bg-teal-700 text-white" : "border border-line bg-white text-slate-600 hover:bg-teal-50",
              )}
            >
              {className}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{visible.length} siswa ditampilkan</span>
        {(query || classFilter !== "all") && (
          <button
            onClick={() => {
              setQuery("");
              setClassFilter("all");
            }}
            className="font-bold text-teal-700 hover:text-teal-900"
          >
            Reset filter
          </button>
        )}
      </div>

      {visible.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((student) => (
            <Link href={`/students/${student.id}`} key={student.id} className="group">
              <Card className="h-full p-4 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-teal-200 group-hover:shadow-lg sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 font-extrabold text-teal-800">
                    {student.full_name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-extrabold">{student.full_name}</h3>
                      <Badge>Kelas {student.class_name}</Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">{student.lastMemorization}</p>
                  </div>
                  <ArrowRight size={17} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-500" />
                </div>

                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-muted">Progress hafalan</div>
                    <div className="mt-1 text-2xl font-extrabold text-teal-800">{student.progressPercent}%</div>
                  </div>
                  <Trend trend={student.trend} />
                </div>
                <Progress value={student.progressPercent} className="mt-3" />

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-muted">Kehadiran</div>
                    <div className="mt-1 font-extrabold">{student.attendanceRate}%</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-muted">Nilai rata-rata</div>
                    <div className="mt-1 font-extrabold">{student.averageScore.toFixed(1)}</div>
                  </div>
                </div>

                {student.focus && (
                  <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">📌 {student.focus}</div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
            <Users size={20} />
          </div>
          <h3 className="mt-3 font-extrabold">Siswa tidak ditemukan</h3>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted">Coba nama lain atau reset filter kelas.</p>
        </Card>
      )}
    </div>
  );
}

function Trend({ trend }: { trend: "meningkat" | "stabil" | "menurun" }) {
  const map = {
    meningkat: { Icon: TrendingUp, text: "Meningkat", cls: "text-emerald-600 bg-emerald-50" },
    stabil: { Icon: Minus, text: "Stabil", cls: "text-slate-600 bg-slate-100" },
    menurun: { Icon: TrendingDown, text: "Menurun", cls: "text-red-600 bg-red-50" },
  };
  const item = map[trend];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${item.cls}`}>
      <item.Icon size={12} />
      {item.text}
    </span>
  );
}
