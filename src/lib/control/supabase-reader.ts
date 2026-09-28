import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { columns, type ReadPort } from "./read-contract";
import { readControl } from "./read-adapter";
import { unavailableModel } from "./adapter";

export function supabaseReadPort(
  client: Pick<SupabaseClient<Database>, "from">,
): ReadPort {
  return async (q) => {
    let query = client
      .from(q.table)
      .select(columns[q.table], { count: "exact" });
    if (q.table === "businesses") query = query.eq("id", q.businessId);
    else if (q.table !== "lead_qualification_answers")
      query = query.eq("business_id", q.businessId);
    else if (!q.threadIds?.length) throw new Error("Parent scope required");
    if (q.actorId) query = query.eq("user_id", q.actorId).eq("active", true);
    if (q.threadIds) query = query.in("thread_id", q.threadIds);
    if (q.after) query = query.gt("id", q.after);
    const { data, error, count, status } = await query
      .order("id", { ascending: true })
      .limit(q.limit)
      .abortSignal(AbortSignal.timeout(8000));
    return {
      data: data as unknown[] | null,
      error: error ? { code: error.code } : null,
      count,
      status,
    };
  };
}
export async function loadControlRead(session: AuthSession) {
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    if (error || data.user?.id !== session.user.id)
      return {
        ...unavailableModel(session.activeBusinessId ?? ""),
        status: "permission" as const,
      };
    // Existing SSR and direct SDK dependencies use different generic declarations.
    // Adapt only the SELECT builder surface; no auth/service-role capability crosses it.
    return await readControl(
      session,
      supabaseReadPort(
        client as unknown as Pick<SupabaseClient<Database>, "from">,
      ),
    );
  } catch {
    return unavailableModel(session.activeBusinessId ?? "");
  }
}
