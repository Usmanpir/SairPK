export const PAGE_SIZE = 20;

/** "PAYMENT_PENDING" → "Payment pending" */
export function humanize(value: string): string {
  const s = value.toLowerCase().replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

/** Returns the value only if it is one of the allowed options (guards enum filters from the URL). */
export function pick<T extends string>(value: string, options: readonly T[]): T | undefined {
  return (options as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(d);
}
