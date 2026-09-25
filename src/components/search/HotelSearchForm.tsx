'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, BedDouble, CalendarDays, MapPin, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function HotelSearchForm({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const [destination, setDestination] = useState(params.get('destination') ?? '');
  const [checkIn, setCheckIn] = useState(params.get('checkIn') ?? todayISO(7));
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? todayISO(9));
  const [adults, setAdults] = useState(params.get('adults') ?? '2');
  const [rooms, setRooms] = useState(params.get('rooms') ?? '1');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out date must be after check-in date.');
      return;
    }
    setError(null);

    const qs = new URLSearchParams({
      destination,
      checkIn,
      checkOut,
      adults,
      rooms
    });
    router.push(`/hotels?${qs.toString()}`);
  }

  const fieldInput = 'border-transparent bg-muted/60 shadow-none hover:border-border hover:bg-background focus-visible:bg-background';

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'rounded-[1.5rem] border border-white/60 bg-white/95 p-3 shadow-lift ring-1 ring-black/[0.03] backdrop-blur-xl',
        className
      )}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.6fr_1fr_1fr_0.75fr_0.75fr_auto] lg:items-end">
        <div className="col-span-2 space-y-2 p-1 lg:col-span-1">
          <Label htmlFor="destination">Destination</Label>
          <Input
            id="destination"
            placeholder="e.g. Hunza, Skardu, Swat"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            leftIcon={<MapPin />}
            className={fieldInput}
          />
        </div>
        <div className="space-y-2 p-1">
          <Label htmlFor="checkIn">Check-in</Label>
          <Input
            id="checkIn"
            type="date"
            min={todayISO()}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            leftIcon={<CalendarDays />}
            className={fieldInput}
            required
          />
        </div>
        <div className="space-y-2 p-1">
          <Label htmlFor="checkOut">Check-out</Label>
          <Input
            id="checkOut"
            type="date"
            min={checkIn}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            leftIcon={<CalendarDays />}
            className={fieldInput}
            required
          />
        </div>
        <div className="space-y-2 p-1">
          <Label htmlFor="adults">Guests</Label>
          <Input
            id="adults"
            type="number"
            min={1}
            max={20}
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
            leftIcon={<Users />}
            className={fieldInput}
          />
        </div>
        <div className="space-y-2 p-1">
          <Label htmlFor="rooms">Rooms</Label>
          <Input
            id="rooms"
            type="number"
            min={1}
            max={10}
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
            leftIcon={<BedDouble />}
            className={fieldInput}
          />
        </div>
        <div className="col-span-2 p-1 lg:col-span-1">
          <Button type="submit" className="h-11 w-full px-6 lg:w-auto">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </div>
      {error && (
        <p className="mx-1 mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </form>
  );
}
