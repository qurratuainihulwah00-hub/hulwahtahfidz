import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpenCheck, CalendarCheck2, CheckCircle2, Clock3, Users } from "lucide-react";
import { Card, Progress } from "@/components/ui";
import { getDashboardData } from "@/lib/data";
import { pct } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const total=data.students.length;
  const progress=pct(data.submitted,data.present);
  const stats=[
    {label:"Siswa Binaan",value:total,icon:Users,sub:"dari kelas yang Anda dampingi"},
    {label:"Hadir Hari Ini",value:data.present,icon:CalendarCheck2,sub:`${data.izin} izin • ${data.sakit} sakit`},
    {label:"Sudah Setor",value:data.submitted,icon:CheckCircle2,sub:`${progress}% dari siswa hadir`},
    {label:"Belum Setor",value:data.waiting,icon:Clock3,sub:"menunggu setoran hari ini"},
  ];
  return <div className="mx-auto max-w-[1500px] space-y-6">
    <Card className="relative min-h-[290px] overflow-hidden border-0 bg-gradient-to-br from-teal-950 via-teal-800 to-cyan-600 p-6 text-white md:p-8 lg:min-h-[330px]">
      <div className="absolute -left-20 bottom-[-90px] h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl"/>
      <div className="absolute right-[28%] top-[-40px] h-56 w-56 rounded-full bg-white/10 blur-3xl"/>
      <div className="absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden md:block">
        <img
          src="/hulwah-hero.webp"
          alt="Hulwah Qurratu Aini, S.Pd."
          className="h-full w-full object-cover object-[50%_25%] opacity-[0.98]"
          style={{ WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,.35) 16%, black 42%), linear-gradient(to top, transparent 0%, black 22%)", WebkitMaskComposite: "source-in", maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,.35) 16%, black 42%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-teal-900 via-teal-800/35 to-transparent"/>
      </div>
      <div className="relative z-10 flex min-h-[235px] max-w-[62%] flex-col justify-between gap-7 md:min-h-[265px] lg:max-w-[58%]">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[.16em] text-white/85 backdrop-blur-md">TRACK • GUIDE • GROW</div>
          <h1 className="text-2xl font-extrabold leading-tight md:text-4xl">Assalamu&apos;alaikum, <span className="text-cyan-100">{data.teacherName}</span> 👋</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 md:text-[15px]">Hari ini ada <b className="text-white">{data.present} siswa hadir</b>. {data.waiting > 0 ? `${data.waiting} siswa masih menunggu setoran.` : "Semua siswa hadir sudah menyelesaikan setoran. MasyaAllah!"}</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-white/80 backdrop-blur-md">
            <BookOpenCheck size={16} className="text-cyan-200"/>
            <span>Personal Tahfidz Dashboard • Hulwah Qurratu Aini, S.Pd.</span>
          </div>
        </div>
        <div>
          <Link href="/submissions" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-teal-800 shadow-xl shadow-teal-950/10 transition hover:-translate-y-0.5 hover:shadow-2xl">Mulai Setoran <ArrowRight size={17}/></Link>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 z-20 md:hidden"><img src="/hulwah-avatar.webp" alt="Hulwah" className="h-20 w-20 rounded-2xl border-2 border-white/60 object-cover shadow-2xl"/></div>
    </Card>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({label,value,icon:Icon,sub})=><Card key={label} className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={19}/></div></div><p className="mt-3 text-[11px] text-muted">{sub}</p></Card>)}</section>
    <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><Card className="p-6"><div className="flex items-center justify-between"><div><p className="label">Aktivitas</p><h2 className="mt-1 text-lg font-extrabold">Setoran Hari Ini</h2></div><div className="text-right"><div className="text-2xl font-extrabold text-teal-800">{progress}%</div><div className="text-[10px] text-muted">selesai</div></div></div><Progress value={progress} className="mt-5 h-3"/><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Mini value={data.submitted} label="Sudah setor"/><Mini value={data.waiting} label="Menunggu"/><Mini value={data.izin} label="Izin"/><Mini value={data.sakit} label="Sakit"/></div><Link href="/submissions" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-700">Lihat daftar setoran <ArrowRight size={15}/></Link></Card>
      <Card className="p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><AlertTriangle size={19}/></div><div><p className="label">Prioritas</p><h2 className="text-lg font-extrabold">Perlu Perhatian</h2></div></div><div className="mt-4 space-y-3">{data.attention.length ? data.attention.slice(0,4).map((a)=><Link href={`/students/${a.studentId}`} key={a.id} className="block rounded-xl border border-line p-3 transition hover:bg-teal-50"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">{a.studentName} <span className="font-medium text-muted">• {a.className}</span></p><p className="mt-1 text-xs leading-5 text-muted">{a.text}</p></div><ArrowRight className="shrink-0 text-slate-300" size={16}/></div></Link>) : <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">Tidak ada prioritas aktif. Semua fokus pembinaan terkendali.</p>}</div></Card></section>
    <section><div className="mb-3 flex items-end justify-between"><div><p className="label">Kelompok</p><h2 className="mt-1 text-lg font-extrabold">Kelas Binaan Saya</h2></div><Link href="/students" className="text-xs font-bold text-teal-700">Lihat siswa</Link></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.classes.map((c)=><Card key={c.name} className="p-5"><div className="flex items-start justify-between"><div><div className="text-xl font-extrabold">Kelas {c.name}</div><div className="mt-1 text-xs text-muted">{c.total} siswa binaan</div></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><BookOpenCheck size={18}/></div></div><div className="mt-5 flex items-center justify-between text-xs"><span className="text-muted">{c.present} hadir</span><span className="font-bold">{c.submitted}/{c.present} setor</span></div><Progress value={pct(c.submitted,c.present)} className="mt-2"/></Card>)}</div></section>
  </div>
}
function Mini({value,label}:{value:number;label:string}){return <div className="rounded-xl bg-slate-50 p-3"><div className="text-xl font-extrabold">{value}</div><div className="mt-1 text-[10px] font-semibold text-muted">{label}</div></div>}
