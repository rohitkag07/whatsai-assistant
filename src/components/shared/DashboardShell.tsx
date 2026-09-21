"use client";

import { useState } from "react";
import { AppShell } from "@/components/system/AppShell";
import type { ShellReadState } from "@/lib/auth/shell-types";
import { Sidebar } from "@/components/shared/Sidebar";
import { TopBar } from "@/components/shared/TopBar";
import { RouteMotion } from "@/components/shared/RouteMotion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { NavMode } from "@/components/shared/Sidebar";
import type { PlatformRole } from "@/lib/auth/roles";
import type { ShellBusiness } from "@/lib/auth/shell-types";

type DashboardShellProps = {
  children: React.ReactNode;
  navMode: NavMode;
  platformRole: PlatformRole;
  activeBusinessId: string | null;
  businesses: ShellBusiness[];
  unreadCount?: number;
  foundation?: boolean;
  foundationState?: ShellReadState;
  designLab?: boolean;
  onboarding?: boolean;
  controlOperations?: boolean;
};

export function DashboardShell({
  children,
  navMode,
  platformRole,
  activeBusinessId,
  businesses,
  unreadCount = 0,
  foundation = false,
  foundationState,
  designLab = false,
  onboarding = false,
  controlOperations = false,
}: DashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  if (foundation && foundationState)
    return (
      <AppShell
        context={navMode === "admin" ? "command" : "control"}
        platformRole={platformRole}
        activeBusinessId={activeBusinessId}
        businesses={businesses}
        state={foundationState}
        designLab={designLab}
        onboarding={onboarding}
        controlOperations={controlOperations}
      >
        {children}
      </AppShell>
    );
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar mode={navMode} />
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>XeroWA AI navigation</SheetTitle>
            <SheetDescription>Open a dashboard workspace.</SheetDescription>
          </SheetHeader>
          <Sidebar
            mode={navMode}
            mobile
            onNavigate={() => setMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          mode={navMode}
          platformRole={platformRole}
          activeBusinessId={activeBusinessId}
          businesses={businesses}
          unreadCount={unreadCount}
          onMenuClick={() => setMenuOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden p-3 sm:p-5 lg:p-7">
          <RouteMotion>{children}</RouteMotion>
        </main>
      </div>
    </div>
  );
}
