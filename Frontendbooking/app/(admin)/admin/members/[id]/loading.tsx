import { Skeleton } from '@/components/ui/skeleton';

export default function AdminMemberDetailLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <Skeleton className="h-6 w-1/4" />
      <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 border-b border-border-default pb-6">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-control" />
          <Skeleton className="h-16 w-full rounded-control" />
        </div>
      </div>
    </div>
  );
}
