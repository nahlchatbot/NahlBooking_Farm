import { VisitType, BookingStatus } from '@prisma/client';
import prisma from '../config/database.js';
import { parseDate, isPastDate } from '../utils/date.js';
import { mapArabicVisitType } from '../utils/visitTypeMapper.js';

export interface AvailabilityResult {
  available: boolean;
  reason?: string;
}

export async function checkAvailability(
  dateString: string,
  visitTypeArabic: string
): Promise<AvailabilityResult> {
  // Parse and validate date
  const date = parseDate(dateString);
  if (!date) {
    return { available: false, reason: 'invalid_date' };
  }

  // Check if date is in the past
  if (isPastDate(date)) {
    return { available: false, reason: 'past_date' };
  }

  // Map Arabic visit type to enum
  const visitType = mapArabicVisitType(visitTypeArabic);
  if (!visitType) {
    return { available: false, reason: 'invalid_visit_type' };
  }

  // Check for blackout dates
  const blackout = await prisma.blackoutDate.findFirst({
    where: {
      date: date,
      OR: [
        { visitType: null }, // Blocks both types
        { visitType: visitType },
      ],
    },
  });

  if (blackout) {
    return { available: false, reason: 'blackout_date' };
  }

  // Check for existing confirmed bookings on this date and visit type
  const existingBooking = await prisma.booking.findFirst({
    where: {
      date: date,
      visitType: visitType,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      },
    },
  });

  if (existingBooking) {
    return { available: false, reason: 'already_booked' };
  }

  return { available: true };
}

export async function getAvailabilityForDateRange(
  startDate: Date,
  endDate: Date
): Promise<Map<string, { dayAvailable: boolean; nightAvailable: boolean }>> {
  const results = new Map<string, { dayAvailable: boolean; nightAvailable: boolean }>();

  // Get all bookings in range
  const bookings = await prisma.booking.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      },
    },
    select: {
      date: true,
      visitType: true,
    },
  });

  // Get all blackout dates in range
  const blackouts = await prisma.blackoutDate.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
      visitType: true,
    },
  });

  // Build availability map
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    let dayAvailable = true;
    let nightAvailable = true;

    // Check bookings
    for (const booking of bookings) {
      const bookingDate = booking.date.toISOString().split('T')[0];
      if (bookingDate === dateKey) {
        if (booking.visitType === VisitType.DAY_VISIT) {
          dayAvailable = false;
        } else {
          nightAvailable = false;
        }
      }
    }

    // Check blackouts
    for (const blackout of blackouts) {
      const blackoutDate = blackout.date.toISOString().split('T')[0];
      if (blackoutDate === dateKey) {
        if (blackout.visitType === null) {
          dayAvailable = false;
          nightAvailable = false;
        } else if (blackout.visitType === VisitType.DAY_VISIT) {
          dayAvailable = false;
        } else {
          nightAvailable = false;
        }
      }
    }

    results.set(dateKey, { dayAvailable, nightAvailable });
    current.setDate(current.getDate() + 1);
  }

  return results;
}
