import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Users,
} from "lucide-react";
import { Card, Progress } from "@/components/ui";
import { WorkspaceLink } from "@/components/workspace-link";
import { getDashboardDataFast } from "@/lib/data-fast";
import { pct } from "@/lib/utils";

export async function DashboardHome() {
  const data = await getDashboardDataFast();
  const total = data.students.length;
  const progress = pct(data.submitted, data.present);
  const stats = [
    { label: "Siswa Binaan", value: total, icon: Users, sub: "dari kelas yang Anda dampingi" },
    { label: "Hadir Hari Ini", value: data.present, icon: CalendarCheck2, sub: `${data.izin} izin • ${data.sakit} sakit` },
    { label: "Sudah Setor Baru", value: data.submitted, icon: CheckCircle2, sub: `${progress}% dari siswa hadir` },
    { label: "Belum Setor Baru", value: data.waiting, icon: Clock3, sub: "menunggu hafalan baru hari ini" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 sm:space-y-6">
      <Card className="relative min-h-[390px] overflow-hidden border-0 bg-gradient-to-br from-teal-950 via-teal-800 to-cyan-600 p-5 text-white sm:min-h-[350px] sm:p-6 md:min-h-[325px] md:p-8">
        <div className="pointer-events-none absolute -left-20 bottom-[-90px] h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute left-[42%] top-[-90px] h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[-70px] top-[-70px] h-52 w-52 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[48%] bg-gradient-to-l from-cyan-100/14 via-teal-500/5 to-transparent sm:w-[42%]" />
        <div className="pointer-events-none absolute bottom-0 right-0 z-[1] h-[245px] w-[158px] overflow-hidden sm:inset-y-0 sm:h-auto sm:w-[40%] md:w-[38%]">
          <div className="absolute inset-0 bg-gradient-to-l from-cyan-100/12 via-transparent to-transparent" />
          <Image
            src="/hulwah-portrait-pro.webp"
            alt="Hulwah Qurratu Aini, S.Pd."
            width={360}
            height={420}
            priority
            sizes="(max-width: 639px) 270px, (max-width: 1023px) 420px, 480px"
            className="absolute left-1/2 top-0 h-[315px] w-auto max-w-none -translate-x-1/2 select-none object-contain drop-shadow-[0_22px_30px_rgba(4,47,46,0.28)] sm:top-[-34px] sm:h-[500px] md:top-[-52px] md:h-[540px]"
          />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-[34%] z-[2] hidden w-24 bg-gradient-to-r from-teal-800/20 to-transparent sm:block" />

        <div className="relative z-10 flex min-h-[350px] max-w-full flex-col justify-between gap-6 sm:min-h-[302px] sm:max-w-[68%] md:min-h-[261px] md:max-w-[64%] lg:max-w-[62%]">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-[.16em] text-white/85 backdrop-blur-md sm:text-[11px]">
              TRACK • GUIDE • GROW
            </div>
            <h1 className="max-w-full text-[27px] font-extrabold leading-[1.08] tracking-tight sm:max-w-3xl sm:text-3xl md:text-4xl">
              Assalamu&apos;alaikum, <span className="text-cyan-100">{data.teacherName}</span> 👋
            </h1>
            <p className="mt-3 max-w-[calc(100%_-_118px)] text-sm leading-6 text-white/80 sm:max-w-2xl md:text-[15px]">
              Hari ini ada <b className="text-white">{data.present} siswa hadir</b>.{" "}
              {data.present === 0
                ? "Absensi hari ini belum dicatat."
                : data.waiting > 0
                  ? `${data.waiting} siswa masih menunggu setoran hafalan baru.`
                  : "Semua siswa hadir sudah menyelesaikan hafalan baru hari ini. MasyaAllah!"}
            </p>
            <div className="mt-5 hidden items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-white/80 backdrop-blur-md sm:inline-flex">
              <BookOpenCheck size={16} className="shrink-0 text-cyan-200" />
              <span>Personal Tahfidz Dashboard • Hulwah Qurratu Aini, S.Pd.</span>
            </div>
          </div>
          <div className="max-w-[58%] sm:max-w-none">
            <WorkspaceLink panel="submissions" className="inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-teal-800 shadow-xl shadow-teal-950/10 transition duration-150 hover:-translate-y-0.5 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/25 active:translate-y-0 active:scale-[0.98]">
              Input Hafalan Baru <ArrowRight size={17} />
            </WorkspaceLink>
          </div>
        </div>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, sub }) => (
          <Card key={label} className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p></div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={19} /></div>
            </div>
            <p className="mt-3 text-[11px] text-muted">{sub}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div><p className="label">Aktivitas</p><h2 className="mt-1 text-lg font-extrabold">Hafalan Baru Hari Ini</h2></div>
            <div className="text-right"><div className="text-2xl font-extrabold text-teal-800">{progress}%</div><div className="text-[10px] text-muted">selesai</div></div>
          </div>
          <Progress value={progress} className="mt-5 h-3" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Mini value={data.submitted} label="Sudah setor" />
            <Mini value={data.waiting} label="Menunggu" />
            <Mini value={data.izin} label="Izin" />
            <Mini value={data.sakit} label="Sakit" />
          </div>
          <WorkspaceLink panel="submissions" className="mt-5 inline-flex min-h-10 touch-manipulation items-center gap-2 text-sm font-bold text-teal-700 transition hover:text-teal-900 active:scale-[0.98]">Buka Hafalan Baru <ArrowRight size={15} /></WorkspaceLink>
        </Card>

        <div id="attention" className="scroll-mt-24">
          <Card className="h-full p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><AlertTriangle size={19} /></div>
              <div><p className="label">Prioritas</p><h2 className="text-lg font-extrabold">Perlu Perhatian</h2></div>
            </div>
            <div className="mt-4 space-y-3">
              {data.attention.length ? data.attention.slice(0, 4).map((item) => (
                <Link href={`/students/${item.studentId}`} prefetch key={item.id} className="block touch-manipulation rounded-xl border border-line p-3 transition hover:border-teal-200 hover:bg-teal-50 active:scale-[0.99]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-sm font-bold">{item.studentName} <span className="font-medium text-muted">• {item.className}</span></p><p className="mt-1 text-xs leading-5 text-muted">{item.text}</p></div>
                    <ArrowRight className="shrink-0 text-slate-300" size={16} />
                  </div>
                </Link>
              )) : <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">Tidak ada prioritas aktif. Semua fokus pembinaan terkendali.</p>}
            </div>
          </Card>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="label">Kelompok</p><h2 className="mt-1 text-lg font-extrabold">Kelas Binaan Saya</h2></div>
          <WorkspaceLink panel="students" className="shrink-0 touch-manipulation text-xs font-bold text-teal-700 transition hover:text-teal-900 active:scale-[0.98]">Lihat siswa</WorkspaceLink>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.classes.map((classRow) => (
            <Card key={classRow.name} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div><div className="text-lg font-extrabold sm:text-xl">Kelas {classRow.name}</div><div className="mt-1 text-xs text-muted">{classRow.total} siswa binaan</div></div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><BookOpenCheck size={18} /></div>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs"><span className="text-muted">{classRow.present} hadir</span><span className="font-bold">{classRow.submitted}/{classRow.present} setor</span></div>
              <Progress value={pct(classRow.submitted, classRow.present)} className="mt-2" />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Mini({ value, label }: { value: number; label: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><div className="text-xl font-extrabold">{value}</div><div className="mt-1 text-[10px] font-semibold text-muted">{label}</div></div>;
}
