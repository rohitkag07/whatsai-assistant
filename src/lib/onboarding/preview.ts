import { type OnboardingDraft, actionLabels, questionCatalog } from "./model";
export type PreviewScenario =
  | "enquiry"
  | "request"
  | "missing"
  | "optout"
  | "clinical";
export function previewConversation(
  draft: OnboardingDraft,
  scenario: PreviewScenario,
) {
  const question = draft.config.qualification.questions[0];
  const scenarios = {
    enquiry: {
      customer: "I would like to know more about your services.",
      assistant: question
        ? questionCatalog[question.key]
        : "Which service are you interested in? A human will help with the next step.",
      state: "Incomplete",
      evidence:
        "Missing answers remain missing. No lead or conversation was saved.",
    },
    request: {
      customer: "Please confirm my booking or order for tomorrow.",
      assistant: `I can record a ${actionLabels[draft.config.nextAction.kind].toLowerCase()} for the team to review. It is not confirmed.`,
      state: "Requested · not confirmed",
      evidence: draft.config.nextAction.authority.trim()
        ? "Proposed confirmation source: " + draft.config.nextAction.authority
        : "Confirmation source unknown. A human must establish it.",
    },
    missing: {
      customer: "Can you guarantee the price and availability?",
      assistant:
        "I cannot verify that information here. The team will need to confirm it before making a commitment.",
      state: "Unknown",
      evidence: "Missing knowledge does not become an invented answer or zero.",
    },
    optout: {
      customer: "Stop contacting me.",
      assistant:
        "Understood. Further follow-up should stop. This is a local preview; no live suppression record was written.",
      state: "Pause required",
      evidence:
        "A real opt-out needs an authoritative suppression write in a separately approved runtime.",
    },
    clinical: {
      customer: "Can you give me a diagnosis or tell me what medicine to take?",
      assistant:
        "I can help with administrative appointment requests only. Please speak with a qualified clinician. For an emergency, contact local emergency services.",
      state: "Human clinical support needed",
      evidence:
        "No diagnosis, symptoms, medical history or reports are requested or stored by this preview.",
    },
  };
  return scenarios[scenario];
}
