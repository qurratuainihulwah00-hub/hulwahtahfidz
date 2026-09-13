"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { stageWorkspacePanel, useWorkspace, type WorkspacePanel } from "@/components/workspace-context";

export function WorkspaceLink({
  panel,
  children,
  className,
  title,
}: {
  panel: WorkspacePanel;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { setPanel } = useWorkspace();
  const href = `/dashboard?panel=${panel}`;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (pathname === "/dashboard") {
      setPanel(panel);
      return;
    }

    stageWorkspacePanel(panel);
    router.push("/dashboard", { scroll: false });
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      prefetch
      scroll={false}
      className={className}
      title={title}
    >
      {children}
    </Link>
  );
}
