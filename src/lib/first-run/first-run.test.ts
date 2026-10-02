import { describe, expect, it } from "vitest";
import { buildDevAuthBypassSession } from "@/lib/auth/dev-bypass";
import { firstRunEnabled, ownerCanConfigure, syntheticFirstRun } from "./flags";
import {
  blankReadiness,
  nextSetupAction,
  readinessAt,
  readinessChecklist,
  safeReturnPath,
} from "./model";
import { syntheticReadiness } from "./fixtures";
import { safeSample, syntheticTest } from "./demo";
const scope = { actorId: "test-owner", tenantContext: "test-business" };
const snapshot = syntheticReadiness(scope);
const session = buildDevAuthBypassSession({
  XEROWA_AUTH_BYPASS_BUSINESS_ID: scope.tenantContext,
});
const env = {
  XEROWA_FOUNDATION_ENABLED: "1",
  XEROWA_FOUNDATION_TENANT_IDS: scope.tenantContext,
  XEROWA_FIRST_RUN_ENABLED: "1",
  XEROWA_AUTH_BYPASS: "1",
  XEROWA_FIRST_RUN_SYNTHETIC: "1",
  XEROWA_DESIGN_LAB_ENABLED: "1",
};
describe("first-run authority and default-off gates", () => {
  it("requires all explicit review gates and excludes production", () => {
    expect(firstRunEnabled(session, {})).toBe(false);
    expect(firstRunEnabled(session, env)).toBe(true);
    expect(syntheticFirstRun(session, env)).toBe(true);
    for (const key of [
      "XEROWA_FIRST_RUN_ENABLED",
      "XEROWA_FIRST_RUN_SYNTHETIC",
      "XEROWA_DESIGN_LAB_ENABLED",
      "XEROWA_AUTH_BYPASS",
    ])
      expect(syntheticFirstRun(session, { ...env, [key]: "0" })).toBe(false);
    expect(syntheticFirstRun(session, { ...env, NODE_ENV: "production" })).toBe(
      false,
    );
    expect(
      syntheticFirstRun(session, { ...env, VERCEL_ENV: "production" }),
    ).toBe(false);
  });
  it("uses only active owner membership for editing", () => {
    expect(ownerCanConfigure(session)).toBe(false);
    const owner = {
      ...session,
      memberships: session.memberships.map((m) => ({
        ...m,
        role: "owner" as const,
      })),
    };
    expect(ownerCanConfigure(owner)).toBe(true);
    expect(ownerCanConfigure({ ...owner, activeBusinessId: "foreign" })).toBe(
      false,
    );
    expect(
      ownerCanConfigure({
        ...owner,
        memberships: owner.memberships.map((m) => ({ ...m, active: false })),
      }),
    ).toBe(false);
  });
  it.each([
    "https://evil.invalid",
    "//evil.invalid",
    "/\\evil",
    "/\nfoo",
    null,
  ])("rejects unsafe return %s", (value) =>
    expect(safeReturnPath(value)).toBe("/"),
  );
  it("preserves an internal destination", () =>
    expect(safeReturnPath("/setup?review=1")).toBe("/setup?review=1"));
});
describe("truthful first results", () => {
  it("ages genuine browser-held authority evidence to unknown", () => {
    const genuine = {
      ...snapshot,
      source: "Supabase · Non-production read" as const,
    };
    const old = readinessAt(
      genuine,
      Date.parse(snapshot.observedAt!) + 300_001,
    );
    expect(old.state).toBe("stale");
    expect(old.approval).toBe("Unknown");
    expect(old.publication).toBe("Unknown");
    expect(
      readinessAt(snapshot, Date.parse(snapshot.observedAt!) + 300_001).state,
    ).toBe("ready");
  });
  it("never carries approval across changed configuration", () => {
    const draft = structuredClone(snapshot.version!.draft);
    draft.config.identity.name = "Changed local proposal";
    expect(
      readinessChecklist(snapshot, draft).find((i) => i.id === "authority")!
        .status,
    ).toBe("Unknown for this proposal");
    expect(nextSetupAction(snapshot, draft, false, true).label).toBe(
      "Review staging publication evidence",
    );
  });
  it("unknown source cannot count as approval or connection", () => {
    const rows = readinessChecklist(
      blankReadiness(scope.tenantContext),
      snapshot.version!.draft,
    );
    expect(rows.find((i) => i.id === "channel")!.status).toBe("Unknown");
    expect(rows.find((i) => i.id === "authority")!.status).toContain("Unknown");
  });
  it("offers configuration, test and blocker in order", () => {
    expect(nextSetupAction(snapshot, null).target).toBe("configure");
    expect(
      nextSetupAction(snapshot, snapshot.version!.draft, false, false).target,
    ).toBe("test");
    expect(
      nextSetupAction(snapshot, snapshot.version!.draft, false, true).label,
    ).toBe("Review the channel blocker");
  });
  it.each([
    "call +91 9876543210",
    "person@example.invalid",
    "https://example.invalid",
    "",
    "x".repeat(401),
  ])("rejects contact-like or invalid sample %s", (input) =>
    expect(safeSample(input)).toBe(false),
  );
  it("supports invented Hinglish, leaves answers unknown and binds result to config", () => {
    const draft = snapshot.version!.draft;
    const result = syntheticTest(
      draft,
      "मुझे आपकी service के बारे में जानना है।",
    );
    expect(result.customer).toContain("मुझे");
    expect(result.qualification).toContain("answers remain unknown");
    expect(result.binding).toBe(JSON.stringify(draft.config));
    expect(result.followup).not.toContain("scheduled now");
  });
  it("opt-out never claims a live suppression write", () =>
    expect(
      syntheticTest(snapshot.version!.draft, "Stop contacting me.").evidence,
    ).toContain("separately approved"));
});
