import type { BookingStatus, Pricing, FareBreakdown } from '../../shared-types/src/index';

export const transitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['DRIVER_ASSIGNED', 'CANCELLED'],
  DRIVER_ASSIGNED: ['CONFIRMED', 'TRIP_STARTED', 'CANCELLED'],
  TRIP_STARTED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertTransition(from: BookingStatus, to: BookingStatus) {
  if (!transitions[from]?.includes(to)) {
    throw new Error(`Invalid status transition: cannot change from ${from} to ${to}.`);
  }
}

export function calculateFare(
  pricing: Pricing,
  distance: number,
  roundTrip = false,
  fixedPrice?: number
): number {
  if (!Number.isFinite(distance) || distance <= 0) {
    throw new Error('Distance must be positive.');
  }
  const base = fixedPrice || distance * pricing.perKm;
  const withMin = Math.max(pricing.minimum, base);
  const total = withMin * (roundTrip ? 2 : 1) * pricing.surge;
  return Math.round(total);
}

export function calculateFareBreakdown(
  pricing: Pricing,
  distance: number,
  roundTrip = false,
  fixedPrice?: number
): FareBreakdown {
  const base = fixedPrice || distance * pricing.perKm;
  const rawSubtotal = Math.max(pricing.minimum, base) * (roundTrip ? 2 : 1);
  const surgeAddon = Math.round(rawSubtotal * (pricing.surge - 1));
  const subtotalWithSurge = Math.round(rawSubtotal * pricing.surge);
  const tax = Math.round(subtotalWithSurge * 0.05); // 5% GST on transport
  const total = subtotalWithSurge + tax;

  return {
    baseFare: Math.round(pricing.minimum),
    distanceFare: Math.round(base),
    surgeMultiplier: pricing.surge,
    additionalCharges: surgeAddon,
    tax,
    total,
    currency: 'INR',
  };
}

export const money = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

export const label = (s: string) =>
  s
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

export function generateBookingNumber(sequenceNum: number): string {
  return `TRV-${sequenceNum}`;
}
