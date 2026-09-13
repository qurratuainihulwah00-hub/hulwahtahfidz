import { format } from "date-fns";
import { id } from "date-fns/locale";
import { AttendanceBoard } from "@/components/attendance-board";
import { getAttendanceForDateFast } from "@/lib/data-fast";
import type { AttendanceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const day = format(new Date(), "yyyy-MM-dd");
  const data = await getAttendanceForDateFast(day);
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <p className="label">Aktivitas Harian</p>
        <h1 className="mt-1 text-2xl font-extrabold">Absensi Tahfidz</h1>
        <p className="mt-1 text-sm text-muted">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })} · absensi pertemuan Tahfidz siswa binaan Anda.
        </p>
      </div>
      <AttendanceBoard students={data.students} initial={data.statuses as Record<string, AttendanceStatus>} date={day} />
    </div>
  );
}
