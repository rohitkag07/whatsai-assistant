import "server-only";

import { isAdminPlatformRole } from "@/lib/auth/roles";
import type { AuthSession } from "@/lib/auth/session";
import type { ShellBusiness } from "@/lib/auth/shell-types";
import { serviceClientOrNull } from "@/lib/sales-server";

export async function loadShellBusinesses(
  session: AuthSession,
): Promise<ShellBusiness[]> {
  const supabase = serviceClientOrNull();
  if (!supabase) return [];

  let query = (supabase.from("businesses") as any)
    .select("id,name,category,status")
    .order("name", { ascending: true })
    .limit(100);

  if (!isAdminPlatformRole(session.platformRole)) {
    const businessIds = session.memberships.map(
      (membership) => membership.business_id,
    );
    if (!businessIds.length) return [];
    query = query.in("id", businessIds);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) return [];

  return data.map((business) => ({
    id: String(business.id),
    name: String(business.name || "Unnamed client"),
    category: String(business.category || "Business"),
    status: String(business.status || "active"),
  }));
}

export async function loadShellUnreadCount(
  session: AuthSession,
): Promise<number> {
  if (!session.activeBusinessId) return 0;

  const supabase = serviceClientOrNull();
  if (!supabase) return 0;

  const { count, error } = await (supabase.from("conversation_threads") as any)
    .select("id", { count: "exact", head: true })
    .eq("business_id", session.activeBusinessId)
    .gt("unread_count", 0)
    .neq("status", "resolved")
    .neq("status", "archived");

  return error ? 0 : Number(count ?? 0);
}

// Foundation readers retain the existing tenant predicates while preserving uncertainty.
export async function loadFoundationShellState(
  session: AuthSession,
): Promise<import("@/lib/auth/shell-types").ShellReadState> {
  const supabase = serviceClientOrNull();
  if (!supabase)
    return {
      businesses: { status: "disconnected", data: null },
      unread: { status: "unknown", data: null },
    };
  const memberships = session.memberships
    .filter((member) => member.active)
    .map((member) => member.business_id);
  if (!isAdminPlatformRole(session.platformRole) && !memberships.length) {
    return {
      businesses: { status: "empty", data: [] },
      unread: { status: "unknown", data: null },
    };
  }
  const businessRead = async (): Promise<
    import("@/lib/auth/shell-types").ShellReadResult<ShellBusiness[]>
  > => {
    try {
      let query = (supabase.from("businesses") as any)
        .select("id,name,category,status")
        .order("name", { ascending: true })
        .limit(100);
      if (!isAdminPlatformRole(session.platformRole))
        query = query.in("id", memberships);
      const { data, error } = await query;
      if (error || !Array.isArray(data)) return { status: "error", data: null };
      const businesses = data.map(
        (business: {
          id: string;
          name?: string;
          category?: string;
          status?: string;
        }) => ({
          id: String(business.id),
          name: String(business.name || "Unnamed business"),
          category: String(business.category || "Business"),
          status: String(business.status || "active"),
        }),
      );
      return {
        status: businesses.length ? "ready" : "empty",
        data: businesses,
      };
    } catch {
      return { status: "error", data: null };
    }
  };
  const unreadRead = async (): Promise<
    import("@/lib/auth/shell-types").ShellReadResult<number>
  > => {
    if (
      !session.activeBusinessId ||
      (!isAdminPlatformRole(session.platformRole) &&
        !memberships.includes(session.activeBusinessId))
    )
      return { status: "unknown", data: null };
    try {
      const { count, error } = await (
        supabase.from("conversation_threads") as any
      )
        .select("id", { count: "exact", head: true })
        .eq("business_id", session.activeBusinessId)
        .gt("unread_count", 0)
        .neq("status", "resolved")
        .neq("status", "archived");
      if (error || typeof count !== "number")
        return { status: "error", data: null };
      return { status: count === 0 ? "empty" : "ready", data: count };
    } catch {
      return { status: "error", data: null };
    }
  };
  const [businesses, unread] = await Promise.all([
    businessRead(),
    unreadRead(),
  ]);
  return { businesses, unread };
}
