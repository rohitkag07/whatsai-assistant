import 'server-only';

import { isAdminPlatformRole } from '@/lib/auth/roles';
import type { AuthSession } from '@/lib/auth/session';
import type { ShellBusiness } from '@/lib/auth/shell-types';
import { serviceClientOrNull } from '@/lib/sales-server';

export async function loadShellBusinesses(
  session: AuthSession,
): Promise<ShellBusiness[]> {
  const supabase = serviceClientOrNull();
  if (!supabase) return [];

  let query = (supabase.from('businesses') as any)
    .select('id,name,category,status')
    .order('name', { ascending: true })
    .limit(100);

  if (!isAdminPlatformRole(session.platformRole)) {
    const businessIds = session.memberships.map(
      (membership) => membership.business_id,
    );
    if (!businessIds.length) return [];
    query = query.in('id', businessIds);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) return [];

  return data.map((business) => ({
    id: String(business.id),
    name: String(business.name || 'Unnamed client'),
    category: String(business.category || 'Business'),
    status: String(business.status || 'active'),
  }));
}
