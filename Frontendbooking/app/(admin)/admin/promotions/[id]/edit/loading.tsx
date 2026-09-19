import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPromotionEditLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <Skeleton className="h-6 w-1/4" />
      <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 space-y-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
