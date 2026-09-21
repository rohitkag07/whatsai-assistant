// Synthetic fixtures only. Never customer evidence or runtime defaults.
import { createDraft } from "../../src/lib/onboarding/templates";
import type { TemplateId } from "../../src/lib/onboarding/model";
export const syntheticScope = {
  actorId: "dev-auth-bypass-user",
  tenantContext: "synthetic-foundation-business",
};
export const syntheticId = "11111111-1111-4111-8111-111111111111";
export function completeSyntheticDraft(
  template: TemplateId = "service",
  id = syntheticId,
) {
  const draft = createDraft(template, syntheticScope, id);
  Object.assign(draft.config.identity, {
    name: "Synthetic setup example",
    description: "Synthetic operational configuration for review only.",
    locations: "Synthetic location — not a real address",
    hours: "Mon–Fri 09:00–18:00; weekends closed",
    primaryLanguage: "English",
    languages: "English, Hindi",
  });
  Object.assign(draft.config.offerings, {
    items: "Synthetic introductory consultation",
    availability:
      "Human review required; availability unknown until confirmed.",
    eligibility: "Human reviews operational fit before accepting a request.",
  });
  Object.assign(draft.config.qualification, {
    disqualification: "A human reviews every non-fit decision.",
    urgency: "An explicit request for a human is routed for review.",
  });
  Object.assign(draft.config.handoff, {
    owner: "Synthetic coordinator role",
    escalation: "Synthetic supervisor role, acceptance required.",
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
  return draft;
}
