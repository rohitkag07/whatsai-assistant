import { describe, expect, it } from "vitest";
import {
  commandPayloadHash,
  commandRequestSchema,
  commandWindowIsValid,
} from "./commands";

const now = Date.parse("2026-09-29T12:00:00.000Z");
const input = {
  operation: "assign_owner" as const,
  resourceId: "11111111-1111-4111-8111-111111111111",
  idempotencyKey: "22222222-2222-4222-8222-222222222222",
  payload: { target_user_id: "33333333-3333-4333-8333-333333333333", label: "A" },
  expectedVersion: 0,
  reason: "Assign a responsible operator",
  evidenceReference: "review-1",
  issuedAt: "2026-09-29T12:00:00.000Z",
  expiresAt: "2026-09-29T12:05:00.000Z",
};

describe("control command envelope", () => {
  it("produces a stable hash regardless of object key order", () => {
    const reordered = { ...input, payload: { label: "A", target_user_id: input.payload.target_user_id } };
    expect(commandPayloadHash(input)).toBe(commandPayloadHash(reordered));
    expect(commandPayloadHash(input)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("does not bind a retry key into the payload identity", () => {
    expect(commandPayloadHash(input)).toBe(
      commandPayloadHash({ ...input, idempotencyKey: "44444444-4444-4444-8444-444444444444" }),
    );
  });

  it("rejects an extra business or actor authority field", () => {
    expect(commandRequestSchema.safeParse({ ...input, businessId: crypto.randomUUID() }).success).toBe(false);
    expect(commandRequestSchema.safeParse({ ...input, actorUserId: crypto.randomUUID() }).success).toBe(false);
  });

  it("enforces five minutes for normal commands", () => {
    expect(commandWindowIsValid(input, now)).toBe(true);
    expect(commandWindowIsValid({ ...input, expiresAt: "2026-09-29T12:05:00.001Z" }, now)).toBe(false);
  });

  it("permits at most 24 hours for a publish command", () => {
    const publish = { ...input, operation: "publish_configuration" as const, expiresAt: "2026-09-30T12:00:00.000Z" };
    expect(commandWindowIsValid(publish, now)).toBe(true);
    expect(commandWindowIsValid({ ...publish, expiresAt: "2026-09-30T12:00:00.001Z" }, now)).toBe(false);
  });
});
