import { format } from "date-fns";
import { SubmissionBoard } from "@/components/submission-board";
import { getSubmissionQueue } from "@/lib/data";
export const dynamic="force-dynamic";
export default async function SubmissionsPage(){const day=format(new Date(),"yyyy-MM-dd");const rows=await getSubmissionQueue(day);const present=rows.filter(r=>r.present);return <div className="mx-auto max-w-6xl space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="label">Aktivitas Harian</p><h1 className="mt-1 text-2xl font-extrabold">Setoran Hafalan</h1><p className="mt-1 text-sm text-muted">{present.length} siswa hadir · {present.filter(r=>r.submitted).length} sudah setor · {present.filter(r=>!r.submitted).length} menunggu.</p></div></div><SubmissionBoard rows={rows} date={day}/></div>}
