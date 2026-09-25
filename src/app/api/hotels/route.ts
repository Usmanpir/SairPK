import { NextRequest, NextResponse } from 'next/server';
import { hotelSearchSchema } from '@/lib/validation/booking';
import { searchHotels } from '@/lib/queries/hotels';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = hotelSearchSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid search parameters.', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const results = await searchHotels({
      destination: parsed.data.destinationSlug,
      checkIn: parsed.data.checkIn,
      checkOut: parsed.data.checkOut,
      adults: parsed.data.adults,
      rooms: parsed.data.rooms
    });
    return NextResponse.json({ results });
  } catch (err) {
    console.error('Hotel search failed', err);
    return NextResponse.json({ error: 'Something went wrong while searching hotels.' }, { status: 500 });
  }
}
