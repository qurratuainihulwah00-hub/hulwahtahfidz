"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BookOpenCheck,
  CalendarRange,
  Database,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { QURAN_SURAHS } from "@/lib/surahs";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type DataRow = Record<string, any>;
type DataCenterTab = "students" | "targets" | "periods" | "records" | "progress" | "profile";
type RecordKind = "attendance" | "hafalan_baru" | "murajaah" | "note" | "focus" | "weekly_target" | "report";
type RecordEntity = "attendance" | "submission" | "note" | "focus" | "weekly_target" | "report";

type ModalState =
  | { type: "student"; row?: DataRow }
  | { type: "target"; row?: DataRow }
  | { type: "period"; row?: DataRow }
  | { type: "record"; kind: RecordKind; row?: DataRow }
  | null;

type DeleteState =
  | { type: "student"; row: DataRow; label: string }
  | { type: "target"; row: DataRow; label: string }
  | { type: "period"; row: DataRow; label: string }
  | { type: "record"; kind: RecordKind; row: DataRow; label: string }
  | null;

const RECORD_CONFIG: Record<RecordKind, { label: string; entity: RecordEntity; tone: string; submissionType?: "hafalan_baru" | "murajaah" }> = {
  attendance: { label: "Absensi", entity: "attendance", tone: "bg-emerald-50 text-emerald-700" },
  hafalan_baru: { label: "Hafalan Baru", entity: "submission", submissionType: "hafalan_baru", tone: "bg-teal-50 text-teal-700" },
  murajaah: { label: "Murajaah", entity: "submission", submissionType: "murajaah", tone: "bg-cyan-50 text-cyan-700" },
  note: { label: "Catatan Siswa", entity: "note", tone: "bg-sky-50 text-sky-700" },
  focus: { label: "Fokus Pembinaan", entity: "focus", tone: "bg-amber-50 text-amber-700" },
  weekly_target: { label: "Target Mingguan", entity: "weekly_target", tone: "bg-violet-50 text-violet-700" },
  report: { label: "Laporan", entity: "report", tone: "bg-slate-100 text-slate-700" },
};

const recordKinds = Object.keys(RECORD_CONFIG) as RecordKind[];

