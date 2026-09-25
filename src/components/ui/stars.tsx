import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${rating} star hotel`}>
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-secondary text-secondary" />
      ))}
    </span>
  );
}
