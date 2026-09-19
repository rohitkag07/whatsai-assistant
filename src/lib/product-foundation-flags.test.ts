import { describe, it, expect } from "vitest";
import { resolveFoundationFlags } from "./product-foundation-flags";
const client = {
  platformRole: "client" as const,
  activeBusinessId: "a",
  memberships: [{ business_id: "a", active: true }],
};
const env = {
  XEROWA_FOUNDATION_ENABLED: "1",
  XEROWA_FOUNDATION_TENANT_IDS: "a",
  XEROWA_FOUNDATION_COMMAND: "1",
  XEROWA_DESIGN_LAB_ENABLED: "1",
};
describe("server foundation flags", () => {
  it("defaults off for every role", () => {
    for (const platformRole of ["client", "admin", "dev"] as const)
      expect(resolveFoundationFlags({ ...client, platformRole }, {})).toEqual({
        control: false,
        command: false,
        designLab: false,
      });
  });
  it("requires explicit tenant and active membership for Control", () => {
    expect(resolveFoundationFlags(client, env).control).toBe(true);
    expect(
      resolveFoundationFlags({ ...client, activeBusinessId: "b" }, env).control,
    ).toBe(false);
    expect(
      resolveFoundationFlags(
        { ...client, memberships: [{ business_id: "a", active: false }] },
        env,
      ).control,
    ).toBe(false);
    expect(
      resolveFoundationFlags(client, {
        ...env,
        XEROWA_FOUNDATION_TENANT_IDS: "*",
      }).control,
    ).toBe(false);
  });
  it("never grants Command or lab to a client, regardless of flags", () => {
    expect(resolveFoundationFlags(client, env)).toEqual({
      control: true,
      command: false,
      designLab: false,
    });
  });
  it("gates Command independently and still requires the master flag", () => {
    const admin = { ...client, platformRole: "admin" as const };
    expect(resolveFoundationFlags(admin, env).command).toBe(true);
    expect(
      resolveFoundationFlags(admin, { ...env, XEROWA_FOUNDATION_ENABLED: "0" })
        .command,
    ).toBe(false);
    expect(
      resolveFoundationFlags(admin, { ...env, XEROWA_FOUNDATION_COMMAND: "0" })
        .command,
    ).toBe(false);
  });
  it("does not enable a rollout through truthy-looking values", () => {
    expect(
      resolveFoundationFlags(client, {
        ...env,
        XEROWA_FOUNDATION_ENABLED: "true",
      }).control,
    ).toBe(false);
  });
});
