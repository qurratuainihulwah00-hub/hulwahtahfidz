import { ReportTable } from "@/components/report-table";
import { getAcademicPeriods, getSemesterReportRows } from "@/lib/semester-report";

export const dynamic = "force-dynamic";

export default async function SemesterReportPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const params = await searchParams;
  const periods = await getAcademicPeriods();
  const active = periods.find((item) => item.isActive) ?? periods[0];
  const requested = params.period ? periods.find((item) => item.code === params.period) : null;
  const selected = requested ?? active;
  const periodCode = selected?.code ?? "";
  const rows = periodCode ? await getSemesterReportRows(periodCode) : [];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <p className="label">Evaluasi Akhir Periode</p>
        <h1 className="mt-1 text-2xl font-extrabold">Laporan Semester</h1>
        <p className="mt-1 text-sm text-muted">
          Rangkuman semester mengikuti tanggal periode yang Anda atur sendiri di Pengaturan → Semester.
        </p>
      </div>

      <form className="card flex flex-wrap items-end gap-3 p-4">
        <input type="hidden" name="panel" value="semester" />
        <div className="min-w-0 flex-1 sm:max-w-md">
          <label className="mb-1.5 block text-xs font-bold">Periode Semester</label>
          <select name="period" defaultValue={periodCode} className="input">
            {periods.map((period) => (
              <option key={period.id} value={period.code}>
                {period.label} · {period.startDate} s.d. {period.endDate}{period.isActive ? " · Aktif" : ""}
              </option>
            ))}
          </select>
        </div>
        <button className="button-secondary">Tampilkan</button>
      </form>

      {!selected ? (
        <div className="card p-8 text-center">
          <h2 className="font-extrabold">Belum ada periode semester</h2>
          <p className="mt-2 text-sm text-muted">Tambahkan periode semester dari Pengaturan agar laporan dapat dibuat.</p>
        </div>
      ) : (
        <ReportTable rows={rows} title="Laporan Perkembangan Tahfidz Semester" period={selected.label} />
      )}
    </div>
  );
}
