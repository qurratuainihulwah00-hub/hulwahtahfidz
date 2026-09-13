import { notFound } from "next/navigation";
import { Badge, Card, Progress } from "@/components/ui";
import { FocusForm, StudentNoteForm } from "@/components/student-note-form";
import { ResolveFocusButton, TargetProgressForm, TargetStatusIcon, WeeklyTargetForm } from "@/components/student-growth-actions";
import { getStudentDetail } from "@/lib/data";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { BookOpen, CalendarCheck2, MessageSquareText, Pin, Sparkles, Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getStudentDetail(id);
  if (!data || !data.student) notFound();

  const student: any = data.student;
  const submissions: any[] = data.submissions;
  const notes: any[] = data.notes;
  const focus: any[] = data.focus ?? [];
  const targets: any[] = data.targets ?? [];
  const latest = submissions[0];
  const scores = submissions.map((row) => (Number(row.fluency_score) + Number(row.tajwid_score) + Number(row.makhraj_score)) / 3);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const activeFocus = focus.filter((row) => row.status === "active");
  const activeTargets = targets.filter((row) => row.status === "active").length;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <Card className="overflow-hidden border-0 bg-gradient-to-r from-teal-950 via-teal-800 to-cyan-700 p-5 text-white sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-extrabold ring-1 ring-white/20">{student.full_name[0]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white/60">PROFIL SISWA</p>
            <h1 className="mt-1 truncate text-2xl font-extrabold">{student.full_name}</h1>
            <p className="mt-1 text-sm text-white/70">Kelas {student.class_name}{student.nis ? ` · NIS ${student.nis}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFocus.slice(0, 2).map((item) => <span key={item.id} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold ring-1 ring-white/10">📌 {item.title}</span>)}
          </div>
        </div>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={BookOpen} label="Setoran tercatat" value={submissions.length} />
        <Stat icon={Sparkles} label="Nilai rata-rata" value={avg ? avg.toFixed(1) : "-"} />
        <Stat icon={CalendarCheck2} label="Hafalan terakhir" value={latest ? `${latest.surah_name} ${latest.start_ayah}–${latest.end_ayah}` : "Belum ada"} />
        <Stat icon={Target} label="Target aktif" value={activeTargets} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2"><BookOpen size={17} className="text-teal-700" /><h2 className="font-extrabold">Timeline Setoran</h2></div>
            <div className="mt-4 space-y-3">
              {submissions.slice(0, 12).map((submission) => (
                <div key={submission.id} className="rounded-xl border border-line p-4 transition hover:border-teal-200">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-bold">{submission.surah_name} {submission.start_ayah}–{submission.end_ayah}</div>
                      <div className="mt-1 text-xs text-muted">{format(new Date(submission.submitted_at), "d MMMM yyyy", { locale: idLocale })} · {submission.type === "murajaah" ? "Murajaah" : "Hafalan Baru"}</div>
                    </div>
                    <Badge tone={submission.type === "murajaah" ? "blue" : "teal"}>{((Number(submission.fluency_score) + Number(submission.tajwid_score) + Number(submission.makhraj_score)) / 3).toFixed(1)}</Badge>
                  </div>
                  {submission.note && <p className="mt-3 text-xs leading-5 text-muted">{submission.note}</p>}
                </div>
              ))}
              {!submissions.length && <p className="py-8 text-center text-sm text-muted">Belum ada setoran.</p>}
            </div>
          </Card>

          <StudentNoteForm studentId={student.id} />
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2"><Target size={17} className="text-teal-700" /><h2 className="font-extrabold">Fokus Pembinaan</h2></div>
            <div className="mt-4 space-y-2">
              {activeFocus.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                  <span className="min-w-0 flex-1">📌 {item.title}</span>
                  <ResolveFocusButton studentId={student.id} focusId={item.id} />
                </div>
              ))}
              {!activeFocus.length && <p className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">Belum ada fokus aktif.</p>}
            </div>
            <div className="mt-4"><FocusForm studentId={student.id} /></div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2"><Target size={17} className="text-teal-700" /><h2 className="font-extrabold">Target Mingguan</h2></div>
            <p className="mt-1 text-xs leading-5 text-muted">Target kecil yang bisa dipantau dan dibawa ke laporan perkembangan.</p>
            <div className="mt-4 space-y-3">
              {targets.slice(0, 6).map((target) => (
                <div key={target.id} className="rounded-2xl border border-line p-4">
                  <div className="flex items-start gap-2">
                    <TargetStatusIcon status={target.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold">{target.target_text}</div>
                      <div className="mt-1 text-[10px] font-semibold text-muted">Minggu {format(new Date(`${target.week_start}T00:00:00`), "d MMM yyyy", { locale: idLocale })} · {target.status === "done" ? "Selesai" : target.status === "carried" ? "Dilanjutkan" : "Aktif"}</div>
                    </div>
                    <span className="text-xs font-extrabold text-teal-800">{target.progress}%</span>
                  </div>
                  <Progress value={Number(target.progress ?? 0)} className="mt-3" />
                  <TargetProgressForm studentId={student.id} target={{ id: target.id, progress: Number(target.progress ?? 0), status: target.status }} />
                </div>
              ))}
              {!targets.length && <p className="rounded-xl bg-slate-50 p-3 text-xs text-muted">Belum ada target mingguan.</p>}
            </div>
            <WeeklyTargetForm studentId={student.id} />
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2"><MessageSquareText size={17} className="text-teal-700" /><h2 className="font-extrabold">Catatan Saya</h2></div>
            <div className="mt-4 space-y-3">
              {notes.slice(0, 12).map((note) => (
                <div key={note.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between gap-2"><div className="text-[11px] font-bold text-teal-700">{note.category}</div>{note.pinned && <Pin size={13} className="text-amber-500" />}</div>
                  <p className="mt-1 text-xs leading-5">{note.note}</p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted"><span>{format(new Date(`${note.note_date}T00:00:00`), "d MMM yyyy", { locale: idLocale })}</span><span>•</span><span>{note.visibility === "report" ? "Bahan laporan" : "Internal guru"}</span></div>
                </div>
              ))}
              {!notes.length && <p className="text-xs text-muted">Belum ada catatan tentang siswa ini.</p>}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={18} /></div>
        <div className="min-w-0"><div className="text-[11px] font-semibold text-muted">{label}</div><div className="mt-1 truncate text-base font-extrabold">{value}</div></div>
      </div>
    </Card>
  );
}
