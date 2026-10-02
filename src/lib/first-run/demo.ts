import type { OnboardingDraft } from "@/lib/onboarding/model";
import {
  previewConversation,
  type PreviewScenario,
} from "@/lib/onboarding/preview";
export const sampleEnquiries = [
  "I would like to know more about your services.",
  "Please confirm my appointment for tomorrow.",
  "Can you guarantee the price and availability?",
  "Stop contacting me.",
  "मुझे आपकी service के बारे में जानना है।",
];
export function safeSample(input: string) {
  return (
    input.trim().length > 0 &&
    input.length <= 400 &&
    !/@|(?:\+?\d[\s().-]*){7,}|https?:\/\//i.test(input)
  );
}
export function syntheticTest(draft: OnboardingDraft, input: string) {
  if (!safeSample(input))
    throw new Error(
      "Use an invented enquiry under 400 characters without contact details or links.",
    );
  let scenario: PreviewScenario = "enquiry";
  if (/stop|unsubscribe|बंद/i.test(input)) scenario = "optout";
  else if (
    draft.templateId === "clinic" &&
    /diagnos|medicine|symptom|दवा/i.test(input)
  )
    scenario = "clinical";
  else if (/confirm|book|appointment|visit|कल/i.test(input))
    scenario = "request";
  else if (/guarantee|price|fees|availability|कीमत/i.test(input))
    scenario = "missing";
  return {
    ...previewConversation(draft, scenario),
    customer: input,
    scenario,
    binding: JSON.stringify(draft.config),
    qualification: `${draft.config.qualification.questions.length} configured questions; answers remain unknown. No qualified lead is inferred.`,
    handoff: `Proposed role: ${draft.config.handoff.owner || "Unassigned"}. ${draft.config.handoff.conditions} Acceptance is unverified.`,
    followup: draft.config.followup.enabled
      ? "Configured with human approval; blocked until consent, eligibility and provider evidence exist."
      : "Follow-up is configured off. No reminder is scheduled.",
  };
}
