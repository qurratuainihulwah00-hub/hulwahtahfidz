export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1500px] animate-pulse space-y-5 sm:space-y-6">
      <div className="h-[260px] rounded-[24px] bg-gradient-to-br from-teal-950/90 via-teal-800/85 to-cyan-600/75 sm:h-[300px]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-2xl border border-line bg-white p-5">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="mt-4 h-8 w-16 rounded bg-slate-100" />
            <div className="mt-4 h-2.5 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="h-64 rounded-2xl border border-line bg-white" />
        <div className="h-64 rounded-2xl border border-line bg-white" />
      </div>
    </div>
  );
}
