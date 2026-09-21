import type { FieldPath, Section } from "./model";
export type FieldDefinition = {
  path: FieldPath;
  label: string;
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  type?: "date" | "number";
  min?: number;
  max?: number;
  advanced?: boolean;
};
export const fields: FieldDefinition[] = [
  {
    path: "identity.name",
    label: "Business name",
    required: true,
    placeholder: "Enter the actual business name",
  },
  {
    path: "identity.description",
    label: "What does the business do?",
    required: true,
    multiline: true,
  },
  {
    path: "identity.locations",
    label: "Locations or service areas",
    required: true,
    multiline: true,
    hint: "Business locations only. Do not enter customer addresses.",
  },
  {
    path: "identity.timezone",
    label: "Timezone",
    required: true,
    placeholder: "Asia/Kolkata",
    hint: "Use an IANA timezone, such as Asia/Kolkata.",
  },
  {
    path: "identity.hours",
    label: "Operating hours and closures",
    required: true,
    multiline: true,
    placeholder: "Mon–Fri 09:00–18:00; weekends closed",
    hint: "Include days, local opening/closing times and exceptions. This draft does not schedule work.",
  },
  {
    path: "identity.primaryLanguage",
    label: "Primary language",
    required: true,
    placeholder: "English",
  },
  {
    path: "identity.languages",
    label: "Supported languages",
    required: true,
    placeholder: "English, Hindi",
    hint: "Separate languages with commas and include the primary language.",
  },
  {
    path: "offerings.items",
    label: "Products or services offered",
    required: true,
    multiline: true,
    hint: "One offering per line. Describe business services, not customer cases.",
  },
  {
    path: "offerings.pricing",
    label: "Indicative pricing",
    multiline: true,
    hint: "Optional. Include currency, conditions and what needs a quote. Blank means Unknown.",
  },
  {
    path: "offerings.availability",
    label: "Availability policy",
    required: true,
    multiline: true,
    hint: "Who confirms stock, capacity or slots? Do not imply live availability.",
  },
  {
    path: "offerings.eligibility",
    label: "Eligibility and service boundaries",
    required: true,
    multiline: true,
  },
  {
    path: "offerings.allowedInformation",
    label: "Information the assistant may communicate",
    required: true,
    multiline: true,
    advanced: true,
  },
  {
    path: "offerings.restrictedInformation",
    label: "Information the assistant must not communicate",
    required: true,
    multiline: true,
    advanced: true,
  },
  {
    path: "objective.outcome",
    label: "Selected measurable outcome",
    required: true,
    multiline: true,
    hint: "Define the result and who or what verifies it. A message sent is not a conversion.",
  },
  {
    path: "qualification.disqualification",
    label: "Disqualification rules",
    required: true,
    multiline: true,
    hint: "Describe operational non-fit, or explicitly state that a human reviews every case.",
  },
  {
    path: "qualification.urgency",
    label: "Urgency signals",
    required: true,
    multiline: true,
  },
  {
    path: "qualification.incomplete",
    label: "When an answer is missing",
    required: true,
    multiline: true,
    advanced: true,
  },
  {
    path: "qualification.operatorEvidence",
    label: "Evidence shown to the operator",
    required: true,
    multiline: true,
    advanced: true,
  },
  {
    path: "handoff.owner",
    label: "Responsible owner or team",
    required: true,
    hint: "A proposed business role/team; not a verified assignment or permission grant.",
  },
  {
    path: "handoff.conditions",
    label: "When to hand off",
    required: true,
    multiline: true,
  },
  {
    path: "handoff.escalation",
    label: "Escalation path",
    required: true,
    multiline: true,
    hint: "Who handles a handoff that is not acknowledged?",
  },
  {
    path: "handoff.afterHours",
    label: "Outside operating hours",
    required: true,
    multiline: true,
    advanced: true,
  },
  {
    path: "handoff.unknownOwner",
    label: "When ownership is unknown",
    required: true,
    multiline: true,
    advanced: true,
  },
  {
    path: "nextAction.authority",
    label: "Who or what confirms the action?",
    required: true,
    multiline: true,
    hint: "Name the authoritative calendar, order system or human role. No connection is verified here.",
  },
  {
    path: "nextAction.cancellation",
    label: "Cancellation and rescheduling boundary",
    required: true,
    multiline: true,
  },
  {
    path: "followup.eligibility",
    label: "Eligibility requirements",
    required: true,
    multiline: true,
  },
  {
    path: "followup.delayHours",
    label: "Wait before follow-up (hours)",
    type: "number",
    min: 1,
    max: 720,
    required: true,
  },
  {
    path: "followup.maxAttempts",
    label: "Maximum attempts",
    type: "number",
    min: 1,
    max: 5,
    required: true,
  },
  {
    path: "followup.pause",
    label: "Pause conditions",
    required: true,
    multiline: true,
  },
  {
    path: "followup.reply",
    label: "When the customer replies",
    required: true,
    multiline: true,
    advanced: true,
  },
  {
    path: "followup.optOut",
    label: "When the customer opts out",
    required: true,
    multiline: true,
    advanced: true,
  },
  {
    path: "knowledge.facts",
    label: "Approved business facts",
    required: true,
    multiline: true,
    hint: "Business-approved content only. No patient information, personal customer records or credentials.",
  },
  {
    path: "knowledge.source",
    label: "Source or owner approval reference",
    required: true,
    hint: "For example, a document title/version or approval reference. Never paste a private access token.",
  },
  {
    path: "knowledge.reviewedOn",
    label: "Source last reviewed",
    required: true,
    type: "date",
    hint: "Owner-entered date; verification is still pending.",
  },
  {
    path: "knowledge.restrictedClaims",
    label: "Restricted claims",
    required: true,
    multiline: true,
    advanced: true,
  },
  {
    path: "knowledge.missingAnswer",
    label: "When knowledge is missing",
    required: true,
    multiline: true,
    advanced: true,
  },
  {
    path: "knowledge.testQuestions",
    label: "Questions to test before publishing",
    required: true,
    multiline: true,
    hint: "One operational question per line. These are test prompts, not customer conversations.",
  },
  {
    path: "behavior.tone",
    label: "Tone of voice",
    required: true,
    multiline: true,
  },
  {
    path: "behavior.boundaries",
    label: "Response boundaries",
    required: true,
    multiline: true,
  },
  {
    path: "behavior.escalation",
    label: "Escalation rules",
    required: true,
    multiline: true,
  },
  {
    path: "behavior.prohibited",
    label: "Prohibited actions",
    required: true,
    multiline: true,
    advanced: true,
  },
];
export function fieldsFor(section: Section) {
  return fields.filter((field) => field.path.startsWith(section + "."));
}
