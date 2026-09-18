import { PublicContainer } from '@/components/public/public-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function PromotionsLoading() {
  return (
    <PublicContainer className="py-10 sm:py-16 space-y-8">
      <div className="space-y-2 max-w-xl">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-card border border-border-default bg-bg-surface p-6 space-y-4"
          >
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        ))}
      </div>
    </PublicContainer>
  );
}
