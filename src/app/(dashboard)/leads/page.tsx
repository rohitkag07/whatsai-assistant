import { SystemState } from '@/components/system/SystemState';
import { redirect } from 'next/navigation';
import { controlEntry } from '@/components/control/ControlEntry';
import { MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { LeadPipeline } from '@/components/leads/LeadPipeline';
import { requireBusinessAccess } from '@/lib/auth/session';
import { loadOperatorLeadsData } from '@/lib/whatsai-data';

export const metadata = { title: 'Leads' };
export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const session = await requireBusinessAccess();
  if (!session.activeBusinessId) redirect('/admin');
  const control = await controlEntry(session, 'pipeline');
  if (control) return control;
  const data = await loadOperatorLeadsData({ businessId: session.activeBusinessId });
  if (data.source === 'error') return <div className="x-legacy-content"><h1 className="text-2xl font-semibold">Pipeline unavailable</h1><SystemState kind="error" /><a className="x-button x-button-secondary mt-4" href="/leads">Reload pipeline</a></div>;

  return (
    <>
      <PageHeader
        title="Lead Pipeline"
        titleHi=""
        description="Every WhatsApp conversation is grouped by its current sales stage."
        actions={<span className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-muted-foreground"><MessageCircle className="h-4 w-4 text-[#00a884]" />Recorded lead pipeline</span>}
      />
      <p className="mb-6 -mt-3 text-xs text-muted-foreground">Records retrieved for this view</p>
      <LeadPipeline threads={data.threads} />
    </>
  );
}
