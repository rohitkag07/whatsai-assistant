'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AutoRefreshIndicator({
  intervalMs = 30_000,
  className,
}: {
  intervalMs?: number;
  className?: string;
}) {
  const router = useRouter();
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 1_000);
    const refresh = window.setInterval(() => {
      router.refresh();
      const refreshedAt = Date.now();
      setLastUpdatedAt(refreshedAt);
      setNow(refreshedAt);
    }, intervalMs);

    return () => {
      window.clearInterval(clock);
      window.clearInterval(refresh);
    };
  }, [intervalMs, router]);

  const seconds = Math.max(0, Math.floor((now - lastUpdatedAt) / 1_000));
  const label = seconds < 5
    ? 'Updated just now'
    : seconds < 60
      ? `Updated ${seconds}s ago`
      : `Updated ${Math.floor(seconds / 60)}m ago`;

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-[#667781]', className)}>
      <RefreshCw className="h-3.5 w-3.5 text-[#00a884]" aria-hidden="true" />
      {label}
    </span>
  );
}
