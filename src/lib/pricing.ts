import { Decimal } from '@prisma/client/runtime/library';

export interface NightlyRate {
  date: Date;
  price: number; // resolved price for that specific night (override or base/weekend)
}

export interface PriceBreakdown {
  nights: number;
  nightlyRates: NightlyRate[];
  subtotal: number; // sum of nightly rates before discount/tax
  discountPct: number;
  discountAmount: number;
  taxPct: number;
  taxAmount: number;
  total: number;
}

/**
 * Resolves the nightly price for a room on a given date.
 * Priority: RoomAvailability.priceOverride > weekend price (Fri/Sat) > base price.
 */
export function resolveNightlyPrice(params: {
  date: Date;
  basePrice: number;
  weekendPrice?: number | null;
  priceOverride?: number | null;
}): number {
  const { date, basePrice, weekendPrice, priceOverride } = params;

  if (priceOverride != null) return priceOverride;

  const day = date.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  const isWeekend = day === 5 || day === 6;
  if (isWeekend && weekendPrice != null) return weekendPrice;

  return basePrice;
}

export function toNumber(value: number | Decimal | string): number {
  return typeof value === 'object' ? Number(value.toString()) : Number(value);
}

/**
 * Full price breakdown for a stay, given resolved per-night rates.
 * Discount and tax are applied on top of the summed nightly subtotal, which
 * mirrors the display requirement: base -> seasonal/weekend -> discount -> tax.
 */
export function calculateBookingPrice(params: {
  nightlyRates: NightlyRate[];
  discountPct?: number;
  taxPct?: number;
}): PriceBreakdown {
  const { nightlyRates, discountPct = 0, taxPct = 0 } = params;

  const subtotal = round2(nightlyRates.reduce((sum, n) => sum + n.price, 0));
  const discountAmount = round2((subtotal * discountPct) / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = round2((taxableAmount * taxPct) / 100);
  const total = round2(taxableAmount + taxAmount);

  return {
    nights: nightlyRates.length,
    nightlyRates,
    subtotal,
    discountPct,
    discountAmount,
    taxPct,
    taxAmount,
    total
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Generates the list of calendar dates for a stay, excluding checkout day. */
export function nightsBetween(checkIn: Date, checkOut: Date): Date[] {
  const nights: Date[] = [];
  const cursor = new Date(checkIn);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setHours(0, 0, 0, 0);

  while (cursor < end) {
    nights.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return nights;
}

/** Generates a unique, human-readable booking reference, e.g. PK-TRV-2026-000123. */
export function generateBookingReference(sequence: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(6, '0');
  return `PK-TRV-${year}-${padded}`;
}
