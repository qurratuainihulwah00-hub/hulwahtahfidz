import { Card, Progress, Badge } from "@/components/ui";
import { getClassTargets } from "@/lib/data";
import { getStudentOverviewsFast } from "@/lib/data-fast";
import { BookOpenCheck, Minus, TrendingDown, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const [rows, targets] = await Promise.all([getStudentOverviewsFast(), getClassTargets()]);
  const grouped = targets.reduce<Record<string, typeof targets>>((acc, target) => {
    (acc[target.className] ??= []).push(target);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="label">Monitoring</p>
        <h1 className="mt-1 text-2xl font-extrabold">Perkembangan Siswa</h1>
        <p className="mt-1 text-sm text-muted">Overview pembinaan siswa binaan tanpa sistem ranking.</p>
      </div>

      <section>
        <div className="mb-3">
          <p className="label">Acuan Hafalan</p>
          <h2 className="mt-1 text-lg font-extrabold">Target Kelas</h2>
          <p className="mt-1 text-xs text-muted">Target sementara sesuai data yang diberikan. Tahap 1 dan 2 disimpan terpisah agar mudah disesuaikan nanti.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Object.entries(grouped).map(([className, classTargets]) => (
            <Card key={className} className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><BookOpenCheck size={18} /></div>
                <div><div className="font-extrabold">Kelas {className}</div><div className="text-xs text-muted">2 tahap target hafalan</div></div>
              </div>
              <div className="mt-4 space-y-2">
                {classTargets.sort((a, b) => a.segmentNo - b.segmentNo).map((target) => (
                  <div key={target.id} className="rounded-xl border border-line bg-slate-50 p-3">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700">Target {target.segmentNo}</div>
                    <div className="mt-1 text-sm font-bold">{target.startLabel} <span className="text-muted">→</span> {target.endLabel}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-muted">
              <tr>{["Siswa", "Kelas", "Progress", "Nilai", "Kehadiran", "Tren", "Fokus"].map((heading) => <th key={heading} className="px-5 py-3 font-bold">{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-teal-50/30">
                  <td className="px-5 py-4 font-bold">{row.full_name}</td>
                  <td className="px-5 py-4"><Badge>{row.class_name}</Badge></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-28"><Progress value={row.progressPercent} /></div><b>{row.progressPercent}%</b></div></td>
                  <td className="px-5 py-4 font-bold">{row.averageScore ? row.averageScore.toFixed(1) : "-"}</td>
                  <td className="px-5 py-4">{row.attendanceRate}%</td>
                  <td className="px-5 py-4"><Trend value={row.trend} /></td>
                  <td className="px-5 py-4 text-xs text-muted">{row.focus ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-[11px] leading-5 text-muted sm:hidden">Geser tabel ke samping untuk melihat seluruh kolom perkembangan.</p>
    </div>
  );
}

function Trend({ value }: { value: "meningkat" | "stabil" | "menurun" }) {
  if (value === "meningkat") return <span className="inline-flex items-center gap-1 font-bold text-emerald-600"><TrendingUp size={14} /> Meningkat</span>;
  if (value === "menurun") return <span className="inline-flex items-center gap-1 font-bold text-red-600"><TrendingDown size={14} /> Menurun</span>;
  return <span className="inline-flex items-center gap-1 font-bold text-slate-500"><Minus size={14} /> Stabil</span>;
}
