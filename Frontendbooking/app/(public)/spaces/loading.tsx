import { PublicContainer } from '@/components/public/public-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function SpacesLoading() {
  return (
    <PublicContainer className="py-10 sm:py-16 space-y-8">
      <div className="space-y-2 max-w-xl">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <Skeleton className="h-16 w-full rounded-card" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-card border border-border-default bg-bg-surface p-4 space-y-4"
          >
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </PublicContainer>
  );
}
