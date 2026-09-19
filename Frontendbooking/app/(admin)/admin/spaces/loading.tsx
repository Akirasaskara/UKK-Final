import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSpacesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 max-w-md">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <Skeleton className="h-16 w-full rounded-card" />

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-border-default bg-bg-surface p-5 space-y-3">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
