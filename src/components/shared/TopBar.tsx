'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { NavMode } from '@/components/shared/Sidebar';

interface TopBarProps {
  builderName?: string;
  mode: NavMode;
  onMenuClick?: () => void;
}

const pageNames: Record<string, { title: string; eyebrow: string }> = {
  dashboard: { title: 'Morning brief', eyebrow: 'Today' },
  chats: { title: 'Customer conversations', eyebrow: 'Inbox' },
  calendar: { title: 'Appointments', eyebrow: 'Schedule' },
  leads: { title: 'Lead pipeline', eyebrow: 'Sales' },
  knowledge: { title: 'Business knowledge', eyebrow: 'Answers' },
  bookings: { title: 'Owner handoffs', eyebrow: 'Needs action' },
  admin: { title: 'Admin dashboard', eyebrow: 'Internal' },
};

export function TopBar({ builderName = 'XeroWA AI', mode, onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const route = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  const page = pageNames[route] ?? { title: 'XeroWA AI workspace', eyebrow: 'Workspace' };
  const profileHref = mode === 'admin' ? '/admin' : '/dashboard';
  const fallback = builderName
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex min-h-[68px] items-center gap-3 border-b border-[#d8dee4] bg-white/90 px-3 backdrop-blur-xl sm:px-5 lg:px-7">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <div className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00a884] sm:block">{page.eyebrow}</div>
        <div className="truncate text-sm font-semibold tracking-[-0.02em] text-[#111b21] sm:text-[15px]">{page.title}</div>
      </div>

      {mode === 'client' ? (
        <Link href="/chats" className="hidden items-center gap-2 rounded-full border border-[#d8dee4] bg-[#f8faf9] px-3 py-2 text-xs font-medium text-[#075e54] transition hover:border-[#00a884] hover:bg-[#edf8f4] md:flex">
          <MessageCircle className="h-3.5 w-3.5" />
          Open inbox
        </Link>
      ) : null}

      {mode === 'client' ? (
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/chats" aria-label="Open conversations requiring attention">
            <Bell className="h-5 w-5" />
          </Link>
        </Button>
      ) : null}

      <Link href={profileHref} className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-[#edf8f4]" aria-label={mode === 'admin' ? 'Open admin dashboard' : 'Open dashboard home'}>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-[#00a884] text-xs text-white">{fallback}</AvatarFallback>
        </Avatar>
        <div className="hidden md:block leading-tight">
          <div className="text-sm font-medium">{builderName}</div>
          <div className="text-[10px] text-[#667781]">WhatsApp inbox and lead desk</div>
        </div>
      </Link>
    </header>
  );
}
