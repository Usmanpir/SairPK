import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Brand mark: a stylised peak inside an emerald tile, plus the wordmark. */
export function Logo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link href="/" className={cn('group inline-flex items-center gap-2.5', className)} aria-label="Sair Pakistan home">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-primary shadow-glow transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path d="M2 19 9 8l3.5 5L15 9.5 22 19Z" fill="white" />
          <path d="M9 8l1.9 3-1.9 1.2L7.2 11Z" fill="hsl(var(--secondary))" />
          <circle cx="18" cy="5.5" r="1.8" fill="hsl(var(--secondary))" />
        </svg>
      </span>
      <span
        className={cn(
          'text-lg font-extrabold tracking-tight',
          tone === 'light' ? 'text-white' : 'text-foreground'
        )}
      >
        Sair<span className="text-secondary">.</span>pk
      </span>
    </Link>
  );
}
