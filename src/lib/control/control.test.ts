import { describe, it, expect } from "vitest";
import { projectSnapshot, unavailableModel } from "./adapter";
import { syntheticSnapshot } from "./fixtures";
import {
  stages,
  appointmentStates,
  countLabel,
  canShowRows,
  timeLabel,
  type BackendSnapshot,
} from "./model";
import { controlEnabled, syntheticEnabled } from "./flags";
import { productNavigation } from "../product-navigation";
describe("Control evidence and isolation", () => {
  it("renders stable IST labels across server and browser with date rollover", () => {
    expect(timeLabel("2026-09-21T09:00:00Z")).toBe("21 Sep 2026, 14:30 IST");
    expect(timeLabel("2026-12-31T20:00:00Z")).toBe("1 Jan 2027, 01:30 IST");
    expect(timeLabel(null)).toBe("Unknown");
    expect(timeLabel("invalid")).toBe("Unknown");
  });
  it("projects all stages and distinct appointment/follow-up states through one model", () => {
    const model = projectSnapshot(syntheticSnapshot("tenant-a"), "tenant-a");
    expect(model.cases.map((c) => c.stage)).toEqual(stages);
    expect(model.appointments.map((a) => a.state)).toEqual(appointmentStates);
    expect(model.followups.map((f) => f.state)).toEqual([
      "Due",
      "Scheduled",
      "Paused",
      "Replied",
      "Failed",
      "Outcome unknown",
    ]);
    expect(
      model.followups.every(
        (f) => f.attempts === null && f.eligibility.startsWith("Unknown"),
      ),
    ).toBe(true);
  });
  it("never infers qualification, acknowledgement, completion or confirmation from legacy fields", () => {
    const input = syntheticSnapshot("a");
    input.receipts = [];
    input.threads.forEach((t) => (t.stage = "booked"));
    input.appointments.forEach((a) => (a.status = "completed"));
    const model = projectSnapshot(input, "a");
    expect(
      model.cases.every((c) => ["New", "Assigned"].includes(c.stage)),
    ).toBe(true);
    expect(
      model.appointments.every((a) => a.state === "Verification unavailable"),
    ).toBe(true);
  });
  const attacks: { name: string; change: (data: BackendSnapshot) => void }[] = [
    {
      name: "foreign root",
      change: (d) => {
        d.businessId = "b";
      },
    },
    {
      name: "foreign thread",
      change: (d) => {
        d.threads[0].business_id = "b";
      },
    },
    {
      name: "foreign message",
      change: (d) => {
        d.messages[0].business_id = "b";
      },
    },
    {
      name: "unscoped qualification",
      change: (d) => {
        d.answers[0].thread_id = "foreign";
      },
    },
    {
      name: "foreign appointment",
      change: (d) => {
        d.appointments[0].business_id = "b";
      },
    },
    {
      name: "wrong appointment contact",
      change: (d) => {
        d.appointments[0].contact_id = "other";
      },
    },
    {
      name: "foreign followup",
      change: (d) => {
        d.followups[0].business_id = "b";
      },
    },
    {
      name: "unscoped handoff",
      change: (d) => {
        d.handoffs[0].thread_id = "foreign";
      },
    },
    {
      name: "duplicate thread",
      change: (d) => {
        d.threads.push(d.threads[0]);
      },
    },
    {
      name: "foreign receipt",
      change: (d) => {
        d.receipts[0].businessId = "b";
      },
    },
    {
      name: "receipt joins another thread",
      change: (d) => {
        d.receipts[0].threadId = d.threads[1].id;
      },
    },
    {
      name: "missing receipt reference",
      change: (d) => {
        d.receipts[0].reference = "";
      },
    },
    {
      name: "missing human verifier",
      change: (d) => {
        d.receipts[0].actor = null;
      },
    },
    {
      name: "future receipt",
      change: (d) => {
        d.receipts[0].at = "2099-01-01T00:00:00Z";
      },
    },
    {
      name: "invalid schedule",
      change: (d) => {
        d.followups[0].scheduled_at = "unknown";
      },
    },
    {
      name: "arbitrary progression",
      change: (d) => {
        d.receipts[0].value = "Converted by reply";
      },
    },
  ];
  it.each(attacks)("fails closed for $name", ({ change }) => {
    const d = syntheticSnapshot("a");
    change(d);
    expect(() => projectSnapshot(d, "a")).toThrow("could not be verified");
  });
  it("does not mutate source records or share mutable fixture instances", () => {
    const d = syntheticSnapshot("a");
    const saved = JSON.stringify(d);
    projectSnapshot(d, "a");
    expect(JSON.stringify(d)).toBe(saved);
    d.threads[0].summary = "changed";
    expect(syntheticSnapshot("b").threads[0].summary).not.toBe("changed");
  });
  it("requires explicit membership, tenant rollout and flags, never query parameters", () => {
    const context = {
      platformRole: "client" as const,
      activeBusinessId: "a",
      memberships: [{ business_id: "a", active: true }],
    };
    const env = {
      XEROWA_FOUNDATION_ENABLED: "1",
      XEROWA_FOUNDATION_TENANT_IDS: "a",
      XEROWA_CONTROL_ENABLED: "1",
    };
    expect(controlEnabled(context, {})).toBe(false);
    expect(controlEnabled(context, env)).toBe(true);
    expect(controlEnabled({ ...context, memberships: [] }, env)).toBe(false);
    expect(controlEnabled({ ...context, activeBusinessId: "b" }, env)).toBe(
      false,
    );
    expect(
      syntheticEnabled({
        NODE_ENV: "production",
        XEROWA_CONTROL_SYNTHETIC: "1",
      }),
    ).toBe(false);
    expect(syntheticEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(productNavigation("control", "client", false, false, false)).toEqual(
      productNavigation("control", "client"),
    );
    expect(productNavigation("command", "admin", true, true, true)).toEqual(
      productNavigation("command", "admin", true, true),
    );
  });
  it("keeps successful zero, partial, stale and unavailable different", () => {
    expect(countLabel("empty", 15)).toBe("0");
    expect(countLabel("ready", 0)).toBe("0");
    expect(countLabel("partial", 0)).toBe("≥ 0");
    expect(countLabel("stale", 2)).toBe("Last known 2");
    for (const s of [
      "permission",
      "loading",
      "error",
      "disconnected",
      "unavailable",
    ] as const) {
      expect(countLabel(s, 0)).toBe("—");
      expect(canShowRows(s)).toBe(false);
    }
    expect(unavailableModel("a").cases).toEqual([]);
  });
});
