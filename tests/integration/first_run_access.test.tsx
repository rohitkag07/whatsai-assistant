import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { buildDevAuthBypassSession } from "@/lib/auth/dev-bypass";
const { guard, reader } = vi.hoisted(() => ({
  guard: vi.fn(),
  reader: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ requireBusinessAccess: guard }));
vi.mock("@/lib/first-run/loader", () => ({ loadReadiness: reader }));
vi.mock("@/components/first-run/FirstRunJourney", () => ({
  FirstRunJourney: () => null,
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw Error("NOT_FOUND");
  },
  redirect: (path: string) => {
    throw Error("REDIRECT " + path);
  },
}));
import SetupPage from "@/app/(dashboard)/setup/page";
const session = buildDevAuthBypassSession({
  XEROWA_AUTH_BYPASS_BUSINESS_ID: "test-business",
});
beforeEach(() => {
  vi.stubEnv("XEROWA_FIRST_RUN_ENABLED", "1");
  vi.stubEnv("XEROWA_FOUNDATION_ENABLED", "1");
  vi.stubEnv("XEROWA_FOUNDATION_TENANT_IDS", "test-business");
  vi.stubEnv("XEROWA_AUTH_BYPASS", "0");
  vi.clearAllMocks();
  guard.mockResolvedValue(session);
  reader.mockResolvedValue({ state: "unavailable" });
});
afterEach(() => vi.unstubAllEnvs());
describe("first-run uses existing guard and exact membership", () => {
  it("rejects no session before any evidence read", async () => {
    guard.mockRejectedValue(Error("LOGIN"));
    await expect(SetupPage()).rejects.toThrow("LOGIN");
    expect(reader).not.toHaveBeenCalled();
  });
  it("missing selection returns pending access", async () => {
    guard.mockResolvedValue({ ...session, activeBusinessId: null });
    await expect(SetupPage()).rejects.toThrow("REDIRECT /guard");
    expect(reader).not.toHaveBeenCalled();
  });
  it("platform role does not substitute for active membership", async () => {
    guard.mockResolvedValue({ ...session, memberships: [] });
    await expect(SetupPage()).rejects.toThrow("REDIRECT /guard");
    expect(reader).not.toHaveBeenCalled();
  });
  it("default-off route stays hidden", async () => {
    vi.stubEnv("XEROWA_FIRST_RUN_ENABLED", "0");
    await expect(SetupPage()).rejects.toThrow("NOT_FOUND");
    expect(reader).not.toHaveBeenCalled();
  });
  it("non-owner can inspect but cannot configure", async () =>
    expect((await SetupPage()).props.canEdit).toBe(false));
  it("owner edit scope is server-owned", async () => {
    guard.mockResolvedValue({
      ...session,
      memberships: session.memberships.map((m) => ({ ...m, role: "owner" })),
    });
    const page = await SetupPage();
    expect(page.props.canEdit).toBe(true);
    expect(page.props.scope).toEqual({
      actorId: session.user.id,
      tenantContext: "test-business",
    });
  });
});
