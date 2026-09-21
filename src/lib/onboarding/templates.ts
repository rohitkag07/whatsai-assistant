import {
  type Configuration,
  type DraftScope,
  type OnboardingDraft,
  type QuestionKey,
  type TemplateId,
} from "./model";
export type OnboardingTemplate = {
  id: TemplateId;
  name: string;
  description: string;
  objective: Configuration["objective"]["goals"];
  questions: QuestionKey[];
  nextAction: Configuration["nextAction"]["kind"];
  outcome: string;
  boundary: string;
  category: string;
};
export const templates: OnboardingTemplate[] = [
  {
    id: "gym",
    name: "Gym & fitness",
    description: "Turn enquiries into a staffed trial or consultation request.",
    objective: ["qualification", "appointment"],
    questions: ["interest", "location", "preferred_time"],
    nextAction: "appointment",
    outcome:
      "Trial attendance verified by the front desk; membership only after a payment receipt.",
    boundary:
      "Do not promise fitness results, provide medical advice or infer membership payment.",
    category: "gym",
  },
  {
    id: "clinic",
    name: "Clinic appointments",
    description:
      "Administrative appointment requests with a strict non-clinical boundary.",
    objective: ["appointment", "resolution"],
    questions: ["appointment_type", "location", "preferred_time"],
    nextAction: "appointment",
    outcome:
      "Appointment attendance verified by the clinic desk; no clinical outcome tracking.",
    boundary:
      "Administrative scheduling only. Never ask for diagnosis, symptoms, medical history, prescriptions or reports. Never give medical advice. Escalate medical requests to the clinic; emergencies require local emergency services.",
    category: "clinic",
  },
  {
    id: "real_estate",
    name: "Real estate sales",
    description:
      "Understand requirements and route an accountable site-visit request.",
    objective: ["qualification", "handoff"],
    questions: ["location", "budget", "timeline"],
    nextAction: "site_visit",
    outcome:
      "Site visit attended, verified by the assigned salesperson. Sale requires authoritative closing evidence.",
    boundary:
      "No guaranteed returns, legal assurances or invented inventory availability.",
    category: "real_estate",
  },
  {
    id: "seller",
    name: "Product seller",
    description:
      "Answer product enquiries and collect the next order-assistance step.",
    objective: ["order", "handoff"],
    questions: ["interest", "quantity", "location"],
    nextAction: "order_assistance",
    outcome:
      "Order acceptance and payment verified in the authoritative order system, not inferred from a message.",
    boundary:
      "Never invent stock, delivery dates, discounts, payments or accepted orders.",
    category: "other",
  },
  {
    id: "admissions",
    name: "Coaching & admissions",
    description: "Qualify program enquiries and arrange a counsellor callback.",
    objective: ["qualification", "handoff"],
    questions: ["program", "location", "timeline"],
    nextAction: "callback",
    outcome:
      "Counselling completed, verified by a counsellor; enrolment requires an admissions record.",
    boundary:
      "No guaranteed admission, placement or exam results. Do not collect student IDs or unnecessary personal records.",
    category: "coaching",
  },
  {
    id: "service",
    name: "General services",
    description: "Establish service fit and arrange a human-led consultation.",
    objective: ["qualification", "resolution"],
    questions: ["interest", "service_area", "preferred_time"],
    nextAction: "consultation",
    outcome:
      "Service completion verified by an accepted job record, not by a reply or quote request.",
    boundary:
      "Do not promise a fixed quote, service capacity or completion date without confirmation.",
    category: "local_service",
  },
];
export function createDraft(
  templateId: TemplateId,
  scope: DraftScope,
  id: string,
): OnboardingDraft {
  const template = templates.find((item) => item.id === templateId)!;
  return {
    schemaVersion: 1,
    id,
    ...scope,
    templateId,
    templateVersion: 1,
    revision: 0,
    savedAt: null,
    config: {
      identity: {
        name: "",
        description: "",
        locations: "",
        timezone: "Asia/Kolkata",
        hours: "",
        primaryLanguage: "",
        languages: "",
      },
      offerings: {
        items: "",
        pricing: "",
        availability: "",
        eligibility: "",
        allowedInformation:
          "Owner-approved facts only. Ask a human when a fact is missing.",
        restrictedInformation: template.boundary,
      },
      objective: { goals: [...template.objective], outcome: template.outcome },
      qualification: {
        questions: template.questions.map((key) => ({ key, required: true })),
        disqualification: "",
        urgency: "",
        incomplete:
          "Ask one missing operational question at a time. Do not infer an answer.",
        operatorEvidence:
          "Show the enquiry, supplied answers, missing answers, the applicable rule and the requested next action.",
      },
      handoff: {
        owner: "",
        conditions:
          "A customer asks for a human, a boundary is reached or required information cannot be established.",
        acknowledgement: true,
        escalation: "",
        afterHours:
          "Explain that the team is unavailable and record a request for the next operating window. Do not promise a response time.",
        unknownOwner:
          "Keep the handoff unassigned and visible for review. Do not claim that someone has accepted it.",
      },
      nextAction: {
        kind: template.nextAction,
        authority: "",
        cancellation:
          "A human or authoritative booking/order source must confirm changes. A request is not a completed cancellation or reschedule.",
      },
      followup: {
        enabled: false,
        eligibility:
          "Only when permitted consent and conversation eligibility are verified.",
        delayHours: 24,
        maxAttempts: 2,
        pause:
          "Pause on human takeover, a reply, an opt-out, a complaint or an unknown eligibility state.",
        humanApproval: true,
        reply:
          "Pause the sequence and route the reply to the current conversation owner.",
        optOut:
          "Stop further follow-ups immediately on an opt-out; record the suppression through the approved system.",
      },
      knowledge: {
        facts: "",
        source: "",
        reviewedOn: "",
        restrictedClaims: template.boundary,
        missingAnswer:
          "Say the information is unavailable and request an accountable human response. Never invent it.",
        testQuestions: "",
      },
      behavior: {
        tone: "Clear, respectful and concise. Ask one question at a time.",
        boundaries: template.boundary,
        escalation:
          "Escalate an uncertain answer, a complaint or a request beyond approved policy.",
        prohibited:
          "No unapproved sends, payments, promises, sensitive-data requests or changes to a confirmed booking. " +
          template.boundary,
      },
      review: { acknowledged: false },
    },
  };
}
