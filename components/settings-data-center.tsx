"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CalendarRange,
  Database,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const recordKinds = [
  { key: "attendance", label: "Absensi" },
  { key: "submission", label: "Setoran & Murajaah" },
  { key: "note", label: "Catatan" },
  { key: "focus", label: "Fokus" },
  { key: "weekly_target", label: "Target Mingguan" },
  { key: "report", label: "Laporan" },
] as const;

type DataCenterTab = "students" | "targets" | "periods" | "records" | "profile";
type ModalState =
  | { type: "student"; row?: any }
  | { type: "target"; row?: any }
  | { type: "period"; row?: any }
  | { type: "record"; entity: string; row: any }
  | null;

type DeleteState = {
  entity: "student" | "target" | "period" | string;
  row: any;
  label: string;
} | null;

export function SettingsDataCenter({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<DataCenterTab>("students");
  const [recordKind, setRecordKind] = useState<(typeof recordKinds)[number]["key"]>("attendance");
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
    } else {
      setData(result);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // token uniquely identifies the currently unlocked settings session.
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
  };

  const tabs: Array<{ key: DataCenterTab; label: string; count?: number; icon: any }> = [
    { key: "students", label: "Siswa", count: counts.students, icon: Users },
    { key: "targets", label: "Target Kelas", count: counts.targets, icon: Target },
    { key: "periods", label: "Semester", count: counts.periods, icon: CalendarRange },
    { key: "records", label: "Semua Aktivitas", count: counts.records, icon: Database },
    { key: "profile", label: "Profil", icon: UserRound },
  ];

  async function deleteRecord() {
    if (!deleting) return;
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    let error: any = null;

    if (deleting.entity === "student") {
      ({ error } = await supabase.rpc("hulwah_manage_student", {
        p_token: token,
        p_action: "delete",
        p_id: deleting.row.id,
      }));
    } else if (deleting.entity === "target") {
      ({ error } = await supabase.rpc("hulwah_manage_class_target", {
        p_token: token,
        p_action: "delete",
        p_id: deleting.row.id,
      }));
    } else if (deleting.entity === "period") {
      ({ error } = await supabase.rpc("hulwah_manage_period", {
        p_token: token,
        p_action: "delete",
        p_id: deleting.row.id,
        p_start_date: deleting.row.start_date,
        p_end_date: deleting.row.end_date,
      }));
    } else {
      ({ error } = await supabase.rpc("hulwah_settings_delete_record", {
        p_token: token,
        p_entity: deleting.entity,
        p_id: deleting.entity === "attendance" ? deleting.row.session_id : deleting.row.id,
        p_student_id: deleting.entity === "attendance" ? deleting.row.student_id : null,
      }));
    }

    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setDeleting(null);
    await load();
  }

  const currentRecords = useMemo(() => {
    if (!data) return [];
    const source: Record<string, any[]> = {
      attendance: data.attendance ?? [],
      submission: data.submissions ?? [],
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

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-[24px] border border-teal-100 bg-white shadow-soft">
        <div className="border-b border-teal-100 bg-gradient-to-r from-teal-950 via-teal-800 to-cyan-700 p-5 text-white sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-cyan-100/80">
                <Database size={15} /> Data Center
              </div>
              <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">Kelola Semua Data Dashboard</h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-white/70 sm:text-sm">
                Tambah dan ubah data master, koreksi aktivitas, atau hapus data secara permanen langsung dari Supabase. Semua aksi di area ini memerlukan sesi PIN Pengaturan yang masih aktif.
              </p>
            </div>
            <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/15">
              <RefreshCw className={loading ? "animate-spin" : ""} size={16} /> Sinkronkan
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-line p-3 sm:p-4">
          {tabs.map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setTab(key); setQuery(""); }}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition",
                tab === key ? "bg-teal-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-800",
              )}
            >
              <Icon size={15} /> {label}
              {typeof count === "number" && <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", tab === key ? "bg-white/15" : "bg-white")}>{count}</span>}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {message && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">{message}</div>}
          {loading ? (
            <div className="grid min-h-52 place-items-center text-center">
              <div><Loader2 className="mx-auto animate-spin text-teal-700" size={24} /><p className="mt-3 text-xs font-semibold text-muted">Memuat Data Center...</p></div>
            </div>
          ) : !data ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-muted">Data belum dapat dimuat.</div>
          ) : (
            <>
              {tab === "students" && <StudentsPanel rows={data.students ?? []} onAdd={() => setModal({ type: "student" })} onEdit={(row) => setModal({ type: "student", row })} onDelete={(row) => setDeleting({ entity: "student", row, label: row.full_name })} />}
              {tab === "targets" && <TargetsPanel rows={data.classTargets ?? []} onAdd={() => setModal({ type: "target" })} onEdit={(row) => setModal({ type: "target", row })} onDelete={(row) => setDeleting({ entity: "target", row, label: `${row.class_name} · segmen ${row.segment_no}` })} />}
              {tab === "periods" && <PeriodsPanel rows={data.periods ?? []} onAdd={() => setModal({ type: "period" })} onEdit={(row) => setModal({ type: "period", row })} onDelete={(row) => setDeleting({ entity: "period", row, label: row.label })} />}
              {tab === "records" && (
                <RecordsPanel
                  kind={recordKind}
                  onKind={setRecordKind}
                  query={query}
                  onQuery={setQuery}
                  rows={currentRecords}
                  onEdit={(row) => setModal({ type: "record", entity: recordKind, row })}
                  onDelete={(row) => setDeleting({ entity: recordKind, row, label: recordLabel(recordKind, row) })}
                />
              )}
              {tab === "profile" && <ProfilePanel row={data.profile} token={token} onSaved={load} />}
            </>
          )}
        </div>
      </div>

      {modal?.type === "student" && <StudentModal token={token} row={modal.row} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await load(); }} />}
      {modal?.type === "target" && <TargetModal token={token} row={modal.row} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await load(); }} />}
      {modal?.type === "period" && <PeriodModal token={token} row={modal.row} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await load(); }} />}
      {modal?.type === "record" && <RecordModal token={token} entity={modal.entity} row={modal.row} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await load(); }} />}
      {deleting && <DeleteModal state={deleting} busy={busy} onCancel={() => setDeleting(null)} onConfirm={() => void deleteRecord()} />}
    </section>
  );
}

