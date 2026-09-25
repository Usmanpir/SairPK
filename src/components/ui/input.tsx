import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  /** Optional icon rendered inside the field on the left. */
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, error, leftIcon, ...props }, ref) => {
  return (
    <div className="w-full">
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          aria-invalid={error ? true : undefined}
          className={cn(
            'flex h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] transition-all placeholder:text-muted-foreground/70 hover:border-foreground/20 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon && 'pl-10',
            error && 'border-destructive hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
});
Input.displayName = 'Input';

export { Input };
