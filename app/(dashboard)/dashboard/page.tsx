import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpenCheck, CalendarCheck2, CheckCircle2, Clock3, Users } from "lucide-react";
import { Card, Progress } from "@/components/ui";
import { getDashboardData } from "@/lib/data";
import { pct } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const total = data.students.length;
  const progress = pct(data.submitted, data.present);
  const stats = [
    { label: "Siswa Binaan", value: total, icon: Users, sub: "dari kelas yang Anda dampingi" },
    { label: "Hadir Hari Ini", value: data.present, icon: CalendarCheck2, sub: `${data.izin} izin • ${data.sakit} sakit` },
    { label: "Sudah Setor", value: data.submitted, icon: CheckCircle2, sub: `${progress}% dari siswa hadir` },
    { label: "Belum Setor", value: data.waiting, icon: Clock3, sub: "menunggu setoran hari ini" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 sm:space-y-6">
      <Card className="relative min-h-[300px] overflow-hidden border-0 bg-gradient-to-br from-teal-950 via-teal-800 to-cyan-600 p-5 text-white sm:p-6 md:min-h-[320px] md:p-8">
        <div className="pointer-events-none absolute -left-20 bottom-[-90px] h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[28%] top-[-40px] h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[-70px] top-[-70px] hidden h-52 w-52 rounded-full border border-white/10 md:block" />

        {/* Keep the photo rendering intentionally simple. Complex CSS masks caused GPU artifacts in Chromium/Brave. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden md:block">
          <img
            src="/hulwah-hero.webp"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover object-[50%_24%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900 via-teal-800/55 to-teal-900/5" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-teal-900/65 to-transparent" />
        </div>

        <div className="relative z-10 flex min-h-[250px] max-w-full flex-col justify-between gap-7 md:min-h-[265px] md:max-w-[62%] lg:max-w-[58%]">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-[.16em] text-white/85 backdrop-blur-md sm:text-[11px]">
              TRACK • GUIDE • GROW
            </div>
            <h1 className="max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
              Assalamu&apos;alaikum, <span className="text-cyan-100">{data.teacherName}</span> 👋
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 md:text-[15px]">
              Hari ini ada <b className="text-white">{data.present} siswa hadir</b>.{" "}
              {data.waiting > 0
                ? `${data.waiting} siswa masih menunggu setoran.`
                : "Semua siswa hadir sudah menyelesaikan setoran. MasyaAllah!"}
            </p>
            <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-white/80 backdrop-blur-md">
              <BookOpenCheck size={16} className="shrink-0 text-cyan-200" />
              <span className="truncate sm:whitespace-normal">Personal Tahfidz Dashboard • Hulwah Qurratu Aini, S.Pd.</span>
            </div>
          </div>
          <div>
            <Link
              href="/submissions"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-teal-800 shadow-xl shadow-teal-950/10 transition hover:-translate-y-0.5 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/25"
            >
              Mulai Setoran <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 z-20 md:hidden">
          <img
            src="/hulwah-avatar.webp"
            alt="Hulwah Qurratu Aini, S.Pd."
            loading="eager"
            decoding="async"
            className="h-20 w-20 rounded-2xl border-2 border-white/60 bg-cyan-50 object-cover shadow-2xl sm:h-24 sm:w-24"
          />
        </div>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, sub }) => (
          <Card key={label} className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-muted">{label}</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p>
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <Icon size={19} />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted">{sub}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="label">Aktivitas</p>
              <h2 className="mt-1 text-lg font-extrabold">Setoran Hari Ini</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-teal-800">{progress}%</div>
              <div className="text-[10px] text-muted">selesai</div>
            </div>
          </div>
          <Progress value={progress} className="mt-5 h-3" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Mini value={data.submitted} label="Sudah setor" />
            <Mini value={data.waiting} label="Menunggu" />
            <Mini value={data.izin} label="Izin" />
            <Mini value={data.sakit} label="Sakit" />
          </div>
          <Link href="/submissions" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-900">
            Lihat daftar setoran <ArrowRight size={15} />
          </Link>
        </Card>

        <Card id="attention" className="scroll-mt-24 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle size={19} />
            </div>
            <div>
              <p className="label">Prioritas</p>
              <h2 className="text-lg font-extrabold">Perlu Perhatian</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {data.attention.length ? (
              data.attention.slice(0, 4).map((a) => (
                <Link
                  href={`/students/${a.studentId}`}
                  key={a.id}
                  className="block rounded-xl border border-line p-3 transition hover:border-teal-200 hover:bg-teal-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {a.studentName} <span className="font-medium text-muted">• {a.className}</span>
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">{a.text}</p>
                    </div>
                    <ArrowRight className="shrink-0 text-slate-300" size={16} />
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                Tidak ada prioritas aktif. Semua fokus pembinaan terkendali.
              </p>
            )}
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="label">Kelompok</p>
            <h2 className="mt-1 text-lg font-extrabold">Kelas Binaan Saya</h2>
          </div>
          <Link href="/students" className="shrink-0 text-xs font-bold text-teal-700 hover:text-teal-900">
            Lihat siswa
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.classes.map((c) => (
            <Card key={c.name} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold sm:text-xl">Kelas {c.name}</div>
                  <div className="mt-1 text-xs text-muted">{c.total} siswa binaan</div>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <BookOpenCheck size={18} />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs">
                <span className="text-muted">{c.present} hadir</span>
                <span className="font-bold">{c.submitted}/{c.present} setor</span>
              </div>
              <Progress value={pct(c.submitted, c.present)} className="mt-2" />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Mini({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xl font-extrabold">{value}</div>
      <div className="mt-1 text-[10px] font-semibold text-muted">{label}</div>
    </div>
  );
}
