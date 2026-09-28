import {
  appointmentStates,
  stages,
  type BackendSnapshot,
  type ControlReadModel,
  type Receipt,
  type Stage,
} from "./model";

// Pure projection only. No client, environment, fetch or mutation capability.
export function projectSnapshot(
  input: BackendSnapshot,
  expectedBusinessId: string,
  source: "synthetic" | "supabase" = "synthetic",
): ControlReadModel {
  const fail = () => {
    throw new Error("The scoped snapshot could not be verified.");
  };
  const date = (value: string) => Number.isFinite(Date.parse(value));
  if (
    !expectedBusinessId ||
    input.businessId !== expectedBusinessId ||
    !date(input.asOf)
  )
    fail();
  const threads = new Map(input.threads.map((row) => [row.id, row]));
  for (const rows of [
    input.threads,
    input.messages,
    input.answers,
    input.handoffs,
    input.appointments,
    input.followups,
  ]) {
    if (new Set(rows.map((row) => row.id)).size !== rows.length) fail();
    for (const row of rows) {
      if (!row.id) fail();
      if ("business_id" in row && row.business_id !== expectedBusinessId)
        fail();
    }
  }
  for (const thread of input.threads)
    if (
      !date(thread.created_at) ||
      (thread.last_message_at && !date(thread.last_message_at))
    )
      fail();
  for (const row of [
    ...input.messages,
    ...input.answers,
    ...input.handoffs,
    ...input.appointments,
    ...input.followups,
  ]) {
    if (!row.thread_id || !threads.has(row.thread_id)) fail();
    if (
      "contact_id" in row &&
      row.contact_id !== threads.get(row.thread_id!)?.contact_id
    )
      fail();
    if ("created_at" in row && !date(row.created_at)) fail();
    if ("extracted_at" in row && !date(row.extracted_at)) fail();
    if ("scheduled_at" in row && !date(row.scheduled_at)) fail();
  }
  const domainRows = {
    case: input.threads,
    appointment: input.appointments,
    followup: input.followups,
  };
  for (const receipt of input.receipts) {
    const row = domainRows[receipt.domain]?.find(
      (item) => item.id === receipt.recordId,
    );
    if (
      !row ||
      receipt.businessId !== expectedBusinessId ||
      !threads.has(receipt.threadId) ||
      ("thread_id" in row
        ? row.thread_id !== receipt.threadId
        : row.id !== receipt.threadId) ||
      !date(receipt.at) ||
      Date.parse(receipt.at) > Date.parse(input.asOf) ||
      !receipt.reference.trim() ||
      !receipt.detail.trim() ||
      !["human", "system"].includes(receipt.authority) ||
      (receipt.authority === "human" && !receipt.actor?.trim())
    )
      fail();
    const allowed =
      receipt.domain === "case"
        ? stages
        : receipt.domain === "appointment"
          ? appointmentStates
          : ["Replied"];
    if (!(allowed as readonly string[]).includes(receipt.value)) fail();
  }
  const latest = (domain: Receipt["domain"], id: string) =>
    input.receipts
      .filter((r) => r.domain === domain && r.recordId === id)
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0] ?? null;
  const cases = input.threads.map((thread) => {
    const receipt = latest("case", thread.id);
    // Explicit evidence wins. Legacy stage, count, reply and extracted answers never qualify or close a case.
    let stage: Stage = receipt
      ? (receipt.value as Stage)
      : thread.assigned_to
        ? "Assigned"
        : "New";
    if (stage === "Assigned" && !thread.assigned_to) stage = "Outcome unknown";
    if (
      stage === "Human acknowledged" &&
      (!thread.assigned_to || receipt?.authority !== "human")
    )
      stage = "Outcome unknown";
    return {
      id: thread.id,
      label: `${source === "synthetic" ? "Synthetic · " : ""}Enquiry ${thread.id}`,
      intent: thread.summary || "Intent unknown",
      openedAt: thread.created_at,
      lastAt: thread.last_message_at,
      owner: thread.assigned_to,
      mode: thread.ai_mode,
      stage,
      receipt,
      answers: input.answers.filter((r) => r.thread_id === thread.id),
      messages: input.messages
        .filter((r) => r.thread_id === thread.id)
        .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)),
      handoff:
        input.handoffs
          .filter((r) => r.thread_id === thread.id)
          .sort(
            (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
          )[0] ?? null,
    };
  });
  return {
    businessId: expectedBusinessId,
    asOf: input.asOf,
    source,
    status: cases.length ? "ready" : "empty",
    cases,
    appointments: input.appointments.map((row) => {
      const receipt = latest("appointment", row.id);
      return {
        id: row.id,
        threadId: row.thread_id!,
        title: row.title,
        scheduledAt: row.scheduled_at,
        recordedStatus: row.status,
        state: receipt
          ? (receipt.value as (typeof appointmentStates)[number])
          : "Verification unavailable",
        receipt,
      };
    }),
    followups: input.followups.map((row) => {
      const receipt = latest("followup", row.id);
      return {
        id: row.id,
        threadId: row.thread_id!,
        scheduledAt: row.scheduled_at,
        state:
          receipt?.value === "Replied"
            ? "Replied"
            : row.status === "failed"
              ? "Failed"
              : row.status === "cancelled"
                ? "Paused"
                : row.status === "pending"
                  ? Date.parse(row.scheduled_at) <= Date.parse(input.asOf)
                    ? "Due"
                    : "Scheduled"
                  : "Outcome unknown",
        reason:
          row.error ||
          "Recorded sequence step; business reason requires review",
        owner: threads.get(row.thread_id)?.assigned_to ?? null,
        eligibility: "Unknown — consent and window unverified",
        attempts: null,
        approval: "Required before any real send",
        stopReason:
          row.status === "cancelled"
            ? "Paused in source; reason unverified"
            : row.status === "failed"
              ? "Execution failed; human review required"
              : receipt?.value === "Replied"
                ? "Reply recorded; pause further attempts"
                : "Unknown — check reply and opt-out records",
        receipt,
      };
    }),
  };
}
export function unavailableModel(businessId: string): ControlReadModel {
  return {
    businessId,
    asOf: null,
    source: "unavailable",
    status: "unavailable",
    cases: [],
    appointments: [],
    followups: [],
  };
}
