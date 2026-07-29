import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, ArrowRight, CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireBusinessAccess } from '@/lib/auth/session';
import { loadWhatsAiInboxData, type WhatsAiThread } from '@/lib/whatsai-data';

export const metadata = { title: 'Handoffs' };
export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const session = await requireBusinessAccess();
  if (!session.activeBusinessId) redirect('/admin');
  const data = await loadWhatsAiInboxData({ businessId: session.activeBusinessId });
  const handoffs = data.threads
    .filter((thread) => thread.hotHandoff || thread.status === 'pending_human' || thread.aiMode === 'manual' || thread.aiMode === 'paused')
    .sort((left, right) => priorityScore(right) - priorityScore(left) || right.lastMessageAt.localeCompare(left.lastMessageAt));
  const openHandoffs = handoffs.filter((thread) => thread.hotHandoff?.status !== 'resolved').length;
  const aiPaused = data.threads.filter((thread) => thread.aiMode === 'manual' || thread.aiMode === 'paused').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Owner Handoffs"
        description="Customer conversations where XeroWA AI needs the owner or team to make the next decision."
        actions={<Button asChild size="sm" className="bg-[#075e54] hover:bg-[#064e46]"><Link href="/chats">Open inbox <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Open handoffs" value={openHandoffs} icon={AlertTriangle} tone="amber" />
        <SummaryCard label="AI paused/manual" value={aiPaused} icon={ShieldCheck} tone="slate" />
        <SummaryCard label="Unread threads" value={data.summary.metrics.unreadThreads} icon={MessageCircle} tone="green" />
      </section>

      {handoffs.length ? (
        <section className="grid gap-3">
          {handoffs.map((thread) => <HandoffRow key={thread.id} thread={thread} />)}
        </section>
      ) : (
        <EmptyState icon={CheckCircle2} title="No owner handoffs waiting" description="When a customer needs human approval, payment follow-up, or manual takeover, the conversation appears here." action={<Button asChild variant="outline"><Link href="/chats">Review all chats</Link></Button>} />
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; tone: 'amber' | 'green' | 'slate' }) {
  const toneClass = {
    amber: 'bg-amber-50 text-amber-800',
    green: 'bg-[#edf8f4] text-[#075e54]',
    slate: 'bg-slate-100 text-slate-700',
  }[tone];

  return (
    <Card className="border-[#d8dee4]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold tracking-[-0.04em] text-[#111b21]">{value}</div>
          <div className="text-xs text-[#667781]">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function HandoffRow({ thread }: { thread: WhatsAiThread }) {
  const reason = thread.hotHandoff?.reason ?? thread.handoffReason ?? (thread.aiMode === 'assistant' ? 'Needs owner review' : 'AI is paused for this conversation');
  const status = thread.hotHandoff?.status ?? thread.status;

  return (
    <Card className="border-[#d8dee4]">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base text-[#111b21]">{thread.contactName}</CardTitle>
          <p className="mt-1 text-xs text-[#667781]">{thread.phone}</p>
        </div>
        <Badge variant={thread.hotHandoff ? 'warning' : 'outline'}>{status.replace('_', ' ')}</Badge>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#111b21]">{reason}</p>
          <p className="mt-1 truncate text-sm text-[#667781]">{thread.lastBody}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {thread.assignedTo ? <Badge variant="secondary">{thread.assignedTo}</Badge> : null}
            <Badge variant="outline">{thread.stage}</Badge>
            <Badge variant="outline">{thread.aiMode}</Badge>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/chats?phone=${encodeURIComponent(thread.phone)}`}>Open chat</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function priorityScore(thread: WhatsAiThread) {
  if (thread.hotHandoff?.priority === 'critical') return 4;
  if (thread.hotHandoff?.priority === 'high') return 3;
  if (thread.status === 'pending_human') return 2;
  return thread.aiMode === 'manual' || thread.aiMode === 'paused' ? 1 : 0;
}
