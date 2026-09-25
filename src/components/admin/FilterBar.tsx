import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { humanize } from '@/lib/admin/format';

/**
 * A plain GET form: filters live in the URL, so they survive refreshes,
 * can be bookmarked and shared, and need no client JS.
 */
export function FilterBar({
  basePath,
  q,
  placeholder,
  selects = [],
  hidden = {}
}: {
  basePath: string;
  q: string;
  placeholder: string;
  selects?: { name: string; label: string; value: string; options: readonly string[] }[];
  /** Extra params to keep on submit (a GET form drops any query string in its action). */
  hidden?: Record<string, string>;
}) {
  const hasFilters = !!q || selects.some((s) => s.value);
  const hiddenQs = new URLSearchParams(hidden).toString();
  const clearHref = hiddenQs ? `${basePath}?${hiddenQs}` : basePath;

  return (
    <form action={basePath} className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:px-6">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div className="flex-1">
        <Input name="q" defaultValue={q} placeholder={placeholder} leftIcon={<Search />} aria-label="Search" />
      </div>
      {selects.map((s) => (
        <div key={s.name} className="sm:w-48">
          <NativeSelect name={s.name} defaultValue={s.value} aria-label={s.label}>
            <option value="">All {s.label.toLowerCase()}</option>
            {s.options.map((o) => (
              <option key={o} value={o}>
                {humanize(o)}
              </option>
            ))}
          </NativeSelect>
        </div>
      ))}
      <div className="flex gap-2">
        <Button type="submit" variant="outline">
          Apply
        </Button>
        {hasFilters && (
          <Button asChild variant="ghost">
            <Link href={clearHref}>Clear</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
