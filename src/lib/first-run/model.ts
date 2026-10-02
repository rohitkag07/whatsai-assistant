import type { OnboardingDraft, Section } from "@/lib/onboarding/model";
import { steps } from "@/lib/onboarding/model";
import { validateDraft } from "@/lib/onboarding/validation";
export type ReadinessState =
  | "ready"
  | "empty"
  | "partial"
  | "stale"
  | "denied"
  | "disconnected"
  | "error"
  | "unavailable";
export type ReadinessSnapshot = {
  businessId: string;
  businessName: string | null;
  source: "Synthetic" | "Supabase · Non-production read" | "Unavailable";
  state: ReadinessState;
  observedAt: string | null;
  version: { id: string; hash: string; draft: OnboardingDraft } | null;
  approval:
    | "Valid owner approval"
    | "Expired or revoked"
    | "Not approved"
    | "Unknown";
  publication: "Staging published" | "Not published" | "Unknown";
  channel: "Disconnected" | "Recorded connection · unverified" | "Unknown";
};
export function blankReadiness(
  businessId: string,
  state: ReadinessState = "unavailable",
): ReadinessSnapshot {
  return {
    businessId,
    businessName: null,
    source: "Unavailable",
    state,
    observedAt: null,
    version: null,
    approval: "Unknown",
    publication: "Unknown",
    channel: "Unknown",
  };
}
// A browser-held observation is not indefinitely current. Staleness removes approval claims.
export function readinessAt(
  snapshot: ReadinessSnapshot,
  now: number,
): ReadinessSnapshot {
  if (
    snapshot.source === "Synthetic" ||
    !snapshot.observedAt ||
    snapshot.state === "denied"
  )
    return snapshot;
  const observed = Date.parse(snapshot.observedAt);
  if (
    !Number.isFinite(observed) ||
    observed > now + 60_000 ||
    now - observed > 300_000
  )
    return {
      ...snapshot,
      state: "stale",
      approval: "Unknown",
      publication: "Unknown",
      channel: "Unknown",
    };
  return snapshot;
}
export function readinessChecklist(
  snapshot: ReadinessSnapshot,
  draft: OnboardingDraft | null,
  dirty = false,
) {
  const issues = draft ? validateDraft(draft) : [];
  const ids: Section[] = [
    "identity",
    "offerings",
    "qualification",
    "knowledge",
    "handoff",
    "followup",
  ];
  const items: {
    id: Section | "authority" | "channel";
    title: string;
    status: string;
    detail: string;
  }[] = ids.map((id) => ({
    id,
    title: steps.find((s) => s.id === id)!.title,
    status:
      draft && !issues.some((i) => i.section === id)
        ? "Configured proposal"
        : "Incomplete",
    detail: dirty
      ? "Unsaved edits; not approved or published."
      : "Configuration values require business review.",
  }));
  const sameVersion = Boolean(
    snapshot.version &&
      draft &&
      JSON.stringify(snapshot.version.draft.config) ===
        JSON.stringify(draft.config) &&
      !dirty,
  );
  items.push({
    id: "authority",
    title: "Owner approval / staging publication",
    status: sameVersion
      ? `${snapshot.approval} / ${snapshot.publication}`
      : "Unknown for this proposal",
    detail: "Local review never substitutes for hash-bound owner approval.",
  });
  items.push({
    id: "channel",
    title: "WhatsApp connection",
    status: snapshot.channel,
    detail: "A recorded connection is not activation or proof of delivery.",
  });
  return items;
}
export function nextSetupAction(
  snapshot: ReadinessSnapshot,
  draft: OnboardingDraft | null,
  dirty = false,
  tested = false,
) {
  if (!draft)
    return {
      label: "Configure your workflow",
      detail: "Choose a template and add the business-approved information.",
      target: "configure" as const,
    };
  const issues = validateDraft(draft);
  if (dirty || issues.length)
    return {
      label: "Complete and save your proposal",
      detail: dirty ? "Save your edits before testing." : issues[0].message,
      target: "configure" as const,
    };
  if (!tested)
    return {
      label: "Try a Synthetic enquiry",
      detail:
        "Inspect the configured workflow without a real send or customer record.",
      target: "test" as const,
    };
  if (
    snapshot.publication !== "Staging published" ||
    !snapshot.version ||
    JSON.stringify(snapshot.version.draft.config) !==
      JSON.stringify(draft.config)
  )
    return {
      label: "Review staging publication evidence",
      detail:
        "Your Synthetic test is complete. Owner approval and a published version still need verified evidence.",
      target: "result" as const,
    };
  return {
    label: "Review the channel blocker",
    detail:
      "Staging publication is not activation. Connection, consent and controlled-release verification remain separate.",
    target: "result" as const,
  };
}
export function safeReturnPath(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return "/";
  try {
    const url = new URL(value, "https://local.invalid");
    return url.origin === "https://local.invalid"
      ? url.pathname + url.search + url.hash
      : "/";
  } catch {
    return "/";
  }
}
