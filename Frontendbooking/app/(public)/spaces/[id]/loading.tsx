import { PublicContainer } from '@/components/public/public-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function SpaceDetailLoading() {
  return (
    <PublicContainer className="py-10 sm:py-16 space-y-8">
      <Skeleton className="h-6 w-1/4" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <Skeleton className="aspect-[16/10] w-full rounded-card" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-96 w-full rounded-card" />
        </div>
      </div>
    </PublicContainer>
  );
}
