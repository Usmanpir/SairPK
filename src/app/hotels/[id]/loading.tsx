import { Skeleton } from '@/components/ui/skeleton';

export default function HotelDetailLoading() {
  return (
    <div className="container py-8 sm:py-10">
      <Skeleton className="h-4 w-60" />
      <Skeleton className="mt-6 h-3.5 w-20" />
      <Skeleton className="mt-3 h-10 w-96 max-w-full" />
      <Skeleton className="mt-3 h-4 w-64" />
      <div className="mt-6 grid h-[260px] grid-cols-2 grid-rows-2 gap-2 sm:h-[420px] sm:grid-cols-4">
        <Skeleton className="col-span-2 row-span-2 rounded-none rounded-l-3xl" />
        <Skeleton className="hidden rounded-none sm:block" />
        <Skeleton className="hidden rounded-none rounded-tr-3xl sm:block" />
        <Skeleton className="hidden rounded-none sm:block" />
        <Skeleton className="hidden rounded-none rounded-br-3xl sm:block" />
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
