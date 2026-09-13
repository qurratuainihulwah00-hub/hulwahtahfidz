"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Plus, RotateCcw, Target } from "lucide-react";
import { createWeeklyTargetAction, resolveFocusAction, updateWeeklyTargetAction } from "@/app/actions";

export function ResolveFocusButton({ studentId, focusId }: { studentId: string; focusId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => {
        const result = await resolveFocusAction({ studentId, focusId });
        if (result.ok) router.refresh();
      })}
      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 text-[10px] font-extrabold text-amber-800 shadow-sm transition hover:bg-white disabled:opacity-60"
    >
      {pending ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />} Selesai
    </button>
  );
}

export function WeeklyTargetForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const today = new Date();
  const monday = new Date(today);
  const day = today.getDay();
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(async () => {
        setMessage("");
        const result = await createWeeklyTargetAction({
          studentId,
          weekStart: String(formData.get("weekStart")),
          targetText: String(formData.get("targetText")),
          progress: Number(formData.get("progress") ?? 0),
          status: "active",
        });
        if (result.ok) {
          setMessage("Target ditambahkan.");
          formRef.current?.reset();
          router.refresh();
        } else {
          setMessage(result.message ?? "Gagal menambahkan target.");
        }
      })}
      className="mt-4 rounded-2xl border border-line bg-slate-50/70 p-3"
    >
      <div className="grid gap-2 sm:grid-cols-[135px_1fr_auto]">
        <input name="weekStart" type="date" defaultValue={weekStart} className="input" aria-label="Awal minggu" />
        <input name="targetText" required className="input" placeholder="Contoh: Lancarkan An-Naba ayat 1–20" />
        <button disabled={pending} className="button-primary min-h-11 px-3">
          {pending ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />} Tambah
        </button>
      </div>
      <input type="hidden" name="progress" value="0" />
      {message && <p className="mt-2 text-[11px] font-semibold text-teal-700">{message}</p>}
    </form>
  );
}

export function TargetProgressForm({
  studentId,
  target,
}: {
  studentId: string;
  target: { id: string; progress: number; status: "active" | "done" | "carried" };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState(Number(target.progress ?? 0));
  const [status, setStatus] = useState<"active" | "done" | "carried">(target.status ?? "active");

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px_auto] sm:items-center">
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-muted"><span>Progress</span><span>{progress}%</span></div>
        <input aria-label="Progress target" type="range" min="0" max="100" step="10" value={progress} onChange={(event) => setProgress(Number(event.target.value))} className="w-full accent-teal-700" />
      </div>
      <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="input py-2 text-xs">
        <option value="active">Aktif</option>
        <option value="done">Selesai</option>
        <option value="carried">Lanjut minggu depan</option>
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => {
          const result = await updateWeeklyTargetAction({ studentId, targetId: target.id, progress, status });
          if (result.ok) router.refresh();
        })}
        className="button-secondary min-h-10 px-3 text-xs"
      >
        {pending ? <Loader2 className="animate-spin" size={14} /> : status === "done" ? <CheckCircle2 size={14} /> : <RotateCcw size={14} />} Simpan
      </button>
    </div>
  );
}

export function TargetStatusIcon({ status }: { status: string }) {
  if (status === "done") return <CheckCircle2 size={15} className="text-emerald-600" />;
  return <Target size={15} className="text-teal-700" />;
}
