import { format } from "date-fns";
import { SubmissionBoard } from "@/components/submission-board";
import { getSubmissionQueue } from "@/lib/data";
export const dynamic="force-dynamic";
export default async function MurajaahPage(){const day=format(new Date(),"yyyy-MM-dd");const rows=await getSubmissionQueue(day);return <div className="mx-auto max-w-6xl space-y-5"><div><p className="label">Penguatan Hafalan</p><h1 className="mt-1 text-2xl font-extrabold">Murajaah</h1><p className="mt-1 text-sm text-muted">Catat kualitas hafalan lama dan fokuskan pembinaan pada bagian yang mulai lemah.</p></div><SubmissionBoard rows={rows} date={day} mode="murajaah"/></div>}
