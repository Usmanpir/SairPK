import { prisma } from '@/lib/db';
import { nightsBetween, resolveNightlyPrice, toNumber } from '@/lib/pricing';
import type { HotelStatus } from '@prisma/client';

export interface HotelSearchParams {
  destination?: string;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  adults: number;
  rooms: number;
}

/**
 * Searches VERIFIED hotels and computes, per hotel, the lowest available
 * nightly starting price across all its rooms for the requested date range —
 * taking blocked dates and per-date unit availability into account so we
 * never advertise a room that can't actually be booked.
 */
export async function searchHotels(params: HotelSearchParams) {
  const hotels = await prisma.hotel.findMany({
    where: {
      status: 'VERIFIED' as HotelStatus,
      ...(params.destination
        ? { destination: { name: { contains: params.destination, mode: 'insensitive' } } }
        : {})
    },
    include: {
      destination: true,
      images: { where: { isCover: true }, take: 1 },
      amenities: true,
      rooms: {
        include: {
          availability: true
        }
      }
    }
  });

  const nights = nightsBetween(new Date(params.checkIn), new Date(params.checkOut));

  return hotels
    .map((hotel) => {
      let startingPrice: number | null = null;

      for (const room of hotel.rooms) {
        if (room.maxAdults * params.rooms < params.adults) continue;

        const availabilityByDate = new Map(room.availability.map((a) => [a.date.toISOString().slice(0, 10), a]));

        let roomAvailableForAllNights = true;
        let roomTotal = 0;

        for (const night of nights) {
          const key = night.toISOString().slice(0, 10);
          const a = availabilityByDate.get(key);

          if (a?.isBlocked || (a && a.unitsAvailable < params.rooms)) {
            roomAvailableForAllNights = false;
            break;
          }

          const nightlyPrice = resolveNightlyPrice({
            date: night,
            basePrice: toNumber(room.basePrice),
            weekendPrice: room.weekendPrice ? toNumber(room.weekendPrice) : null,
            priceOverride: a?.priceOverride ? toNumber(a.priceOverride) : null
          });
          roomTotal += nightlyPrice;
        }

        if (!roomAvailableForAllNights || nights.length === 0) continue;

        const avgNightly = roomTotal / nights.length;
        if (startingPrice === null || avgNightly < startingPrice) {
          startingPrice = Math.round(avgNightly);
        }
      }

      return {
        id: hotel.id,
        slug: hotel.slug,
        name: hotel.name,
        starRating: hotel.starRating,
        destinationName: hotel.destination.name,
        coverImage: hotel.images[0]?.url ?? null,
        amenities: hotel.amenities.map((a) => a.name),
        startingPrice
      };
    })
    .sort((a, b) => (a.startingPrice ?? Infinity) - (b.startingPrice ?? Infinity));
}

export async function getHotelBySlug(slug: string) {
  return prisma.hotel.findUnique({
    where: { slug },
    include: {
      destination: true,
      images: true,
      amenities: true,
      rooms: {
        include: { images: true, amenities: true, availability: true }
      },
      reviews: { where: { isApproved: true }, include: { user: true }, take: 10, orderBy: { createdAt: 'desc' } }
    }
  });
}
