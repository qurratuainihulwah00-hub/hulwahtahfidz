import { DashboardShell } from "@/components/dashboard-shell";
import { ensureHulwahWorkspace, getTeacherProfile } from "@/lib/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await ensureHulwahWorkspace();
  const teacher = await getTeacherProfile();
  return <DashboardShell teacherName={teacher.name} teacherAvatarUrl={teacher.avatarUrl}>{children}</DashboardShell>;
}
