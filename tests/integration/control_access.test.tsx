import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/components/control/ControlWorkspace", () => ({
  ControlWorkspace: () => null,
}));
const { guard, legacy } = vi.hoisted(() => ({
  guard: vi.fn(),
  legacy: vi.fn(() => {
    throw new Error("Legacy reader must not run");
  }),
}));
vi.mock("@/lib/auth/session", () => ({ requireBusinessAccess: guard }));
vi.mock("@/lib/whatsai-data", () => ({
  loadWhatsAiInboxData: legacy,
  loadOperatorLeadsData: legacy,
}));
vi.mock("@/lib/calendar-data", () => ({ loadCalendarData: legacy }));
import DashboardPage from "@/app/(dashboard)/dashboard/page";
import ChatsPage from "@/app/(dashboard)/chats/page";
import LeadsPage from "@/app/(dashboard)/leads/page";
import CalendarPage from "@/app/(dashboard)/calendar/page";
import { controlEntry } from "@/components/control/ControlEntry";
import type { AuthSession } from "@/lib/auth/session";
const keys = [
  "XEROWA_CONTROL_ENABLED",
  "XEROWA_CONTROL_SYNTHETIC",
  "XEROWA_FOUNDATION_ENABLED",
  "XEROWA_FOUNDATION_TENANT_IDS",
];
const original = keys.map((k) => process.env[k]);
const session = {
  user: { id: "actor" },
  platformRole: "client",
  activeBusinessId: "a",
  memberships: [{ business_id: "a", active: true }],
} as AuthSession;
beforeEach(() => {
  keys.forEach((k) => (process.env[k] = "1"));
  process.env.XEROWA_FOUNDATION_TENANT_IDS = "a";
  vi.clearAllMocks();
  guard.mockResolvedValue(session);
});
afterEach(() =>
  keys.forEach((k, i) => {
    if (original[i] === undefined) delete process.env[k];
    else process.env[k] = original[i];
  }),
);
describe("Control route boundary", () => {
  it("returns no UI when flag off or tenant access is absent", async () => {
    delete process.env.XEROWA_CONTROL_ENABLED;
    expect(await controlEntry(session, "today")).toBeNull();
    process.env.XEROWA_CONTROL_ENABLED = "1";
    expect(
      await controlEntry({ ...session, memberships: [] }, "today"),
    ).toBeNull();
  });
  it("does not call legacy readers from any flagged workspace", async () => {
    await DashboardPage();
    await ChatsPage({});
    await LeadsPage();
    await CalendarPage();
    expect(legacy).not.toHaveBeenCalled();
    expect(guard).toHaveBeenCalledTimes(4);
  });
  it("propagates denial before any data or fixture is exposed", async () => {
    guard.mockRejectedValue(new Error("LOGIN"));
    await expect(DashboardPage()).rejects.toThrow("LOGIN");
    expect(legacy).not.toHaveBeenCalled();
  });
  it("binds Synthetic data to server context and returns unavailable without an adapter", async () => {
    const element = await controlEntry(session, "today");
    expect(element?.props.initial.businessId).toBe("a");
    expect(element?.props.initial.source).toBe("synthetic");
    delete process.env.XEROWA_CONTROL_SYNTHETIC;
    expect((await controlEntry(session, "today"))?.props.initial.status).toBe(
      "unavailable",
    );
  });
});
