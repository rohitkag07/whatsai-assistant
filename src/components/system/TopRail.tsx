"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Search, ArrowUpRight } from "lucide-react";
import type { PlatformRole } from "@/lib/auth/roles";
import { isAdminPlatformRole } from "@/lib/auth/roles";
import type { ShellBusiness } from "@/lib/auth/shell-types";
import type { ProductContext } from "@/lib/product-navigation";
export function TopRail({
  context,
  title,
  platformRole,
  businesses,
  activeBusinessId,
  unread,
  onMenu,
  onSearch,
  menuRef,
}: {
  context: ProductContext;
  title: string;
  platformRole: PlatformRole;
  businesses: ShellBusiness[];
  activeBusinessId: string | null;
  unread: number | null;
  onMenu: () => void;
  onSearch: (trigger: HTMLButtonElement) => void;
  menuRef: React.RefObject<HTMLButtonElement>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const current = businesses.find((b) => b.id === activeBusinessId);
  async function switchBusiness(id: string) {
    if (!isAdminPlatformRole(platformRole) || !id || busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/active-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: id }),
      });
      if (!response.ok)
        throw new Error("Workspace switch failed. Please try again.");
      router.refresh();
    } catch {
      setError("Workspace switch failed. Please try again.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <header className="x-top-rail">
      <div className="x-top-rail-row">
        <button
          ref={menuRef}
          className="x-icon-button x-mobile-menu"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <div className="x-breadcrumb">
          <span>{context === "control" ? "Control" : "Command"}</span>
          <span aria-hidden="true">/</span>
          <strong>{title}</strong>
        </div>
        <div className="x-top-actions">
          {isAdminPlatformRole(platformRole) && businesses.length > 0 ? (
            <label className="x-workspace-select">
              <span className="sr-only">Active business</span>
              <select
                value={current?.id ?? ""}
                disabled={pending}
                onChange={(e) => void switchBusiness(e.target.value)}
                aria-busy={pending}
              >
                <option value="" disabled>
                  Select business
                </option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="x-workspace-name">
              {current?.name ??
                (context === "command"
                  ? "Platform workspace"
                  : "Workspace not selected")}
            </span>
          )}
          {isAdminPlatformRole(platformRole) && (
            <Link
              className="x-context-link"
              href={context === "control" ? "/admin" : "/dashboard"}
            >
              {context === "control" ? "Command" : "Control"}
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          )}
          <button
            className="x-icon-button"
            onClick={(event) => onSearch(event.currentTarget)}
            aria-label="Search navigation"
          >
            <Search size={18} />
          </button>
          <span
            className="x-unread"
            title="Unread conversations; not business outcomes"
            aria-label={
              unread === null
                ? "Unread conversations unknown"
                : `${unread} unread conversations`
            }
          >
            {unread === null ? "—" : unread}
            <span> unread</span>
          </span>
        </div>
      </div>
      {pending && (
        <p className="x-rail-feedback" role="status">
          Switching workspace…
        </p>
      )}
      {error && (
        <p className="x-rail-feedback" role="alert">
          {error}
        </p>
      )}
    </header>
  );
}
