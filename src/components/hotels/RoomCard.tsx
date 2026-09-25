import Link from 'next/link';
import { ArrowRight, BedDouble, CalendarX2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AmenityIcon } from '@/components/ui/amenity-icon';
import { cn, formatPKR } from '@/lib/utils';

export interface RoomCardData {
  id: string;
  name: string;
  type: string;
  bedType: string;
  maxAdults: number;
  maxChildren: number;
  amenities: string[];
  nightlyPrice: number | null; // null = unavailable for the searched dates
  totalPrice: number | null;
  nights: number;
}

export function RoomCard({ room, bookingQuery }: { room: RoomCardData; bookingQuery: string }) {
  const available = room.nightlyPrice != null;

  return (
    <div
      className={cn(
        'group rounded-2xl border bg-card p-5 shadow-soft transition-all duration-300 sm:p-6',
        available ? 'border-border/80 hover:border-primary/30 hover:shadow-lift' : 'border-dashed border-border opacity-80'
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-bold sm:text-lg">{room.name}</h4>
            <Badge variant="muted" className="uppercase tracking-wide">{room.type}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-primary/80" />
              {room.bedType}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary/80" />
              Up to {room.maxAdults} adults{room.maxChildren > 0 ? `, ${room.maxChildren} children` : ''}
            </span>
          </div>
          {room.amenities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {room.amenities.slice(0, 5).map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 rounded-lg bg-muted/70 px-2 py-1 text-xs font-medium text-foreground/75"
                >
                  <AmenityIcon name={a} className="h-3 w-3 text-primary" />
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-row items-end justify-between gap-4 border-t border-border/70 pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
          {available ? (
            <>
              <div className="sm:text-right">
                <p className="text-2xl font-extrabold tracking-tight">
                  {formatPKR(room.nightlyPrice!)}
                  <span className="text-xs font-medium text-muted-foreground"> / night</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPKR(room.totalPrice!)} total for {room.nights} night{room.nights !== 1 ? 's' : ''}
                </p>
              </div>
              <Button asChild>
                <Link href={`/booking/${room.id}?${bookingQuery}`}>
                  Book Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </>
          ) : (
            <Badge variant="muted" className="gap-1.5 px-3 py-1.5">
              <CalendarX2 className="h-3.5 w-3.5" />
              Not available for these dates
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
