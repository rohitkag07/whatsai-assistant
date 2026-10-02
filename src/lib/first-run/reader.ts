import { z } from "zod";
import { configurationSchema, type TemplateId } from "@/lib/onboarding/model";
import { parseDraft } from "@/lib/onboarding/validation";
import { blankReadiness, type ReadinessSnapshot } from "./model";
const date = z.string().refine((v) => Number.isFinite(Date.parse(v)));
const scoped = { business_id: z.string().min(1) };
const version = z.object({
  ...scoped,
  id: z.string().uuid(),
  schema_version: z.literal(1),
  template_id: z.enum([
    "gym",
    "clinic",
    "real_estate",
    "seller",
    "admissions",
    "service",
  ]),
  version: z.number().int().positive(),
  payload: configurationSchema,
  payload_hash: z.string().regex(/^[a-f0-9]{64}$/),
  created_at: date,
});
const approval = z.object({
  ...scoped,
  configuration_id: z.string().uuid(),
  payload_hash: z.string(),
  approved_at: date,
  expires_at: date,
  revoked_at: date.nullable(),
});
const publication = z.object({
  ...scoped,
  configuration_id: z.string().uuid(),
  payload_hash: z.string(),
  published_at: date,
  revision: z.number().int().positive(),
});
const business = z.object({ id: z.string().min(1), name: z.string().min(1) });
const channel = z.object({
  ...scoped,
  is_active: z.boolean(),
  status: z.string(),
  last_verified_at: date.nullable(),
});
export type ReadinessTable =
  | "businesses"
  | "onboarding_configuration_versions"
  | "onboarding_configuration_approvals"
  | "business_configuration_publications"
  | "business_channels";
export type ReadPort = (
  table: ReadinessTable,
  columns: string,
  field: string,
  id: string,
) => Promise<{ data: unknown; error: { code?: string } | null }>;
export async function readReadiness(
  read: ReadPort,
  businessId: string,
  actorId: string,
  now = new Date().toISOString(),
): Promise<ReadinessSnapshot> {
  const specs: [ReadinessTable, string, string][] = [
    ["businesses", "id,name", "id"],
    [
      "onboarding_configuration_versions",
      "id,business_id,schema_version,template_id,version,payload,payload_hash,created_at",
      "business_id",
    ],
    [
      "onboarding_configuration_approvals",
      "business_id,configuration_id,payload_hash,approved_at,expires_at,revoked_at",
      "business_id",
    ],
    [
      "business_configuration_publications",
      "business_id,configuration_id,payload_hash,published_at,revision",
      "business_id",
    ],
    [
      "business_channels",
      "business_id,is_active,status,last_verified_at",
      "business_id",
    ],
  ];
  let results: Awaited<ReturnType<ReadPort>>[];
  try {
    results = await Promise.all(
      specs.map(([table, columns, field]) =>
        read(table, columns, field, businessId),
      ),
    );
  } catch {
    return blankReadiness(businessId, "error");
  }
  if (results.some((r) => r.error?.code === "42501"))
    return blankReadiness(businessId, "denied");
  if (results[0].error) return blankReadiness(businessId, "error");
  try {
    const schemas = [business, version, approval, publication, channel];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.error) continue;
      if (!Array.isArray(r.data) || r.data.length > 50)
        throw Error("Malformed or capped");
      for (const row of r.data) {
        const parsed = schemas[i].parse(row);
        if (
          ("business_id" in parsed
            ? parsed.business_id
            : "id" in parsed
              ? parsed.id
              : null) !== businessId
        )
          return blankReadiness(businessId, "denied");
      }
    }
    const businesses = z.array(business).parse(results[0].data);
    if (businesses.length !== 1) return blankReadiness(businessId, "denied");
    const versions = results[1].error
      ? []
      : z.array(version).parse(results[1].data);
    versions.sort(
      (a, b) =>
        b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id),
    );
    const current = versions[0];
    const approvals = results[2].error
      ? []
      : z.array(approval).parse(results[2].data);
    const pubs = results[3].error
      ? []
      : z.array(publication).parse(results[3].data);
    if (
      pubs.length > 1 ||
      pubs.some(
        (p) =>
          !versions.some(
            (v) =>
              v.id === p.configuration_id && v.payload_hash === p.payload_hash,
          ),
      ) ||
      approvals.some(
        (a) =>
          !versions.some(
            (v) =>
              v.id === a.configuration_id && v.payload_hash === a.payload_hash,
          ),
      )
    )
      return blankReadiness(businessId, "denied");
    const relevant = approvals.filter(
      (a) =>
        a.configuration_id === current?.id &&
        a.payload_hash === current?.payload_hash,
    );
    const valid = relevant.some(
      (a) =>
        !a.revoked_at &&
        Date.parse(a.approved_at) <= Date.parse(now) &&
        Date.parse(a.expires_at) > Date.parse(now),
    );
    const channels = results[4].error
      ? []
      : z.array(channel).parse(results[4].data);
    const draft = current
      ? parseDraft({
          schemaVersion: 1,
          id: current.id,
          actorId,
          tenantContext: businessId,
          templateId: current.template_id as TemplateId,
          templateVersion: 1,
          revision: 0,
          savedAt: null,
          config: current.payload,
        })
      : null;
    return {
      businessId,
      businessName: businesses[0].name,
      source: "Supabase · Non-production read",
      state: results.some((r) => r.error)
        ? "partial"
        : current
          ? "ready"
          : "empty",
      observedAt: now,
      version:
        current && draft
          ? { id: current.id, hash: current.payload_hash, draft }
          : null,
      approval: results[2].error
        ? "Unknown"
        : valid
          ? "Valid owner approval"
          : relevant.length
            ? "Expired or revoked"
            : "Not approved",
      publication: results[3].error
        ? "Unknown"
        : pubs.some(
              (p) =>
                p.configuration_id === current?.id &&
                p.payload_hash === current?.payload_hash,
            )
          ? "Staging published"
          : "Not published",
      channel: results[4].error
        ? "Unknown"
        : channels.some(
              (c) =>
                c.is_active && c.status === "connected" && c.last_verified_at,
            )
          ? "Recorded connection · unverified"
          : "Disconnected",
    };
  } catch {
    return blankReadiness(businessId, "error");
  }
}
