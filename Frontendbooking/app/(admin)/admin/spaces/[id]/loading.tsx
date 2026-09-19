import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSpaceDetailLoading() {
  return (
    <div className="max-w-4xl space-y-6">
      <Skeleton className="h-6 w-1/4" />
      <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <Skeleton className="aspect-[16/10] w-full rounded-card" />
          </div>
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full rounded-control" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
