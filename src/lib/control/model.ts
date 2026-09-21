import type {
  Appointment,
  ConversationThread,
  ConversationMessage,
  LeadQualificationAnswer,
  HandoffEvent,
  FollowupJob,
} from "@/types/database";

export const stages = [
  "New",
  "Qualifying",
  "Qualified",
  "Assigned",
  "Human acknowledged",
  "Appointment/next action requested",
  "Confirmed",
  "Won/completed",
  "Lost/not eligible",
  "Outcome unknown",
] as const;
export const appointmentStates = [
  "Requested",
  "Tentatively proposed",
  "Confirmed",
  "Rescheduled",
  "Cancelled",
  "Attended/completed",
  "No-show",
  "Verification unavailable",
] as const;
export const followupStates = [
  "Due",
  "Scheduled",
  "Paused",
  "Replied",
  "Failed",
  "Outcome unknown",
] as const;
export const readStates = [
  "ready",
  "empty",
  "partial",
  "stale",
  "loading",
  "error",
  "permission",
  "disconnected",
  "unavailable",
] as const;
export type Stage = (typeof stages)[number];
export type ReadState = (typeof readStates)[number];
export type View =
  | "today"
  | "inbox"
  | "pipeline"
  | "followups"
  | "appointments";
export const views: {
  id: View;
  title: string;
  href: string;
  description: string;
}[] = [
  {
    id: "today",
    title: "Today",
    href: "/dashboard",
    description: "The work that needs a human decision.",
  },
  {
    id: "inbox",
    title: "Inbox",
    href: "/chats",
    description: "Understand the enquiry. Own the next step.",
  },
  {
    id: "pipeline",
    title: "Pipeline",
    href: "/leads",
    description: "Progress that can be traced to evidence.",
  },
  {
    id: "followups",
    title: "Follow-ups",
    href: "/follow-ups",
    description: "Every follow-up has an owner, a reason and a boundary.",
  },
  {
    id: "appointments",
    title: "Appointments",
    href: "/calendar",
    description: "Separate a request from a confirmed commitment.",
  },
];
export type Receipt = {
  domain: "case" | "appointment" | "followup";
  recordId: string;
  threadId: string;
  businessId: string;
  value: string;
  authority: "human" | "system";
  actor: string | null;
  reference: string;
  at: string;
  detail: string;
};
export type BackendSnapshot = {
  businessId: string;
  asOf: string;
  threads: Pick<
    ConversationThread,
    | "id"
    | "business_id"
    | "contact_id"
    | "summary"
    | "assigned_to"
    | "ai_mode"
    | "stage"
    | "created_at"
    | "last_message_at"
  >[];
  messages: Pick<
    ConversationMessage,
    | "id"
    | "thread_id"
    | "business_id"
    | "direction"
    | "body"
    | "agent"
    | "created_at"
    | "status"
  >[];
  answers: LeadQualificationAnswer[];
  handoffs: Pick<
    HandoffEvent,
    | "id"
    | "business_id"
    | "thread_id"
    | "reason"
    | "status"
    | "assigned_to"
    | "created_at"
  >[];
  appointments: Pick<
    Appointment,
    | "id"
    | "business_id"
    | "thread_id"
    | "contact_id"
    | "title"
    | "scheduled_at"
    | "status"
  >[];
  followups: Pick<
    FollowupJob,
    | "id"
    | "business_id"
    | "thread_id"
    | "contact_id"
    | "scheduled_at"
    | "status"
    | "sent_at"
    | "error"
    | "step_index"
  >[];
  receipts: Receipt[];
};
export type Case = {
  id: string;
  label: string;
  intent: string;
  openedAt: string;
  lastAt: string | null;
  owner: string | null;
  mode: string;
  stage: Stage;
  receipt: Receipt | null;
  answers: BackendSnapshot["answers"];
  messages: BackendSnapshot["messages"];
  handoff: BackendSnapshot["handoffs"][number] | null;
};
export type AppointmentRead = {
  id: string;
  threadId: string;
  title: string;
  scheduledAt: string;
  recordedStatus: string;
  state: (typeof appointmentStates)[number];
  receipt: Receipt | null;
};
export type FollowupRead = {
  id: string;
  threadId: string;
  scheduledAt: string;
  state: (typeof followupStates)[number];
  reason: string;
  owner: string | null;
  eligibility: string;
  attempts: number | null;
  approval: string;
  stopReason: string;
  receipt: Receipt | null;
};
export type ControlReadModel = {
  businessId: string;
  asOf: string | null;
  source: "synthetic" | "unavailable";
  status: ReadState;
  cases: Case[];
  appointments: AppointmentRead[];
  followups: FollowupRead[];
};
export function canShowRows(state: ReadState) {
  return ["ready", "partial", "stale"].includes(state);
}
export function countLabel(state: ReadState, count: number) {
  return state === "empty"
    ? "0"
    : state === "ready"
      ? String(count)
      : state === "partial"
        ? `≥ ${count}`
        : state === "stale"
          ? `Last known ${count}`
          : "—";
}
export function ageLabel(at: string, asOf: string | null) {
  if (!asOf) return "Age unknown";
  const minutes = Math.max(
    0,
    Math.floor((Date.parse(asOf) - Date.parse(at)) / 60000),
  );
  return minutes < 60
    ? `${minutes}m`
    : minutes < 1440
      ? `${Math.floor(minutes / 60)}h`
      : `${Math.floor(minutes / 1440)}d`;
}
export function timeLabel(at: string | null) {
  if (!at || !Number.isFinite(Date.parse(at))) return "Unknown";
  // This review uses IST throughout. Avoid runtime locale punctuation/month
  // differences between server ICU and WebKit during hydration.
  const ist = new Date(Date.parse(at) + 330 * 60_000);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${ist.getUTCDate()} ${months[ist.getUTCMonth()]} ${ist.getUTCFullYear()}, ${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())} IST`;
}
