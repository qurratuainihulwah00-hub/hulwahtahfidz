"use client";

import Image from "next/image";
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
  Sparkles,
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
  { label: "Hafalan Baru", href: "/submissions", panel: "submissions" as WorkspacePanel, icon: ClipboardCheck },
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
    <div className="flex h-full flex-col bg-white px-4 pb-4 pt-5">
      <button type="button" onClick={() => choose("dashboard")} className="group mb-5 flex items-center gap-3 rounded-2xl px-1.5 py-1.5 text-left focus:outline-none focus:ring-4 focus:ring-teal-100">
        <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-900 via-teal-700 to-cyan-500 text-white shadow-[0_10px_28px_rgba(6,78,104,0.22)]">
          <div className="absolute -right-2 -top-2 h-7 w-7 rounded-full border border-white/20" />
          <BookOpenCheck size={21} strokeWidth={1.9} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-black tracking-[-0.025em] text-slate-900">Tahfidz with Hulwah</div>
          <div className="mt-0.5 truncate text-[10px] font-semibold tracking-[0.01em] text-muted">Personal Tahfidz Dashboard</div>
        </div>
      </button>

      <div className="mb-2 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <nav className="space-y-1 overflow-y-auto overscroll-contain pb-5 pr-0.5">
        {nav.map((item, index) => {
          if ("section" in item) {
            return (
              <div key={`${item.section}-${index}`} className="px-2.5 pb-1 pt-5 text-[9px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
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
                "group relative flex min-h-12 w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left text-sm font-bold transition duration-150 focus:outline-none focus:ring-4 focus:ring-teal-100 active:scale-[0.99]",
                active
                  ? "bg-gradient-to-r from-teal-50 to-cyan-50/70 text-teal-900 ring-1 ring-teal-100"
                  : "text-slate-600 hover:bg-slate-50/90 hover:text-slate-900",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition duration-150",
                  active
                    ? "border-teal-100 bg-white text-teal-700 shadow-sm"
                    : "border-slate-200/80 bg-white text-slate-400 group-hover:border-teal-100 group-hover:text-teal-700",
                )}
              >
                <Icon size={16.5} strokeWidth={1.8} />
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {active && <ChevronRight size={14} strokeWidth={2} className="text-teal-600" />}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto overflow-hidden rounded-[20px] bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-700 p-4 text-white shadow-[0_16px_38px_rgba(6,78,104,0.18)]">
        <div className="mb-2.5 flex items-center gap-2 text-[11px] font-extrabold tracking-[0.02em]">
          <span className="grid h-7 w-7 place-items-center rounded-xl border border-white/15 bg-white/10">
            <NotebookPen size={14} strokeWidth={1.8} />
          </span>
          Catatan hari ini
        </div>
        <p className="text-[10.5px] font-medium leading-[1.65] text-cyan-50/75">Simpan hal kecil dari setiap siswa. Catatan hari ini akan menjadi narasi perkembangan yang bermakna.</p>
        <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-100/55">
          <Sparkles size={11} /> Track • Guide • Grow
        </div>
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
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-slate-200/80 bg-white lg:block">
        <Sidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Tutup menu" className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[min(292px,88vw)] border-r border-line bg-white shadow-2xl">
            <div className="absolute right-3 top-3 z-10">
              <button aria-label="Tutup menu" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-100 active:scale-95">
                <X size={17} strokeWidth={1.8} />
              </button>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-2 border-b border-slate-200/75 bg-white/90 px-3 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl sm:h-[72px] sm:gap-3 sm:px-5 lg:px-7 xl:px-8">
          <button aria-label="Buka menu" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-teal-100 hover:bg-teal-50 hover:text-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 active:scale-95 lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={18} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={() => openPanel("students")}
            className="group relative hidden max-w-[520px] flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50/75 px-3.5 py-2.5 text-sm text-slate-400 transition hover:border-teal-100 hover:bg-white hover:text-slate-600 focus:outline-none focus:ring-4 focus:ring-teal-100 active:scale-[0.995] sm:flex"
          >
            <Search className="mr-2.5 shrink-0 text-slate-400 transition group-hover:text-teal-600" size={16} strokeWidth={1.8} />
            <span className="truncate font-medium">Cari siswa binaan...</span>
            <span className="ml-auto hidden rounded-lg border border-slate-200 bg-white px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.1em] text-slate-400 xl:inline">Siswa</span>
          </button>

          <div className="ml-auto flex min-w-0 items-center gap-2.5">
            <button type="button" onClick={() => openPanel("dashboard")} aria-label="Lihat prioritas pembinaan" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-amber-100 hover:bg-amber-50 hover:text-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-100 active:scale-95">
              <Bell size={17} strokeWidth={1.8} />
            </button>

            <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 shadow-sm sm:pr-3">
              {teacherAvatarUrl ? (
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-teal-50 ring-1 ring-teal-100">
                  <Image
                    src={teacherAvatarUrl}
                    alt={teacherName}
                    fill
                    priority
                    unoptimized
                    sizes="36px"
                    className="object-cover object-top"
                  />
                </div>
              ) : (
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-100 text-xs font-extrabold text-teal-800">H</div>
              )}
              <div className="hidden min-w-0 sm:block">
                <div className="max-w-[168px] truncate text-[11px] font-extrabold tracking-[-0.01em] text-slate-800">{teacherName}</div>
                <div className="mt-0.5 text-[9px] font-semibold text-muted">Guru Tahfidz</div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-3.5 sm:p-5 md:p-6 lg:p-7 xl:p-8">{children}</main>
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