export function SettingsDataCenter({ token }: { token: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<DataCenterTab>("students");
  const [recordKind, setRecordKind] = useState<RecordKind>("attendance");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [deleting, setDeleting] = useState<DeleteState>(null);

  async function load() {
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { data: result, error } = await supabase.rpc("hulwah_settings_data", { p_token: token });
    if (error) {
      setMessage(error.message);
      setData(null);
    } else {
      setData(result);
    }
    setLoading(false);
  }

  async function refreshAll() {
    await load();
    router.refresh();
  }

  useEffect(() => {
    void load();
    // token uniquely identifies the active PIN-protected settings session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const counts = {
    students: data?.students?.length ?? 0,
    targets: data?.classTargets?.length ?? 0,
    periods: data?.periods?.length ?? 0,
    records:
      (data?.attendance?.length ?? 0) +
      (data?.submissions?.length ?? 0) +
      (data?.notes?.length ?? 0) +
      (data?.focusItems?.length ?? 0) +
      (data?.weeklyTargets?.length ?? 0) +
      (data?.reports?.length ?? 0),
    progress: data?.surahProgress?.length ?? 0,
  };

  const tabs: Array<{ key: DataCenterTab; label: string; count?: number; icon: any }> = [
    { key: "students", label: "Siswa", count: counts.students, icon: Users },
    { key: "targets", label: "Target Kelas", count: counts.targets, icon: Target },
    { key: "periods", label: "Semester", count: counts.periods, icon: CalendarRange },
    { key: "records", label: "Semua Aktivitas", count: counts.records, icon: Database },
    { key: "progress", label: "Progress Otomatis", count: counts.progress, icon: BookOpenCheck },
    { key: "profile", label: "Profil", icon: UserRound },
  ];

  const currentRecords = useMemo<DataRow[]>(() => {
    if (!data) return [];
    const submissions = data.submissions ?? [];
    const source: Record<RecordKind, DataRow[]> = {
      attendance: data.attendance ?? [],
      hafalan_baru: submissions.filter((row: DataRow) => row.type === "hafalan_baru"),
      murajaah: submissions.filter((row: DataRow) => row.type === "murajaah"),
      note: data.notes ?? [],
      focus: data.focusItems ?? [],
      weekly_target: data.weeklyTargets ?? [],
      report: data.reports ?? [],
    };
    const rows = source[recordKind] ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
  }, [data, query, recordKind]);

  async function deleteRecord() {
    if (!deleting) return;
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    let error: any = null;

    if (deleting.type === "student") {
      ({ error } = await supabase.rpc("hulwah_manage_student", {
        p_token: token,
        p_action: "delete",
        p_id: deleting.row.id,
      }));
    } else if (deleting.type === "target") {
      ({ error } = await supabase.rpc("hulwah_manage_class_target", {
        p_token: token,
        p_action: "delete",
        p_id: deleting.row.id,
      }));
    } else if (deleting.type === "period") {
      ({ error } = await supabase.rpc("hulwah_manage_period", {
        p_token: token,
        p_action: "delete",
        p_id: deleting.row.id,
        p_start_date: deleting.row.start_date,
        p_end_date: deleting.row.end_date,
      }));
    } else {
      const config = RECORD_CONFIG[deleting.kind];
      ({ error } = await supabase.rpc("hulwah_settings_delete_record", {
        p_token: token,
        p_entity: config.entity,
        p_id: config.entity === "attendance" ? deleting.row.session_id : deleting.row.id,
        p_student_id: config.entity === "attendance" ? deleting.row.student_id : null,
      }));
    }

    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setDeleting(null);
    await refreshAll();
  }

  function openRecordSource(kind: "hafalan_baru" | "murajaah") {
    setRecordKind(kind);
    setQuery("");
    setTab("records");
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-[24px] border border-teal-100 bg-white shadow-soft">
        <div className="border-b border-teal-100 bg-gradient-to-r from-teal-950 via-teal-800 to-cyan-700 p-5 text-white sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-cyan-100/80">
                <Database size={15} /> Database Control Center
              </div>
              <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">Kelola Semua Data Tahfidz</h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-white/70 sm:text-sm">
                Siswa, target, semester, absensi, Hafalan Baru, Murajaah, catatan, fokus, target mingguan, laporan, dan profil dikelola dari sini. Tambah, ubah, dan hapus langsung tersimpan ke Supabase lalu dashboard disegarkan otomatis.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refreshAll()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/15 active:scale-[0.98]"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} size={16} /> Sinkronkan Supabase
            </button>
          </div>
        </div>

        <div className="grid gap-2 border-b border-line bg-slate-50/60 p-3 sm:grid-cols-3 sm:p-4 lg:grid-cols-6">
          <SummaryChip label="Siswa" value={counts.students} />
          <SummaryChip label="Aktivitas" value={counts.records} />
          <SummaryChip label="Progress" value={counts.progress} />
          <SummaryChip label="Target Kelas" value={counts.targets} />
          <SummaryChip label="Semester" value={counts.periods} />
          <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">
            <ShieldCheck size={14} /> Live Supabase
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-line p-3 sm:p-4">
          {tabs.map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                setQuery("");
              }}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition active:scale-[0.98]",
                tab === key ? "bg-teal-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-800",
              )}
            >
              <Icon size={15} /> {label}
              {typeof count === "number" && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", tab === key ? "bg-white/15" : "bg-white")}>{count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {message && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">{message}</div>}
          {loading ? (
            <div className="grid min-h-52 place-items-center text-center">
              <div><Loader2 className="mx-auto animate-spin text-teal-700" size={24} /><p className="mt-3 text-xs font-semibold text-muted">Sinkronisasi Data Center...</p></div>
            </div>
          ) : !data ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-muted">Data belum dapat dimuat.</div>
          ) : (
            <>
              {tab === "students" && (
                <StudentsPanel
                  rows={data.students ?? []}
                  onAdd={() => setModal({ type: "student" })}
                  onEdit={(row) => setModal({ type: "student", row })}
                  onDelete={(row) => setDeleting({ type: "student", row, label: row.full_name })}
                />
              )}
              {tab === "targets" && (
                <TargetsPanel
                  rows={data.classTargets ?? []}
                  onAdd={() => setModal({ type: "target" })}
                  onEdit={(row) => setModal({ type: "target", row })}
                  onDelete={(row) => setDeleting({ type: "target", row, label: `${row.class_name} · segmen ${row.segment_no}` })}
                />
              )}
              {tab === "periods" && (
                <PeriodsPanel
                  rows={data.periods ?? []}
                  onAdd={() => setModal({ type: "period" })}
                  onEdit={(row) => setModal({ type: "period", row })}
                  onDelete={(row) => setDeleting({ type: "period", row, label: row.label })}
                />
              )}
              {tab === "records" && (
                <RecordsPanel
                  kind={recordKind}
                  onKind={(kind) => {
                    setRecordKind(kind);
                    setQuery("");
                  }}
                  query={query}
                  onQuery={setQuery}
                  rows={currentRecords}
                  onAdd={() => setModal({ type: "record", kind: recordKind })}
                  onEdit={(row) => setModal({ type: "record", kind: recordKind, row })}
                  onDelete={(row) => setDeleting({ type: "record", kind: recordKind, row, label: recordLabel(recordKind, row) })}
                />
              )}
              {tab === "progress" && <ProgressPanel rows={data.surahProgress ?? []} onSource={openRecordSource} />}
              {tab === "profile" && <ProfilePanel row={data.profile} token={token} onSaved={refreshAll} />}
            </>
          )}
        </div>
      </div>

      {modal?.type === "student" && (
        <StudentModal token={token} row={modal.row} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refreshAll(); }} />
      )}
      {modal?.type === "target" && (
        <TargetModal token={token} row={modal.row} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refreshAll(); }} />
      )}
      {modal?.type === "period" && (
        <PeriodModal token={token} row={modal.row} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refreshAll(); }} />
      )}
      {modal?.type === "record" && (
        <RecordModal
          token={token}
          kind={modal.kind}
          row={modal.row}
          students={data?.students ?? []}
          onClose={() => setModal(null)}
          onSaved={async () => { setModal(null); await refreshAll(); }}
        />
      )}
      {deleting && <DeleteModal state={deleting} busy={busy} onCancel={() => setDeleting(null)} onConfirm={() => void deleteRecord()} />}
    </section>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-line bg-white px-3 py-2"><div className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</div><div className="mt-0.5 text-lg font-extrabold text-ink">{value}</div></div>;
}

