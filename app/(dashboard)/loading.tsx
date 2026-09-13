export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1500px] pt-1" aria-live="polite" aria-busy="true">
      <div className="h-1 overflow-hidden rounded-full bg-teal-50">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-teal-600" />
      </div>
      <p className="mt-3 text-xs font-semibold text-muted">Menyiapkan data terbaru…</p>
    </div>
  );
}
