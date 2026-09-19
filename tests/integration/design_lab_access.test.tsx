import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const { guard, notFound } = vi.hoisted(() => ({
  guard: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));
vi.mock("@/lib/auth/session", () => ({ requirePlatformRole: guard }));
vi.mock("next/navigation", () => ({ notFound }));
import DesignLabPage from "@/app/admin/design-lab/page";
const prior = process.env.XEROWA_DESIGN_LAB_ENABLED;
beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.XEROWA_DESIGN_LAB_ENABLED;
});
afterEach(() => {
  if (prior === undefined) delete process.env.XEROWA_DESIGN_LAB_ENABLED;
  else process.env.XEROWA_DESIGN_LAB_ENABLED = prior;
});
describe("design lab server gate", () => {
  it("invokes the existing admin/dev guard before rendering or reading fixtures", async () => {
    guard.mockRejectedValue(new Error("LOGIN_REDIRECT"));
    process.env.XEROWA_DESIGN_LAB_ENABLED = "1";
    await expect(DesignLabPage()).rejects.toThrow("LOGIN_REDIRECT");
    expect(guard).toHaveBeenCalledWith(["admin", "dev"]);
  });
  it("fails closed for a client even if a mocked guard incorrectly returns it", async () => {
    guard.mockResolvedValue({
      platformRole: "client",
      activeBusinessId: "a",
      memberships: [],
    });
    process.env.XEROWA_DESIGN_LAB_ENABLED = "1";
    await expect(DesignLabPage()).rejects.toThrow("NOT_FOUND");
  });
  it("does not render for admin when the lab flag is off", async () => {
    guard.mockResolvedValue({
      platformRole: "admin",
      activeBusinessId: null,
      memberships: [],
    });
    await expect(DesignLabPage()).rejects.toThrow("NOT_FOUND");
  });
  it.each(["admin", "dev"])(
    "renders for authorized %s only with the explicit lab flag",
    async (role) => {
      guard.mockResolvedValue({
        platformRole: role,
        activeBusinessId: null,
        memberships: [],
      });
      process.env.XEROWA_DESIGN_LAB_ENABLED = "1";
      expect(await DesignLabPage()).toBeTruthy();
      expect(notFound).not.toHaveBeenCalled();
    },
  );
});