function PanelTitle({ title, description, onAdd, addLabel }: { title: string; description: string; onAdd?: () => void; addLabel?: string }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h3 className="font-extrabold">{title}</h3><p className="mt-1 max-w-3xl text-xs leading-5 text-muted">{description}</p></div>
      {onAdd && <button type="button" onClick={onAdd} className="button-primary shrink-0"><Plus size={16} /> {addLabel ?? "Tambah"}</button>}
    </div>
  );
}

function StudentsPanel({ rows, onAdd, onEdit, onDelete }: { rows: DataRow[]; onAdd: () => void; onEdit: (row: DataRow) => void; onDelete: (row: DataRow) => void }) {
  const [query, setQuery] = useState("");
  const visible = rows.filter((row) => `${row.full_name} ${row.class_name} ${row.nis ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <PanelTitle title="Siswa Binaan" description="Tambah siswa baru, ubah nama/kelas/NIS/status, atau hapus permanen. Menghapus siswa juga menghapus data turunannya di Supabase melalui relasi database." onAdd={onAdd} addLabel="Tambah Siswa" />
      <SearchBox value={query} onChange={setQuery} placeholder="Cari nama atau kelas..." />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visible.map((row) => (
          <article key={row.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-sm font-extrabold text-teal-800">{row.full_name?.[0] ?? "S"}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-extrabold">{row.full_name}</div>
                <div className="mt-1 text-xs text-muted">Kelas {row.class_name}{row.nis ? ` · NIS ${row.nis}` : ""}</div>
                <div className={cn("mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold", row.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{row.is_active ? "Aktif" : "Nonaktif"}</div>
              </div>
              <RowActions onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} />
            </div>
          </article>
        ))}
      </div>
      {!visible.length && <Empty text="Tidak ada siswa yang cocok." />}
    </div>
  );
}

function TargetsPanel({ rows, onAdd, onEdit, onDelete }: { rows: DataRow[]; onAdd: () => void; onEdit: (row: DataRow) => void; onDelete: (row: DataRow) => void }) {
  return (
    <div>
      <PanelTitle title="Target Hafalan per Kelas" description="Kelola target tiap segmen kelas. Perubahan langsung menjadi acuan dashboard dan laporan." onAdd={onAdd} addLabel="Tambah Target" />
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-line p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Target size={18} /></div>
              <div className="min-w-0 flex-1"><div className="font-extrabold">Kelas {row.class_name}</div><div className="mt-1 text-xs font-semibold text-teal-700">Segmen {row.segment_no}</div><p className="mt-2 text-sm">{row.start_label} → {row.end_label}</p></div>
              <RowActions onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} />
            </div>
          </article>
        ))}
      </div>
      {!rows.length && <Empty text="Belum ada target kelas." />}
    </div>
  );
}

function PeriodsPanel({ rows, onAdd, onEdit, onDelete }: { rows: DataRow[]; onAdd: () => void; onEdit: (row: DataRow) => void; onDelete: (row: DataRow) => void }) {
  return (
    <div>
      <PanelTitle title="Tahun Ajaran & Semester" description="Periode ini menjadi dasar laporan bulanan/semester. Hanya satu periode yang sebaiknya aktif." onAdd={onAdd} addLabel="Tambah Semester" />
      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><CalendarRange size={18} /></div>
            <div className="min-w-0 flex-1"><div className="font-extrabold">{row.label}</div><div className="mt-1 text-xs text-muted">{formatDate(row.start_date)} – {formatDate(row.end_date)} · {row.code}</div></div>
            {row.is_active && <span className="self-start rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:self-auto">Aktif</span>}
            <RowActions onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} />
          </article>
        ))}
      </div>
      {!rows.length && <Empty text="Belum ada periode akademik." />}
    </div>
  );
}

function RecordsPanel({ kind, onKind, query, onQuery, rows, onAdd, onEdit, onDelete }: { kind: RecordKind; onKind: (kind: RecordKind) => void; query: string; onQuery: (value: string) => void; rows: DataRow[]; onAdd: () => void; onEdit: (row: DataRow) => void; onDelete: (row: DataRow) => void }) {
  const config = RECORD_CONFIG[kind];
  return (
    <div>
      <PanelTitle title="Semua Data Aktivitas" description="Setiap data di bawah ini adalah data asli Supabase. Tambah, koreksi, dan hapus dari sini akan langsung memengaruhi Dashboard, Detail Siswa, Progress, serta laporan." onAdd={onAdd} addLabel={`Tambah ${config.label}`} />
      <div className="flex gap-2 overflow-x-auto pb-2">
        {recordKinds.map((item) => {
          const itemConfig = RECORD_CONFIG[item];
          return (
            <button key={item} type="button" onClick={() => onKind(item)} className={cn("shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition active:scale-[0.98]", kind === item ? "bg-teal-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-teal-50")}>{itemConfig.label}</button>
          );
        })}
      </div>
      <div className="mt-3"><SearchBox value={query} onChange={onQuery} placeholder="Cari nama, kelas, tanggal, surah, atau catatan..." /></div>
      <div className="mt-4 space-y-2">
        {rows.slice(0, 200).map((row, index) => (
          <article key={`${kind}-${row.id ?? row.session_id}-${row.student_id ?? index}`} className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center">
            <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold", config.tone)}>{row.student_name?.[0] ?? "D"}</div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-extrabold">{recordLabel(kind, row)}</div><div className="mt-1 text-xs text-muted">{recordMeta(kind, row)}</div></div>
            <RowActions onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} />
          </article>
        ))}
      </div>
      {!rows.length && <Empty text={`Belum ada data ${config.label}.`} />}
      {rows.length > 200 && <p className="mt-3 text-center text-xs text-muted">Menampilkan 200 data terbaru dari hasil pencarian.</p>}
    </div>
  );
}

function ProgressPanel({ rows, onSource }: { rows: DataRow[]; onSource: (kind: "hafalan_baru" | "murajaah") => void }) {
  return (
    <div>
      <PanelTitle title="Progress Hafalan Otomatis" description="Progress ini dihitung ulang dari data Hafalan Baru dan Murajaah. Karena bersifat turunan, jangan diedit manual—ubah sumbernya, maka progress akan mengikuti otomatis." />
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onSource("hafalan_baru")} className="button-secondary">Kelola Hafalan Baru</button>
        <button type="button" onClick={() => onSource("murajaah")} className="button-secondary">Kelola Murajaah</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-line p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-extrabold">{row.student_name}</div><div className="mt-1 text-xs text-muted">Kelas {row.class_name}</div></div><span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700">{statusText(row.status)}</span></div>
            <div className="mt-4 text-lg font-extrabold">{row.surah_name} · ayat {row.last_ayah}</div>
            <div className="mt-2 text-[11px] leading-5 text-muted">Setoran terakhir: {formatDateTime(row.last_submitted_at)}<br />Murajaah terakhir: {formatDateTime(row.last_reviewed_at)}</div>
          </article>
        ))}
      </div>
      {!rows.length && <Empty text="Progress akan muncul setelah ada Hafalan Baru atau Murajaah." />}
    </div>
  );
}

function ProfilePanel({ row, token, onSaved }: { row: DataRow; token: string; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(row?.display_name ?? "");
  const [avatar, setAvatar] = useState(row?.avatar_url ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.rpc("hulwah_settings_update_record", {
      p_token: token,
      p_entity: "profile",
      p_id: row.id,
      p_student_id: null,
      p_payload: { display_name: name, avatar_url: avatar },
    });
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setMessage("Profil tersimpan ke Supabase.");
      await onSaved();
    }
  }

  return (
    <div>
      <PanelTitle title="Profil Ustadzah" description="Identitas yang tampil pada header dan Dashboard." />
      <form onSubmit={save} className="max-w-2xl space-y-4 rounded-2xl border border-line p-4 sm:p-5">
        <Field label="Nama" value={name} onChange={setName} required />
        <Field label="Avatar URL / path" value={avatar} onChange={setAvatar} placeholder="/hulwah-avatar-pro.webp" />
        {message && <p className="text-xs font-semibold text-teal-700">{message}</p>}
        <button disabled={busy} className="button-primary">{busy ? <Loader2 className="animate-spin" size={16} /> : <BookOpenCheck size={16} />} Simpan Profil</button>
      </form>
    </div>
  );
}

function StudentModal({ token, row, onClose, onSaved }: { token: string; row?: DataRow; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(row?.full_name ?? "");
  const [className, setClassName] = useState(row?.class_name ?? "");
  const [nis, setNis] = useState(row?.nis ?? "");
  const [active, setActive] = useState(row?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.rpc("hulwah_manage_student", {
      p_token: token,
      p_action: row ? "update" : "create",
      p_id: row?.id ?? null,
      p_full_name: name,
      p_class_name: className,
      p_nis: nis || null,
      p_is_active: active,
    });
    setBusy(false);
    if (error) setMessage(error.message);
    else await onSaved();
  }

  return (
    <BaseModal title={row ? "Ubah Siswa" : "Tambah Siswa"} subtitle="Perubahan langsung tersimpan ke Supabase." onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Nama siswa" value={name} onChange={setName} required />
        <Field label="Kelas" value={className} onChange={setClassName} placeholder="Contoh: 1 Ar Rahman" required />
        <Field label="NIS (opsional)" value={nis} onChange={setNis} />
        <CheckboxField label="Siswa aktif" checked={active} onChange={setActive} />
        <ModalMessage text={message} />
        <SaveButton busy={busy} label={row ? "Simpan Perubahan" : "Tambah Siswa"} />
      </form>
    </BaseModal>
  );
}

function TargetModal({ token, row, onClose, onSaved }: { token: string; row?: DataRow; onClose: () => void; onSaved: () => Promise<void> }) {
  const [className, setClassName] = useState(row?.class_name ?? "");
  const [segment, setSegment] = useState(row?.segment_no ?? 1);
  const [start, setStart] = useState(row?.start_label ?? "");
  const [end, setEnd] = useState(row?.end_label ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.rpc("hulwah_manage_class_target", {
      p_token: token,
      p_action: row ? "update" : "create",
      p_id: row?.id ?? null,
      p_class_name: className,
      p_segment_no: Number(segment),
      p_start_label: start,
      p_end_label: end,
    });
    setBusy(false);
    if (error) setMessage(error.message);
    else await onSaved();
  }

  return (
    <BaseModal title={row ? "Ubah Target Kelas" : "Tambah Target Kelas"} subtitle="Atur segmen dan rentang hafalan." onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Nama kelas" value={className} onChange={setClassName} required />
        <NumberField label="Segmen" value={segment} onChange={setSegment} min={1} />
        <Field label="Mulai" value={start} onChange={setStart} placeholder="An-Naba" required />
        <Field label="Sampai" value={end} onChange={setEnd} placeholder="Al-Fajr" required />
        <ModalMessage text={message} />
        <SaveButton busy={busy} label={row ? "Simpan Perubahan" : "Tambah Target"} />
      </form>
    </BaseModal>
  );
}

function PeriodModal({ token, row, onClose, onSaved }: { token: string; row?: DataRow; onClose: () => void; onSaved: () => Promise<void> }) {
  const [code, setCode] = useState(row?.code ?? "");
  const [label, setLabel] = useState(row?.label ?? "");
  const [start, setStart] = useState(row?.start_date ?? "");
  const [end, setEnd] = useState(row?.end_date ?? "");
  const [active, setActive] = useState(row?.is_active ?? false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.rpc("hulwah_manage_period", {
      p_token: token,
      p_action: row ? "update" : "create",
      p_id: row?.id ?? null,
      p_code: code,
      p_label: label,
      p_start_date: start,
      p_end_date: end,
      p_is_active: active,
    });
    setBusy(false);
    if (error) setMessage(error.message);
    else await onSaved();
  }

  return (
    <BaseModal title={row ? "Ubah Semester" : "Tambah Semester"} subtitle="Rentang tanggal ini menjadi dasar laporan semester." onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Kode" value={code} onChange={setCode} placeholder="2026-ganjil" required />
        <Field label="Nama periode" value={label} onChange={setLabel} placeholder="2026/2027 · Semester Ganjil" required />
        <div className="grid gap-3 sm:grid-cols-2"><DateField label="Tanggal mulai" value={start} onChange={setStart} /><DateField label="Tanggal selesai" value={end} onChange={setEnd} /></div>
        <CheckboxField label="Jadikan semester aktif" checked={active} onChange={setActive} />
        <ModalMessage text={message} />
        <SaveButton busy={busy} label={row ? "Simpan Perubahan" : "Tambah Semester"} />
      </form>
    </BaseModal>
  );
}

function RecordModal({ token, kind, row, students, onClose, onSaved }: { token: string; kind: RecordKind; row?: DataRow; students: DataRow[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const config = RECORD_CONFIG[kind];
  const [studentId, setStudentId] = useState(row?.student_id ?? students[0]?.id ?? "");
  const [payload, setPayload] = useState<Record<string, any>>(() => initialRecordPayload(kind, row));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const isCreate = !row;
  const set = (key: string, value: any) => setPayload((previous) => ({ ...previous, [key]: value }));

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (isCreate && !studentId) {
      setMessage("Pilih siswa terlebih dahulu.");
      return;
    }
    if ((kind === "hafalan_baru" || kind === "murajaah") && Number(payload.end_ayah) < Number(payload.start_ayah)) {
      setMessage("Ayat akhir tidak boleh lebih kecil dari ayat awal.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const finalPayload = config.entity === "submission" ? { ...payload, type: config.submissionType } : payload;
    const rpc = isCreate ? "hulwah_settings_create_record" : "hulwah_settings_update_record";
    const args = isCreate
      ? { p_token: token, p_entity: config.entity, p_student_id: studentId, p_payload: finalPayload }
      : {
          p_token: token,
          p_entity: config.entity,
          p_id: config.entity === "attendance" ? row.session_id : row.id,
          p_student_id: config.entity === "attendance" ? row.student_id : null,
          p_payload: finalPayload,
        };
    const { error } = await supabase.rpc(rpc, args as any);
    setBusy(false);
    if (error) setMessage(error.message);
    else await onSaved();
  }

  return (
    <BaseModal title={`${isCreate ? "Tambah" : "Ubah"} ${config.label}`} subtitle={isCreate ? "Data baru langsung masuk ke Supabase." : recordLabel(kind, row)} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        {isCreate ? (
          <StudentField students={students} value={studentId} onChange={setStudentId} />
        ) : (
          <div className="rounded-xl border border-line bg-slate-50 px-3 py-2.5"><div className="text-[10px] font-bold uppercase tracking-wider text-muted">Siswa</div><div className="mt-1 text-sm font-extrabold">{row.student_name} · Kelas {row.class_name}</div></div>
        )}

        {kind === "attendance" && (
          <>
            <DateField label="Tanggal Absensi" value={payload.session_date} onChange={(value) => set("session_date", value)} />
            <SelectField label="Status" value={payload.status} onChange={(value) => set("status", value)} options={[
              { value: "hadir", label: "Hadir" }, { value: "izin", label: "Izin" }, { value: "sakit", label: "Sakit" }, { value: "alfa", label: "Alfa" },
            ]} />
            <TextAreaField label="Catatan" value={payload.note ?? ""} onChange={(value) => set("note", value)} />
          </>
        )}

        {(kind === "hafalan_baru" || kind === "murajaah") && (
          <>
            <div className={cn("rounded-2xl px-4 py-3 text-xs font-semibold", kind === "murajaah" ? "bg-cyan-50 text-cyan-800" : "bg-teal-50 text-teal-800")}>{kind === "murajaah" ? "Khusus Murajaah · tidak ada pilihan Hafalan Baru di form ini." : "Khusus Hafalan Baru · data tersimpan sebagai setoran hafalan baru."}</div>
            <DateField label="Tanggal" value={payload.session_date} onChange={(value) => set("session_date", value)} />
            <SurahField value={payload.surah_name} onChange={(value) => set("surah_name", value)} />
            <div className="grid gap-3 sm:grid-cols-2"><NumberField label="Ayat awal" value={payload.start_ayah} onChange={(value) => set("start_ayah", value)} min={1} /><NumberField label="Ayat akhir" value={payload.end_ayah} onChange={(value) => set("end_ayah", value)} min={1} /></div>
            <div className="grid gap-3 sm:grid-cols-3"><NumberField label="Kelancaran" value={payload.fluency_score} onChange={(value) => set("fluency_score", value)} min={1} max={5} step="0.5" /><NumberField label="Tajwid" value={payload.tajwid_score} onChange={(value) => set("tajwid_score", value)} min={1} max={5} step="0.5" /><NumberField label="Makhraj" value={payload.makhraj_score} onChange={(value) => set("makhraj_score", value)} min={1} max={5} step="0.5" /></div>
            <NumberField label="Jumlah kesalahan" value={payload.mistake_count} onChange={(value) => set("mistake_count", value)} min={0} />
            <TextAreaField label={kind === "murajaah" ? "Catatan Murajaah" : "Catatan Hafalan Baru"} value={payload.note ?? ""} onChange={(value) => set("note", value)} />
          </>
        )}

        {kind === "note" && (
          <>
            <DateField label="Tanggal Catatan" value={payload.note_date} onChange={(value) => set("note_date", value)} />
            <Field label="Kategori" value={payload.category} onChange={(value) => set("category", value)} required />
            <TextAreaField label="Catatan" value={payload.note} onChange={(value) => set("note", value)} required />
            <SelectField label="Penggunaan" value={payload.visibility} onChange={(value) => set("visibility", value)} options={[{ value: "internal", label: "Internal" }, { value: "report", label: "Masuk Laporan" }]} />
            <div className="grid gap-2 sm:grid-cols-2"><CheckboxField label="Pin catatan" checked={Boolean(payload.pinned)} onChange={(value) => set("pinned", value)} /><CheckboxField label="Sudah selesai" checked={Boolean(payload.resolved)} onChange={(value) => set("resolved", value)} /></div>
          </>
        )}

        {kind === "focus" && (
          <>
            <Field label="Fokus pembinaan" value={payload.title} onChange={(value) => set("title", value)} required />
            <SelectField label="Status" value={payload.status} onChange={(value) => set("status", value)} options={[{ value: "active", label: "Aktif" }, { value: "resolved", label: "Selesai" }]} />
          </>
        )}

        {kind === "weekly_target" && (
          <>
            <DateField label="Awal minggu" value={payload.week_start} onChange={(value) => set("week_start", value)} />
            <TextAreaField label="Target" value={payload.target_text} onChange={(value) => set("target_text", value)} required />
            <NumberField label="Progress (%)" value={payload.progress} onChange={(value) => set("progress", value)} min={0} max={100} />
            <SelectField label="Status" value={payload.status} onChange={(value) => set("status", value)} options={[{ value: "active", label: "Aktif" }, { value: "done", label: "Selesai" }, { value: "carried", label: "Dibawa ke minggu berikutnya" }]} />
          </>
        )}

        {kind === "report" && (
          <>
            <SelectField label="Jenis laporan" value={payload.period_type} onChange={(value) => set("period_type", value)} options={[{ value: "monthly", label: "Bulanan" }, { value: "semester", label: "Semester" }]} />
            <Field label="Kunci periode" value={payload.period_key} onChange={(value) => set("period_key", value)} placeholder={payload.period_type === "monthly" ? "2026-09" : "2026-ganjil"} required />
            <TextAreaField label="Analisis" value={payload.analysis ?? ""} onChange={(value) => set("analysis", value)} />
            <TextAreaField label="Narasi" value={payload.narrative ?? ""} onChange={(value) => set("narrative", value)} />
            <TextAreaField label="Fokus berikutnya" value={payload.next_focus ?? ""} onChange={(value) => set("next_focus", value)} />
            <SelectField label="Status" value={payload.status} onChange={(value) => set("status", value)} options={[{ value: "draft", label: "Draft" }, { value: "reviewed", label: "Ditinjau" }, { value: "final", label: "Final" }]} />
          </>
        )}

        <ModalMessage text={message} />
        <SaveButton busy={busy} label={isCreate ? `Tambah ${config.label}` : "Simpan Perubahan"} />
      </form>
    </BaseModal>
  );
}

function initialRecordPayload(kind: RecordKind, row?: DataRow) {
  if (row) return recordPayload(kind, row);
  const today = localDateString(new Date());
  if (kind === "attendance") return { session_date: today, status: "hadir", note: "" };
  if (kind === "hafalan_baru" || kind === "murajaah") return { session_date: today, type: kind, surah_name: "An-Naba", start_ayah: 1, end_ayah: 5, fluency_score: 4, tajwid_score: 4, makhraj_score: 4, mistake_count: 0, note: "" };
  if (kind === "note") return { note_date: today, category: "Perkembangan", note: "", visibility: "internal", pinned: false, resolved: false };
  if (kind === "focus") return { title: "", status: "active" };
  if (kind === "weekly_target") return { week_start: today, target_text: "", progress: 0, status: "active" };
  return { period_type: "monthly", period_key: today.slice(0, 7), analysis: "", narrative: "", next_focus: "", status: "draft" };
}

function recordPayload(kind: RecordKind, row: DataRow) {
  if (kind === "attendance") return { session_date: row.session_date, status: row.status, note: row.note ?? "" };
  if (kind === "hafalan_baru" || kind === "murajaah") return { session_date: row.session_date ?? String(row.submitted_at).slice(0, 10), type: kind, surah_name: row.surah_name, start_ayah: row.start_ayah, end_ayah: row.end_ayah, fluency_score: Number(row.fluency_score), tajwid_score: Number(row.tajwid_score), makhraj_score: Number(row.makhraj_score), mistake_count: row.mistake_count, note: row.note ?? "" };
  if (kind === "note") return { note_date: row.note_date, category: row.category, note: row.note, visibility: row.visibility, pinned: row.pinned, resolved: row.resolved };
  if (kind === "focus") return { title: row.title, status: row.status };
  if (kind === "weekly_target") return { week_start: row.week_start, target_text: row.target_text, progress: row.progress, status: row.status };
  return { period_type: row.period_type, period_key: row.period_key, analysis: row.analysis ?? "", narrative: row.narrative ?? "", next_focus: row.next_focus ?? "", status: row.status };
}

function recordLabel(kind: RecordKind, row: DataRow) {
  if (kind === "attendance") return `${row.student_name} · ${statusText(row.status)}`;
  if (kind === "hafalan_baru") return `${row.student_name} · Hafalan Baru`;
  if (kind === "murajaah") return `${row.student_name} · Murajaah`;
  if (kind === "note") return `${row.student_name} · ${row.category}`;
  if (kind === "focus") return `${row.student_name} · ${row.title}`;
  if (kind === "weekly_target") return `${row.student_name} · Target Mingguan`;
  return `${row.student_name} · ${row.period_key}`;
}

function recordMeta(kind: RecordKind, row: DataRow) {
  if (kind === "attendance") return `${formatDate(row.session_date)} · Kelas ${row.class_name}`;
  if (kind === "hafalan_baru" || kind === "murajaah") return `${formatDate(row.session_date ?? String(row.submitted_at).slice(0, 10))} · ${row.surah_name} ${row.start_ayah}–${row.end_ayah}`;
  if (kind === "note") return `${formatDate(row.note_date)} · ${row.visibility}`;
  if (kind === "focus") return `${statusText(row.status)} · Kelas ${row.class_name}`;
  if (kind === "weekly_target") return `${formatDate(row.week_start)} · ${row.progress}% · ${statusText(row.status)}`;
  return `${row.period_type} · ${statusText(row.status)}`;
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 gap-2">
      <button type="button" onClick={onEdit} aria-label="Ubah data" className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-slate-500 transition hover:bg-teal-50 hover:text-teal-700 active:scale-95"><Pencil size={15} /></button>
      <button type="button" onClick={onDelete} aria-label="Hapus data" className="grid h-9 w-9 place-items-center rounded-xl border border-red-100 bg-white text-red-500 transition hover:bg-red-50 active:scale-95"><Trash2 size={15} /></button>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative block max-w-xl"><span className="sr-only">Cari data</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} className="input pl-10" placeholder={placeholder} /></label>
  );
}

function StudentField({ students, value, onChange }: { students: DataRow[]; value: string; onChange: (value: string) => void }) {
  return (
    <div><label className="mb-1.5 block text-xs font-bold">Siswa</label><select value={value} onChange={(event) => onChange(event.target.value)} className="input" required><option value="">Pilih siswa</option>{students.map((student) => <option key={student.id} value={student.id}>{student.full_name} · Kelas {student.class_name}</option>)}</select></div>
  );
}

function SurahField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div><label className="mb-1.5 block text-xs font-bold">Surah</label><select value={value} onChange={(event) => onChange(event.target.value)} className="input">{QURAN_SURAHS.map((surah) => <option key={surah} value={surah}>{surah}</option>)}</select></div>;
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return <div><label className="mb-1.5 block text-xs font-bold">{label}</label><input value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="input" placeholder={placeholder} required={required} /></div>;
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="mb-1.5 block text-xs font-bold">{label}</label><input type="date" value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="input" required /></div>;
}

function NumberField({ label, value, onChange, min, max, step = "1" }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: string }) {
  return <div><label className="mb-1.5 block text-xs font-bold">{label}</label><input type="number" value={Number.isFinite(Number(value)) ? value : 0} onChange={(event) => onChange(Number(event.target.value))} min={min} max={max} step={step} className="input" required /></div>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <div><label className="mb-1.5 block text-xs font-bold">{label}</label><select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="input">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}

function TextAreaField({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <div><label className="mb-1.5 block text-xs font-bold">{label}</label><textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="textarea" required={required} /></div>;
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-3 rounded-xl border border-line bg-slate-50 p-3 text-xs font-bold"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /> {label}</label>;
}

function BaseModal({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm md:items-center md:p-5">
      <div className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[26px] bg-white p-5 shadow-2xl md:max-h-[92vh] md:rounded-[26px] md:p-6">
        <div className="mb-5 flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-xl font-extrabold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted">{subtitle}</p></div><button type="button" onClick={onClose} aria-label="Tutup" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95"><X size={17} /></button></div>
        {children}
      </div>
    </div>
  );
}

function DeleteModal({ state, busy, onCancel, onConfirm }: { state: NonNullable<DeleteState>; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const cascade = state.type === "student";
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-5">
      <div className="w-full max-w-md rounded-t-[26px] bg-white p-5 shadow-2xl md:rounded-[26px] md:p-6">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-600"><Trash2 size={20} /></div>
        <h3 className="mt-4 text-lg font-extrabold">Hapus Permanen?</h3>
        <p className="mt-2 text-sm leading-6 text-muted"><b className="text-ink">{state.label}</b> akan dihapus langsung dari Supabase. {cascade ? "Semua data terkait siswa tersebut ikut terhapus melalui relasi database." : "Perubahan ini langsung memengaruhi dashboard dan laporan."}</p>
        <div className="mt-5 flex gap-2"><button type="button" onClick={onCancel} disabled={busy} className="button-secondary flex-1">Batal</button><button type="button" onClick={onConfirm} disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} Hapus</button></div>
      </div>
    </div>
  );
}

function SaveButton({ busy, label }: { busy: boolean; label: string }) {
  return <button type="submit" className="button-primary w-full sm:w-auto sm:min-w-44" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={16} /> : <BookOpenCheck size={16} />} {busy ? "Menyimpan..." : label}</button>;
}

function ModalMessage({ text }: { text: string }) {
  return text ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-5 text-amber-800">{text}</div> : null;
}

function Empty({ text }: { text: string }) {
  return <div className="mt-4 rounded-2xl border border-dashed border-line bg-slate-50 p-8 text-center text-sm text-muted">{text}</div>;
}

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function statusText(value: string) {
  if (!value) return "-";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  if (!value) return "-";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  if (!year || !month || !day) return String(value);
  return `${day}/${month}/${year}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return formatDate(String(value).slice(0, 10));
}
