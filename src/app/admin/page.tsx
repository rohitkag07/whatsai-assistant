import { AlertTriangle } from 'lucide-react';
import { AdminControlPanel } from '@/components/admin/AdminControlPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ADMIN_MODULES, getAdminModuleStates } from '@/lib/admin-control';
import { requirePlatformRole } from '@/lib/auth/session';
import { serviceClientOrNull } from '@/lib/sales-server';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ business_id?: string | string[] }>;

type BusinessRow = {
  id: string;
  name: string;
  category: string;
  status: string;
  plan: string;
  city: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  updated_at: string;
  metadata?: Record<string, unknown> | null;
};

export default async function AdminHomePage({ searchParams }: { searchParams: SearchParams }) {
  await requirePlatformRole(['admin', 'dev']);
  const supabase = serviceClientOrNull();

  if (!supabase) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Admin data unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Supabase service role is not configured for this runtime, so the platform dashboard cannot load client controls.
        </CardContent>
      </Card>
    );
  }

  const params = await searchParams;
  const rawBusinessId = Array.isArray(params?.business_id) ? params.business_id[0] : params?.business_id;
  const selectedBusinessId = rawBusinessId || null;

  const { data: businessesData, error: businessesError } = await (supabase.from('businesses') as any)
    .select('id,name,category,status,plan,city,owner_name,owner_phone,updated_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (businessesError) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Client list failed
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{businessesError.message}</CardContent>
      </Card>
    );
  }

  const businesses = ((businessesData ?? []) as BusinessRow[]).map(stripMetadata);
  const selectedBusinessResult = selectedBusinessId
    ? await (supabase.from('businesses') as any)
        .select('id,name,category,status,plan,city,owner_name,owner_phone,updated_at,metadata')
        .eq('id', selectedBusinessId)
        .maybeSingle()
    : null;
  const selectedBusiness = selectedBusinessResult?.data ? selectedBusinessResult.data as BusinessRow : null;

  const [channelsResult, membersResult, counts] = selectedBusinessId && selectedBusiness
    ? await Promise.all([
        (supabase.from('business_channels') as any)
          .select('id,channel_type,phone_number,phone_number_id,display_name,status,is_primary,last_verified_at')
          .eq('business_id', selectedBusinessId)
          .order('is_primary', { ascending: false }),
        (supabase.from('business_members') as any)
          .select('id,user_id,display_name,role,active,created_at')
          .eq('business_id', selectedBusinessId)
          .order('created_at', { ascending: true }),
        loadSelectedBusinessCounts(supabase, selectedBusinessId),
      ])
    : [null, null, null];

  return (
    <AdminControlPanel
      businesses={businesses}
      selectedBusinessId={selectedBusinessId}
      selectedBusiness={selectedBusiness ? stripMetadata(selectedBusiness) : null}
      channels={channelsResult?.data ?? []}
      members={membersResult?.data ?? []}
      counts={counts}
      moduleDefinitions={ADMIN_MODULES}
      moduleStates={selectedBusiness ? getAdminModuleStates(selectedBusiness.metadata) : null}
    />
  );
}

async function loadSelectedBusinessCounts(supabase: ReturnType<typeof serviceClientOrNull>, businessId: string) {
  if (!supabase) return null;

  const [contacts, threads, appointments, handoffs, knowledge] = await Promise.all([
    countByBusiness(supabase, 'conversation_contacts', businessId),
    countByBusiness(supabase, 'conversation_threads', businessId),
    countByBusiness(supabase, 'appointments', businessId),
    countByBusiness(supabase, 'handoff_events', businessId),
    countByBusiness(supabase, 'assistant_knowledge_items', businessId),
  ]);

  return { contacts, threads, appointments, handoffs, knowledge };
}

async function countByBusiness(supabase: NonNullable<ReturnType<typeof serviceClientOrNull>>, table: string, businessId: string) {
  const { count } = await (supabase.from(table) as any)
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId);

  return count ?? 0;
}

function stripMetadata(business: BusinessRow) {
  return {
    id: business.id,
    name: business.name,
    category: business.category,
    status: business.status,
    plan: business.plan,
    city: business.city,
    owner_name: business.owner_name,
    owner_phone: business.owner_phone,
    updated_at: business.updated_at,
  };
}
