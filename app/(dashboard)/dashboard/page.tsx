import { Suspense } from "react";
import { DashboardWorkspace } from "@/components/dashboard-workspace";
import { DashboardHome } from "@/components/dashboard-home";
import AttendancePage from "@/app/(dashboard)/attendance/page";
import SubmissionsPage from "@/app/(dashboard)/submissions/page";
import MurajaahPage from "@/app/(dashboard)/murajaah/page";
import StudentsPage from "@/app/(dashboard)/students/page";
import ProgressPage from "@/app/(dashboard)/progress/page";
import MonthlyReportPage from "@/app/(dashboard)/reports/monthly/page";
import SemesterReportPage from "@/app/(dashboard)/reports/semester/page";
import SettingsPage from "@/app/(dashboard)/settings/page";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

function PanelFallback() {
  return (
    <div className="mx-auto max-w-6xl py-2" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-white px-4 py-3 shadow-sm">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-50" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-600" />
        </span>
        <p className="text-xs font-semibold text-slate-500">Menyiapkan panel...</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const emptySearchParams = Promise.resolve({} as { period?: string; date?: string });

  return (
    <DashboardWorkspace
      panels={{
        dashboard: <Suspense fallback={<PanelFallback />}><DashboardHome /></Suspense>,
        attendance: <Suspense fallback={<PanelFallback />}><AttendancePage searchParams={emptySearchParams} /></Suspense>,
        submissions: <Suspense fallback={<PanelFallback />}><SubmissionsPage /></Suspense>,
        murajaah: <Suspense fallback={<PanelFallback />}><MurajaahPage /></Suspense>,
        students: <Suspense fallback={<PanelFallback />}><StudentsPage /></Suspense>,
        progress: <Suspense fallback={<PanelFallback />}><ProgressPage /></Suspense>,
        monthly: <Suspense fallback={<PanelFallback />}><MonthlyReportPage searchParams={emptySearchParams} /></Suspense>,
        semester: <Suspense fallback={<PanelFallback />}><SemesterReportPage searchParams={emptySearchParams} /></Suspense>,
        settings: <SettingsPage />,
      }}
    />
  );
}
