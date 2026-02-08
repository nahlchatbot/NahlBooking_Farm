import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database.js';
import { successResponse, errorResponse } from '../../utils/response.js';

interface CalendarDate {
  date: string;
  dayVisit: 'available' | 'booked' | 'blackout';
  overnight: 'available' | 'booked' | 'blackout';
  bookings: {
    id: string;
    bookingRef: string;
    customerName: string;
    visitType: string;
    status: string;
  }[];
}

export async function getCalendarHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const chaletId = req.query.chaletId as string | undefined;

    // Get first and last day of month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Build booking filter
    const bookingWhere: any = {
      date: { gte: startDate, lte: endDate },
      status: { in: ['PENDING', 'CONFIRMED'] },
    };
    if (chaletId) {
      bookingWhere.chaletId = chaletId;
    }

    // Fetch bookings for the month
    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      select: {
        id: true,
        bookingRef: true,
        date: true,
        visitType: true,
        customerName: true,
        status: true,
        chaletId: true,
        chalet: { select: { nameAr: true, nameEn: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Build blackout filter
    const blackoutWhere: any = {
      date: { gte: startDate, lte: endDate },
    };
    if (chaletId) {
      blackoutWhere.OR = [
        { chaletId: chaletId },
        { chaletId: null }, // Global blackouts apply to all chalets
      ];
    }

    // Fetch blackout dates for the month
    const blackoutDates = await prisma.blackoutDate.findMany({
      where: blackoutWhere,
    });

    // Build calendar data
    const dates: CalendarDate[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Find bookings for this date
      const dayBookings = bookings.filter(
        (b) => new Date(b.date).toISOString().split('T')[0] === dateStr
      );

      // Find blackout dates
      const dayBlackouts = blackoutDates.filter(
        (b) => new Date(b.date).toISOString().split('T')[0] === dateStr
      );

      // Determine status for each visit type
      let dayVisitStatus: 'available' | 'booked' | 'blackout' = 'available';
      let overnightStatus: 'available' | 'booked' | 'blackout' = 'available';

      // Check blackouts
      const dayVisitBlackout = dayBlackouts.find(
        (b) => b.visitType === 'DAY_VISIT' || b.visitType === null
      );
      const overnightBlackout = dayBlackouts.find(
        (b) => b.visitType === 'OVERNIGHT_STAY' || b.visitType === null
      );

      if (dayVisitBlackout) dayVisitStatus = 'blackout';
      if (overnightBlackout) overnightStatus = 'blackout';

      // Check bookings (only if not already blackout)
      if (dayVisitStatus !== 'blackout') {
        const dayVisitBooking = dayBookings.find((b) => b.visitType === 'DAY_VISIT');
        if (dayVisitBooking) dayVisitStatus = 'booked';
      }

      if (overnightStatus !== 'blackout') {
        const overnightBooking = dayBookings.find((b) => b.visitType === 'OVERNIGHT_STAY');
        if (overnightBooking) overnightStatus = 'booked';
      }

      dates.push({
        date: dateStr,
        dayVisit: dayVisitStatus,
        overnight: overnightStatus,
        bookings: dayBookings.map((b) => ({
          id: b.id,
          bookingRef: b.bookingRef,
          customerName: b.customerName,
          visitType: b.visitType,
          status: b.status,
        })),
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary
    const summary = {
      available: dates.filter((d) => d.dayVisit === 'available' || d.overnight === 'available').length,
      booked: dates.filter((d) => d.dayVisit === 'booked' || d.overnight === 'booked').length,
      blackout: dates.filter((d) => d.dayVisit === 'blackout' && d.overnight === 'blackout').length,
      totalBookings: bookings.length,
    };

    successResponse(res, 'تم جلب بيانات التقويم', {
      year,
      month,
      dates,
      summary,
    });
  } catch (error) {
    next(error);
  }
}

export async function blockDateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate, visitType, reason, chaletId } = req.body;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    const createdDates = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];

      try {
        const blackoutDate = await prisma.blackoutDate.create({
          data: {
            date: new Date(dateStr),
            visitType: visitType || null,
            reason,
            createdBy: req.admin?.id,
            chaletId: chaletId || null,
          },
        });
        createdDates.push(blackoutDate);
      } catch {
        // Skip if already exists
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    successResponse(res, 'تم حجب التواريخ بنجاح', { blocked: createdDates.length });
  } catch (error) {
    next(error);
  }
}

export async function unblockDateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { date, visitType } = req.body;

    await prisma.blackoutDate.deleteMany({
      where: {
        date: new Date(date),
        visitType: visitType || null,
      },
    });

    successResponse(res, 'تم إلغاء حجب التاريخ بنجاح');
  } catch (error) {
    next(error);
  }
}
