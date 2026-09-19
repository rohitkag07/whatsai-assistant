"use client";
import {
  AlertCircle,
  CircleHelp,
  Inbox,
  LockKeyhole,
  RefreshCw,
  Unplug,
} from "lucide-react";
import type { SystemStateKind } from "@/lib/shell-state";
const states = {
  loading: {
    title: "Loading workspace",
    description: "Retrieving the latest available records.",
    icon: RefreshCw,
  },
  empty: {
    title: "No records yet",
    description:
      "Nothing has been recorded in this view. New activity will appear here.",
    icon: Inbox,
  },
  error: {
    title: "Workspace data could not be loaded",
    description: "The last read failed. No result or count is assumed.",
    icon: AlertCircle,
  },
  disconnected: {
    title: "Workspace data is not connected",
    description:
      "This workspace cannot reach its configured data source. Connection health is not verified.",
    icon: Unplug,
  },
  permission: {
    title: "This action needs permission",
    description:
      "Ask your workspace owner for the appropriate access. No action has been taken.",
    icon: LockKeyhole,
  },
  unknown: {
    title: "Outcome not yet verified",
    description:
      "A provider receipt or owner confirmation is still needed. Activity alone does not establish success.",
    icon: CircleHelp,
  },
  partial: {
    title: "Some workspace data is unavailable",
    description:
      "Available records remain visible. Missing counts are shown as unknown.",
    icon: AlertCircle,
  },
};
export function SystemState({
  kind,
  compact = false,
  onRetry,
}: {
  kind: SystemStateKind;
  compact?: boolean;
  onRetry?: () => void;
}) {
  const state = states[kind];
  const Icon = state.icon;
  return (
    <section
      className={`x-system-state ${compact ? "x-system-state-compact" : ""}`}
      data-state={kind}
      aria-busy={kind === "loading"}
      aria-label={state.title}
    >
      <Icon size={22} aria-hidden="true" />
      <div>
        <h2>{state.title}</h2>
        <p>{state.description}</p>
        {kind === "loading" && (
          <div className="x-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      {onRetry &&
        (kind === "error" || kind === "disconnected" || kind === "partial") && (
          <button className="x-button x-button-secondary" onClick={onRetry}>
            Try again
          </button>
        )}
    </section>
  );
}
