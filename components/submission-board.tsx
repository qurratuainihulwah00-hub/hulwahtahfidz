"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, CheckCircle2, ChevronRight, Loader2, Plus, Users, X } from "lucide-react";
import { createSubmissionAction } from "@/app/actions";
import { QURAN_SURAHS } from "@/lib/surahs";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export type QueueRow = {
  id: string;
  full_name: string;
  class_name: string;
  present: boolean;
  submitted: boolean;
  lastMemorization: string;
  focus?: string | null;
};

type BoardMode = "hafalan_baru" | "murajaah";

export function SubmissionBoard({ rows, date, mode = "hafalan_baru" }: { rows: QueueRow[]; date: string; mode?: BoardMode }) {
  const [tab, setTab] = useState<"pending" | "done" | "all">("all");
  const [selected, setSelected] = useState<QueueRow | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const classes = useMemo(() => Array.from(new Set(rows.map((row) => row.class_name))).sort(), [rows]);

  const visible = useMemo(() => {
    return rows
      .filter(
        (row) =>
          (filter === "all" || row.class_name === filter) &&
          (mode === "murajaah" || tab === "all" || (tab === "pending" ? !row.submitted : row.submitted)),
      )
      .sort((a, b) => Number(b.present) - Number(a.present) || a.class_name.localeCompare(b.class_name) || a.full_name.localeCompare(b.full_name));
  }, [rows, filter, mode, tab]);

  const openStudent = (row: QueueRow) => {
    setPickerOpen(false);
    setSelected(row);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-extrabold text-teal-900">
              <BookOpenCheck size={18} />
              {mode === "murajaah" ? "Input Murajaah" : "Input Hafalan Baru"}
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-teal-900/65">
              Pilih siswa lalu isi surah, rentang ayat, kelancaran, tajwid, makhraj, jumlah kesalahan, dan catatan. Siswa tetap dapat dipilih walau presensi hari ini belum dicatat.
            </p>
          </div>
          <button type="button" onClick={() => setPickerOpen(true)} className="button-primary shrink-0 sm:min-w-48">
            <Plus size={17} /> {mode === "murajaah" ? "Input Murajaah" : "Input Hafalan Baru"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        {mode !== "murajaah" && (
          <div className="grid grid-cols-3 rounded-xl border border-line bg-white p-1 sm:flex">
            {([["all", "Semua"], ["pending", "Belum Setor"], ["done", "Sudah Setor"]] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "min-h-10 rounded-lg px-2 py-2 text-xs font-bold transition sm:px-3",
                  tab === key ? "bg-teal-700 text-white" : "text-muted hover:bg-slate-50",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="input w-full sm:ml-auto sm:w-auto sm:min-w-44">
          <option value="all">Semua kelas</option>
          {classes.map((className) => <option key={className} value={className}>Kelas {className}</option>)}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((row) => (
          <div key={row.id} className="card group p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-50 text-sm font-extrabold text-teal-800">{row.full_name[0]}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-extrabold">{row.full_name}</h3>
                  <Badge>Kelas {row.class_name}</Badge>
                  <Badge tone={row.present ? "green" : undefined}>{row.present ? "Hadir" : "Belum presensi"}</Badge>
                  {row.submitted && mode !== "murajaah" && <Badge tone="green">Sudah setor</Badge>}
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Setoran terakhir</p>
                <p className="mt-1 text-sm font-semibold">{row.lastMemorization}</p>
                {row.focus && <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">📌 {row.focus}</div>}
              </div>
            </div>
            <button type="button" onClick={() => openStudent(row)} className="button-primary mt-4 w-full">
              {row.submitted && mode !== "murajaah" ? <CheckCircle2 size={16} /> : <Plus size={16} />}
              {mode === "murajaah" ? "Catat Murajaah" : row.submitted ? "Tambah Setoran Lagi" : "Input Hafalan"}
            </button>
          </div>
        ))}
      </div>

      {!visible.length && (
        <div className="card p-8 text-center sm:p-10">
          <BookOpenCheck className="mx-auto text-teal-600" />
          <h3 className="mt-3 font-bold">Tidak ada siswa pada filter ini</h3>
          <p className="mt-1 text-sm leading-6 text-muted">Ubah filter kelas atau status setoran untuk menampilkan siswa.</p>
        </div>
      )}

      {pickerOpen && <StudentPicker rows={rows} mode={mode} onSelect={openStudent} onClose={() => setPickerOpen(false)} />}
      {selected && <SubmissionModal student={selected} date={date} defaultType={mode} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StudentPicker({ rows, mode, onSelect, onClose }: { rows: QueueRow[]; mode: BoardMode; onSelect: (row: QueueRow) => void; onClose: () => void }) {
  const [classFilter, setClassFilter] = useState("all");
  const classes = useMemo(() => Array.from(new Set(rows.map((row) => row.class_name))).sort(), [rows]);
  const options = rows
    .filter((row) => classFilter === "all" || row.class_name === classFilter)
    .sort((a, b) => Number(b.present) - Number(a.present) || a.class_name.localeCompare(b.class_name) || a.full_name.localeCompare(b.full_name));

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm md:items-center md:p-5">
      <div className="max-h-[90dvh] w-full max-w-xl overflow-hidden rounded-t-[28px] bg-white shadow-2xl md:rounded-[28px]">
        <div className="border-b border-line p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label">Pilih Siswa</p>
              <h3 className="mt-1 text-xl font-extrabold">{mode === "murajaah" ? "Siapa yang akan murajaah?" : "Siapa yang akan setor hafalan?"}</h3>
              <p className="mt-1 text-xs leading-5 text-muted">Semua siswa binaan dapat dipilih. Status presensi tetap ditampilkan sebagai informasi.</p>
            </div>
            <button type="button" aria-label="Tutup daftar siswa" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"><X size={17} /></button>
          </div>
          <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="input mt-4">
            <option value="all">Semua kelas</option>
            {classes.map((className) => <option key={className} value={className}>Kelas {className}</option>)}
          </select>
        </div>
        <div className="max-h-[56dvh] space-y-2 overflow-y-auto p-4 sm:p-5">
          {options.map((row) => (
            <button key={row.id} type="button" onClick={() => onSelect(row)} className="flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left transition hover:border-teal-200 hover:bg-teal-50/70">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-sm font-extrabold text-teal-800">{row.full_name[0]}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold">{row.full_name}</div>
                <div className="mt-0.5 text-[11px] text-muted">Kelas {row.class_name} · {row.present ? "Hadir" : "Belum presensi"}{row.submitted && mode === "hafalan_baru" ? " · Sudah setor" : ""}</div>
              </div>
              <ChevronRight className="shrink-0 text-slate-300" size={17} />
            </button>
          ))}
          {!options.length && <div className="py-10 text-center text-sm text-muted"><Users className="mx-auto mb-2" />Tidak ada siswa pada kelas ini.</div>}
        </div>
      </div>
    </div>
  );
}

function SubmissionModal({ student, date, defaultType, onClose }: { student: QueueRow; date: string; defaultType: BoardMode; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const isMurajaah = defaultType === "murajaah";

  const submit = (formData: FormData) => startTransition(async () => {
    setMessage("");
    const startAyah = Number(formData.get("start"));
    const endAyah = Number(formData.get("end"));
    if (endAyah < startAyah) {
      setMessage("Ayat akhir tidak boleh lebih kecil dari ayat awal.");
      return;
    }

    const result = await createSubmissionAction({
      studentId: student.id,
      date,
      type: defaultType,
      surahName: String(formData.get("surah")),
      startAyah,
      endAyah,
      fluency: Number(formData.get("fluency")),
      tajwid: Number(formData.get("tajwid")),
      makhraj: Number(formData.get("makhraj")),
      mistakes: Number(formData.get("mistakes")),
      note: String(formData.get("note") || ""),
    });

    if (result.ok) {
      setMessage(isMurajaah ? "Murajaah berhasil disimpan." : "Hafalan baru berhasil disimpan.");
      router.refresh();
      window.setTimeout(onClose, 450);
    } else {
      setMessage(result.message ?? "Gagal menyimpan");
    }
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm md:items-center md:p-5">
      <div className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl md:max-h-[92vh] md:rounded-[28px] md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label">{isMurajaah ? "Input Murajaah" : "Input Hafalan Baru"}</p>
            <h3 className="mt-1 truncate text-xl font-extrabold">{student.full_name}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>Kelas {student.class_name}</span><span>•</span><span>{student.present ? "Hadir hari ini" : "Presensi belum dicatat"}</span>
            </div>
          </div>
          <button type="button" aria-label="Tutup form" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"><X size={17} /></button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Setoran terakhir</p>
          <p className="mt-1 text-sm font-extrabold text-slate-800">{student.lastMemorization}</p>
        </div>

        <form action={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className={cn("sm:col-span-2 rounded-2xl border px-4 py-3", isMurajaah ? "border-cyan-100 bg-cyan-50/70" : "border-teal-100 bg-teal-50/70")}>
            <div className={cn("text-xs font-extrabold", isMurajaah ? "text-cyan-900" : "text-teal-900")}>{isMurajaah ? "Murajaah Hafalan" : "Setoran Hafalan Baru"}</div>
            <p className={cn("mt-1 text-[11px] leading-5", isMurajaah ? "text-cyan-800/75" : "text-teal-800/75")}>Isi detail bacaan di bawah. Nilai 5 adalah kualitas terbaik.</p>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-xs font-bold">Surah</label>
            <select name="surah" required className="input" defaultValue={QURAN_SURAHS[0]}>
              {QURAN_SURAHS.map((surah) => <option key={surah} value={surah}>{surah}</option>)}
            </select>
          </div>

          <div><label className="mb-2 block text-xs font-bold">Ayat awal</label><input name="start" type="number" inputMode="numeric" min="1" required defaultValue="1" className="input" /></div>
          <div><label className="mb-2 block text-xs font-bold">Ayat akhir</label><input name="end" type="number" inputMode="numeric" min="1" required defaultValue="5" className="input" /></div>

          <ScoreField name="fluency" label="Kelancaran" />
          <ScoreField name="tajwid" label="Tajwid" />
          <ScoreField name="makhraj" label="Makhraj" />
          <div><label className="mb-2 block text-xs font-bold">Jumlah kesalahan</label><input name="mistakes" type="number" inputMode="numeric" min="0" defaultValue="0" className="input" /></div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-xs font-bold">{isMurajaah ? "Catatan murajaah" : "Catatan hafalan"} <span className="font-medium text-muted">(opsional)</span></label>
            <textarea name="note" rows={4} className="textarea" placeholder={isMurajaah ? "Contoh: bacaan sudah stabil, mad pada ayat 8 masih perlu penguatan." : "Contoh: hafalan lancar, makhraj ض membaik, ayat 4 masih perlu diulang."} />
          </div>

          {message && <p className="sm:col-span-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">{message}</p>}
          <div className="sm:col-span-2 flex justify-end border-t border-line pt-4">
            <button className="button-primary w-full sm:min-w-48 sm:w-auto" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" size={16} /> : <BookOpenCheck size={16} />}
              {pending ? "Menyimpan..." : isMurajaah ? "Simpan Murajaah" : "Simpan Hafalan Baru"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScoreField({ name, label }: { name: "fluency" | "tajwid" | "makhraj"; label: string }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold">{label}</label>
      <select name={name} className="input" defaultValue="4">
        <option value="5">5 · Sangat baik</option>
        <option value="4.5">4.5 · Baik sekali</option>
        <option value="4">4 · Baik</option>
        <option value="3.5">3.5 · Cukup baik</option>
        <option value="3">3 · Perlu penguatan</option>
        <option value="2">2 · Perlu bimbingan</option>
        <option value="1">1 · Perlu perhatian khusus</option>
      </select>
    </div>
  );
}
