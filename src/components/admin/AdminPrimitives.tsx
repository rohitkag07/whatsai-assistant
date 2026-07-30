import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AdminPageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description: string;
  eyebrow: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-[28px] border border-[#cfd9d5] bg-[#073f3a] px-5 py-7 text-white shadow-[0_24px_70px_rgba(7,94,84,0.16)] sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#00a884]/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-12 h-28 w-44 -skew-x-12 rounded-t-[42px] border border-white/10 bg-white/[0.04]" />
      <div className="relative flex max-w-5xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#91e5cf]">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-5xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.05]">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d2e8e2] sm:text-[15px]">
            {description}
          </p>
        </div>
        {action ? <div className="relative shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function AdminMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'green',
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: LucideIcon;
  tone?: 'green' | 'blue' | 'amber' | 'slate';
}) {
  const tones = {
    green: 'bg-[#e2f7ee] text-[#087d5d]',
    blue: 'bg-[#eaf2ff] text-[#315d9b]',
    amber: 'bg-[#fff0dc] text-[#9a4b0f]',
    slate: 'bg-[#edf1f0] text-[#52615c]',
  };
  return (
    <Card className="group overflow-hidden border-[#d8e1dd] bg-white shadow-[0_12px_35px_rgba(17,27,33,0.045)] transition duration-300 hover:-translate-y-1 hover:border-[#a9d7ca] hover:shadow-[0_18px_45px_rgba(7,94,84,0.1)]">
      <CardContent className="flex min-h-[138px] items-start justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-semibold text-[#667781]">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-[#111b21]">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#7a8984]">{detail}</p>
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-105', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cdd8d4] bg-[#fbfdfc] px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f6f1] text-[#075e54]">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold tracking-[-0.02em] text-[#111b21]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#667781]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminQuickAction({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-36 flex-col justify-between rounded-2xl border border-[#d8e1dd] bg-white p-5 shadow-[0_10px_30px_rgba(17,27,33,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#8fd2c0] hover:shadow-[0_18px_44px_rgba(7,94,84,0.09)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf8f4] text-[#075e54]">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-[#86968f] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#00a884]" />
      </div>
      <div className="mt-6">
        <h3 className="font-semibold text-[#111b21]">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-[#667781]">{description}</p>
      </div>
    </Link>
  );
}

export function AdminStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const active = ['active', 'connected', 'published', 'ready', 'sent', 'delivered', 'read'].includes(normalized);
  const warning = ['paused', 'pending', 'testing', 'manual', 'partial', 'draft', 'acknowledged'].includes(normalized);
  const failed = ['failed', 'error', 'blocked', 'cancelled', 'disabled', 'archived'].includes(normalized);
  return (
    <Badge
      variant={failed ? 'destructive' : warning ? 'warning' : active ? 'success' : 'outline'}
      className="capitalize"
    >
      <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', active ? 'bg-[#00a884]' : warning ? 'bg-[#d97706]' : failed ? 'bg-current' : 'bg-[#8696a0]')} />
      {status.replaceAll('_', ' ')}
    </Badge>
  );
}

export function AdminSection({
  title,
  description,
  children,
  action,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('overflow-hidden rounded-2xl border border-[#d8e1dd] bg-white shadow-[0_12px_35px_rgba(17,27,33,0.04)]', className)}>
      <div className="flex flex-col gap-3 border-b border-[#e7ecea] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.025em] text-[#111b21]">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[#667781]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function formatAdminDate(value: string, withTime = true) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' as const } : {}),
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

export function truncateAdminText(value: string | null, length = 50) {
  const text = value?.trim() || 'No text content';
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}
