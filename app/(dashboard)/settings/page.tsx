"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BookOpenCheck,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Target,
  TimerReset,
  UserRound,
} from "lucide-react";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const SESSION_KEY = "hulwah-settings-session";

export default function SettingsPage() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = window.sessionStorage.getItem(SESSION_KEY);
      if (!token) {
        if (active) setChecking(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.rpc("hulwah_settings_session_valid", {
        p_token: token,
      });

      if (!active) return;
      if (!error && data === true) {
        setUnlocked(true);
      } else {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
      setChecking(false);
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!/^\d{6}$/.test(pin)) {
      setMessage("Masukkan PIN 6 digit.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("unlock_hulwah_settings", {
      p_pin: pin,
    });
    setBusy(false);

    if (error || !data) {
      setPin("");
      setMessage("PIN salah atau akses sedang dikunci sementara. Silakan coba lagi.");
      return;
    }

    window.sessionStorage.setItem(SESSION_KEY, String(data));
    setPin("");
    setUnlocked(true);
  }

  async function lockNow() {
    const token = window.sessionStorage.getItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setMessage("");

    if (token) {
      const supabase = createClient();
      await supabase.rpc("lock_hulwah_settings", { p_token: token });
    }
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
            <ShieldCheck size={24} />
          </div>
          <p className="text-sm font-semibold">Memeriksa akses pengaturan...</p>
        </Card>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-xl py-6 md:py-14">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-br from-teal-800 to-teal-500 text-white shadow-soft">
            <LockKeyhole size={25} />
          </div>
          <p className="label">Area Privat</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Pengaturan</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Dashboard utama tetap langsung terbuka. PIN hanya diminta saat masuk ke pengaturan.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-line bg-gradient-to-r from-teal-50 to-cyan-50/70 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-teal-700 shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="font-extrabold">Verifikasi PIN</div>
                <div className="text-xs text-muted">Masukkan 6 digit untuk membuka pengaturan.</div>
              </div>
            </div>
          </div>

          <form onSubmit={unlock} className="space-y-4 p-5 md:p-6">
            <div>
              <label htmlFor="settings-pin" className="mb-2 block text-xs font-bold text-slate-600">
                PIN Pengaturan
              </label>
              <input
                id="settings-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={6}
                value={pin}
                onChange={(event) =>
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="input text-center text-xl font-extrabold tracking-[0.55em]"
                placeholder="••••••"
                autoFocus
              />
            </div>

            {message && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-5 text-amber-800">
                {message}
              </div>
            )}

            <button type="submit" className="button-primary w-full" disabled={busy}>
              <LockKeyhole size={17} />
              {busy ? "Memeriksa..." : "Buka Pengaturan"}
            </button>

            <p className="text-center text-[11px] leading-5 text-muted">
              Setelah 5 percobaan PIN yang salah, akses dikunci sementara selama 5 menit.
            </p>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label">Area Privat</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Pengaturan</h1>
          <p className="mt-1 text-sm text-muted">Pengaturan pribadi Tahfidz with Hulwah.</p>
        </div>
        <button type="button" onClick={lockNow} className="button-secondary">
          <LockKeyhole size={16} /> Kunci Sekarang
        </button>
      </div>

      <Card className="border-teal-100 bg-gradient-to-r from-teal-50/80 to-cyan-50/60 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-teal-700 shadow-sm">
            <ShieldCheck size={21} />
          </div>
          <div>
            <div className="font-extrabold text-teal-950">Pengaturan berhasil dibuka</div>
            <p className="mt-1 text-xs leading-5 text-teal-800/75">
              Sesi pengaturan berlaku maksimal 30 menit pada tab ini. Dashboard dan aktivitas harian tidak memerlukan PIN.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700">
              <UserRound size={21} />
            </div>
            <div>
              <div className="font-extrabold">Profil Ustadzah</div>
              <div className="text-xs text-muted">Identitas pemilik dashboard</div>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-line bg-slate-50/70 p-4">
            <div className="text-sm font-extrabold">Hulwah Qurratu Aini, S.Pd.</div>
            <div className="mt-1 text-xs font-semibold text-teal-700">Guru Tahfidz</div>
            <p className="mt-3 text-xs leading-5 text-muted">
              Foto profil Ustadzah akan menggunakan foto yang sudah Anda kirim dan akan diblend halus dengan tema dashboard.
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
              <Target size={21} />
            </div>
            <div>
              <div className="font-extrabold">Target Kelas</div>
              <div className="text-xs text-muted">3 kelas binaan aktif</div>
            </div>
          </div>
          <div className="mt-5 space-y-2 text-xs">
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 font-semibold">1 Ar Rahman · An-Naba → An-Nas</div>
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 font-semibold">2 An Nur · Al-Mulk → Al-Baqarah:29</div>
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 font-semibold">3 Az Zukhruf · Al-Baqarah:30 → 190</div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <BookOpenCheck size={21} />
            </div>
            <div>
              <div className="font-extrabold">Mode Dashboard</div>
              <div className="text-xs text-muted">Personal · tanpa akun email</div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            Absensi, setoran, murajaah, siswa, perkembangan, dan laporan dapat dibuka langsung tanpa halaman login.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <TimerReset size={21} />
            </div>
            <div>
              <div className="font-extrabold">Keamanan PIN</div>
              <div className="text-xs text-muted">PIN tidak disimpan di frontend</div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            Verifikasi PIN dilakukan di database menggunakan hash. Nilai PIN asli tidak dicantumkan di repository publik.
          </p>
        </Card>
      </div>

      <div className="flex items-center gap-2 px-1 text-[11px] text-muted">
        <Settings2 size={14} /> Track • Guide • Grow
      </div>
    </div>
  );
}
