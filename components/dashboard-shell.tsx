"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  BookHeart,
  BookOpenCheck,
  CalendarCheck2,
  ChevronRight,
  ClipboardCheck,
  FileBarChart,
  FileText,
  LayoutDashboard,
  Menu,
  NotebookPen,
  Search,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WorkspaceProvider,
  stageWorkspacePanel,
  useWorkspace,
  type WorkspacePanel,
} from "@/components/workspace-context";

const nav = [
  { label: "Dashboard", href: "/dashboard", panel: "dashboard" as WorkspacePanel, icon: LayoutDashboard },
  { section: "Aktivitas" },
  { label: "Absensi", href: "/attendance", panel: "attendance" as WorkspacePanel, icon: CalendarCheck2 },
  { label: "Setoran Hafalan", href: "/submissions", panel: "submissions" as WorkspacePanel, icon: ClipboardCheck },
  { label: "Murajaah", href: "/murajaah", panel: "murajaah" as WorkspacePanel, icon: BookHeart },
  { section: "Siswa" },
  { label: "Siswa Binaan", href: "/students", panel: "students" as WorkspacePanel, icon: Users },
  { label: "Perkembangan", href: "/progress", panel: "progress" as WorkspacePanel, icon: BarChart3 },
  { section: "Laporan" },
  { label: "Laporan Bulanan", href: "/reports/monthly", panel: "monthly" as WorkspacePanel, icon: FileText },
  { label: "Laporan Semester", href: "/reports/semester", panel: "semester" as WorkspacePanel, icon: FileBarChart },
  { section: "Sistem" },
  { label: "Pengaturan", href: "/settings", panel: "settings" as WorkspacePanel, icon: Settings2 },
] as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { panel, setPanel } = useWorkspace();
  const inWorkspace = pathname === "/dashboard";

  function choose(next: WorkspacePanel) {
    if (inWorkspace) {
      setPanel(next);
      onNavigate?.();
      return;
    }
    stageWorkspacePanel(next);
    onNavigate?.();
    router.push("/dashboard", { scroll: false });
  }

  return (
    <div className="flex h-full flex-col bg-white p-4">
      <button type="button" onClick={() => choose("dashboard")} className="mb-7 flex items-center gap-3 px-2 pt-2 text-left">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-800 to-teal-500 text-white shadow-soft">
          <BookOpenCheck size={21} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-extrabold tracking-tight">Tahfidz with Hulwah</div>
          <div className="truncate text-[10px] font-medium text-muted">Personal Tahfidz Dashboard</div>
        </div>
      </button>

      <nav className="space-y-1 overflow-y-auto overscroll-contain pb-6">
        {nav.map((item, index) => {
          if ("section" in item) {
            return (
              <div key={`${item.section}-${index}`} className="px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-[.18em] text-muted/70">
                {item.section}
              </div>
            );
          }

          const Icon = item.icon;
          const active = inWorkspace
            ? panel === item.panel
            : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <button
              key={item.href}
              type="button"
              onClick={() => choose(item.panel)}
              className={cn(
                "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-teal-100 active:scale-[0.99]",
                active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50 hover:text-ink",
              )}
            >
              <Icon size={18} className={active ? "text-teal-700" : "text-slate-400"} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={15} />}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl bg-gradient-to-br from-teal-800 to-teal-600 p-4 text-white">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold"><NotebookPen size={15} /> Catatan hari ini</div>
        <p className="text-[11px] leading-5 text-white/75">Simpan hal kecil dari setiap siswa. Catatan itu akan menjadi narasi perkembangan yang bermakna.</p>
      </div>
    </div>
  );
}

function DashboardShellInner({
  children,
  teacherName,
  teacherAvatarUrl,
}: {
  children: React.ReactNode;
  teacherName: string;
  teacherAvatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { setPanel } = useWorkspace();

  useEffect(() => {
    if (pathname !== "/dashboard") router.prefetch("/dashboard");
  }, [pathname, router]);

  function openPanel(panel: WorkspacePanel) {
    if (pathname === "/dashboard") {
      setPanel(panel);
      return;
    }
    stageWorkspacePanel(panel);
    router.push("/dashboard", { scroll: false });
  }

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[258px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[258px] border-r border-line lg:block">
        <Sidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Tutup menu" className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[min(286px,88vw)] border-r border-line bg-white shadow-2xl">
            <div className="absolute right-3 top-3 z-10">
              <button aria-label="Tutup menu" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-100 active:scale-95">
                <X size={18} />
              </button>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-[66px] items-center gap-2 border-b border-line/80 bg-white/92 px-3 backdrop-blur-xl sm:h-[70px] sm:gap-3 sm:px-5 lg:px-7">
          <button aria-label="Buka menu" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-slate-600 transition hover:bg-teal-50 hover:text-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 active:scale-95 lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={19} />
          </button>

          <button
            type="button"
            onClick={() => openPanel("students")}
            className="relative hidden max-w-md flex-1 items-center rounded-xl border border-line bg-slate-50 px-3 py-2.5 text-sm text-slate-400 transition hover:border-teal-200 hover:bg-white hover:text-slate-600 focus:outline-none focus:ring-4 focus:ring-teal-100 active:scale-[0.995] sm:flex lg:max-w-lg"
          >
            <Search className="mr-2 shrink-0" size={17} />
            <span className="truncate">Cari siswa binaan...</span>
            <span className="ml-auto hidden rounded-md border border-line bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-400 xl:inline">SISWA</span>
          </button>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => openPanel("dashboard")} aria-label="Lihat prioritas pembinaan" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-slate-500 transition hover:bg-amber-50 hover:text-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-100 active:scale-95">
              <Bell size={18} />
            </button>
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-white py-1.5 pl-1.5 pr-2 sm:pr-3">
              {teacherAvatarUrl ? (
                <img
                  src={teacherAvatarUrl}
                  alt={teacherName}
                  width={32}
                  height={32}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-8 w-8 shrink-0 rounded-lg bg-teal-50 object-cover object-top ring-1 ring-teal-100"
                />
              ) : (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-100 text-xs font-extrabold text-teal-800">H</div>
              )}
              <div className="hidden min-w-0 sm:block">
                <div className="max-w-[150px] truncate text-xs font-bold">{teacherName}</div>
                <div className="text-[10px] text-muted">Guru Tahfidz</div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-5 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function DashboardShell(props: {
  children: React.ReactNode;
  teacherName: string;
  teacherAvatarUrl?: string | null;
}) {
  return (
    <WorkspaceProvider>
      <DashboardShellInner {...props} />
    </WorkspaceProvider>
  );
}
