import { Badge } from '@/components/ui/badge';
import { humanize } from '@/lib/admin/format';

type Variant = React.ComponentProps<typeof Badge>['variant'];

const VARIANTS: Record<string, Variant> = {
  // Booking
  PENDING: 'gold',
  PAYMENT_PENDING: 'warning',
  CONFIRMED: 'default',
  PAID: 'success',
  CANCELLED: 'muted',
  COMPLETED: 'default',
  REFUNDED: 'outline',
  EXPIRED: 'muted',
  // Payment
  INITIATED: 'gold',
  SUCCESS: 'success',
  FAILED: 'destructive',
  PARTIALLY_REFUNDED: 'warning',
  // Hotel
  VERIFIED: 'success',
  REJECTED: 'destructive',
  SUSPENDED: 'warning'
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANTS[status] ?? 'muted'}>{humanize(status)}</Badge>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? 'success' : 'destructive'}>{active ? 'Active' : 'Suspended'}</Badge>;
}
