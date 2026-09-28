import { z } from "zod";

const id = z.string().min(1);
const date = z.string().refine((v) => Number.isFinite(Date.parse(v)));
const nullable = z.string().nullable();
const scoped = { id, business_id: id };
const linked = { ...scoped, thread_id: nullable };
export const rowSchemas = {
  businesses: z.object({ id, name: z.string().min(1) }),
  business_profiles: z.object({
    ...scoped,
    timezone: z.string(),
    vertical: z.string(),
  }),
  business_members: z.object({
    ...scoped,
    user_id: id,
    display_name: nullable,
    active: z.boolean(),
    role: z.string(),
  }),
  business_channels: z.object({
    ...scoped,
    provider: z.string(),
    is_active: z.boolean(),
    status: z.string(),
    last_verified_at: date.nullable(),
  }),
  conversation_threads: z.object({
    ...scoped,
    contact_id: nullable,
    summary: nullable,
    assigned_to: nullable,
    assigned_user_id: nullable,
    ai_mode: z.enum(["assistant", "manual", "paused"]),
    created_at: date,
    last_message_at: date.nullable(),
  }),
  conversation_messages: z.object({
    ...linked,
    direction: z.enum(["inbound", "outbound"]),
    body: nullable,
    agent: nullable,
    status: z.string(),
    created_at: date,
  }),
  lead_qualification_answers: z.object({
    id,
    thread_id: id,
    question_key: z.string(),
    answer_value: z.string(),
    confidence: z.number().nullable(),
    extracted_at: date,
  }),
  handoff_events: z.object({
    ...linked,
    reason: z.string(),
    status: z.string(),
    created_at: date,
  }),
  followup_jobs: z.object({
    ...linked,
    contact_id: id,
    scheduled_at: date,
    status: z.enum(["pending", "processing", "sent", "cancelled", "failed"]),
    sent_at: date.nullable(),
    error: nullable,
    step_index: z.number().int().nonnegative(),
  }),
  appointments: z.object({
    ...linked,
    contact_id: id,
    title: z.string(),
    scheduled_at: date,
    status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
  }),
};
export type ReadTable = keyof typeof rowSchemas;
export type Rows<T extends ReadTable> = z.infer<(typeof rowSchemas)[T]>[];
export type ReadQuery = {
  table: ReadTable;
  businessId: string;
  actorId?: string;
  threadIds?: string[];
  after?: string;
  limit: number;
};
export type ReadResponse = {
  data: unknown[] | null;
  count: number | null;
  error: null | { code?: string };
  status: number;
};
export type ReadPort = (query: ReadQuery) => Promise<ReadResponse>;
export type SourceState =
  | "complete"
  | "partial"
  | "error"
  | "permission"
  | "unavailable";
export type ResourceEvidence = {
  table: ReadTable;
  state: SourceState;
  rows: number;
  omitted: number;
  detail: string;
};
export type ReadEvidence = {
  businessName: string | null;
  timezone: string | null;
  retrievedAt: string;
  expiresAt: string;
  resources: ResourceEvidence[];
  connection: string;
  scope: string;
};
// Explicit safe columns only. Channel secrets, metadata and provider config never enter a response.
export const columns: Record<ReadTable, string> = Object.fromEntries(
  Object.entries(rowSchemas).map(([table, schema]) => [
    table,
    Object.keys(schema.shape).join(","),
  ]),
) as Record<ReadTable, string>;
