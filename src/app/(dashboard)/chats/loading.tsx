import { Skeleton } from '@/components/ui/skeleton';

export default function ChatsLoading() {
  return (
    <div className="grid min-h-[calc(100dvh-112px)] overflow-hidden rounded-[18px] border border-[#d8dee4] bg-white md:grid-cols-[320px_minmax(0,1fr)]" aria-label="Loading conversations">
      <div className="border-r border-[#d8dee4] p-3">
        <Skeleton className="mb-4 h-10 rounded-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex min-h-20 items-center gap-3 rounded-xl border border-[#edf0ef] p-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden bg-[#efeae2] p-6 md:block">
        <Skeleton className="ml-auto mt-24 h-20 w-2/3 rounded-xl" />
        <Skeleton className="mt-4 h-24 w-3/4 rounded-xl" />
      </div>
    </div>
  );
}
