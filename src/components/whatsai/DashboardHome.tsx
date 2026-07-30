'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageCircle,
  Siren,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { AutoRefreshIndicator } from '@/components/shared/AutoRefreshIndicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WhatsAiInboxData, WhatsAiThread } from '@/lib/whatsai-data';

export function DashboardHome({ data }: { data: WhatsAiInboxData }) {
  const router = useRouter();
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const metrics = data.summary.metrics;
  const todayMessages = metrics.inboundToday + metrics.outboundToday;
  const hotLeads = data.threads.filter(
    (thread) =>
      thread.hotHandoff ||
      thread.status === 'pending_human' ||
      thread.stage === 'negotiating',
  ).length;
  const appointments = data.threads.flatMap((thread) => thread.appointment ? [{ thread, appointment: thread.appointment }] : []);
  const appointmentsThisWeek = appointments.filter(({ appointment }) => isThisWeek(appointment.scheduledAt)).length;
  const upcoming = appointments
    .filter(({ appointment }) => new Date(appointment.scheduledAt).getTime() >= Date.now() && appointment.status !== 'cancelled')
    .sort((left, right) => left.appointment.scheduledAt.localeCompare(right.appointment.scheduledAt))
    .slice(0, 3);
  const activity = [...data.threads].sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt)).slice(0, 5);
  const attention = data.threads
    .filter((thread) => thread.hotHandoff || thread.status === 'pending_human' || thread.aiMode === 'manual' || thread.aiMode === 'paused')
    .sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt))
    .slice(0, 3);

  function markResolved(threadId: string) {
    setPendingThreadId(threadId);
    startTransition(async () => {
      try {
        const response = await fetch('/api/whatsai/thread-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            thread_id: threadId,
            status: 'resolved',
            ai_mode: 'assistant',
            handoff_reason: null,
          }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || 'Conversation could not be resolved.');
        }
        toast.success('Conversation marked as resolved.');
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Conversation could not be resolved.');
      } finally {
        setPendingThreadId(null);
      }
    });
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <header className="grid gap-5 border-b border-[#d8dee4] pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="wa-kicker">{formatDate(new Date())}</p>
          <h1 className="wa-page-title mt-2 w-full max-w-5xl">{smartGreeting()}. Your customer desk is ready.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667781]">Start with the conversations that need you, then review bookings and recent customer activity.</p>
          <AutoRefreshIndicator className="mt-3" />
        </div>
        <Button asChild size="lg" className="w-full bg-[#075e54] hover:bg-[#064e46] lg:w-auto">
          <Link href="/chats">Open customer inbox <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </header>

      {!data.threads.length ? <WelcomeState /> : null}

      <section aria-label="Today at a glance" className="wa-panel grid divide-y divide-[#e7ebe9] overflow-hidden sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Metric label="Messages today" value={todayMessages} icon={MessageCircle} />
        <Metric label="Hot leads" value={hotLeads} icon={Siren} attention={hotLeads > 0} />
        <Metric label="Upcoming visits" value={appointmentsThisWeek} icon={CalendarDays} />
      </section>

      <section className="grid grid-flow-dense grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="wa-panel overflow-hidden xl:col-span-8">
          <SectionHeader title="Needs attention" description="Customer conversations waiting for a human decision." icon={Siren} action={{ href: '/chats', label: 'Review inbox' }} />
          <div className="divide-y divide-[#edf0ef] px-2 pb-2">
            {attention.length ? attention.map((thread) => <AttentionRow key={thread.id} thread={thread} pending={pendingThreadId === thread.id} onResolve={() => markResolved(thread.id)} />) : (
              <PositiveState title="No handoffs waiting" body="XeroWA AI is handling active conversations. You will see urgent customer requests here." />
            )}
          </div>
        </div>

        <div className="wa-panel overflow-hidden xl:col-span-4">
          <SectionHeader title="Next appointments" description="Upcoming customer commitments." icon={CalendarDays} action={{ href: '/calendar', label: 'Calendar' }} />
          <div className="space-y-2 p-3">
            {upcoming.length ? upcoming.map(({ thread, appointment }) => <AppointmentRow key={appointment.id} thread={thread} appointment={appointment} />) : (
              <PositiveState compact title="No appointments yet" body="Bookings made from WhatsApp will appear here." />
            )}
          </div>
        </div>

        <div className="wa-panel overflow-hidden xl:col-span-12">
          <SectionHeader title="Recent customer activity" description="The latest conversations across your business." icon={MessageCircle} action={{ href: '/chats', label: 'All chats' }} />
          <div className="divide-y divide-[#edf0ef] px-2 pb-2">
            {activity.length ? activity.map((thread) => <ActivityRow key={thread.id} thread={thread} />) : (
              <PositiveState title="No customer activity yet" body="A new WhatsApp message will appear here as soon as it arrives." />
            )}
          </div>
        </div>

      </section>
    </div>
  );
}

