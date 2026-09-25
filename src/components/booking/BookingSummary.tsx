import { CalendarDays, Hotel, Moon, Users } from 'lucide-react';
import { formatPKR, formatDate } from '@/lib/utils';

export function BookingSummary({
  hotelName,
  roomName,
  checkIn,
  checkOut,
  nights,
  adults,
  childrenCount,
  subtotal,
  discountAmount,
  taxAmount,
  total
}: {
  hotelName: string;
  roomName: string;
  checkIn: string | Date;
  checkOut: string | Date;
  nights: number;
  adults: number;
  childrenCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-emerald-900 p-6 text-white">
        <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-secondary/30 blur-2xl" aria-hidden />
        <div className="relative flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Hotel className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/65">Booking summary</p>
            <p className="mt-1 text-lg font-bold leading-snug">{hotelName}</p>
            <p className="text-sm text-white/75">{roomName}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-muted/70 p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> Check-in</p>
            <p className="mt-1 font-semibold">{formatDate(checkIn)}</p>
          </div>
          <div className="rounded-xl bg-muted/70 p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> Check-out</p>
            <p className="mt-1 font-semibold">{formatDate(checkOut)}</p>
          </div>
          <div className="rounded-xl bg-muted/70 p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Moon className="h-3.5 w-3.5" /> Nights</p>
            <p className="mt-1 font-semibold">{nights}</p>
          </div>
          <div className="rounded-xl bg-muted/70 p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> Guests</p>
            <p className="mt-1 font-semibold">
              {adults} adult{adults !== 1 ? 's' : ''}{childrenCount > 0 ? `, ${childrenCount} children` : ''}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 border-t border-dashed border-border pt-5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatPKR(subtotal)}</span></div>
          {discountAmount > 0 && (
            <div className="flex justify-between font-medium text-emerald-600"><span>Discount</span><span>-{formatPKR(discountAmount)}</span></div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Taxes & fees</span><span className="font-medium">{formatPKR(taxAmount)}</span></div>
          )}
        </div>

        <div className="flex items-end justify-between rounded-xl bg-accent/70 px-4 py-3.5">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-2xl font-extrabold tracking-tight text-primary">{formatPKR(total)}</span>
        </div>
      </div>
    </div>
  );
}
