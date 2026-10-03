import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
const fixture = vi.hoisted(() => ({
  user: null as User | null,
  authError: null as null | { message: string },
  rows: [] as unknown[],
  error: null as null | { message: string },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => client(),
  createServiceClient: () => client(),
}));
vi.mock("@/lib/sales-server", () => ({ serviceClientOrNull: () => client() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => client() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw Error(`REDIRECT ${path}`);
  },
}));
vi.mock("@/lib/admin-data", () => ({
  loadAdminBusinesses: vi.fn(),
  loadAdminTeam: vi.fn(),
}));
function client() {
  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    order() {
      return Promise.resolve({ data: fixture.rows, error: fixture.error });
    },
  };
  return {
    auth: {
      getUser: async () => ({
        data: { user: fixture.user },
        error: fixture.authError,
      }),
    },
    from: () => query,
  };
}
import {
  getUserPlatformRole,
  resolveTrustedPlatformRole,
} from "@/lib/auth/roles";
import {
  getAuthSession,
  requireBusinessAccess,
  requirePlatformRole,
} from "@/lib/auth/session";
import { requirePlatformApiSession } from "@/lib/whatsai-business";
import { updateSession } from "@/lib/supabase/middleware";
import AdminTeamPage from "@/app/admin/team/page";
import { isDashboardAuthBypassEnabled } from "@/lib/auth/dev-bypass";
import { GET as adminKnowledgeGET } from "@/app/api/admin/knowledge/route";
const user = (
  app: Record<string, unknown> = {},
  editable: Record<string, unknown> = {},
) =>
  ({
    id: "Synthetic-actor",
    app_metadata: app,
    user_metadata: editable,
  }) as User;
