"use client";

import { useWorkspace, type WorkspacePanel } from "@/components/workspace-context";

const order: WorkspacePanel[] = [
  "dashboard",
  "attendance",
  "submissions",
  "murajaah",
  "students",
  "progress",
  "monthly",
  "semester",
  "settings",
];

export function DashboardWorkspace({ panels }: { panels: Record<WorkspacePanel, React.ReactNode> }) {
  const { panel } = useWorkspace();

  return (
    <div data-workspace-panel={panel}>
      {order.map((key) => (
        <section key={key} hidden={panel !== key} aria-hidden={panel !== key}>
          {panels[key]}
        </section>
      ))}
    </div>
  );
}
