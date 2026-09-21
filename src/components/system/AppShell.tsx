"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import type { PlatformRole } from "@/lib/auth/roles";
import type { ShellBusiness, ShellReadState } from "@/lib/auth/shell-types";
import {
  destinationTitle,
  productNavigation,
  type ProductContext,
} from "@/lib/product-navigation";
import { readableCount, shellPresentation } from "@/lib/shell-state";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { TopRail } from "./TopRail";
import { CommandPalette } from "./CommandPalette";
import { SystemState } from "./SystemState";
export type AppShellProps = {
  children: ReactNode;
  context: ProductContext;
  platformRole: PlatformRole;
  activeBusinessId: string | null;
  businesses: ShellBusiness[];
  state: ShellReadState;
  designLab?: boolean;
  onboarding?: boolean;
  controlOperations?: boolean;
};
export function AppShell({
  children,
  context,
  platformRole,
  activeBusinessId,
  businesses,
  state,
  designLab = false,
  onboarding = false,
  controlOperations = false,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [compact, setCompact] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const destinations = productNavigation(
    context,
    platformRole,
    designLab,
    onboarding,
    controlOperations,
  );
  const presentation = shellPresentation(state);
  const isLab = pathname === "/admin/design-lab";
  const isFoundationPage = isLab || pathname === "/admin/onboarding" || (context === 'control' && controlOperations && ['/dashboard','/chats','/leads','/calendar','/follow-ups'].includes(pathname));
  const openSearch = (trigger: HTMLButtonElement) => {
    returnFocus.current = trigger;
    setSearch(true);
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        returnFocus.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        setSearch((value) => !value);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <div
      data-foundation={context}
      className="x-app-shell"
      data-shell="foundation"
    >
      <a href="#workspace-main" className="x-skip-link">
        Skip to workspace
      </a>
      <div className="x-desktop-sidebar">
        <WorkspaceSidebar
          {...{ context, destinations, pathname, compact }}
          onCompact={() => setCompact((value) => !value)}
        />
      </div>
      <Dialog.Root open={menu} onOpenChange={setMenu}>
        <Dialog.Portal>
          <Dialog.Overlay className="x-overlay" />
          <Dialog.Content
            className="x-nav-drawer"
            data-foundation={context}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              menuRef.current?.focus();
            }}
          >
            <Dialog.Title className="sr-only">
              Workspace navigation
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Choose an available destination.
            </Dialog.Description>
            <WorkspaceSidebar
              {...{ context, destinations, pathname }}
              mobile
              onNavigate={() => setMenu(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="x-workspace">
        <TopRail
          {...{ context, platformRole, businesses, activeBusinessId, menuRef }}
          title={
            isLab ? "Design lab" : destinationTitle(pathname, destinations)
          }
          unread={readableCount(state.unread)}
          onMenu={() => setMenu(true)}
          onSearch={openSearch}
        />
        <main id="workspace-main" tabIndex={-1} className="x-main">
          {presentation && !isFoundationPage && (
            <SystemState
              kind={presentation}
              compact
              onRetry={() => router.refresh()}
            />
          )}
          <div
            className={
              isFoundationPage ? "x-foundation-content" : "x-legacy-content"
            }
          >
            {children}
          </div>
        </main>
        <footer className="x-workspace-footer">
          <span>XeroWA / {context === "control" ? "Control" : "Command"}</span>
          <span>Outcomes require evidence.</span>
        </footer>
      </div>
      <CommandPalette
        open={search}
        onOpenChange={setSearch}
        {...{ destinations, context, returnFocus }}
      />
    </div>
  );
}