function PanelTitle({ title, description, onAdd, addLabel }: { title: string; description: string; onAdd?: () => void; addLabel?: string }) {
  return <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-extrabold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted">{description}</p></div>{onAdd && <button type="button" onClick={onAdd} className="button-primary"><Plus size={16} /> {addLabel ?? "Tambah"}</button>}</div>;
}

function StudentsPanel({ rows, onAdd, onEdit, onDelete }: any) {
  const [query, setQuery] = useState("");
  const visible = rows.filter((row: any) => `${row.full_name} ${row.class_name} ${row.nis ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return <div><PanelTitle title="Siswa Binaan" description="Tambah siswa baru, ubah nama/kelas/NIS/status, atau hapus permanen beserta data terkait." onAdd={onAdd} addLabel="Tambah Siswa" /><SearchBox value={query} onChange={setQuery} placeholder="Cari nama atau kelas..." /><div className="mt-4 grid gap-3 md:grid-cols-2">{visible.map((row: any) => <article key={row.id} className="rounded-2xl border border-line bg-white p-4"><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-sm font-extrabold text-teal-800">{row.full_name?.[0] ?? "S"}</div><div className="min-w-0 flex-1"><div className="truncate font-extrabold">{row.full_name}</div><div className="mt-1 text-xs text-muted">Kelas {row.class_name}{row.nis ? ` · NIS ${row.nis}` : ""}</div><div className={cn("mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold", row.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{row.is_active ? "Aktif" : "Nonaktif"}</div></div><RowActions onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} /></div></article>)}</div>{!visible.length && <Empty text="Tidak ada siswa yang cocok." />}</div>;
}

function TargetsPanel({ rows, onAdd, onEdit, onDelete }: any) {
  return <div><PanelTitle title="Target Hafalan per Kelas" description="Kelola rentang target setiap segmen kelas. Perubahan langsung dipakai sebagai acuan dashboard." onAdd={onAdd} addLabel="Tambah Target" /><div className="grid gap-3 md:grid-cols-2">{rows.map((row: any) => <article key={row.id} className="rounded-2xl border border-line p-4"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Target size={18} /></div><div className="min-w-0 flex-1"><div className="font-extrabold">Kelas {row.class_name}</div><div className="mt-1 text-xs font-semibold text-teal-700">Segmen {row.segment_no}</div><p className="mt-2 text-xs text-muted">{row.start_label} → {row.end_label}</p></div><RowActions onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} /></div></article>)}</div>{!rows.length && <Empty text="Belum ada target kelas." />}</div>;
}

function PeriodsPanel({ rows, onAdd, onEdit, onDelete }: any) {
  return <div><PanelTitle title="Periode Semester" description="Atur sendiri tanggal awal dan akhir semester. Laporan semester nantinya mengikuti periode ini, bukan asumsi bulan tetap." onAdd={onAdd} addLabel="Tambah Semester" /><div className="grid gap-3 md:grid-cols-2">{rows.map((row: any) => <article key={row.id} className={cn("rounded-2xl border p-4", row.is_active ? "border-teal-200 bg-teal-50/40" : "border-line")}><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-teal-700 shadow-sm"><CalendarRange size={18} /></div><div className="min-w-0 flex-1"><div className="font-extrabold">{row.label}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted">{row.code}</div><p className="mt-2 text-xs text-slate-600">{formatDate(row.start_date)} — {formatDate(row.end_date)}</p>{row.is_active && <span className="mt-2 inline-flex rounded-full bg-teal-700 px-2.5 py-1 text-[10px] font-bold text-white">Semester Aktif</span>}</div><RowActions onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} /></div></article>)}</div>{!rows.length && <Empty text="Belum ada periode semester." />}</div>;
}

function RecordsPanel({ kind, onKind, query, onQuery, rows, onEdit, onDelete }: any) {
  return <div><PanelTitle title="Semua Data Aktivitas" description="Cari, koreksi, atau hapus data operasional yang sudah tersimpan. Penambahan aktivitas harian tetap lebih cepat dilakukan dari menu Absensi, Setoran, Murajaah, dan Detail Siswa." /><div className="flex gap-2 overflow-x-auto pb-2">{recordKinds.map((item) => <button key={item.key} type="button" onClick={() => onKind(item.key)} className={cn("shrink-0 rounded-xl px-3 py-2 text-xs font-bold", kind === item.key ? "bg-teal-700 text-white" : "bg-slate-50 text-slate-600")}>{item.label}</button>)}</div><div className="mt-3"><SearchBox value={query} onChange={onQuery} placeholder="Cari nama, kelas, tanggal, surah, catatan..." /></div><div className="mt-4 space-y-2">{rows.slice(0, 150).map((row: any, index: number) => <article key={`${kind}-${row.id ?? row.session_id}-${row.student_id ?? index}`} className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="truncate text-sm font-extrabold">{recordLabel(kind, row)}</div><div className="mt-1 text-xs text-muted">{recordMeta(kind, row)}</div></div><RowActions onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} /></article>)}</div>{!rows.length && <Empty text="Belum ada data pada kategori ini." />}{rows.length > 150 && <p className="mt-3 text-center text-xs text-muted">Menampilkan 150 data terbaru dari hasil pencarian.</p>}</div>;
}

function ProfilePanel({ row, token, onSaved }: { row: any; token: string; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(row?.display_name ?? "");
  const [avatar, setAvatar] = useState(row?.avatar_url ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.rpc("hulwah_settings_update_record", { p_token: token, p_entity: "profile", p_id: row.id, p_student_id: null, p_payload: { display_name: name, avatar_url: avatar } });
    setBusy(false); if (error) setMessage(error.message); else { setMessage("Profil tersimpan."); await onSaved(); }
  }
  return <div><PanelTitle title="Profil Ustadzah" description="Identitas yang tampil di header dan dashboard." /><form onSubmit={save} className="max-w-2xl space-y-4 rounded-2xl border border-line p-4 sm:p-5"><Field label="Nama" value={name} onChange={setName} required /><Field label="Avatar URL / path" value={avatar} onChange={setAvatar} placeholder="/hulwah-avatar-pro.webp" />{message && <p className="text-xs font-semibold text-teal-700">{message}</p>}<button disabled={busy} className="button-primary">{busy ? <Loader2 className="animate-spin" size={16} /> : <BookOpenCheck size={16} />} Simpan Profil</button></form></div>;
}

function StudentModal({ token, row, onClose, onSaved }: any) {
  const [name, setName] = useState(row?.full_name ?? "");
  const [className, setClassName] = useState(row?.class_name ?? "");
  const [nis, setNis] = useState(row?.nis ?? "");
  const [active, setActive] = useState(row?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); const supabase=createClient(); const { error }=await supabase.rpc("hulwah_manage_student",{p_token:token,p_action:row?"update":"create",p_id:row?.id??null,p_full_name:name,p_class_name:className,p_nis:nis||null,p_is_active:active}); setBusy(false); if(error)setMessage(error.message);else await onSaved(); }
  return <BaseModal title={row?"Ubah Siswa":"Tambah Siswa"} subtitle="Data siswa langsung tersimpan ke Supabase." onClose={onClose}><form onSubmit={save} className="space-y-4"><Field label="Nama siswa" value={name} onChange={setName} required /><Field label="Kelas" value={className} onChange={setClassName} placeholder="Contoh: 1 Ar Rahman" required /><Field label="NIS (opsional)" value={nis} onChange={setNis} /><label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-xs font-bold"><input type="checkbox" checked={active} onChange={(event)=>setActive(event.target.checked)} /> Siswa aktif</label><ModalMessage text={message} /><SaveButton busy={busy} /></form></BaseModal>;
}

function TargetModal({ token, row, onClose, onSaved }: any) {
  const [className, setClassName] = useState(row?.class_name ?? "");
  const [segment, setSegment] = useState(row?.segment_no ?? 1);
  const [start, setStart] = useState(row?.start_label ?? "");
  const [end, setEnd] = useState(row?.end_label ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: FormEvent){event.preventDefault();setBusy(true);setMessage("");const supabase=createClient();const {error}=await supabase.rpc("hulwah_manage_class_target",{p_token:token,p_action:row?"update":"create",p_id:row?.id??null,p_class_name:className,p_segment_no:Number(segment),p_start_label:start,p_end_label:end});setBusy(false);if(error)setMessage(error.message);else await onSaved();}
  return <BaseModal title={row?"Ubah Target Kelas":"Tambah Target Kelas"} subtitle="Atur segmen dan rentang hafalan." onClose={onClose}><form onSubmit={save} className="space-y-4"><Field label="Nama kelas" value={className} onChange={setClassName} required /><div><label className="mb-1.5 block text-xs font-bold">Segmen</label><input type="number" min="1" value={segment} onChange={(e)=>setSegment(Number(e.target.value))} className="input" required /></div><Field label="Mulai" value={start} onChange={setStart} placeholder="An-Naba" required /><Field label="Sampai" value={end} onChange={setEnd} placeholder="Al-Fajr" required /><ModalMessage text={message}/><SaveButton busy={busy}/></form></BaseModal>;
}

function PeriodModal({ token, row, onClose, onSaved }: any) {
  const [code, setCode] = useState(row?.code ?? ""); const [label,setLabel]=useState(row?.label??""); const [start,setStart]=useState(row?.start_date??""); const [end,setEnd]=useState(row?.end_date??""); const [active,setActive]=useState(row?.is_active??false); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  async function save(event:FormEvent){event.preventDefault();setBusy(true);setMessage("");const supabase=createClient();const {error}=await supabase.rpc("hulwah_manage_period",{p_token:token,p_action:row?"update":"create",p_id:row?.id??null,p_code:code,p_label:label,p_start_date:start,p_end_date:end,p_is_active:active});setBusy(false);if(error)setMessage(error.message);else await onSaved();}
  return <BaseModal title={row?"Ubah Semester":"Tambah Semester"} subtitle="Tanggal inilah yang menjadi dasar laporan semester." onClose={onClose}><form onSubmit={save} className="space-y-4"><Field label="Kode" value={code} onChange={setCode} placeholder="2026-ganjil" required/><Field label="Nama periode" value={label} onChange={setLabel} placeholder="2026/2027 · Semester Ganjil" required/><div className="grid gap-3 sm:grid-cols-2"><DateField label="Tanggal mulai" value={start} onChange={setStart}/><DateField label="Tanggal selesai" value={end} onChange={setEnd}/></div><label className="flex items-center gap-3 rounded-xl bg-teal-50 p-3 text-xs font-bold text-teal-900"><input type="checkbox" checked={active} onChange={(e)=>setActive(e.target.checked)}/> Jadikan semester aktif</label><ModalMessage text={message}/><SaveButton busy={busy}/></form></BaseModal>;
}

function RecordModal({ token, entity, row, onClose, onSaved }: any) {
  const [payload, setPayload] = useState<Record<string, any>>(() => recordPayload(entity,row)); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  const set=(key:string,value:any)=>setPayload((previous)=>({...previous,[key]:value}));
  async function save(event:FormEvent){event.preventDefault();setBusy(true);setMessage("");const supabase=createClient();const {error}=await supabase.rpc("hulwah_settings_update_record",{p_token:token,p_entity:entity,p_id:entity==="attendance"?row.session_id:row.id,p_student_id:entity==="attendance"?row.student_id:null,p_payload:payload});setBusy(false);if(error)setMessage(error.message);else await onSaved();}
  return <BaseModal title={`Ubah ${recordKinds.find((item)=>item.key===entity)?.label??"Data"}`} subtitle={recordLabel(entity,row)} onClose={onClose}><form onSubmit={save} className="space-y-4">{entity==="attendance"&&<><SelectField label="Status" value={payload.status} onChange={(v)=>set("status",v)} options={["hadir","izin","sakit","alfa"]}/><TextAreaField label="Catatan" value={payload.note??""} onChange={(v)=>set("note",v)}/></>}{entity==="submission"&&<><SelectField label="Jenis" value={payload.type} onChange={(v)=>set("type",v)} options={["hafalan_baru","murajaah"]}/><Field label="Surah" value={payload.surah_name} onChange={(v)=>set("surah_name",v)} required/><div className="grid gap-3 sm:grid-cols-2"><NumberField label="Ayat awal" value={payload.start_ayah} onChange={(v)=>set("start_ayah",v)}/><NumberField label="Ayat akhir" value={payload.end_ayah} onChange={(v)=>set("end_ayah",v)}/></div><div className="grid gap-3 sm:grid-cols-3"><NumberField label="Kelancaran" value={payload.fluency_score} onChange={(v)=>set("fluency_score",v)} step="0.5"/><NumberField label="Tajwid" value={payload.tajwid_score} onChange={(v)=>set("tajwid_score",v)} step="0.5"/><NumberField label="Makhraj" value={payload.makhraj_score} onChange={(v)=>set("makhraj_score",v)} step="0.5"/></div><NumberField label="Kesalahan" value={payload.mistake_count} onChange={(v)=>set("mistake_count",v)}/><TextAreaField label="Catatan" value={payload.note??""} onChange={(v)=>set("note",v)}/></>}{entity==="note"&&<><DateField label="Tanggal" value={payload.note_date} onChange={(v)=>set("note_date",v)}/><Field label="Kategori" value={payload.category} onChange={(v)=>set("category",v)} required/><TextAreaField label="Catatan" value={payload.note} onChange={(v)=>set("note",v)}/><SelectField label="Penggunaan" value={payload.visibility} onChange={(v)=>set("visibility",v)} options={["internal","report"]}/></>}{entity==="focus"&&<><Field label="Fokus" value={payload.title} onChange={(v)=>set("title",v)} required/><SelectField label="Status" value={payload.status} onChange={(v)=>set("status",v)} options={["active","resolved"]}/></>}{entity==="weekly_target"&&<><DateField label="Awal minggu" value={payload.week_start} onChange={(v)=>set("week_start",v)}/><TextAreaField label="Target" value={payload.target_text} onChange={(v)=>set("target_text",v)}/><NumberField label="Progress (%)" value={payload.progress} onChange={(v)=>set("progress",v)}/><SelectField label="Status" value={payload.status} onChange={(v)=>set("status",v)} options={["active","done","carried"]}/></>}{entity==="report"&&<><TextAreaField label="Analisis" value={payload.analysis??""} onChange={(v)=>set("analysis",v)}/><TextAreaField label="Narasi" value={payload.narrative??""} onChange={(v)=>set("narrative",v)}/><TextAreaField label="Fokus berikutnya" value={payload.next_focus??""} onChange={(v)=>set("next_focus",v)}/><SelectField label="Status" value={payload.status} onChange={(v)=>set("status",v)} options={["draft","final"]}/></>}<ModalMessage text={message}/><SaveButton busy={busy}/></form></BaseModal>;
}

function recordPayload(entity:string,row:any){if(entity==="attendance")return{status:row.status,note:row.note??""};if(entity==="submission")return{type:row.type,surah_name:row.surah_name,start_ayah:row.start_ayah,end_ayah:row.end_ayah,fluency_score:Number(row.fluency_score),tajwid_score:Number(row.tajwid_score),makhraj_score:Number(row.makhraj_score),mistake_count:row.mistake_count,note:row.note??""};if(entity==="note")return{note_date:row.note_date,category:row.category,note:row.note,visibility:row.visibility,pinned:row.pinned,resolved:row.resolved};if(entity==="focus")return{title:row.title,status:row.status};if(entity==="weekly_target")return{week_start:row.week_start,target_text:row.target_text,progress:row.progress,status:row.status};return{analysis:row.analysis??"",narrative:row.narrative??"",next_focus:row.next_focus??"",status:row.status};}

function recordLabel(kind:string,row:any){if(kind==="attendance")return `${row.student_name} · ${statusLabel(row.status)}`;if(kind==="submission")return `${row.student_name} · ${row.type==="murajaah"?"Murajaah":"Hafalan Baru"}`;if(kind==="note")return `${row.student_name} · ${row.category}`;if(kind==="focus")return `${row.student_name} · ${row.title}`;if(kind==="weekly_target")return `${row.student_name} · Target Mingguan`;return `${row.student_name} · ${row.period_key}`;}
function recordMeta(kind:string,row:any){if(kind==="attendance")return `${formatDate(row.session_date)} · Kelas ${row.class_name}`;if(kind==="submission")return `${formatDate(String(row.submitted_at).slice(0,10))} · ${row.surah_name} ${row.start_ayah}–${row.end_ayah}`;if(kind==="note")return `${formatDate(row.note_date)} · ${row.visibility}`;if(kind==="focus")return `${row.status} · Kelas ${row.class_name}`;if(kind==="weekly_target")return `${formatDate(row.week_start)} · ${row.progress}% · ${row.status}`;return `${row.period_type} · ${row.status}`;}
function statusLabel(value:string){return value?.charAt(0).toUpperCase()+value?.slice(1);}
function formatDate(value:string){if(!value)return"-";const [y,m,d]=String(value).slice(0,10).split("-");return `${d}/${m}/${y}`;}

function RowActions({onEdit,onDelete}:{onEdit:()=>void;onDelete:()=>void}){return <div className="flex shrink-0 gap-1"><button type="button" onClick={onEdit} aria-label="Ubah" className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"><Pencil size={15}/></button><button type="button" onClick={onDelete} aria-label="Hapus" className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100"><Trash2 size={15}/></button></div>}
function SearchBox({value,onChange,placeholder}:{value:string;onChange:(value:string)=>void;placeholder:string}){return <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input value={value} onChange={(e)=>onChange(e.target.value)} className="input pl-10" placeholder={placeholder}/></div>}
function Empty({text}:{text:string}){return <div className="mt-4 rounded-2xl bg-slate-50 p-8 text-center text-xs text-muted">{text}</div>}

function BaseModal({title,subtitle,onClose,children}:{title:string;subtitle:string;onClose:()=>void;children:React.ReactNode}){return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm md:items-center md:p-5"><div className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-[26px] bg-white p-5 shadow-2xl md:rounded-[26px] md:p-6"><div className="mb-5 flex items-start justify-between gap-3"><div><h3 className="text-xl font-extrabold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted">{subtitle}</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><X size={17}/></button></div>{children}</div></div>}
function DeleteModal({state,busy,onCancel,onConfirm}:{state:DeleteState;busy:boolean;onCancel:()=>void;onConfirm:()=>void}){if(!state)return null;const student=state.entity==="student";return <BaseModal title="Hapus Permanen?" subtitle={student?"Menghapus siswa juga akan menghapus absensi, setoran, murajaah, catatan, fokus, target, progress, dan laporan siswa tersebut dari Supabase.":"Data yang dihapus tidak akan tampil lagi di dashboard."} onClose={onCancel}><div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="text-xs font-bold text-red-700">DATA YANG AKAN DIHAPUS</div><div className="mt-1 font-extrabold text-red-950">{state.label}</div></div><div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="button-secondary">Batal</button><button type="button" onClick={onConfirm} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">{busy?<Loader2 className="animate-spin" size={16}/>:<Trash2 size={16}/>} Hapus Permanen</button></div></BaseModal>}

function Field({label,value,onChange,placeholder,required}:{label:string;value:string;onChange:(value:string)=>void;placeholder?:string;required?:boolean}){return <div><label className="mb-1.5 block text-xs font-bold">{label}</label><input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} required={required} className="input"/></div>}
function DateField({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){return <div><label className="mb-1.5 block text-xs font-bold">{label}</label><input type="date" value={value} onChange={(e)=>onChange(e.target.value)} required className="input"/></div>}
function NumberField({label,value,onChange,step}:{label:string;value:any;onChange:(value:number)=>void;step?:string}){return <div><label className="mb-1.5 block text-xs font-bold">{label}</label><input type="number" value={value} step={step} onChange={(e)=>onChange(Number(e.target.value))} className="input"/></div>}
function TextAreaField({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){return <div><label className="mb-1.5 block text-xs font-bold">{label}</label><textarea value={value} onChange={(e)=>onChange(e.target.value)} className="textarea"/></div>}
function SelectField({label,value,onChange,options}:{label:string;value:string;onChange:(value:string)=>void;options:string[]}){return <div><label className="mb-1.5 block text-xs font-bold">{label}</label><select value={value} onChange={(e)=>onChange(e.target.value)} className="input">{options.map((option)=><option key={option} value={option}>{statusLabel(option.replaceAll("_"," "))}</option>)}</select></div>}
function SaveButton({busy}:{busy:boolean}){return <button disabled={busy} className="button-primary w-full sm:w-auto">{busy?<Loader2 className="animate-spin" size={16}/>:<BookOpenCheck size={16}/>} {busy?"Menyimpan...":"Simpan Perubahan"}</button>}
function ModalMessage({text}:{text:string}){return text?<div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{text}</div>:null}
