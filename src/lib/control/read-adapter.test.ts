import { describe, it, expect, vi } from "vitest";
import type { AuthSession } from "@/lib/auth/session";
import { syntheticSnapshot } from "./fixtures";
import { readControl, currentReadState, READ_TTL_MS } from "./read-adapter";
import { readEnabled } from "./flags";
import { columns, type ReadPort, type ReadTable } from "./read-contract";

const at = Date.parse("2026-09-21T09:00:00Z");
const session = {
  user: { id: "actor-a" },
  activeBusinessId: "a",
  platformRole: "client",
  memberships: [{ business_id: "a", user_id: "actor-a", active: true }],
} as AuthSession;
function fixture() {
  const s = syntheticSnapshot("a");
  const data: Record<ReadTable, Record<string, unknown>[]> = {
    businesses: [{ id: "a", name: "Synthetic protocol business" }],
    business_profiles: [
      {
        id: "profile-a",
        business_id: "a",
        timezone: "Asia/Kolkata",
        vertical: "coaching",
      },
    ],
    business_members: [
      {
        id: "member-a",
        business_id: "a",
        user_id: "actor-a",
        display_name: "Synthetic operator",
        active: true,
        role: "owner",
      },
    ],
    business_channels: [
      {
        id: "channel-a",
        business_id: "a",
        provider: "meta_whatsapp",
        is_active: true,
        status: "connected",
        last_verified_at: s.asOf,
      },
    ],
    conversation_threads: s.threads.map((t) => ({
      ...t,
      assigned_user_id: t.assigned_to ? "actor-a" : null,
    })),
    conversation_messages: s.messages,
    lead_qualification_answers: s.answers.map(a => ({ ...a })),
    handoff_events: s.handoffs,
    followup_jobs: s.followups,
    appointments: s.appointments,
  };
  const port = vi.fn<ReadPort>(async (q) => {
    const rows = data[q.table]
      .filter(
        (r) =>
          (!q.actorId || (r.user_id === q.actorId && r.active === true)) &&
          (!q.threadIds || q.threadIds.includes(String(r.thread_id))) &&
          (!q.after || String(r.id) > q.after),
      )
      .sort((a, b) => String(a.id).localeCompare(String(b.id), "en"));
    return {
      data: rows.slice(0, q.limit),
      count: rows.length,
      status: 200,
      error: null,
    };
  });
  return { data, port };
}
describe("Control read integration with Synthetic protocol records", () => {
  it("reads scoped contracts without inventing receipts, health or business success", async () => {
    const { port } = fixture();
    const m = await readControl(session, port, () => at);
    expect(m.source).toBe("supabase");
    expect(m.status).toBe("ready");
    expect(m.read?.businessName).toBe("Synthetic protocol business");
    expect(
      m.cases.every((c) => ["New", "Assigned"].includes(c.stage) && !c.receipt),
    ).toBe(true);
    expect(
      m.appointments.every((a) => a.state === "Verification unavailable"),
    ).toBe(true);
    expect(m.followups.every((f) => f.attempts === null && !f.receipt)).toBe(
      true,
    );
    expect(m.read?.connection).toContain("Live health unknown");
    expect(port.mock.calls.every(([q]) => q.businessId === "a")).toBe(true);
    expect(
      port.mock.calls
        .filter(([q]) => q.table === "lead_qualification_answers")
        .every(([q]) => q.threadIds?.length),
    ).toBe(true);
  });
  it("requires active membership for the authenticated actor, even for platform admin", async () => {
    const { port } = fixture();
    for (const memberships of [
      [],
      [{ business_id: "b", user_id: "actor-a", active: true }],
      [{ business_id: "a", user_id: "other", active: true }],
      [{ business_id: "a", user_id: "actor-a", active: false }],
    ]) {
      expect(
        (
          await readControl(
            { ...session, platformRole: "admin", memberships } as AuthSession,
            port,
          )
        ).status,
      ).toBe("permission");
    }
    expect(port).not.toHaveBeenCalled();
  });
  it("rechecks membership and business visibility before operational queries", async () => {
    const f = fixture();
    f.data.business_members = [];
    expect((await readControl(session, f.port)).status).toBe("permission");
    expect(f.port.mock.calls).toHaveLength(1);
    const g = fixture();
    g.data.businesses = [];
    expect((await readControl(session, g.port)).status).toBe("unavailable");
    expect(g.port.mock.calls).toHaveLength(2);
  });
  for (const table of [
    "businesses",
    "business_profiles",
    "business_channels",
    "business_members",
    "conversation_threads",
    "conversation_messages",
    "handoff_events",
    "appointments",
    "followup_jobs",
  ] as ReadTable[]) {
    it(`fails closed on a foreign ${table} row`, async () => {
      const f = fixture();
      f.data[table][0][table === "businesses" ? "id" : "business_id"] =
        "foreign";
      const m = await readControl(session, f.port, () => at);
      expect(["permission", "unavailable", "error"]).toContain(m.status);
      expect(m.cases).toEqual([]);
    });
  }
  it("rejects a foreign answer even if the transport ignores the parent filter", async () => {
    const f = fixture();
    const port: ReadPort = (q) =>
      q.table === "lead_qualification_answers"
        ? Promise.resolve({
            data: [
              { ...f.data.lead_qualification_answers[0], thread_id: "foreign" },
            ],
            count: 1,
            status: 200,
            error: null,
          })
        : f.port(q);
    expect((await readControl(session, port, () => at)).status).toBe("error");
  });
  it("does not turn failed child reads into a complete or zero result", async () => {
    const f = fixture();
    const port: ReadPort = (q) =>
      q.table === "followup_jobs"
        ? Promise.resolve({
            data: null,
            count: null,
            status: 403,
            error: { code: "42501" },
          })
        : f.port(q);
    const m = await readControl(session, port, () => at);
    expect(m.status).toBe("partial");
    expect(
      m.read?.resources.find((r) => r.table === "followup_jobs")?.state,
    ).toBe("permission");
  });
  it("preserves network failure without returning a successful empty source", async () => {
    const f = fixture();
    const port: ReadPort = (q) =>
      q.table === "conversation_threads"
        ? Promise.reject(new Error("offline"))
        : f.port(q);
    const m = await readControl(session, port, () => at);
    expect(m.status).toBe("error");
    expect(m.cases).toEqual([]);
  });
  it("enumerates ordered pages and reports a bounded partial result", async () => {
    const f = fixture();
    const base = f.data.conversation_threads[0];
    f.data.conversation_threads = Array.from({ length: 201 }, (_, i) => ({
      ...base,
      id: `T-${String(i).padStart(4, "0")}`,
    }));
    const m = await readControl(session, f.port, () => at);
    expect(m.cases).toHaveLength(150);
    expect(m.status).toBe("partial");
    expect(
      f.port.mock.calls
        .filter(([q]) => q.table === "conversation_threads")
        .map(([q]) => q.after),
    ).toEqual([undefined, "T-0049", "T-0099"]);
    expect(
      m.read?.resources.find((r) => r.table === "appointments")?.omitted,
    ).toBe(8);
  });
  it("does not claim completeness for an unknown count or server cap", async () => {
    for (const count of [null, 900]) {
      const f = fixture();
      const port: ReadPort = async (q) => {
        const r = await f.port(q);
        return q.table === "conversation_threads"
          ? { ...r, data: r.data!.slice(0, 2), count }
          : r;
      };
      const m = await readControl(session, port, () => at);
      expect(m.status).toBe("partial");
    }
  });
  it("rejects duplicate keys and malformed schemas rather than silently dropping records", async () => {
    const f = fixture();
    f.data.conversation_threads.push(f.data.conversation_threads[0]);
    expect((await readControl(session, f.port, () => at)).status).toBe("error");
    const g = fixture();
    delete g.data.conversation_threads[0].created_at;
    expect((await readControl(session, g.port, () => at)).status).toBe("error");
  });
  it("omits unlinked appointments with explicit partial evidence", async () => {
    const f = fixture();
    f.data.appointments[0].thread_id = null;
    const m = await readControl(session, f.port, () => at);
    expect(m.appointments).toHaveLength(7);
    expect(m.status).toBe("partial");
    expect(
      m.read?.resources.find((r) => r.table === "appointments")?.omitted,
    ).toBe(1);
  });
  it("expires a successful read without consulting activity timestamps or mixing users", async () => {
    const f = fixture();
    const m = await readControl(session, f.port, () => at);
    expect(currentReadState(m, at + READ_TTL_MS - 1)).toBe("ready");
    expect(currentReadState(m, at + READ_TTL_MS)).toBe("stale");
    expect(
      currentReadState({ ...m, status: "permission" }, at + READ_TTL_MS),
    ).toBe("permission");
    expect(
      currentReadState(
        { ...m, read: undefined, source: "synthetic" },
        at + READ_TTL_MS,
      ),
    ).toBe("ready");
  });
  it("selects no channel secrets or metadata and does not select undeclared handoff owner columns", () => {
    expect(columns.business_channels).not.toMatch(
      /config|token|metadata|phone/,
    );
    expect(columns.handoff_events).not.toContain("assigned_to");
  });
  it("requires explicit environment approval and never enables production or bypass reads", () => {
    const env = {
      XEROWA_CONTROL_READ_ENABLED: "1",
      XEROWA_CONTROL_READ_SCHEMA_CONFIRMED: "1",
      NEXT_PUBLIC_SUPABASE_URL: "https://nonprod.example",
      XEROWA_CONTROL_APPROVED_NONPROD_URL: "https://nonprod.example",
      NODE_ENV: "development",
    };
    expect(readEnabled(env)).toBe(true);
    expect(readEnabled({ ...env, XEROWA_AUTH_BYPASS: "0" })).toBe(true);
    expect(readEnabled({})).toBe(false);
    for (const patch of [
      { NODE_ENV: "production" },
      { VERCEL_ENV: "production" },
      { XEROWA_AUTH_BYPASS: "1" },
      { XEROWA_CONTROL_SYNTHETIC: "1" },
      { XEROWA_CONTROL_READ_SCHEMA_CONFIRMED: "0" },
      { XEROWA_CONTROL_APPROVED_NONPROD_URL: "https://different.example" },
    ])
      expect(readEnabled({ ...env, ...patch })).toBe(false);
  });
});
