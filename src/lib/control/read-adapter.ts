import type { AuthSession } from "@/lib/auth/session";
import { projectSnapshot, unavailableModel } from "./adapter";
import type { BackendSnapshot, ControlReadModel, ReadState } from "./model";
import {
  rowSchemas,
  type ReadPort,
  type ReadQuery,
  type ReadTable,
  type Rows,
  type ResourceEvidence,
  type ReadEvidence,
} from "./read-contract";

export const READ_TTL_MS = 60_000;
const PAGE_SIZE = 50;
const MAX_PAGES = 3;
class BoundaryError extends Error {}

export function hasReadMembership(session: AuthSession) {
  return Boolean(
    session.activeBusinessId &&
      session.user.id &&
      session.memberships.some(
        (m) =>
          m.active &&
          m.business_id === session.activeBusinessId &&
          m.user_id === session.user.id,
      ),
  );
}

export async function readControl(
  session: AuthSession,
  port: ReadPort,
  now = () => Date.now(),
): Promise<ControlReadModel> {
  const businessId = session.activeBusinessId ?? "";
  const unavailable = (status: ReadState = "unavailable") => ({
    ...unavailableModel(businessId),
    status,
  });
  if (!hasReadMembership(session)) return unavailable("permission");
  const started = now();
  const resources: ResourceEvidence[] = [];
  async function read<T extends ReadTable>(
    table: T,
    options: Partial<ReadQuery> = {},
  ): Promise<Rows<T>> {
    const evidence: ResourceEvidence = {
      table,
      state: "partial",
      rows: 0,
      omitted: 0,
      detail: "Bounded read; completeness not established.",
    };
    resources.push(evidence);
    const rows: Rows<T> = [];
    const seen = new Set<string>();
    let after: string | undefined;
    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const result = await port({
          ...options,
          table,
          businessId,
          after,
          limit: PAGE_SIZE,
        });
        if (
          result.error ||
          result.status >= 400 ||
          !Array.isArray(result.data)
        ) {
          evidence.state =
            result.status === 401 ||
            result.status === 403 ||
            result.error?.code === "42501"
              ? "permission"
              : "error";
          evidence.detail = rows.length
            ? "A later page failed; shown rows are incomplete."
            : "Source read failed; absence is not zero.";
          if (rows.length) evidence.state = "partial";
          break;
        }
        if (result.data.length > PAGE_SIZE) throw new BoundaryError();
        for (const raw of result.data) {
          const parsed = rowSchemas[table].safeParse(raw);
          if (!parsed.success) throw new BoundaryError();
          const row = parsed.data;
          if (
            ("business_id" in row && row.business_id !== businessId) ||
            (table === "businesses" && row.id !== businessId)
          )
            throw new BoundaryError();
          if (
            options.threadIds &&
            (!("thread_id" in row) ||
              !row.thread_id ||
              !options.threadIds.includes(row.thread_id))
          )
            throw new BoundaryError();
          if (
            options.actorId &&
            (!("user_id" in row) || row.user_id !== options.actorId)
          )
            throw new BoundaryError();
          if (seen.has(row.id) || (after && row.id <= after))
            throw new BoundaryError();
          seen.add(row.id);
          after = row.id;
          rows.push(row as Rows<T>[number]);
        }
        evidence.rows = rows.length;
        const countKnown =
          Number.isInteger(result.count) && result.count! >= result.data.length;
        if (countKnown && result.count === result.data.length) {
          evidence.state = "complete";
          evidence.detail = "Enumerated visible rows; not an atomic snapshot.";
          break;
        }
        if (result.data.length < PAGE_SIZE) {
          evidence.detail = countKnown
            ? "Server cap or concurrent change; rows omitted."
            : "Count unavailable; completeness unknown.";
          break;
        }
        evidence.detail = "Page budget reached; additional rows may exist.";
      }
    } catch (error) {
      if (error instanceof BoundaryError) throw error;
      evidence.state = rows.length ? "partial" : "unavailable";
      evidence.detail = "Source unavailable; no complete result established.";
    }
    return rows;
  }
  try {
    const own = await read("business_members", { actorId: session.user.id });
    if (
      !own.some((m) => m.active && m.user_id === session.user.id) ||
      resources[0].state !== "complete"
    )
      return unavailable("permission");
    const business = await read("businesses");
    if (business.length !== 1 || resources.at(-1)?.state !== "complete")
      return unavailable(
        resources.at(-1)?.state === "permission" ? "permission" : "unavailable",
      );
    const profiles = await read("business_profiles");
    const members = await read("business_members");
    const channels = await read("business_channels");
    const threads = await read("conversation_threads");
    const threadEvidence = resources.at(-1)!;
    if (!threads.length && threadEvidence.state !== "complete")
      return {
        ...unavailable(
          threadEvidence.state === "permission" ? "permission" : "error",
        ),
        read: evidence(),
      };
    const messages: Rows<"conversation_messages"> = [];
    const answers: Rows<"lead_qualification_answers"> = [];
    const handoffs: Rows<"handoff_events"> = [];
    if (!threads.length && threadEvidence.state === "complete") {
      for (const table of [
        "conversation_messages",
        "lead_qualification_answers",
        "handoff_events",
      ] as const)
        resources.push({
          table,
          state: "complete",
          rows: 0,
          omitted: 0,
          detail:
            "No visible parent conversations; no linked records in this scope.",
        });
    }
    for (let i = 0; i < threads.length; i += PAGE_SIZE) {
      const threadIds = threads.slice(i, i + PAGE_SIZE).map((t) => t.id);
      messages.push(...(await read("conversation_messages", { threadIds })));
      answers.push(
        ...(await read("lead_qualification_answers", { threadIds })),
      );
      handoffs.push(...(await read("handoff_events", { threadIds })));
    }
    const appointments = await read("appointments");
    const followups = await read("followup_jobs");
    const parents = new Map(threads.map((t) => [t.id, t]));
    function linked<T extends { thread_id: string | null; contact_id: string }>(
      rows: T[],
      table: ReadTable,
    ) {
      const e = resources.find((r) => r.table === table)!;
      return rows.filter((row): row is T & { thread_id: string } => {
        const parent = row.thread_id ? parents.get(row.thread_id) : null;
        if (!parent) {
          e.omitted++;
          e.state = "partial";
          e.detail =
            "Unlinked or outside loaded conversations; excluded from this view.";
          return false;
        }
        if (row.contact_id !== parent.contact_id) throw new BoundaryError();
        return true;
      });
    }
    const ownerLabel = (t: Rows<"conversation_threads">[number]) => {
      if (!t.assigned_user_id)
        return t.assigned_to
          ? `Unverified owner claim: ${t.assigned_to}`
          : null;
      const member = members.find(
        (m) => m.active && m.user_id === t.assigned_user_id,
      );
      return member
        ? `${member.display_name || "Member"} · ${member.user_id}`
        : `Unverified owner reference: ${t.assigned_user_id}`;
    };
    const snapshot: BackendSnapshot = {
      businessId,
      asOf: new Date(started).toISOString(),
      receipts: [],
      threads: threads.map((t) => ({
        ...t,
        stage: "new",
        assigned_to: ownerLabel(t),
      })),
      messages: messages as BackendSnapshot["messages"],
      answers,
      handoffs: handoffs.map((h) => ({
        ...h,
        assigned_to: null,
      })) as BackendSnapshot["handoffs"],
      appointments: linked(appointments, "appointments"),
      followups: linked(followups, "followup_jobs"),
    };
    const model = projectSnapshot(snapshot, businessId, "supabase");
    model.read = evidence();
    if (resources.some((r) => r.state !== "complete")) model.status = "partial";
    if (now() - started >= READ_TTL_MS) model.status = "stale";
    return model;

    function evidence(): ReadEvidence {
      const channelEvidence = resources.find(
        (r) => r.table === "business_channels",
      );
      const active = channels.filter(
        (c) => c.provider === "meta_whatsapp" && c.is_active,
      );
      return {
        businessName: business[0]?.name ?? null,
        timezone: profiles[0]?.timezone ?? null,
        retrievedAt: new Date(started).toISOString(),
        expiresAt: new Date(started + READ_TTL_MS).toISOString(),
        resources,
        connection:
          channelEvidence?.state !== "complete"
            ? "Unavailable — channel read incomplete"
            : !active.length
              ? "Disconnected — no active WhatsApp channel recorded"
              : `Live health unknown · ${active.length} active channel record(s); latest recorded verification ${
                  active
                    .map((c) => c.last_verified_at)
                    .filter(Boolean)
                    .sort()
                    .at(-1) ?? "unavailable"
                }`,
        scope:
          "Bounded visible business records; related details cover loaded conversations only. Independent reads are not an atomic snapshot.",
      };
    }
  } catch {
    return unavailable("error");
  }
}

export function currentReadState(
  model: ControlReadModel,
  now: number,
): ReadState {
  return model.read &&
    ["ready", "empty", "partial", "stale"].includes(model.status) &&
    now >= Date.parse(model.read.expiresAt)
    ? "stale"
    : model.status;
}
