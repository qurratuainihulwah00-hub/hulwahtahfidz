import { DashboardShell } from "@/components/dashboard-shell";

const TEACHER_NAME = "Hulwah Qurratu Aini, S.Pd.";
const TEACHER_AVATAR = "/hulwah-avatar-pro.webp";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell teacherName={TEACHER_NAME} teacherAvatarUrl={TEACHER_AVATAR}>
      {children}
    </DashboardShell>
  );
}
