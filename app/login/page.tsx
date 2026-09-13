import { BookOpenCheck, Sparkles } from "lucide-react";
import { login } from "./actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(185,221,230,.7),transparent_30%),linear-gradient(135deg,#063F55_0%,#08748F_50%,#C5E0E7_140%)] p-5 md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[30px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_.9fr]">
          <section className="hidden min-h-[640px] flex-col justify-between p-12 text-white md:flex">
            <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><BookOpenCheck /></div><div><div className="text-xl font-bold">Tahfidz with Hulwah</div><div className="text-xs text-white/70">Personal Tahfidz Dashboard</div></div></div>
            <div className="max-w-lg"><div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold"><Sparkles size={14}/> Track • Guide • Grow</div><h1 className="text-5xl font-bold leading-[1.08]">Setiap ayat punya perjalanan. Setiap siswa punya cerita.</h1><p className="mt-5 max-w-md text-sm leading-7 text-white/75">Catat setoran, pantau murajaah, simpan catatan perkembangan, dan susun laporan Tahfidz yang lebih bermakna.</p></div>
            <p className="text-xs text-white/55">Dashboard kerja pribadi Guru Tahfidz SDIT</p>
          </section>
          <section className="bg-white p-7 md:p-12">
            <div className="mx-auto flex h-full max-w-sm flex-col justify-center">
              <div className="mb-8 md:hidden"><div className="text-2xl font-bold text-teal-800">Tahfidz with Hulwah</div><div className="text-sm text-muted">Personal Tahfidz Dashboard</div></div>
              <p className="label text-teal-700">Welcome back</p><h2 className="mt-2 text-3xl font-bold">Assalamu&apos;alaikum 👋</h2><p className="mt-2 text-sm leading-6 text-muted">Masuk untuk melanjutkan aktivitas dan pembinaan Tahfidz hari ini.</p>
              {!isSupabaseConfigured && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">Supabase belum dikonfigurasi. Dashboard tetap dapat dibuka dalam mode pengembangan.</div>}
              {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
              <form action={login} className="mt-8 space-y-4">
                <div><label className="mb-2 block text-sm font-semibold">Email</label><input name="email" type="email" className="input" placeholder="nama@sekolah.sch.id" required /></div>
                <div><label className="mb-2 block text-sm font-semibold">Password</label><input name="password" type="password" className="input" placeholder="••••••••" required /></div>
                <button className="button-primary h-12 w-full" disabled={!isSupabaseConfigured}>Masuk</button>
              </form>
              {!isSupabaseConfigured && <a href="/dashboard" className="button-secondary mt-3 h-12 w-full">Lihat preview dashboard</a>}
              <p className="mt-8 text-center text-xs text-muted">Tahfidz with Hulwah · Track • Guide • Grow</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
