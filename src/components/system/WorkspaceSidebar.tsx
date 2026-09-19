"use client";
import Link from "next/link";
import {
  Activity,
  ArrowRightLeft,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Home,
  Inbox,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  Workflow,
  X,
} from "lucide-react";
import {
  destinationActive,
  type ProductContext,
  type ProductDestination,
} from "@/lib/product-navigation";
const icons = {
  home: Home,
  inbox: Inbox,
  pipeline: Workflow,
  calendar: CalendarDays,
  knowledge: BookOpen,
  connection: Activity,
  account: Settings2,
  handoff: ArrowRightLeft,
  command: LayoutDashboard,
  business: Building2,
  access: ShieldCheck,
  lab: FlaskConical,
};
export function WorkspaceSidebar({
  context,
  destinations,
  pathname,
  compact = false,
  mobile = false,
  onCompact,
  onNavigate,
}: {
  context: ProductContext;
  destinations: ProductDestination[];
  pathname: string;
  compact?: boolean;
  mobile?: boolean;
  onCompact?: () => void;
  onNavigate?: () => void;
}) {
  const activeHref = [...destinations]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => destinationActive(pathname, item.href))?.href;
  return (
    <aside
      className={`x-sidebar ${compact ? "x-sidebar-compact" : ""} ${mobile ? "x-sidebar-mobile" : ""}`}
    >
      <div className="x-brand">
        <span className="x-brand-symbol" aria-hidden="true">
          X
        </span>
        {!compact && (
          <div>
            <strong>XeroWA</strong>
            <span>
              {context === "control"
                ? "Revenue operations"
                : "Platform operations"}
            </span>
          </div>
        )}
        {mobile && (
          <button
            className="x-icon-button"
            aria-label="Close navigation"
            onClick={onNavigate}
          >
            <X size={18} />
          </button>
        )}
      </div>
      <p className="x-nav-label">
        {compact
          ? context === "control"
            ? "CTRL"
            : "CMD"
          : context === "control"
            ? "Control workspace"
            : "Command workspace"}
      </p>
      <nav
        aria-label={`${context === "control" ? "Control" : "Command"} navigation`}
      >
        {destinations
          .filter((item) => !item.secondary)
          .map((item) => {
            const Icon = icons[item.icon as keyof typeof icons] ?? Home;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="x-nav-link"
                title={compact ? item.label : undefined}
                aria-label={compact ? item.label : undefined}
                aria-current={activeHref === item.href ? "page" : undefined}
                onClick={onNavigate}
              >
                <Icon size={18} aria-hidden="true" />
                {!compact && <span>{item.label}</span>}
              </Link>
            );
          })}
        {!compact && destinations.some((item) => item.secondary) && (
          <details className="x-secondary-nav">
            <summary>More tools</summary>
            {destinations
              .filter((item) => item.secondary)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="x-nav-link"
                  aria-current={activeHref === item.href ? "page" : undefined}
                  onClick={onNavigate}
                >
                  {item.label}
                </Link>
              ))}
          </details>
        )}
      </nav>
      <div className="x-sidebar-footer">
        {!compact && (
          <p>
            Every enquiry.
            <br />
            <strong>An accountable next step.</strong>
          </p>
        )}
        {!mobile && (
          <button
            className="x-icon-button"
            onClick={onCompact}
            aria-label={compact ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!compact}
          >
            {compact ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>
    </aside>
  );
}
