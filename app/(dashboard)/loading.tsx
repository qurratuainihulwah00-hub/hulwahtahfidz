export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1500px] py-2" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-white px-4 py-3 shadow-sm">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-50" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-600" />
        </span>
        <p className="text-xs font-semibold text-slate-500">Memuat data terbaru…</p>
      </div>
    </div>
  );
}