function Metric({ label, value, icon: Icon, attention = false }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; attention?: boolean }) {
  return (
    <div className={cn('flex min-h-28 items-center gap-3 p-4 sm:p-5', attention && 'bg-[#fff8ee]')}>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', attention ? 'bg-[#ffead0] text-[#b45309]' : 'bg-[#edf8f4] text-[#075e54]')}><Icon className="h-5 w-5" /></div>
      <div className="min-w-0"><div className="text-2xl font-semibold tracking-[-0.04em] text-[#111b21]">{value}</div><div className="mt-1 text-xs leading-4 text-[#667781]">{label}</div></div>
    </div>
  );
}

function SectionHeader({ title, description, icon: Icon, action }: { title: string; description: string; icon: React.ComponentType<{ className?: string }>; action?: { href: string; label: string } }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e7ebe9] px-4 py-4 sm:px-5">
      <div className="flex min-w-0 gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf8f4] text-[#075e54]"><Icon className="h-4 w-4" /></div><div><h2 className="font-semibold tracking-[-0.02em] text-[#111b21]">{title}</h2><p className="mt-1 text-xs leading-5 text-[#667781]">{description}</p></div></div>
      {action ? <Link href={action.href} className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-[#087d70] hover:text-[#075e54] sm:flex">{action.label}<ChevronRight className="h-3.5 w-3.5" /></Link> : null}
    </div>
  );
}

function AttentionRow({ thread, pending, onResolve }: { thread: WhatsAiThread; pending: boolean; onResolve: () => void }) {
  return (
    <article className="wa-row rounded-2xl px-3 py-4 transition-all duration-200 hover:bg-[#fffaf3] sm:px-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff0dc] text-xs font-semibold text-[#a84f0f]">{initials(thread.contactName)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-[#111b21]">{thread.contactName}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#d97706]" />
            <Badge variant="warning">Needs you</Badge>
            <span className="ml-auto text-[10px] text-[#8696a0]">{formatTime(thread.lastMessageAt)}</span>
          </div>
          <div className="mt-3 rounded-xl border border-amber-200 bg-[#fff8ee] p-3">
            <p className="text-xs font-semibold text-[#8a4b12]">Why this needs you</p>
            <p className="mt-1 text-sm leading-5 text-[#4b3522]">{handoffReason(thread)}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#667781]">
              <span className="rounded-full bg-white px-2.5 py-1 capitalize">Stage: {thread.stage}</span>
              <span className="rounded-full bg-white px-2.5 py-1">Qualification: {thread.qualification.answered}/{thread.qualification.total}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" className="bg-[#075e54] hover:bg-[#064e46]">
              <Link href={`/chats?phone=${encodeURIComponent(thread.phone)}`}>Reply Now</Link>
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onResolve}>
              {pending ? 'Updating...' : 'Mark Resolved'}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ActivityRow({ thread }: { thread: WhatsAiThread }) {
  const status = activityStatus(thread);
  return (
    <Link href={`/chats?phone=${encodeURIComponent(thread.phone)}`} className="wa-row group flex items-center gap-3 rounded-xl px-3 py-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9fdd3] text-xs font-semibold text-[#075e54]">{initials(thread.contactName)}</div>
      <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-[#111b21]">{thread.contactName}</div><div className="mt-1 truncate text-xs text-[#667781]">{thread.lastBody}</div></div>
      <div className="text-right"><Badge variant={status === 'Needs you' ? 'warning' : status === 'Booked' ? 'success' : 'outline'}>{status}</Badge><div className="mt-1 text-[10px] text-[#8696a0]">{formatTime(thread.lastMessageAt)}</div></div>
    </Link>
  );
}

function AppointmentRow({ thread, appointment }: { thread: WhatsAiThread; appointment: NonNullable<WhatsAiThread['appointment']> }) {
  return (
    <Link href={`/chats?phone=${encodeURIComponent(thread.phone)}`} className="wa-row block rounded-xl border border-transparent bg-[#f7faf8] p-3 hover:border-[#b7ddd2]">
      <div className="flex items-start justify-between gap-2"><div className="text-sm font-semibold text-[#111b21]">{thread.contactName}</div><Badge variant="success">{appointment.status}</Badge></div>
      <div className="mt-2 flex items-center gap-2 text-xs text-[#667781]"><Clock3 className="h-3.5 w-3.5 text-[#00a884]" />{formatDateTime(appointment.scheduledAt)}</div>
      <div className="mt-1 text-xs capitalize text-[#667781]">{appointment.type.replace('_', ' ')}</div>
    </Link>
  );
}

function PositiveState({ title, body, compact = false }: { title: string; body: string; compact?: boolean }) {
  return <div className={cn('m-2 flex flex-col items-center justify-center rounded-xl bg-[#f7faf8] px-5 text-center', compact ? 'min-h-36' : 'min-h-44')}><CheckCircle2 className="h-7 w-7 text-[#00a884]" /><p className="mt-3 text-sm font-semibold text-[#111b21]">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-[#667781]">{body}</p></div>;
}

function WelcomeState() {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#b7ddd2] bg-[linear-gradient(135deg,#ffffff_0%,#edf8f4_58%,#d9fdd3_100%)] p-5 shadow-[0_12px_35px_rgba(17,27,33,0.05)] sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#075e54] text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-[#111b21]">Welcome to XeroWA AI</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52615c]">Your WhatsApp receptionist is ready. Send one test message to see the complete customer journey appear here.</p>
          <ol className="mt-5 grid gap-3 text-sm text-[#23312d] sm:grid-cols-3">
            <WelcomeStep number="1" title="WhatsApp connected" detail="Your business number is ready." />
            <WelcomeStep number="2" title="Instant replies" detail="Customers receive approved answers." />
            <WelcomeStep number="3" title="Live inbox" detail="Every conversation appears here." />
          </ol>
        </div>
        <Button asChild size="lg" className="w-full bg-[#075e54] hover:bg-[#064e46] lg:w-auto">
          <Link href="/whatsapp-status">Send a Test Message <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  );
}

function WelcomeStep({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <li className="rounded-xl border border-white/80 bg-white/80 p-3">
      <div className="flex items-center gap-2 font-semibold text-[#075e54]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d9fdd3] text-xs">{number}</span>
        {title}
      </div>
      <p className="mt-1 pl-8 text-xs leading-5 text-[#667781]">{detail}</p>
    </li>
  );
}

function handoffReason(thread: WhatsAiThread) {
  const reason = thread.hotHandoff?.summary || thread.hotHandoff?.reason || thread.handoffReason;
  if (!reason) return 'This customer asked for a decision that needs the business owner.';
  return reason.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function smartGreeting(): string {
  const hour = Number(new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Kolkata',
  }).format(new Date()));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function activityStatus(thread: WhatsAiThread) { if (thread.hotHandoff || thread.status === 'pending_human') return 'Needs you'; if (thread.appointment) return 'Booked'; if (thread.qualification.answered > 0 && !thread.qualification.qualified) return 'Qualifying'; return 'AI handling'; }
function isThisWeek(value: string) { const now = new Date(); const date = new Date(value); const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(start.getDate() + 7); return date >= start && date < end; }
function initials(name: string) { return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'WA'; }
function formatDate(value: Date) { return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(value); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }
function formatTime(value: string) { return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
