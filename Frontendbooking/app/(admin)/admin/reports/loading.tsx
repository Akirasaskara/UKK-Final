import { Skeleton } from '@/components/ui/skeleton';

export default function AdminReportsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 max-w-md">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <Skeleton className="h-16 w-full rounded-card" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-card" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Skeleton className="lg:col-span-7 h-72 w-full rounded-card" />
        <Skeleton className="lg:col-span-5 h-72 w-full rounded-card" />
      </div>
    </div>
  );
}
