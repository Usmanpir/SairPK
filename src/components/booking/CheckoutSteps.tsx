import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['Guest details', 'Payment', 'Confirmed'];

/** Progress indicator for the booking flow. `current` is 0-based. */
export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3 last:flex-none">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors',
                  done && 'bg-primary text-white',
                  active && 'bg-primary text-white ring-4 ring-primary/15',
                  !done && !active && 'border border-border bg-card text-muted-foreground'
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden whitespace-nowrap text-sm font-semibold sm:inline',
                  active || done ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </span>
            {i < STEPS.length - 1 && (
              <span className={cn('h-0.5 min-w-6 flex-1 rounded-full', done ? 'bg-primary' : 'bg-border')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
