import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Headphones,
  MessageCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { requireBusinessAccess } from '@/lib/auth/session';
import { serviceClientOrNull } from '@/lib/sales-server';

export const metadata = { title: 'Plan & Support' };
export const dynamic = 'force-dynamic';

export default async function PlanSupportPage() {
  const session = await requireBusinessAccess();
  const supabase = serviceClientOrNull();
  const business = supabase && session.activeBusinessId
    ? (
        await (supabase.from('businesses') as any)
          .select('name,plan,status')
          .eq('id', session.activeBusinessId)
          .maybeSingle()
      ).data
    : null;
  const supportText = encodeURIComponent(
    `Hi XeroWA support, I need help with ${business?.name || 'my account'}.`,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Plan & Support"
        description="See your current service and contact the XeroWA team when you need help."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-[#b7ddd2] bg-[#edf8f4] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#075e54]">
                <CreditCard className="h-4 w-4" />
                Current plan
              </div>
              <h2 className="mt-3 text-3xl font-semibold capitalize tracking-[-0.045em] text-[#111b21]">
                {business?.plan || 'Managed launch'}
              </h2>
              <p className="mt-2 text-sm text-[#667781]">
                {business?.name || 'Your business'} · Managed by the XeroWA team
              </p>
            </div>
            <Badge variant={business?.status === 'paused' ? 'warning' : 'success'}>
              {business?.status === 'paused' ? 'Paused' : 'Active'}
            </Badge>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              'WhatsApp customer inbox',
              'Approved automatic replies',
              'Lead pipeline and handoffs',
              'Appointment tracking',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl bg-white/75 px-3 py-3 text-sm font-medium text-[#23312d]">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00a884]" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <Card className="border-[#d8dee4] shadow-none">
          <CardContent className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf8f4] text-[#075e54]">
              <Headphones className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#111b21]">
              Need help?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#667781]">
              Message the XeroWA team for connection help, reply updates, or account support.
            </p>
            <Button asChild className="mt-5 w-full bg-[#075e54] hover:bg-[#064e46]">
              <a
                href={`https://wa.me/917869161842?text=${supportText}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp Support
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <p className="mt-3 text-center text-xs text-[#8696a0]">
              Support replies during business hours.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
