import { describe, it, expect } from "vitest";
import {
  completeSyntheticDraft,
  syntheticScope,
  syntheticId,
} from "../../../tests/fixtures/onboarding";
import { createDraft, templates } from "./templates";
import { draftSchema } from "./model";
import {
  activationRequirements,
  lifecycle,
  parseDraft,
  validateDraft,
  withField,
} from "./validation";
import { previewConversation } from "./preview";
import { onboardingEnabled } from "./flags";
import { productNavigation } from "../product-navigation";

describe("one configurable onboarding model", () => {
  it.each(templates)(
    "$name uses one schema, starts incomplete, and has no activation authority",
    (template) => {
      const draft = createDraft(template.id, syntheticScope, syntheticId);
      expect(draftSchema.safeParse(draft).success).toBe(true);
      expect(
        validateDraft(draft).some((issue) => issue.path === "identity.name"),
      ).toBe(true);
      expect(lifecycle(draft, true)).toBe("Draft");
      expect(draft.config.followup.enabled).toBe(false);
      expect(draft.config.knowledge.facts).toBe("");
      expect(draft.savedAt).toBeNull();
      expect(Object.keys(draft.config)).toHaveLength(10);
    },
  );
  it.each(templates)(
    "$name can be complete for a local test but never Active",
    (template) => {
      const draft = completeSyntheticDraft(template.id);
      expect(validateDraft(draft)).toEqual([]);
      expect(lifecycle(draft, false)).toBe("Draft");
      draft.revision = 1;
      expect(lifecycle(draft, false)).toBe("Ready for testing");
      expect(lifecycle(draft, true)).toBe("Draft");
      expect(
        activationRequirements.every(
          (item) => item.state !== ("Verified" as string),
        ),
      ).toBe(true);
    },
  );
  it("does not mutate template defaults or another draft, and edits invalidate review", () => {
    const a = completeSyntheticDraft();
    const b = completeSyntheticDraft();
    const changed = withField(a, "identity.name", "Synthetic changed");
    expect(changed.config.review.acknowledged).toBe(false);
    expect(a.config.identity.name).toBe(b.config.identity.name);
    a.config.qualification.questions[0].required = false;
    expect(b.config.qualification.questions[0].required).toBe(true);
    expect(
      createDraft("service", syntheticScope, syntheticId).config.identity.name,
    ).toBe("");
  });
  it("validates timezone, language consistency, date, numeric limits and handoff evidence", () => {
    const draft = completeSyntheticDraft();
    draft.config.identity.timezone = "Unknown/City";
    draft.config.identity.languages = "Hindi";
    draft.config.identity.hours = "25:99";
    draft.config.knowledge.reviewedOn = "2099-02-31";
    draft.config.handoff.acknowledgement = false;
    draft.config.followup.enabled = true;
    draft.config.followup.maxAttempts = 100;
    draft.config.followup.humanApproval = false;
    const paths = validateDraft(draft).map((issue) => issue.path);
    for (const path of [
      "identity.timezone",
      "identity.languages",
      "identity.hours",
      "knowledge.reviewedOn",
      "handoff.acknowledgement",
      "followup.maxAttempts",
      "followup.humanApproval",
    ])
      expect(paths).toContain(path);
  });
  it("limits clinic questions to operational scheduling and rejects tampered medical fields", () => {
    const draft = completeSyntheticDraft("clinic");
    draft.config.qualification.questions.push({
      key: "budget",
      required: false,
    });
    expect(
      validateDraft(draft).some(
        (issue) => issue.path === "qualification.questions",
      ),
    ).toBe(true);
    expect(() => parseDraft(draft)).toThrow();
    const unsafe = {
      ...completeSyntheticDraft("clinic"),
      diagnosis: "Synthetic forbidden field",
    };
    expect(() => parseDraft(unsafe)).toThrow();
  });
  it("rejects stored Active status, extra authority fields and future schema versions", () => {
    const draft = completeSyntheticDraft();
    for (const extra of [
      { status: "Active" },
      { consentVerified: true },
      { schemaVersion: 2 },
    ])
      expect(() => parseDraft({ ...draft, ...extra })).toThrow();
  });
  it("keeps requested/confirmed and activity/outcome distinct in every preview", () => {
    for (const template of templates) {
      const draft = completeSyntheticDraft(template.id);
      expect(previewConversation(draft, "request").state).toBe(
        "Requested · not confirmed",
      );
      expect(previewConversation(draft, "missing").state).toBe("Unknown");
      expect(previewConversation(draft, "optout").assistant).toContain(
        "no live suppression record was written",
      );
    }
    expect(
      previewConversation(completeSyntheticDraft("clinic"), "clinical")
        .assistant,
    ).toContain("administrative appointment requests only");
  });
  it("requires explicit server flag, Command foundation and admin/dev; flag-off nav equals Phase 1", () => {
    const context = {
      platformRole: "admin" as const,
      activeBusinessId: null,
      memberships: [],
    };
    const env = {
      XEROWA_FOUNDATION_ENABLED: "1",
      XEROWA_FOUNDATION_COMMAND: "1",
      XEROWA_ONBOARDING_ENABLED: "1",
    };
    expect(onboardingEnabled(context, {})).toBe(false);
    expect(onboardingEnabled(context, env)).toBe(true);
    expect(
      onboardingEnabled(context, { ...env, XEROWA_FOUNDATION_COMMAND: "0" }),
    ).toBe(false);
    expect(onboardingEnabled({ ...context, platformRole: "client" }, env)).toBe(
      false,
    );
    expect(productNavigation("command", "admin", true, false)).toEqual(
      productNavigation("command", "admin", true),
    );
    expect(productNavigation("command", "client", true, true)).toEqual([]);
    expect(
      productNavigation("command", "admin", true, true).filter(
        (item) => item.href === "/admin/onboarding",
      ),
    ).toHaveLength(1);
  });
});
