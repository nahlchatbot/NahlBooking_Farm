import prisma from '../config/database.js';

/**
 * Generates a booking reference in the format FR-YYYY-XXXX
 * where YYYY is the current year and XXXX is a sequential number
 */
export async function generateBookingRef(): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Atomically increment the counter
  const counter = await prisma.bookingCounter.upsert({
    where: { year: currentYear },
    update: { count: { increment: 1 } },
    create: { year: currentYear, count: 1 },
  });

  // Format: FR-2024-0001
  const paddedCount = counter.count.toString().padStart(4, '0');
  return `FR-${currentYear}-${paddedCount}`;
}
