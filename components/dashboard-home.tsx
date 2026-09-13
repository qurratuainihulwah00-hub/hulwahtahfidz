import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Card, Progress } from "@/components/ui";
import { TeacherPortrait } from "@/components/teacher-portrait";
import { WorkspaceLink } from "@/components/workspace-link";
import { getDashboardDataFast } from "@/lib/data-fast";
import { pct } from "@/lib/utils";

const statStyles = [
  { icon: "bg-cyan-50 text-cyan-700 ring-cyan-100", accent: "from-cyan-500/10" },
  { icon: "bg-sky-50 text-sky-700 ring-sky-100", accent: "from-sky-500/10" },
  { icon: "bg-emerald-50 text-emerald-700 ring-emerald-100", accent: "from-emerald-500/10" },
  { icon: "bg-amber-50 text-amber-700 ring-amber-100", accent: "from-amber-500/10" },
] as const;

export async function DashboardHome() {
  const data = await getDashboardDataFast();
  const total = data.students.length;
  const progress = pct(data.submitted, data.present);
  const stats = [
    { label: "Siswa Binaan", value: total, icon: UsersRound, sub: "dari kelas yang Anda dampingi" },
    { label: "Hadir Hari Ini", value: data.present, icon: CalendarDays, sub: `${data.izin} izin • ${data.sakit} sakit` },
    { label: "Sudah Setor Baru", value: data.submitted, icon: BadgeCheck, sub: `${progress}% dari siswa hadir` },
    { label: "Belum Setor Baru", value: data.waiting, icon: Clock3, sub: "menunggu hafalan baru hari ini" },
  ];

  return (
    <div className="mx-auto max-w-[1480px] space-y-5 sm:space-y-6">
      <Card className="relative overflow-hidden border-0 bg-[#063f46] text-white shadow-[0_24px_70px_rgba(8,70,74,0.16)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(45,212,191,0.24),transparent_28%),radial-gradient(circle_at_18%_100%,rgba(34,211,238,0.18),transparent_34%),linear-gradient(120deg,#063f46_0%,#075b67_45%,#08798c_72%,#064c4e_100%)]" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-5 -top-8 h-48 w-48 rounded-full border border-white/8" />
        <div className="pointer-events-none absolute bottom-0 left-[52%] hidden h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block" />

        <div className="relative z-10 grid min-h-[410px] gap-8 p-6 sm:min-h-[390px] sm:p-8 md:grid-cols-[minmax(0,1fr)_230px] md:items-center md:gap-6 lg:min-h-[365px] lg:grid-cols-[minmax(0,1fr)_300px] lg:px-9 lg:py-8 xl:grid-cols-[minmax(0,1fr)_330px] xl:gap-10 xl:px-10">
          <div className="flex min-w-0 flex-col justify-center md:pr-2 lg:pr-6">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.22em] text-cyan-50/90 shadow-sm backdrop-blur-md sm:text-[11px]">
              <Sparkles size={13} strokeWidth={1.8} className="text-cyan-200" />
              TRACK • GUIDE • GROW
            </div>

            <h1 className="max-w-[760px] text-[30px] font-black leading-[1.08] tracking-[-0.035em] text-white sm:text-[38px] md:text-[40px] lg:text-[44px]">
              Assalamu&apos;alaikum,
              <span className="mt-1 block text-cyan-100">{data.teacherName} 👋</span>
            </h1>

            <p className="mt-4 max-w-[680px] text-[13px] font-medium leading-6 text-cyan-50/75 sm:text-sm lg:text-[15px]">
              Hari ini ada <b className="font-extrabold text-white">{data.present} siswa hadir</b>.{" "}
              {data.present === 0
                ? "Absensi hari ini belum dicatat. Hafalan tetap dapat langsung diinput."
                : data.waiting > 0
                  ? `${data.waiting} siswa masih menunggu setoran hafalan baru.`
                  : "Semua siswa hadir sudah menyelesaikan hafalan baru hari ini. MasyaAllah!"}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <WorkspaceLink panel="submissions" className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-teal-800 shadow-[0_14px_35px_rgba(0,0,0,0.14)] transition duration-150 hover:-translate-y-0.5 hover:bg-cyan-50 focus:outline-none focus:ring-4 focus:ring-white/25 active:translate-y-0 active:scale-[0.98]">
                Input Hafalan Baru <ArrowRight size={17} strokeWidth={2} />
              </WorkspaceLink>
              <div className="hidden items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-xs font-semibold text-cyan-50/75 backdrop-blur-md sm:flex">
                <BookOpenCheck size={16} strokeWidth={1.8} className="text-cyan-200" />
                <span>Personal Tahfidz Dashboard</span>
              </div>
            </div>
          </div>

          <div className="relative hidden h-[300px] self-end md:block lg:h-[320px] xl:h-[330px]">
            <div className="absolute -left-8 top-8 hidden rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 text-[10px] font-bold leading-4 text-cyan-50/80 shadow-xl backdrop-blur-xl lg:block">
              <span className="block text-white">Setiap ayat adalah progres.</span>
              <span className="font-medium text-cyan-100/65">Catat • dampingi • tumbuhkan</span>
            </div>
            <TeacherPortrait className="absolute bottom-0 right-0 h-[286px] w-[214px] lg:h-[312px] lg:w-[238px] xl:h-[324px] xl:w-[250px]" />
          </div>
        </div>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, sub }, index) => {
          const style = statStyles[index];
          return (
            <Card key={label} className="group relative overflow-hidden border-slate-200/80 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-[0_18px_45px_rgba(20,64,78,0.09)] sm:p-5">
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${style.accent} via-transparent to-transparent opacity-0 transition group-hover:opacity-100`} />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-[0.01em] text-slate-500 sm:text-xs">{label}</p>
                  <p className="mt-2 text-[30px] font-black leading-none tracking-[-0.04em] text-slate-900 sm:text-[32px]">{value}</p>
                </div>
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ${style.icon}`}>
                  <Icon size={19} strokeWidth={1.85} />
                </div>
              </div>
              <p className="mt-4 text-[11px] font-medium leading-5 text-muted">{sub}</p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.22fr_.78fr]">
        <Card className="overflow-hidden border-slate-200/80 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                <BookOpenCheck size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className="label">Aktivitas</p>
                <h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-slate-900">Hafalan Baru Hari Ini</h2>
              </div>
            </div>
            <div className="rounded-2xl bg-teal-50 px-3 py-2 text-right ring-1 ring-teal-100">
              <div className="text-xl font-black leading-none text-teal-800">{progress}%</div>
              <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-teal-600/70">selesai</div>
            </div>
          </div>

          <Progress value={progress} className="mt-6 h-2.5" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Mini value={data.submitted} label="Sudah setor" />
            <Mini value={data.waiting} label="Menunggu" />
            <Mini value={data.izin} label="Izin" />
            <Mini value={data.sakit} label="Sakit" />
          </div>
          <WorkspaceLink panel="submissions" className="mt-5 inline-flex min-h-10 touch-manipulation items-center gap-2 rounded-xl px-1 text-sm font-extrabold text-teal-700 transition hover:text-teal-900 active:scale-[0.98]">
            Buka Hafalan Baru <ArrowRight size={15} strokeWidth={2} />
          </WorkspaceLink>
        </Card>

        <div id="attention" className="scroll-mt-24">
          <Card className="h-full overflow-hidden border-slate-200/80 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <AlertTriangle size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className="label">Prioritas</p>
                <h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-slate-900">Perlu Perhatian</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {data.attention.length ? data.attention.slice(0, 4).map((item) => (
                <Link href={`/students/${item.studentId}`} prefetch key={item.id} className="group block touch-manipulation rounded-2xl border border-line p-3.5 transition hover:border-teal-200 hover:bg-teal-50/60 active:scale-[0.99]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-800">{item.studentName} <span className="font-semibold text-muted">• {item.className}</span></p>
                      <p className="mt-1 text-xs leading-5 text-muted">{item.text}</p>
                    </div>
                    <ArrowRight className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600" size={16} />
                  </div>
                </Link>
              )) : (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Semua fokus pembinaan terkendali.</p>
                      <p className="mt-1 text-[11px] leading-5 text-emerald-700/75">Tidak ada prioritas aktif yang perlu ditindaklanjuti hari ini.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
          <div>
            <p className="label">Kelompok</p>
            <h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-slate-900">Kelas Binaan Saya</h2>
          </div>
          <WorkspaceLink panel="students" className="shrink-0 touch-manipulation rounded-xl px-2 py-1.5 text-xs font-extrabold text-teal-700 transition hover:bg-teal-50 hover:text-teal-900 active:scale-[0.98]">Lihat siswa</WorkspaceLink>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.classes.map((classRow) => (
            <Card key={classRow.name} className="group border-slate-200/80 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-[0_18px_45px_rgba(20,64,78,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black tracking-[-0.02em] text-slate-900 sm:text-xl">Kelas {classRow.name}</div>
                  <div className="mt-1 text-xs font-medium text-muted">{classRow.total} siswa binaan</div>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100 transition group-hover:bg-teal-100">
                  <BookOpenCheck size={18} strokeWidth={1.8} />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs font-semibold">
                <span className="text-muted">{classRow.present} hadir</span>
                <span className="text-slate-700">{classRow.submitted}/{classRow.present} setor</span>
              </div>
              <Progress value={pct(classRow.submitted, classRow.present)} className="mt-2.5" />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Mini({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-3.5">
      <div className="text-xl font-black leading-none tracking-[-0.03em] text-slate-900">{value}</div>
      <div className="mt-2 text-[10px] font-bold text-muted">{label}</div>
    </div>
  );
}
