import { describe, it, expect, vi, beforeEach } from "vitest";
import { readableCount, shellPresentation } from "./shell-state";
import type { AuthSession } from "@/lib/auth/session";
vi.mock("server-only", () => ({}));
const { serviceClient } = vi.hoisted(() => ({ serviceClient: vi.fn() }));
vi.mock("@/lib/sales-server", () => ({ serviceClientOrNull: serviceClient }));
import { loadFoundationShellState } from "@/lib/auth/shell-context";
const session = {
  platformRole: "client",
  activeBusinessId: "a",
  memberships: [{ business_id: "a", active: true }],
} as AuthSession;
beforeEach(() => vi.clearAllMocks());
describe("honest shell read states", () => {
  it("preserves measured zero and rejects unknown/invalid counters", () => {
    expect(readableCount({ status: "empty", data: 0 })).toBe(0);
    expect(readableCount({ status: "unknown", data: null })).toBeNull();
    expect(readableCount({ status: "ready", data: NaN })).toBeNull();
    expect(readableCount({ status: "ready", data: -1 })).toBeNull();
  });
  it("does not turn absent credentials into zero or a verified channel state", async () => {
    serviceClient.mockReturnValue(null);
    const state = await loadFoundationShellState(session);
    expect(state).toEqual({
      businesses: { status: "disconnected", data: null },
      unread: { status: "unknown", data: null },
    });
    expect(shellPresentation(state)).toBe("disconnected");
  });
  it("keeps tenant filtering and masks provider errors without leaking text", async () => {
    const query = {
      select: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      in: vi.fn(),
      eq: vi.fn(),
      gt: vi.fn(),
      neq: vi.fn(),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(
          resolve({
            data: null,
            count: null,
            error: { message: "private provider text" },
          }),
        ),
    };
    for (const key of [
      "select",
      "order",
      "limit",
      "in",
      "eq",
      "gt",
      "neq",
    ] as const)
      query[key].mockReturnValue(query);
    serviceClient.mockReturnValue({ from: vi.fn(() => query) });
    const state = await loadFoundationShellState(session);
    expect(query.in).toHaveBeenCalledWith("id", ["a"]);
    expect(query.eq).toHaveBeenCalledWith("business_id", "a");
    expect(state.businesses.status).toBe("error");
    expect(state.unread.data).toBeNull();
    expect(JSON.stringify(state)).not.toContain("private");
  });
  it("does not query a selected tenant outside the active membership", async () => {
    const query = {
      select: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      in: vi.fn(),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(resolve({ data: [], error: null })),
    };
    for (const key of ["select", "order", "limit", "in"] as const)
      query[key].mockReturnValue(query);
    const from = vi.fn(() => query);
    serviceClient.mockReturnValue({ from });
    const state = await loadFoundationShellState({
      ...session,
      activeBusinessId: "b",
    });
    expect(from).toHaveBeenCalledTimes(1);
    expect(state.unread.status).toBe("unknown");
  });
  it("retains partial evidence without manufacturing missing counts", () => {
    expect(
      shellPresentation({
        businesses: {
          status: "ready",
          data: [{ id: "a", name: "A", category: "Service", status: "active" }],
        },
        unread: { status: "error", data: null },
      }),
    ).toBe("partial");
  });
});
