import Link from 'next/link';
import { ArrowRight, CalendarX2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SmartImage } from '@/components/ui/smart-image';
import { Stars } from '@/components/ui/stars';
import { AmenityIcon } from '@/components/ui/amenity-icon';
import { formatPKR } from '@/lib/utils';

export interface HotelCardData {
  id: string;
  slug: string;
  name: string;
  starRating: number;
  destinationName: string;
  coverImage?: string | null;
  startingPrice: number | null;
  amenities: string[];
}

export function HotelCard({ hotel, searchQuery }: { hotel: HotelCardData; searchQuery: string }) {
  const available = hotel.startingPrice != null;

  return (
    <Link
      href={`/hotels/${hotel.slug}?${searchQuery}`}
      className="group block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lift"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-72 lg:w-80">
          <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105 sm:absolute sm:inset-0">
            <SmartImage src={hotel.coverImage} alt={hotel.name} seed={hotel.name} />
          </div>
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
            <MapPin className="h-3 w-3 text-primary" />
            {hotel.destinationName}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-stretch">
          <div className="flex-1">
            <Stars rating={hotel.starRating} />
            <h3 className="mt-2 text-lg font-bold leading-snug transition-colors group-hover:text-primary sm:text-xl">
              {hotel.name}
            </h3>
            {hotel.amenities.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {hotel.amenities.slice(0, 4).map((a) => (
                  <li key={a} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <AmenityIcon name={a} className="h-3.5 w-3.5 text-primary/80" />
                    {a}
                  </li>
                ))}
                {hotel.amenities.length > 4 && (
                  <li className="text-xs font-medium text-muted-foreground">+{hotel.amenities.length - 4} more</li>
                )}
              </ul>
            )}
          </div>

          <div className="flex items-end justify-between gap-4 border-t border-border/70 pt-4 md:w-48 md:flex-col md:items-end md:justify-between md:border-l md:border-t-0 md:pl-6 md:pt-0">
            {available ? (
              <>
                <Badge variant="success" className="hidden md:inline-flex">Available</Badge>
                <div className="md:text-right">
                  <p className="text-xs font-medium text-muted-foreground">Starting from</p>
                  <p className="text-2xl font-extrabold tracking-tight text-foreground">
                    {formatPKR(hotel.startingPrice!)}
                  </p>
                  <p className="text-xs text-muted-foreground">per night</p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground md:flex-col md:items-end md:text-right">
                <CalendarX2 className="h-5 w-5 text-muted-foreground/70" />
                No rooms available for these dates
              </div>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              View rooms <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
