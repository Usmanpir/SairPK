import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Prev/next links that preserve the current filters in the query string. */
export function Pagination({
  basePath,
  page,
  pageSize,
  total,
  searchParams
}: {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      const value = Array.isArray(v) ? v[0] : v;
      if (value && k !== 'page') qs.set(k, value);
    }
    if (p > 1) qs.set('page', String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const linkClass = (disabled: boolean) =>
    cn(
      'inline-flex h-9 items-center gap-1 rounded-xl border border-border bg-background px-3 text-[13px] font-semibold transition-colors hover:bg-muted',
      disabled && 'pointer-events-none opacity-40'
    );

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-6 py-4 text-sm text-muted-foreground sm:flex-row">
      <p>
        {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <Link href={href(page - 1)} aria-disabled={page <= 1} className={linkClass(page <= 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Link>
        <span className="px-1 tabular-nums">
          {page} / {pages}
        </span>
        <Link href={href(page + 1)} aria-disabled={page >= pages} className={linkClass(page >= pages)}>
          Next <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
