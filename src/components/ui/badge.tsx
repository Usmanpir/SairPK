import * as React from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'outline' | 'success' | 'gold' | 'muted' | 'warning' | 'destructive';
}) {
  const variants = {
    default: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/15',
    outline: 'border border-border bg-background text-foreground/80',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    gold: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-500/25',
    muted: 'bg-muted text-muted-foreground',
    warning: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-500/25',
    destructive: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-500/20'
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
