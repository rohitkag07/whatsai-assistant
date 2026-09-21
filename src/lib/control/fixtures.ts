import {
  stages,
  appointmentStates,
  type BackendSnapshot,
  type Receipt,
} from "./model";
// Local examples only. No real customers, contacts, phone numbers or measured results.
export function syntheticSnapshot(businessId: string): BackendSnapshot {
  const asOf = "2026-09-21T09:00:00.000Z";
  const intents = [
    "Asks about a trial visit",
    "Needs course timing",
    "Wants a site visit",
    "Requests product availability",
    "Asks for a consultation",
    "Requests an appointment",
    "Checks a proposed time",
    "Completion requires a receipt",
    "Outside the service area",
    "No outcome has been reported",
  ];
  const threads = stages.map((_, i) => ({
    id: `E-${String(i + 1).padStart(2, "0")}`,
    business_id: businessId,
    contact_id: `synthetic-contact-${i}`,
    summary: intents[i],
    assigned_to: i >= 3 ? "Synthetic coordinator" : null,
    ai_mode: i === 4 ? ("manual" as const) : ("assistant" as const),
    stage: "new" as const,
    created_at: `2026-09-${i === 0 ? "21" : "20"}T07:00:00.000Z`,
    last_message_at: "2026-09-21T08:30:00.000Z",
  }));
  const receipt = (
    domain: Receipt["domain"],
    recordId: string,
    threadId: string,
    value: string,
  ): Receipt => ({
    domain,
    recordId,
    threadId,
    businessId,
    value,
    authority: "human",
    actor: "Synthetic reviewer",
    reference: `synthetic-receipt-${recordId}`,
    at: "2026-09-21T08:00:00.000Z",
    detail: `Synthetic ${value.toLowerCase()} verification example. No real action or business outcome occurred.`,
  });
  const appointments = appointmentStates.map((_, i) => ({
    id: `A-${i + 1}`,
    business_id: businessId,
    thread_id: threads[i].id,
    contact_id: threads[i].contact_id,
    title: "Synthetic consultation",
    scheduled_at: "2026-09-22T10:00:00.000Z",
    status: "scheduled" as const,
  }));
  const statuses = [
    "pending",
    "pending",
    "cancelled",
    "sent",
    "failed",
    "sent",
  ] as const;
  const followups = statuses.map((status, i) => ({
    id: `F-${i + 1}`,
    business_id: businessId,
    thread_id: threads[i + 3].id,
    contact_id: threads[i + 3].contact_id,
    scheduled_at:
      i === 1 ? "2026-09-22T09:00:00.000Z" : "2026-09-21T08:00:00.000Z",
    status,
    sent_at: status === "sent" ? "2026-09-21T08:00:00.000Z" : null,
    error:
      status === "failed"
        ? "Synthetic provider timeout; delivery unknown"
        : null,
    step_index: i,
  }));
  return {
    businessId,
    asOf,
    threads,
    messages: threads.flatMap((t, i) => [
      {
        id: `M-${i}-in`,
        business_id: businessId,
        thread_id: t.id,
        direction: "inbound" as const,
        body: `Synthetic enquiry: ${intents[i].toLowerCase()}.`,
        agent: null,
        created_at: t.created_at,
        status: "read" as const,
      },
      {
        id: `M-${i}-out`,
        business_id: businessId,
        thread_id: t.id,
        direction: "outbound" as const,
        body: "Synthetic assistant: I can record your request. A person must confirm the next action.",
        agent: "assistant",
        created_at: "2026-09-21T07:30:00.000Z",
        status: "sent" as const,
      },
    ]),
    answers: threads
      .slice(1)
      .map((t, i) => ({
        id: `Q-${i}`,
        thread_id: t.id,
        question_key: "preferred_time",
        answer_value: "Synthetic: weekday afternoon",
        confidence: null,
        extracted_at: "2026-09-21T07:15:00.000Z",
      })),
    handoffs: threads
      .slice(3, 6)
      .map((t, i) => ({
        id: `H-${i}`,
        business_id: businessId,
        thread_id: t.id,
        reason: "Synthetic customer requested a human",
        status: i === 1 ? ("acknowledged" as const) : ("open" as const),
        assigned_to: t.assigned_to,
        created_at: "2026-09-21T07:40:00.000Z",
      })),
    appointments,
    followups,
    receipts: [
      ...threads.map((t, i) => receipt("case", t.id, t.id, stages[i])),
      ...appointments
        .slice(0, 7)
        .map((a, i) =>
          receipt("appointment", a.id, a.thread_id, appointmentStates[i]),
        ),
      receipt("followup", "F-4", followups[3].thread_id, "Replied"),
    ],
  };
}
