'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Bell,
  ChevronDown,
  Eye,
  Menu,
  MessageCircle,
  Wrench,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { NavMode } from '@/components/shared/Sidebar';
import { isAdminPlatformRole, type PlatformRole } from '@/lib/auth/roles';
import type { ShellBusiness } from '@/lib/auth/shell-types';

interface TopBarProps {
  mode: NavMode;
  platformRole: PlatformRole;
  activeBusinessId: string | null;
  businesses: ShellBusiness[];
  onMenuClick?: () => void;
}

const pageNames: Record<string, { title: string; eyebrow: string }> = {
  dashboard: { title: 'Today', eyebrow: 'Business overview' },
  chats: { title: 'Customer chats', eyebrow: 'WhatsApp inbox' },
  calendar: { title: 'Appointments', eyebrow: 'Schedule' },
  leads: { title: 'Lead pipeline', eyebrow: 'Sales' },
  knowledge: { title: 'Approved replies', eyebrow: 'Business answers' },
  bookings: { title: 'Owner handoffs', eyebrow: 'Needs action' },
  'whatsapp-status': { title: 'WhatsApp status', eyebrow: 'Connection' },
  'plan-support': { title: 'Plan and support', eyebrow: 'Account' },
  admin: { title: 'Agency control room', eyebrow: 'Platform operations' },
  'admin/clients': { title: 'Client directory', eyebrow: 'Platform operations' },
  'admin/conversations': { title: 'Conversation monitor', eyebrow: 'Platform operations' },
  'admin/knowledge': { title: 'Knowledge editor', eyebrow: 'Platform operations' },
  'admin/playbooks': { title: 'Playbook manager', eyebrow: 'Platform operations' },
  'admin/webhooks': { title: 'Webhook log', eyebrow: 'Platform operations' },
  'admin/team': { title: 'Team and access', eyebrow: 'Platform operations' },
  'admin/system': { title: 'System health', eyebrow: 'Platform operations' },
};

export function TopBar({
  mode,
  platformRole,
  activeBusinessId,
  businesses,
  onMenuClick,
}: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const segments = pathname.split('/').filter(Boolean);
  const route = segments[0] === 'admin' && segments[1]
    ? `admin/${segments[1]}`
    : segments[0] ?? 'dashboard';
  const page = pageNames[route] ?? {
    title: 'XeroWA AI workspace',
    eyebrow: 'Workspace',
  };
  const isPlatformUser = isAdminPlatformRole(platformRole);
  const currentBusiness =
    businesses.find((business) => business.id === activeBusinessId) ?? null;
  const currentBusinessId =
    currentBusiness?.id ?? (isPlatformUser ? null : businesses[0]?.id) ?? null;
  const workspaceName = currentBusiness?.name ?? 'XeroWA AI';
  const fallback = workspaceName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  async function selectBusiness(businessId: string, destination?: string) {
    if (!businessId || switching) return;
    setSwitching(true);
    setSwitchError(null);

    try {
      const response = await fetch('/api/admin/active-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Client switch failed.');
      }

      if (destination) {
        router.push(destination);
      } else if (mode === 'admin') {
        router.push(`/admin?business_id=${businessId}#client-settings`);
      } else {
        router.refresh();
      }
    } catch (error) {
      setSwitchError(
        error instanceof Error ? error.message : 'Client switch failed.',
      );
    } finally {
      setSwitching(false);
    }
  }

  async function openClientView() {
    const businessId = currentBusinessId ?? businesses[0]?.id;
    if (!businessId) {
      setSwitchError('Add or select a client before opening Client View.');
      return;
    }
    await selectBusiness(businessId, '/dashboard');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#d8dee4] bg-white/95 backdrop-blur-xl">
      <div className="flex min-h-[68px] items-center gap-3 px-3 sm:px-5 lg:px-7">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[#008b73] sm:block">
            {page.eyebrow}
          </div>
          <div className="truncate text-sm font-semibold tracking-[-0.02em] text-[#111b21] sm:text-[15px]">
            {page.title}
          </div>
        </div>

        {isPlatformUser ? (
          <div className="hidden items-center gap-2 xl:flex">
            <label className="relative">
              <span className="sr-only">Select client</span>
              <select
                value={currentBusinessId ?? ''}
                disabled={switching || !businesses.length}
                onChange={(event) => selectBusiness(event.target.value)}
                className="h-10 min-w-[230px] appearance-none rounded-xl border border-[#cfd8d5] bg-[#f8faf9] py-2 pl-3 pr-9 text-sm font-medium text-[#23312d] outline-none transition focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select client</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#667781]" />
            </label>

            {mode === 'admin' ? (
              <Button
                type="button"
                variant="outline"
                onClick={openClientView}
                disabled={switching || !businesses.length}
                className="border-[#b7d8cf] bg-[#edf8f4] text-[#075e54] hover:bg-[#dff4ec]"
              >
                <Eye className="mr-2 h-4 w-4" />
                Switch to Client View
              </Button>
            ) : (
              <Button asChild variant="outline" className="border-[#d8dee4]">
                <Link href="/admin">
                  <Wrench className="mr-2 h-4 w-4" />
                  Back to Admin Control
                </Link>
              </Button>
            )}
          </div>
        ) : null}

        {!isPlatformUser && mode === 'client' ? (
          <Link
            href="/chats"
            className="hidden items-center gap-2 rounded-full border border-[#d8dee4] bg-[#f8faf9] px-3 py-2 text-xs font-medium text-[#075e54] transition hover:border-[#00a884] hover:bg-[#edf8f4] md:flex"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Open inbox
          </Link>
        ) : null}

        {mode === 'client' ? (
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link
              href="/chats"
              aria-label="Open conversations requiring attention"
            >
              <Bell className="h-5 w-5" />
            </Link>
          </Button>
        ) : null}

        <Link
          href={mode === 'admin' ? '/admin' : '/dashboard'}
          className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-[#edf8f4]"
          aria-label={
            mode === 'admin' ? 'Open admin dashboard' : 'Open dashboard home'
          }
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#00a884] text-xs text-white">
              {fallback || 'XA'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden leading-tight md:block">
            <div className="max-w-40 truncate text-sm font-medium">
              {workspaceName}
            </div>
            <div className="text-[10px] text-[#667781]">
              {mode === 'admin' ? 'Agency operations' : 'Client workspace'}
            </div>
          </div>
        </Link>
      </div>

      {isPlatformUser ? (
        <div className="flex items-center gap-2 border-t border-[#edf0ef] px-3 py-2 xl:hidden">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Select client</span>
            <select
              value={currentBusinessId ?? ''}
              disabled={switching || !businesses.length}
              onChange={(event) => selectBusiness(event.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-[#cfd8d5] bg-[#f8faf9] py-2 pl-3 pr-9 text-sm font-medium text-[#23312d] outline-none focus:border-[#00a884]"
            >
              <option value="">Select client</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#667781]" />
          </label>
          {mode === 'admin' ? (
            <Button
              type="button"
              size="sm"
              onClick={openClientView}
              disabled={switching || !businesses.length}
              className="bg-[#075e54] hover:bg-[#064e46]"
            >
              <Eye className="mr-1.5 h-4 w-4" />
              Client View
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/admin">
                <Wrench className="mr-1.5 h-4 w-4" />
                Admin
              </Link>
            </Button>
          )}
        </div>
      ) : null}

      {switchError ? (
        <div
          role="alert"
          className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700"
        >
          {switchError}
        </div>
      ) : null}
    </header>
  );
}
