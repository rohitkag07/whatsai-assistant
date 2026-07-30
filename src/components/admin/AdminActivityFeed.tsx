'use client';

import { useRef } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import type { AdminMessage } from '@/lib/admin-data';
import { AdminEmptyState, formatAdminDate, truncateAdminText } from '@/components/admin/AdminPrimitives';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

export function AdminActivityFeed({ activity }: { activity: AdminMessage[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const items = gsap.utils.toArray<HTMLElement>('[data-admin-activity]');
      items.forEach((item) => {
        gsap.fromTo(
          item,
          { autoAlpha: 0.28, y: 16 },
          {
            autoAlpha: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: item,
              start: 'top 92%',
              end: 'top 72%',
              scrub: 0.35,
            },
          },
        );
      });
    },
    { scope: root, dependencies: [activity.length] },
  );

  if (!activity.length) {
    return (
      <div className="p-4 sm:p-5">
        <AdminEmptyState
          title="No platform activity yet"
          description="New WhatsApp messages and automated replies will appear here as clients start using the platform."
        />
      </div>
    );
  }

  return (
    <div ref={root} className="divide-y divide-[#edf0ef]">
      {activity.map((message) => {
        const inbound = message.direction === 'inbound';
        const Icon = inbound ? ArrowDownLeft : ArrowUpRight;
        return (
          <article
            key={message.id}
            data-admin-activity
            className="group grid min-h-[88px] grid-cols-[40px_minmax(0,1fr)] gap-3 px-4 py-4 transition-colors hover:bg-[#f8fbfa] sm:grid-cols-[44px_minmax(0,1fr)_150px] sm:px-5"
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl',
                inbound
                  ? 'bg-[#e5f8f1] text-[#087d5d]'
                  : 'bg-[#eaf2ff] text-[#315d9b]',
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-[#111b21]">
                  {message.business_name}
                </span>
                <span className="text-xs text-[#86968f]">
                  {message.contact_name || message.contact_phone || 'Unknown contact'}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-[#52615c]">
                {truncateAdminText(message.body, 80)}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-medium capitalize text-[#7a8984] sm:hidden">
                <span>{message.direction}</span>
                <span>·</span>
                <time>{formatAdminDate(message.created_at)}</time>
              </div>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold capitalize text-[#52615c]">
                {message.direction}
              </p>
              <time className="mt-1 block text-[11px] text-[#86968f]">
                {formatAdminDate(message.created_at)}
              </time>
            </div>
          </article>
        );
      })}
    </div>
  );
}
