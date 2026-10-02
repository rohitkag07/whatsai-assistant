import type { DraftScope } from "@/lib/onboarding/model";
import { createDraft } from "@/lib/onboarding/templates";
import type { ReadinessSnapshot } from "./model";
export function syntheticReadiness(scope: DraftScope): ReadinessSnapshot {
  const draft = createDraft(
    "service",
    scope,
    "55555555-5555-4555-8555-555555555555",
  );
  Object.assign(draft.config.identity, {
    name: "Synthetic · संकल्प service workspace",
    description: "Synthetic configuration for local review only.",
    locations: "Synthetic location — not a real address",
    hours: "Mon–Fri 09:00–18:00",
    primaryLanguage: "English",
    languages: "English, Hindi",
  });
  Object.assign(draft.config.offerings, {
    items: "Synthetic introductory consultation",
    availability: "Human confirmation required.",
    eligibility: "Human reviews operational fit.",
  });
  Object.assign(draft.config.qualification, {
    disqualification: "Human reviews non-fit decisions.",
    urgency: "Explicit requests for a human are reviewed.",
  });
  Object.assign(draft.config.handoff, {
    owner: "Synthetic coordinator role",
    escalation: "Synthetic supervisor role",
  });
  draft.config.nextAction.authority =
    "Synthetic scheduling ledger — not connected";
  Object.assign(draft.config.knowledge, {
    facts: "Synthetic consultation requires human confirmation.",
    source: "Synthetic policy v1",
    reviewedOn: "2026-09-18",
    testQuestions: "Synthetic: how is a request confirmed?",
  });
  draft.config.review.acknowledged = true;
  return {
    businessId: scope.tenantContext!,
    businessName: draft.config.identity.name,
    source: "Synthetic",
    state: "ready",
    observedAt: "2026-10-02T18:00:00Z",
    version: { id: draft.id, hash: "a".repeat(64), draft },
    approval: "Valid owner approval",
    publication: "Staging published",
    channel: "Disconnected",
  };
}
