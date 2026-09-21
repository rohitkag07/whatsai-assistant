import {
  clinicQuestions,
  configurationSchema,
  draftSchema,
  type Configuration,
  type FieldPath,
  type OnboardingDraft,
  type Section,
  type Lifecycle,
} from "./model";
import { fields } from "./fields";
export type Issue = { path: string; section: Section; message: string };
export function fieldValue(
  config: Configuration,
  path: FieldPath,
): string | number | boolean | unknown[] {
  const [section, key] = path.split(".");
  return (
    config[section as Section] as unknown as Record<
      string,
      string | number | boolean | unknown[]
    >
  )[key];
}
export function withField(
  draft: OnboardingDraft,
  path: FieldPath,
  value: unknown,
): OnboardingDraft {
  const [section, key] = path.split(".") as [Section, string];
  return {
    ...draft,
    config: {
      ...draft.config,
      [section]: { ...draft.config[section], [key]: value },
      review: {
        acknowledged: path === "review.acknowledged" ? Boolean(value) : false,
      },
    },
  };
}
export function clinicBoundaryValid(draft: OnboardingDraft) {
  return (
    draft.templateId !== "clinic" ||
    draft.config.qualification.questions.every((q) =>
      clinicQuestions.includes(q.key),
    )
  );
}
export function validateDraft(
  draft: OnboardingDraft,
  today = new Date().toISOString().slice(0, 10),
): Issue[] {
  const issues: Issue[] = [];
  const add = (path: string, message: string) =>
    issues.push({ path, section: path.split(".")[0] as Section, message });
  const shape = configurationSchema.safeParse(draft.config);
  if (!shape.success)
    for (const error of shape.error.issues)
      add(error.path.join("."), error.message);
  for (const field of fields) {
    if (
      !field.required ||
      (field.path.startsWith("followup.") && !draft.config.followup.enabled)
    )
      continue;
    const value = fieldValue(draft.config, field.path);
    if (
      typeof value === "string" &&
      (!value.trim() ||
        /^(unknown|incomplete|not connected|tbd)$/i.test(value.trim()))
    )
      add(field.path, `Add ${field.label.toLowerCase()}.`);
  }
  try {
    new Intl.DateTimeFormat("en", {
      timeZone: draft.config.identity.timezone,
    }).format();
  } catch {
    add("identity.timezone", "Enter a valid IANA timezone.");
  }
  const { primaryLanguage, languages, hours } = draft.config.identity;
  if (
    primaryLanguage.trim() &&
    !languages
      .toLowerCase()
      .split(",")
      .map((s) => s.trim())
      .includes(primaryLanguage.trim().toLowerCase())
  )
    add(
      "identity.languages",
      "Include the primary language in supported languages.",
    );
  if (
    hours.trim() &&
    !/\b(?:[01]\d|2[0-3]):[0-5]\d\b/.test(hours) &&
    !/24\s*(?:\/\s*7|hours)/i.test(hours)
  )
    add(
      "identity.hours",
      "Include local times in HH:MM format, or explicitly state 24/7.",
    );
  if (!draft.config.objective.goals.length)
    add("objective.goals", "Select at least one business objective.");
  const questions = draft.config.qualification.questions;
  if (!questions.length)
    add("qualification.questions", "Select at least one operational question.");
  if (new Set(questions.map((q) => q.key)).size !== questions.length)
    add("qualification.questions", "Use each question only once.");
  if (!clinicBoundaryValid(draft))
    add(
      "qualification.questions",
      "Clinic intake is limited to appointment type, location and preferred time.",
    );
  if (!draft.config.handoff.acknowledgement)
    add(
      "handoff.acknowledgement",
      "Require acknowledgement before a handoff is considered accepted.",
    );
  if (draft.config.followup.enabled && !draft.config.followup.humanApproval)
    add(
      "followup.humanApproval",
      "Keep human approval required for this pilot configuration.",
    );
  const date = draft.config.knowledge.reviewedOn;
  if (
    date &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date ||
      date > today)
  )
    add(
      "knowledge.reviewedOn",
      "Enter a valid review date that is not in the future.",
    );
  if (!draft.config.review.acknowledged)
    add(
      "review.acknowledged",
      "Review the configuration before marking it ready for a local test.",
    );
  return issues.filter(
    (issue, index, all) =>
      all.findIndex((other) => other.path === issue.path) === index,
  );
}
export function lifecycle(draft: OnboardingDraft, unsaved: boolean): Lifecycle {
  return !unsaved && draft.revision > 0 && validateDraft(draft).length === 0
    ? "Ready for testing"
    : "Draft";
}
export function parseDraft(value: unknown): OnboardingDraft {
  const draft = draftSchema.parse(value);
  if (!clinicBoundaryValid(draft))
    throw new Error("Unsafe clinic qualification fields.");
  return draft;
}
export const activationRequirements = [
  {
    title: "Configuration published",
    state: "Not published",
    detail: "Local drafts do not change the live assistant.",
  },
  {
    title: "Business and messaging consent",
    state: "Unverified",
    detail: "A local review acknowledgement is not a consent receipt.",
  },
  {
    title: "WhatsApp connection",
    state: "Not connected",
    detail: "No channel verification was performed here.",
  },
  {
    title: "Security and workflow verification",
    state: "Unverified",
    detail:
      "Live authorization, data boundaries and end-to-end behavior need separate verification.",
  },
] as const;
