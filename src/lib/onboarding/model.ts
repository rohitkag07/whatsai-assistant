import { z } from "zod";
export const templateIds = [
  "gym",
  "clinic",
  "real_estate",
  "seller",
  "admissions",
  "service",
] as const;
export type TemplateId = (typeof templateIds)[number];
export const questionCatalog = {
  interest: "Which offering are you interested in?",
  location: "Which location works for you?",
  preferred_time: "What day and time would you prefer?",
  appointment_type: "Which appointment service would you like to request?",
  budget: "What indicative budget range should the team consider?",
  timeline: "When are you hoping to get started?",
  quantity: "What quantity are you enquiring about?",
  program: "Which program are you interested in?",
  service_area: "Which area needs the service?",
} as const;
export type QuestionKey = keyof typeof questionCatalog;
export const clinicQuestions: QuestionKey[] = [
  "appointment_type",
  "location",
  "preferred_time",
];
const text = z.string().max(4000);
const question = z
  .object({
    key: z.enum(
      Object.keys(questionCatalog) as [QuestionKey, ...QuestionKey[]],
    ),
    required: z.boolean(),
  })
  .strict();
export const configurationSchema = z
  .object({
    identity: z
      .object({
        name: text,
        description: text,
        locations: text,
        timezone: text,
        hours: text,
        primaryLanguage: text,
        languages: text,
      })
      .strict(),
    offerings: z
      .object({
        items: text,
        pricing: text,
        availability: text,
        eligibility: text,
        allowedInformation: text,
        restrictedInformation: text,
      })
      .strict(),
    objective: z
      .object({
        goals: z
          .array(
            z.enum([
              "qualification",
              "appointment",
              "handoff",
              "resolution",
              "order",
              "followup",
            ]),
          )
          .max(6),
        outcome: text,
      })
      .strict(),
    qualification: z
      .object({
        questions: z.array(question).max(9),
        disqualification: text,
        urgency: text,
        incomplete: text,
        operatorEvidence: text,
      })
      .strict(),
    handoff: z
      .object({
        owner: text,
        conditions: text,
        acknowledgement: z.boolean(),
        escalation: text,
        afterHours: text,
        unknownOwner: text,
      })
      .strict(),
    nextAction: z
      .object({
        kind: z.enum([
          "appointment",
          "site_visit",
          "consultation",
          "callback",
          "demo",
          "order_assistance",
        ]),
        authority: text,
        cancellation: text,
      })
      .strict(),
    followup: z
      .object({
        enabled: z.boolean(),
        eligibility: text,
        delayHours: z.number().int().min(1).max(720),
        maxAttempts: z.number().int().min(1).max(5),
        pause: text,
        humanApproval: z.boolean(),
        reply: text,
        optOut: text,
      })
      .strict(),
    knowledge: z
      .object({
        facts: text,
        source: text,
        reviewedOn: text,
        restrictedClaims: text,
        missingAnswer: text,
        testQuestions: text,
      })
      .strict(),
    behavior: z
      .object({
        tone: text,
        boundaries: text,
        escalation: text,
        prohibited: text,
      })
      .strict(),
    review: z.object({ acknowledged: z.boolean() }).strict(),
  })
  .strict();
export type Configuration = z.infer<typeof configurationSchema>;
export type Section = keyof Configuration;
export type FieldPath = {
  [K in Section]: `${K}.${keyof Configuration[K] & string}`;
}[Section];
export const draftSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().uuid(),
    actorId: z.string().min(1).max(200),
    tenantContext: z.string().min(1).max(200).nullable(),
    templateId: z.enum(templateIds),
    templateVersion: z.literal(1),
    revision: z.number().int().nonnegative(),
    savedAt: z.string().datetime().nullable(),
    config: configurationSchema,
  })
  .strict();
export type OnboardingDraft = z.infer<typeof draftSchema>;
export type DraftScope = { actorId: string; tenantContext: string | null };
export type Lifecycle = "Draft" | "Ready for testing" | "Active";
export const steps: { id: Section; title: string; description: string }[] = [
  {
    id: "identity",
    title: "Business identity",
    description:
      "Give the assistant a clear picture of the business it will represent.",
  },
  {
    id: "offerings",
    title: "Products & services",
    description:
      "Define what is offered, what is known and where a human should help.",
  },
  {
    id: "objective",
    title: "Business objective",
    description:
      "Choose the job to be done and what would count as a verified outcome.",
  },
  {
    id: "qualification",
    title: "Qualification",
    description: "Ask only what the team needs to decide the next step.",
  },
  {
    id: "handoff",
    title: "Human handoff",
    description: "Make ownership explicit. A handoff needs acknowledgement.",
  },
  {
    id: "nextAction",
    title: "Appointment or next action",
    description: "Keep a request separate from a confirmed commitment.",
  },
  {
    id: "followup",
    title: "Follow-up policy",
    description: "Set the limits before any follow-up can run.",
  },
  {
    id: "knowledge",
    title: "Approved knowledge",
    description: "Record the business-approved facts and where they came from.",
  },
  {
    id: "behavior",
    title: "AI behavior",
    description: "Decide how the assistant speaks and when it must stop.",
  },
  {
    id: "review",
    title: "Review & test",
    description:
      "Check the proposal and try a local Synthetic conversation. Nothing activates here.",
  },
];
export const goalLabels = {
  qualification: "Lead qualification",
  appointment: "Appointment or visit request",
  handoff: "Sales handoff",
  resolution: "Enquiry resolution",
  order: "Order assistance",
  followup: "Eligible follow-up",
} as const;
export const actionLabels = {
  appointment: "Appointment request",
  site_visit: "Site visit request",
  consultation: "Consultation request",
  callback: "Callback request",
  demo: "Demo request",
  order_assistance: "Order assistance",
} as const;
