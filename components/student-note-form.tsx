"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createStudentNoteAction, createFocusAction } from "@/app/actions";
import { format } from "date-fns";

export function StudentNoteForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  const submit = (formData: FormData) => startTransition(async () => {
    setMsg("");
    const result = await createStudentNoteAction({
      studentId,
      noteDate: String(formData.get("date")),
      category: String(formData.get("category")),
      note: String(formData.get("note")),
      visibility: String(formData.get("visibility")) as "internal" | "report",
      pinned: formData.get("pinned") === "on",
    });
    if (result.ok) {
      setMsg("Catatan tersimpan.");
      formRef.current?.reset();
      router.refresh();
    } else {
      setMsg(result.message ?? "Gagal menyimpan");
    }
  });

  return (
    <form ref={formRef} action={submit} className="card p-5">
      <div className="flex items-center gap-2"><Plus size={17} className="text-teal-700" /><h3 className="font-extrabold">Tambah Catatan</h3></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><label className="mb-1.5 block text-xs font-bold">Tanggal</label><input name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} className="input" /></div>
        <div><label className="mb-1.5 block text-xs font-bold">Kategori</label><select name="category" className="input"><option>Hafalan</option><option>Murajaah</option><option>Tajwid</option><option>Makhraj</option><option>Kelancaran</option><option>Kedisiplinan</option><option>Motivasi</option><option>Perkembangan Umum</option></select></div>
        <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-bold">Catatan</label><textarea required name="note" className="textarea" placeholder="Tuliskan perkembangan, kendala, atau hal penting yang ingin diingat..." /></div>
        <div><label className="mb-1.5 block text-xs font-bold">Penggunaan catatan</label><select name="visibility" className="input"><option value="internal">Internal Guru 🔒</option><option value="report">Boleh Masuk Laporan 📄</option></select></div>
        <label className="flex min-h-11 items-center gap-2 self-end rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><input name="pinned" type="checkbox" /> Pin sebagai catatan penting</label>
      </div>
      {msg && <p className="mt-3 rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700">{msg}</p>}
      <button disabled={pending} className="button-primary mt-4 w-full sm:w-auto">{pending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} {pending ? "Menyimpan..." : "Simpan Catatan"}</button>
    </form>
  );
}

export function FocusForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(async () => {
        setMsg("");
        const result = await createFocusAction({ studentId, title: String(formData.get("title")) });
        if (result.ok) {
          setMsg("Fokus pembinaan ditambahkan.");
          formRef.current?.reset();
          router.refresh();
        } else {
          setMsg(result.message ?? "Gagal");
        }
      })}
      className="space-y-2"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input name="title" required className="input" placeholder="Contoh: Makhraj huruf ض" />
        <button disabled={pending} className="button-primary min-h-11 shrink-0 sm:w-auto">{pending ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />} Tambah</button>
      </div>
      {msg && <p className="text-[11px] font-semibold text-teal-700">{msg}</p>}
    </form>
  );
}
