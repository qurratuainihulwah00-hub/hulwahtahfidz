"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type WorkspacePanel =
  | "dashboard"
  | "attendance"
  | "submissions"
  | "murajaah"
  | "students"
  | "progress"
  | "monthly"
  | "semester"
  | "settings";

const STORAGE_KEY = "hulwah-workspace-panel";
const PANEL_EVENT = "hulwah-workspace-panel-change";

const WorkspaceContext = createContext<{
  panel: WorkspacePanel;
  setPanel: (panel: WorkspacePanel) => void;
} | null>(null);

function isWorkspacePanel(value: string | null): value is WorkspacePanel {
  return ["dashboard", "attendance", "submissions", "murajaah", "students", "progress", "monthly", "semester", "settings"].includes(value ?? "");
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [panel, setPanelState] = useState<WorkspacePanel>("dashboard");

  useEffect(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (isWorkspacePanel(saved)) setPanelState(saved);

    const handle = (event: Event) => {
      const detail = (event as CustomEvent<WorkspacePanel>).detail;
      if (isWorkspacePanel(detail)) setPanelState(detail);
    };
    window.addEventListener(PANEL_EVENT, handle);
    return () => window.removeEventListener(PANEL_EVENT, handle);
  }, []);

  const value = useMemo(() => ({
    panel,
    setPanel(next: WorkspacePanel) {
      setPanelState(next);
      window.sessionStorage.setItem(STORAGE_KEY, next);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    },
  }), [panel]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}

export function stageWorkspacePanel(panel: WorkspacePanel) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, panel);
  window.dispatchEvent(new CustomEvent(PANEL_EVENT, { detail: panel }));
}
