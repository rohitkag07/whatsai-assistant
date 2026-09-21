import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const { guard, notFound } = vi.hoisted(() => ({
  guard: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));
vi.mock("@/lib/auth/session", () => ({ requirePlatformRole: guard }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/components/onboarding/OnboardingWorkspace", () => ({
  OnboardingWorkspace: () => null,
}));
import OnboardingPage from "@/app/admin/onboarding/page";
const keys = [
  "XEROWA_FOUNDATION_ENABLED",
  "XEROWA_FOUNDATION_COMMAND",
  "XEROWA_ONBOARDING_ENABLED",
];
const prior = keys.map((key) => process.env[key]);
beforeEach(() => {
  vi.clearAllMocks();
  keys.forEach((key) => {
    process.env[key] = "1";
  });
});
afterEach(() =>
  keys.forEach((key, index) => {
    if (prior[index] === undefined) delete process.env[key];
    else process.env[key] = prior[index];
  }),
);
describe("onboarding uses existing server authorization", () => {
  it("denies no-session users before exposing a local workspace", async () => {
    guard.mockRejectedValue(new Error("LOGIN"));
    await expect(OnboardingPage()).rejects.toThrow("LOGIN");
    expect(guard).toHaveBeenCalledWith(["admin", "dev"]);
  });
  it("denies client role even if a mocked guard returns it", async () => {
    guard.mockResolvedValue({
      user: { id: "actor" },
      platformRole: "client",
      activeBusinessId: "tenant",
      memberships: [],
    });
    await expect(OnboardingPage()).rejects.toThrow("NOT_FOUND");
  });
  it.each(["admin", "dev"])(
    "binds %s drafts to the server actor and tenant context",
    async (role) => {
      guard.mockResolvedValue({
        user: { id: "actor" },
        platformRole: role,
        activeBusinessId: "tenant",
        memberships: [],
      });
      const page = await OnboardingPage();
      expect(page.props.scope).toEqual({
        actorId: "actor",
        tenantContext: "tenant",
      });
    },
  );
  it("flag off hides the route without touching Phase 1 flags", async () => {
    guard.mockResolvedValue({
      user: { id: "actor" },
      platformRole: "admin",
      activeBusinessId: null,
      memberships: [],
    });
    delete process.env.XEROWA_ONBOARDING_ENABLED;
    await expect(OnboardingPage()).rejects.toThrow("NOT_FOUND");
  });
});
