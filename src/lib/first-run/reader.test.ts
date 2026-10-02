import { describe, it, expect } from "vitest";
import { readReadiness, type ReadPort, type ReadinessTable } from "./reader";
import { syntheticReadiness } from "./fixtures";
const id = "synthetic-business";
const actor = "synthetic-owner";
const snapshot = syntheticReadiness({ actorId: actor, tenantContext: id });
const config = snapshot.version!;
function records(): Record<ReadinessTable, unknown[]> {
  return {
    businesses: [{ id, name: "Synthetic business" }],
    onboarding_configuration_versions: [
      {
        id: config.id,
        business_id: id,
        schema_version: 1,
        template_id: "service",
        version: 1,
        payload: config.draft.config,
        payload_hash: config.hash,
        created_at: "2026-09-19T10:00:00Z",
      },
    ],
    onboarding_configuration_approvals: [
      {
        business_id: id,
        configuration_id: config.id,
        payload_hash: config.hash,
        approved_at: "2026-09-19T11:00:00Z",
        expires_at: "2026-10-10T11:00:00Z",
        revoked_at: null,
      },
    ],
    business_configuration_publications: [
      {
        business_id: id,
        configuration_id: config.id,
        payload_hash: config.hash,
        published_at: "2026-09-19T12:00:00Z",
        revision: 1,
      },
    ],
    business_channels: [
      {
        business_id: id,
        status: "disconnected",
        is_active: false,
        last_verified_at: null,
      },
    ],
  };
}
function port(
  rows = records(),
  failed?: ReadinessTable,
  code = "provider_error",
): ReadPort {
  return async (table, _columns, field, requested) => {
    expect(requested).toBe(id);
    expect(field).toBe(table === "businesses" ? "id" : "business_id");
    return table === failed
      ? { data: null, error: { code } }
      : { data: rows[table], error: null };
  };
}
const read = (p: ReadPort) =>
  readReadiness(p, id, actor, "2026-10-03T00:00:00Z");
describe("user-scoped readiness projection fails closed", () => {
  it("reads only scoped columns and distinguishes publication from disconnected channel", async () => {
    const result = await read(port());
    expect(result.state).toBe("ready");
    expect(result.approval).toBe("Valid owner approval");
    expect(result.publication).toBe("Staging published");
    expect(result.channel).toBe("Disconnected");
  });
  it.each([
    "onboarding_configuration_versions",
    "onboarding_configuration_approvals",
    "business_configuration_publications",
    "business_channels",
  ] as const)("rejects a foreign %s", async (table) => {
    const rows = records();
    rows[table] = [
      {
        ...(rows[table][0] as Record<string, unknown>),
        business_id: "foreign",
      },
    ];
    expect((await read(port(rows))).state).toBe("denied");
  });
  it.each([
    "onboarding_configuration_approvals",
    "business_configuration_publications",
  ] as const)("rejects a foreign child/hash in %s", async (table) => {
    const rows = records();
    rows[table] = [
      {
        ...(rows[table][0] as Record<string, unknown>),
        payload_hash: "b".repeat(64),
      },
    ];
    expect((await read(port(rows))).state).toBe("denied");
  });
  it("does not turn provider errors into empty records", async () => {
    const result = await read(
      port(records(), "onboarding_configuration_approvals"),
    );
    expect(result.state).toBe("partial");
    expect(result.approval).toBe("Unknown");
  });
  it("preserves permission denial", async () =>
    expect(
      (await read(port(records(), "business_channels", "42501"))).state,
    ).toBe("denied"));
  it("never accepts future, expired or revoked approval", async () => {
    for (const patch of [
      { approved_at: "2026-11-01T00:00:00Z" },
      { expires_at: "2026-10-01T00:00:00Z" },
      { revoked_at: "2026-10-01T00:00:00Z" },
    ]) {
      const rows = records();
      rows.onboarding_configuration_approvals = [
        {
          ...(rows.onboarding_configuration_approvals[0] as Record<
            string,
            unknown
          >),
          ...patch,
        },
      ];
      expect((await read(port(rows))).approval).toBe("Expired or revoked");
    }
  });
  it("fails closed on capped or malformed collections", async () => {
    const rows = records();
    rows.business_channels = Array(51).fill(rows.business_channels[0]);
    expect((await read(port(rows))).state).toBe("error");
  });
  it("empty permitted workspace is not denied and has no invented publication", async () => {
    const rows = records();
    rows.onboarding_configuration_versions = [];
    rows.onboarding_configuration_approvals = [];
    rows.business_configuration_publications = [];
    const result = await read(port(rows));
    expect(result.state).toBe("empty");
    expect(result.publication).toBe("Not published");
  });
});
