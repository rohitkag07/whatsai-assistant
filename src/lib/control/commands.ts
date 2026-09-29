import { createHash } from "node:crypto";
import { z } from "zod";

export const controlOperations = [
  "assign_owner",
  "acknowledge_handoff",
  "human_takeover",
  "pause_automation",
  "resume_automation",
  "decide_followup",
  "decide_appointment",
  "record_outcome",
  "save_configuration",
  "approve_configuration",
  "publish_configuration",
] as const;

export const commandRequestSchema = z
  .object({
    operation: z.enum(controlOperations),
    resourceId: z.string().uuid(),
    idempotencyKey: z.string().uuid(),
    payload: z.record(z.unknown()),
    expectedVersion: z.number().int().nonnegative().nullable(),
    reason: z.string().trim().min(3).max(1000),
    evidenceReference: z.string().trim().min(3).max(1000).nullable(),
    issuedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
  })
  .strict();

export type ControlCommandRequest = z.infer<typeof commandRequestSchema>;

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
    .join(",")}}`;
}

export function canonicalHash(value: unknown) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

export function commandPayloadHash(input: ControlCommandRequest) {
  return canonicalHash({
    operation: input.operation,
    resourceId: input.resourceId,
    payload: input.payload,
    expectedVersion: input.expectedVersion,
  });
}

export function commandWindowIsValid(
  input: ControlCommandRequest,
  now = Date.now(),
) {
  const issuedAt = Date.parse(input.issuedAt);
  const expiresAt = Date.parse(input.expiresAt);
  const maximumWindow =
    input.operation === "publish_configuration" ? 86_400_000 : 300_000;
  return (
    Number.isFinite(issuedAt) &&
    Number.isFinite(expiresAt) &&
    issuedAt <= now + 30_000 &&
    expiresAt > now &&
    expiresAt - issuedAt <= maximumWindow
  );
}
