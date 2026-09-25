import { Skeleton } from '@/components/ui/skeleton';

export default function HotelsLoading() {
  return (
    <div>
      <section className="border-b border-border/70 bg-gradient-to-b from-accent/70 to-background">
        <div className="container py-10 sm:py-12">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-9 w-72" />
          <Skeleton className="mt-8 h-[164px] rounded-[1.5rem] lg:h-[92px]" />
        </div>
      </section>
      <div className="container space-y-5 py-10">
        <Skeleton className="h-5 w-56" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card sm:flex-row">
            <Skeleton className="aspect-[16/10] w-full rounded-none sm:aspect-auto sm:h-52 sm:w-80" />
            <div className="flex-1 space-y-3 p-6">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-6 w-2/3" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
