import { format, isValid, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { AttendanceBoard } from "@/components/attendance-board";
import { getAttendanceForDateFast } from "@/lib/data-fast";
import type { AttendanceStatus } from "@/lib/types";

export const revalidate = 15;

function resolveDate(value?: string) {
  if (!value) return new Date();
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date();
}

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const selectedDate = resolveDate(params.date);
  const day = format(selectedDate, "yyyy-MM-dd");
  const data = await getAttendanceForDateFast(day);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <p className="label">Aktivitas Harian</p>
        <h1 className="mt-1 text-2xl font-extrabold">Absensi Tahfidz</h1>
        <p className="mt-1 text-sm text-muted">
          {format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })} · pilih tanggal sesuai pertemuan yang ingin dicatat.
        </p>
      </div>
      <AttendanceBoard students={data.students} initial={data.statuses as Record<string, AttendanceStatus>} date={day} />
    </div>
  );
}
