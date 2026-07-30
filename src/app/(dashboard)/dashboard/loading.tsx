import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-5" aria-label="Loading dashboard">
      <div className="space-y-3 border-b border-[#d8dee4] pb-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-12">
        <Skeleton className="h-80 rounded-2xl xl:col-span-8" />
        <Skeleton className="h-80 rounded-2xl xl:col-span-4" />
      </div>
    </div>
  );
}
