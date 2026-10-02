import "server-only";
import type { AuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { readEnabled } from "@/lib/control/flags";
import { syntheticFirstRun } from "./flags";
import { blankReadiness } from "./model";
import { syntheticReadiness } from "./fixtures";
import { readReadiness, type ReadinessTable } from "./reader";
type Query = {
  eq: (field: string, id: string) => Query;
  order: (field: string, options: { ascending: boolean }) => Query;
  limit: (
    n: number,
  ) => Promise<{ data: unknown; error: { code?: string } | null }>;
};
type UserReadClient = {
  from: (table: ReadinessTable) => { select: (columns: string) => Query };
};
export async function loadReadiness(session: AuthSession) {
  const id = session.activeBusinessId;
  if (!id) return blankReadiness("", "denied");
  if (syntheticFirstRun(session, process.env))
    return syntheticReadiness({ actorId: session.user.id, tenantContext: id });
  if (!session.memberships.some((m) => m.active && m.business_id === id))
    return blankReadiness(id, "denied");
  if (!readEnabled(process.env)) return blankReadiness(id);
  try {
    const client = await createClient();
    const auth = await client.auth.getUser();
    if (auth.error || auth.data.user?.id !== session.user.id)
      return blankReadiness(id, "denied");
    const readClient = client as unknown as UserReadClient;
    return readReadiness(
      (table, columns, field, businessId) => {
        let query = readClient
          .from(table)
          .select(columns)
          .eq(field, businessId);
        if (table === "onboarding_configuration_versions")
          query = query
            .order("created_at", { ascending: false })
            .order("id", { ascending: false });
        return query.limit(51);
      },
      id,
      session.user.id,
    );
  } catch {
    return blankReadiness(id, "error");
  }
}
