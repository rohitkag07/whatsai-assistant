import {
  CheckCircle2,
  Circle,
  CircleHelp,
  Clock3,
  Hand,
  Pause,
  XCircle,
} from "lucide-react";
export type StatusKind =
  | "verified"
  | "active"
  | "customer"
  | "human"
  | "paused"
  | "failed"
  | "unknown";
const statuses = {
  verified: { label: "Verified", icon: CheckCircle2, tone: "success" },
  active: { label: "In progress", icon: Circle, tone: "info" },
  customer: { label: "Waiting for customer", icon: Clock3, tone: "neutral" },
  human: { label: "Needs human", icon: Hand, tone: "attention" },
  paused: { label: "Paused", icon: Pause, tone: "neutral" },
  failed: { label: "Failed", icon: XCircle, tone: "danger" },
  unknown: { label: "Outcome unknown", icon: CircleHelp, tone: "attention" },
} as const;
export function StatusPill({ status }: { status: StatusKind }) {
  const state = statuses[status];
  const Icon = state.icon;
  return (
    <span className="x-status" data-tone={state.tone}>
      <Icon size={13} aria-hidden="true" />
      {state.label}
    </span>
  );
}
