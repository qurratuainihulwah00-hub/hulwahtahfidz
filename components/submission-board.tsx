"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, CheckCircle2, Loader2, Plus, X } from "lucide-react";
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

export function SubmissionBoard({ rows, date, mode = "hafalan_baru" }: { rows: QueueRow[]; date: string; mode?: "hafalan_baru" | "murajaah" }) {
  const [tab, setTab] = useState<"pending" | "done" | "all">(mode === "murajaah" ? "all" : "pending");
  const [selected, setSelected] = useState<QueueRow | null>(null);
  const [filter, setFilter] = useState("all");
  const classes = useMemo(() => Array.from(new Set(rows.map((row) => row.class_name))).sort(), [rows]);
  const visible = rows.filter(
    (row) =>
      (filter === "all" || row.class_name === filter) &&
      (mode === "murajaah" || tab === "all" || (tab === "pending" ? !row.submitted : row.submitted)) &&
      (mode === "murajaah" || row.present),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        {mode !== "murajaah" && (
          <div className="grid grid-cols-3 rounded-xl border border-line bg-white p-1 sm:flex">
            {([["pending", "Belum Setor"], ["done", "Sudah Setor"], ["all", "Semua"]] as const).map(([key, label]) => (
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
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="input w-full sm:ml-auto sm:w-auto sm:min-w-40">
          <option value="all">Semua kelas</option>
          {classes.map((className) => <option key={className} value={className}>Kelas {className}</option>)}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((row) => (
          <div key={row.id} className="card p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-sm font-extrabold text-teal-800">{row.full_name[0]}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-extrabold">{row.full_name}</h3>
                  <Badge>Kelas {row.class_name}</Badge>
                  {row.submitted && mode !== "murajaah" && <Badge tone="green">Sudah setor</Badge>}
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Terakhir</p>
                <p className="mt-1 text-sm font-semibold">{row.lastMemorization}</p>
                {row.focus && <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">📌 {row.focus}</div>}
              </div>
            </div>
            <button type="button" onClick={() => setSelected(row)} className="button-primary mt-4 w-full">
              {row.submitted && mode !== "murajaah" ? <CheckCircle2 size={16} /> : <Plus size={16} />}
              {mode === "murajaah" ? "Catat Murajaah" : "Catat Setoran"}
            </button>
          </div>
        ))}
      </div>

      {!visible.length && (
        <div className="card p-8 text-center sm:p-10">
          <BookOpenCheck className="mx-auto text-teal-600" />
          <h3 className="mt-3 font-bold">Tidak ada siswa pada daftar ini</h3>
          <p className="mt-1 text-sm leading-6 text-muted">Coba ubah filter atau selesaikan absensi terlebih dahulu.</p>
        </div>
      )}

      {selected && <SubmissionModal student={selected} date={date} defaultType={mode} onClose={() => setSelected(null)} />}
    </div>
  );
}

function SubmissionModal({ student, date, defaultType, onClose }: { student: QueueRow; date: string; defaultType: "hafalan_baru" | "murajaah"; onClose: () => void }) {
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
      setMessage(isMurajaah ? "Murajaah berhasil disimpan." : "Setoran berhasil disimpan.");
      router.refresh();
      window.setTimeout(onClose, 350);
    } else {
      setMessage(result.message ?? "Gagal menyimpan");
    }
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-sm md:items-center md:p-5">
      <div className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-[26px] bg-white p-5 shadow-2xl md:max-h-[92vh] md:rounded-[26px] md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label">{isMurajaah ? "Catat Murajaah" : "Catat Setoran Hafalan"}</p>
            <h3 className="mt-1 truncate text-xl font-extrabold">{student.full_name}</h3>
            <p className="mt-1 text-xs leading-5 text-muted">Kelas {student.class_name} · terakhir {student.lastMemorization}</p>
          </div>
          <button type="button" aria-label="Tutup form" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200">
            <X size={17} />
          </button>
        </div>

        <form action={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {isMurajaah ? (
            <div className="sm:col-span-2 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3">
              <div className="text-xs font-extrabold text-cyan-900">Mode Murajaah</div>
              <p className="mt-1 text-[11px] leading-5 text-cyan-800/75">Form ini khusus penguatan hafalan lama. Data yang disimpan selalu tercatat sebagai murajaah.</p>
            </div>
          ) : (
            <div className="sm:col-span-2 rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3">
              <div className="text-xs font-extrabold text-teal-900">Mode Hafalan Baru</div>
              <p className="mt-1 text-[11px] leading-5 text-teal-800/75">Form ini khusus setoran hafalan baru.</p>
            </div>
          )}
          <div className="sm:col-span-2"><label className="mb-2 block text-xs font-bold">Surah</label><select name="surah" className="input">{QURAN_SURAHS.map((surah) => <option key={surah}>{surah}</option>)}</select></div>
          <div><label className="mb-2 block text-xs font-bold">Ayat awal</label><input name="start" type="number" min="1" required defaultValue="1" className="input" /></div>
          <div><label className="mb-2 block text-xs font-bold">Ayat akhir</label><input name="end" type="number" min="1" required defaultValue="5" className="input" /></div>
          {([["fluency", "Kelancaran"], ["tajwid", "Tajwid"], ["makhraj", "Makhraj"]] as const).map(([name, label]) => (
            <div key={name}><label className="mb-2 block text-xs font-bold">{label}</label><select name={name} className="input" defaultValue="4"><option value="5">5 · Sangat baik</option><option value="4.5">4.5</option><option value="4">4 · Baik</option><option value="3.5">3.5</option><option value="3">3 · Perlu penguatan</option><option value="2">2</option><option value="1">1</option></select></div>
          ))}
          <div><label className="mb-2 block text-xs font-bold">Jumlah kesalahan</label><input name="mistakes" type="number" min="0" defaultValue="0" className="input" /></div>
          <div className="sm:col-span-2"><label className="mb-2 block text-xs font-bold">{isMurajaah ? "Catatan murajaah" : "Catatan setoran"}</label><textarea name="note" className="textarea" placeholder={isMurajaah ? "Contoh: An-Naba ayat 1–20 mulai lancar, mad masih perlu diperkuat." : "Contoh: makhraj ض mulai membaik, tetapi mad masih perlu diperhatikan."} /></div>
          {message && <p className="sm:col-span-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">{message}</p>}
          <div className="sm:col-span-2 flex justify-end"><button className="button-primary w-full sm:min-w-40 sm:w-auto" disabled={pending}>{pending ? <Loader2 className="animate-spin" size={16} /> : <BookOpenCheck size={16} />} {pending ? "Menyimpan..." : isMurajaah ? "Simpan Murajaah" : "Simpan Setoran"}</button></div>
        </form>
      </div>
    </div>
  );
}
