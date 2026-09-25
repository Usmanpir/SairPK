import * as React from 'react';
import { cn } from '@/lib/utils';

/** Centered icon + message block for empty, error and informational states. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'default',
  className
}: {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'default' | 'error' | 'warning';
  className?: string;
}) {
  const tones = {
    default: 'bg-accent text-primary ring-primary/10',
    error: 'bg-red-50 text-destructive ring-destructive/10',
    warning: 'bg-amber-50 text-amber-600 ring-amber-500/15'
  };
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center',
        className
      )}
    >
      <div className={cn('mb-5 grid h-14 w-14 place-items-center rounded-2xl ring-8 [&_svg]:h-6 [&_svg]:w-6', tones[tone])}>
        {icon}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <div className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