const member = (role: string, extra: Record<string, unknown> = {}) => ({
  id: "Synthetic-member",
  business_id: "Synthetic-business",
  user_id: "Synthetic-actor",
  active: true,
  role,
  ...extra,
});
beforeEach(() => {
  vi.stubEnv("XEROWA_AUTH_BYPASS", "0");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://synthetic.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Synthetic-not-a-key");
  fixture.user = user();
  fixture.rows = [];
  fixture.error = null;
  fixture.authError = null;
});
afterEach(() => vi.unstubAllEnvs());
describe("Phase 6 single trusted authorization path", () => {
  it.each(
    ["platform_role", "xero_role", "xerowa_role", "role"].flatMap((alias) =>
      ["admin", "dev"].map((role) => ({ alias, role })),
    ),
  )("denies editable $alias=$role consistently", async ({ alias, role }) => {
    fixture.user = user({}, { [alias]: role });
    expect(getUserPlatformRole(fixture.user)).toBe("client");
    expect((await getAuthSession())?.memberships).toEqual([]);
    await expect(requirePlatformRole(["admin", "dev"])).rejects.toThrow(
      "REDIRECT /dashboard",
    );
    expect(
      (
        await adminKnowledgeGET(
          new Request("http://localhost/api/admin/knowledge"),
        )
      ).status,
    ).toBe(403);
    await expect(AdminTeamPage()).rejects.toThrow("REDIRECT /dashboard");
    await expect(
      requirePlatformApiSession(["admin", "dev"]),
    ).rejects.toMatchObject({ status: 403 });
    await expect(requireBusinessAccess()).rejects.toThrow("REDIRECT /guard");
    const response = await updateSession(
      new NextRequest("http://localhost/admin"),
    );
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });
  it.each(["admin", "dev"])(
    "retains trusted app %s for page/API/landing guards",
    async (role) => {
      fixture.user = user({ platform_role: role }, { role: "client" });
      expect((await requirePlatformRole(["admin", "dev"])).platformRole).toBe(
        role,
      );
      expect(
        (await requirePlatformApiSession(["admin", "dev"])).platformRole,
      ).toBe(role);
      expect((await requireBusinessAccess()).platformRole).toBe(role);
      const response = await updateSession(
        new NextRequest("http://localhost/login"),
      );
      expect(response.headers.get("location")).toBe("http://localhost/admin");
    },
  );
  it.each(["admin", "dev"])(
    "never promotes tenant membership %s to platform authority",
    async (role) => {
      fixture.rows = [member(role)];
      await expect(requirePlatformRole(["admin", "dev"])).rejects.toThrow(
        "REDIRECT /dashboard",
      );
      await expect(
        requirePlatformApiSession(["admin", "dev"]),
      ).rejects.toMatchObject({ status: 403 });
      expect(
        (
          await updateSession(new NextRequest("http://localhost/admin"))
        ).headers.get("location"),
      ).toBe("http://localhost/dashboard");
    },
  );
  it.each(["client", "owner", "manager", "agent", "operator", "viewer"])(
    "never promotes %s membership",
    async (role) => {
      fixture.rows = [member(role)];
      await expect(requirePlatformRole(["admin", "dev"])).rejects.toThrow(
        "REDIRECT /dashboard",
      );
      await expect(
        requirePlatformApiSession(["admin", "dev"]),
      ).rejects.toMatchObject({ status: 403 });
      expect(
        (await requireBusinessAccess("Synthetic-business")).activeBusinessId,
      ).toBe("Synthetic-business");
      await expect(requireBusinessAccess("Synthetic-foreign")).rejects.toThrow(
        "REDIRECT /guard",
      );
    },
  );
  it.each([
    {},
    { role: null },
    { role: "ADMIN" },
    { role: { value: "admin", expires_at: "2000-01-01" } },
    { role: "admin", platform_role: "dev" },
    { role: "admin", platform_role: "client" },
    { role: "admin", xero_role: false },
  ])("fails closed on absent/malformed/conflicting claims %j", (app) => {
    expect(resolveTrustedPlatformRole(user(app), [])).toBe("client");
  });
  it.each([
    { active: false },
    { active: "true" },
    { user_id: "Synthetic-foreign" },
    { id: "" },
    { business_id: null },
    { role: "ADMIN" },
  ])("rejects invalid/foreign/inactive authority %j", (extra) => {
    expect(resolveTrustedPlatformRole(user(), [member("admin", extra)])).toBe(
      "client",
    );
  });
  it("fails closed on conflicting platform memberships and provider error", async () => {
    fixture.rows = [member("admin"), member("dev")];
    expect((await getAuthSession())?.platformRole).toBe("client");
    fixture.rows = [member("admin")];
    fixture.error = { message: "Synthetic provider error" };
    expect((await getAuthSession())?.platformRole).toBe("client");
    expect(
      (
        await updateSession(new NextRequest("http://localhost/admin"))
      ).headers.get("location"),
    ).toBe("http://localhost/dashboard");
  });
  it("stale/error authentication never reuses trusted-looking claims", async () => {
    fixture.user = user({ role: "admin" });
    fixture.authError = { message: "Synthetic expired token" };
    expect(await getAuthSession()).toBeNull();
    await expect(
      requirePlatformApiSession(["admin", "dev"]),
    ).rejects.toMatchObject({ status: 401 });
    expect(
      (
        await updateSession(new NextRequest("http://localhost/admin"))
      ).headers.get("location"),
    ).toContain("/login");
  });
  it.each(
    ["platform_role", "xero_role", "xerowa_role", "role"].flatMap((alias) =>
      ["admin", "dev"].map((role) => ({ alias, role })),
    ),
  )("retains trusted app alias $alias=$role", ({ alias, role }) => {
    expect(getUserPlatformRole(user({ [alias]: role }))).toBe(role);
  });
  it("denies missing sessions in both guards", async () => {
    fixture.user = null;
    await expect(requirePlatformRole(["admin", "dev"])).rejects.toThrow(
      "REDIRECT /login",
    );
    await expect(
      requirePlatformApiSession(["admin", "dev"]),
    ).rejects.toMatchObject({ status: 401 });
  });
  it.each(["production", "prod", " PRODUCTION "])(
    "keeps bypass disabled in %s",
    (value) => {
      expect(
        isDashboardAuthBypassEnabled({
          XEROWA_AUTH_BYPASS: "1",
          NODE_ENV: value,
        }),
      ).toBe(false);
      expect(
        isDashboardAuthBypassEnabled({
          XEROWA_AUTH_BYPASS: "1",
          VERCEL_ENV: value,
        }),
      ).toBe(false);
    },
  );
  it("keeps existing explicit local bypass conditions", () => {
    expect(isDashboardAuthBypassEnabled({ NODE_ENV: "development" })).toBe(
      false,
    );
    expect(
      isDashboardAuthBypassEnabled({
        NODE_ENV: "development",
        XEROWA_AUTH_BYPASS: "1",
      }),
    ).toBe(true);
  });
});
