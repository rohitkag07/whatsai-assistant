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

type ChannelRow = {
  id: string;
  business_id: string;
  channel_type: string;
  phone_number: string | null;
  display_name: string | null;
  status: string;
  is_primary: boolean;
  last_verified_at: string | null;
};

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requirePlatformRole(['admin', 'dev']);
  const supabase = serviceClientOrNull();

  if (!supabase) {
    return <AdminError title="Admin data unavailable" body="Client controls cannot load right now. Check the Supabase service connection and retry." />;
  }

  const params = await searchParams;
  const rawBusinessId = Array.isArray(params?.business_id)
    ? params.business_id[0]
    : params?.business_id;

  const [
    businessesResult,
    channelsResult,
    messagesSentToday,
    hotHandoffs,
  ] = await Promise.all([
    (supabase.from('businesses') as any)
      .select('id,name,category,status,plan,city,owner_name,owner_phone,updated_at')
      .order('created_at', { ascending: false })
      .limit(100),
    (supabase.from('business_channels') as any)
      .select('id,business_id,channel_type,phone_number,display_name,status,is_primary,last_verified_at')
      .eq('channel_type', 'whatsapp')
      .order('is_primary', { ascending: false }),
    countRows(supabase, 'conversation_messages', (query) =>
      query
        .eq('direction', 'outbound')
        .gte('created_at', startOfTodayInIndia()),
    ),
    countRows(supabase, 'handoff_events', (query) =>
      query.in('status', ['open', 'pending']),
    ),
  ]);

  if (businessesResult.error) {
    return <AdminError title="Client list failed" body="The client directory could not load. Retry in a moment." />;
  }

  const businesses = (businessesResult.data ?? []) as BusinessRow[];
  const channels = (channelsResult.data ?? []) as ChannelRow[];
  const selectedBusinessId =
    rawBusinessId ||
    session.activeBusinessId ||
    businesses[0]?.id ||
    null;
  const selectedBusinessResult = selectedBusinessId
    ? await (supabase.from('businesses') as any)
        .select('id,name,category,status,plan,city,owner_name,owner_phone,updated_at,metadata')
        .eq('id', selectedBusinessId)
        .maybeSingle()
    : null;
  const selectedBusiness = selectedBusinessResult?.data
    ? (selectedBusinessResult.data as BusinessRow)
    : null;
  const selectedCounts = selectedBusinessId
    ? await loadSelectedBusinessCounts(supabase, selectedBusinessId)
    : null;
  const primaryChannelByBusiness = new Map<string, ChannelRow>();

  for (const channel of channels) {
    const current = primaryChannelByBusiness.get(channel.business_id);
    if (!current || channel.is_primary) {
      primaryChannelByBusiness.set(channel.business_id, channel);
    }
  }

  const clientDirectory = businesses.map((business) => {
    const channel = primaryChannelByBusiness.get(business.id);
    return {
      ...stripMetadata(business),
      whatsapp_phone: channel?.phone_number ?? business.owner_phone,
      whatsapp_status: channel?.status ?? 'not_connected',
    };
  });

  return (
    <AdminControlPanel
      businesses={clientDirectory}
      selectedBusinessId={selectedBusinessId}
      selectedBusiness={selectedBusiness ? stripMetadata(selectedBusiness) : null}
      selectedChannels={channels.filter(
        (channel) => channel.business_id === selectedBusinessId,
      )}
      selectedCounts={selectedCounts}
      overview={{
        totalClients: businesses.length,
        liveConnections: channels.filter(
          (channel) => channel.status === 'connected',
        ).length,
        messagesSentToday,
        hotHandoffs,
      }}
      moduleDefinitions={ADMIN_MODULES.filter((module) =>
        ['assistant', 'followups', 'whatsapp'].includes(module.id),
      )}
      moduleStates={
        selectedBusiness
          ? getAdminModuleStates(selectedBusiness.metadata)
          : null
      }
    />
  );
}

function AdminError({ title, body }: { title: string; body: string }) {
  return (
    <Card className="border-red-200 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-[#667781]">{body}</CardContent>
    </Card>
  );
}

async function loadSelectedBusinessCounts(
  supabase: NonNullable<ReturnType<typeof serviceClientOrNull>>,
  businessId: string,
) {
  const [contacts, appointments, handoffs] = await Promise.all([
    countRows(supabase, 'conversation_contacts', (query) =>
      query.eq('business_id', businessId),
    ),
    countRows(supabase, 'appointments', (query) =>
      query.eq('business_id', businessId).in('status', ['scheduled', 'confirmed']),
    ),
    countRows(supabase, 'handoff_events', (query) =>
      query.eq('business_id', businessId).in('status', ['open', 'pending']),
    ),
  ]);

  return { contacts, appointments, handoffs };
}

async function countRows(
  supabase: NonNullable<ReturnType<typeof serviceClientOrNull>>,
  table: string,
  refine: (query: any) => any,
) {
  const query = (supabase.from(table) as any).select('id', {
    count: 'exact',
    head: true,
  });
  const { count } = await refine(query);
  return count ?? 0;
}

function startOfTodayInIndia() {
  const now = new Date();
  const indiaOffsetMs = 5.5 * 60 * 60 * 1000;
  const indiaNow = new Date(now.getTime() + indiaOffsetMs);
  indiaNow.setUTCHours(0, 0, 0, 0);
  return new Date(indiaNow.getTime() - indiaOffsetMs).toISOString();
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
