'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  BookOpen,
  CreditCard,
  Home,
  MessageCircle,
  SlidersHorizontal,
  Smartphone,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

export type NavMode = 'client' | 'admin';

type Item = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const clientItems: Item[] = [
  { href: '/dashboard', label: 'Home / Today', description: 'Daily business summary', icon: Home },
  { href: '/chats', label: 'Customer Chats', description: 'WhatsApp inbox', icon: MessageCircle },
  { href: '/leads', label: 'Leads', description: 'Sales pipeline', icon: Users },
  { href: '/calendar', label: 'Appointments', description: 'Visits and bookings', icon: CalendarDays },
  { href: '/knowledge', label: 'Approved Replies', description: 'Published answers', icon: BookOpen },
  { href: '/whatsapp-status', label: 'WhatsApp Status', description: 'Connection health', icon: Smartphone },
  { href: '/plan-support', label: 'Plan & Support', description: 'Account help', icon: CreditCard },
];

const adminItems: Item[] = [
  { href: '/admin', label: 'Client Control Room', description: 'Clients and live features', icon: SlidersHorizontal },
];

export function Sidebar({ mode, mobile = false, onNavigate }: { mode: NavMode; mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = mode === 'admin' ? adminItems : clientItems;

  return (
    <aside className={cn('h-full w-[272px] shrink-0 flex-col border-r border-[#d8dee4] bg-white', mobile ? 'flex' : 'sticky top-0 hidden lg:flex h-screen')}>
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-[#e5e9e7] px-5 py-5">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#075e54] text-white">
          <MessageCircle className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#25d366]" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111b21]">{APP_NAME}</div>
          <div className="mt-1 max-w-[170px] text-[11px] leading-4 text-[#667781]">{APP_TAGLINE}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {items.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors',
                isActive
                  ? 'bg-[#edf8f4] text-[#075e54]'
                  : 'text-[#667781] hover:bg-[#f5f7f6] hover:text-[#111b21]',
              )}
            >
              {isActive ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#00a884]" /> : null}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="font-medium">{item.label}</span>
                <span className={cn('mt-0.5 text-[11px]', isActive ? 'text-[#128c7e]' : 'text-[#8696a0]')}>
                  {item.description}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mx-5 mb-5 border-t border-[#e5e9e7] pt-4 text-[11px] leading-4 text-[#667781]">
        <span className="inline-flex items-center gap-2 font-medium text-[#075e54]"><span className="h-2 w-2 rounded-full bg-[#00a884]" /> {mode === 'admin' ? 'Agency control' : 'Reception desk'}</span>
        <p className="mt-1">{mode === 'admin' ? 'Switch clients, inspect workspaces, and control live replies.' : 'Chats, leads, appointments, and support in one place.'}</p>
      </div>
    </aside>
  );
}
