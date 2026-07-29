import Link from 'next/link';
import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { requireBusinessAccess } from '@/lib/auth/session';
import { isAdminPlatformRole } from '@/lib/auth/roles';
import { serviceClientOrNull } from '@/lib/sales-server';

export const metadata = { title: 'WhatsApp Status' };
export const dynamic = 'force-dynamic';

export default async function WhatsAppStatusPage() {
  const session = await requireBusinessAccess();
  const supabase = serviceClientOrNull();
  const businessId = session.activeBusinessId;
  const channel = supabase && businessId
    ? (
        await (supabase.from('business_channels') as any)
          .select('display_name,phone_number,status,last_verified_at')
          .eq('business_id', businessId)
          .eq('channel_type', 'whatsapp')
          .order('is_primary', { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data
    : null;
  const connected = channel?.status === 'connected';
  const supportText = encodeURIComponent(
    'Hi XeroWA support, I need help with my WhatsApp connection.',
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="WhatsApp Status"
        description="A simple view of the number XeroWA AI uses for customer conversations."
      />

      <section
        className={connected
          ? 'rounded-2xl border border-[#b7ddd2] bg-[#edf8f4] p-6 sm:p-8'
          : 'rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8'}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className={connected ? 'flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9fdd3] text-[#075e54]' : 'flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700'}>
            {connected ? <Wifi className="h-7 w-7" /> : <WifiOff className="h-7 w-7" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#111b21]">
                {connected ? 'WhatsApp is connected' : 'Reconnect WhatsApp'}
              </h2>
              <Badge variant={connected ? 'success' : 'warning'}>
                {connected ? 'Connected' : 'Action needed'}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#667781]">
              {connected
                ? 'Customer messages can reach your inbox and approved replies can be sent.'
                : 'Messages may not reach XeroWA AI until the connection is restored.'}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white/80 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#667781]">
            Connected number
          </div>
          <div className="mt-1 text-lg font-semibold text-[#111b21]">
            {channel?.display_name || channel?.phone_number || 'Number not available'}
          </div>
          {channel?.phone_number && channel.display_name ? (
            <div className="mt-1 text-sm text-[#667781]">{channel.phone_number}</div>
          ) : null}
        </div>

        {!connected ? (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {isAdminPlatformRole(session.platformRole) ? (
              <Button asChild className="bg-[#075e54] hover:bg-[#064e46]">
                <Link href="/admin#client-settings">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Open Admin Controls
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <a
                href={`https://wa.me/917869161842?text=${supportText}`}
                target="_blank"
                rel="noreferrer"
              >
                Contact Support
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatusStep icon={MessageCircle} title="Customer messages" body={connected ? 'Ready to receive' : 'Waiting for reconnection'} ready={connected} />
        <StatusStep icon={ShieldCheck} title="Approved replies" body={connected ? 'Ready to send' : 'Saved and protected'} ready={connected} />
        <StatusStep icon={CheckCircle2} title="Inbox history" body="Available in Customer Chats" ready />
      </div>
    </div>
  );
}

function StatusStep({
  icon: Icon,
  title,
  body,
  ready,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  ready: boolean;
}) {
  return (
    <Card className="border-[#d8dee4] shadow-none">
      <CardContent className="p-5">
        <Icon className={ready ? 'h-5 w-5 text-[#00a884]' : 'h-5 w-5 text-amber-600'} />
        <h3 className="mt-4 text-sm font-semibold text-[#111b21]">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-[#667781]">{body}</p>
      </CardContent>
    </Card>
  );
}
