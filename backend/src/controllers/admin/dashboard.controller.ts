import { Request, Response, NextFunction } from 'express';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import prisma from '../../config/database.js';
import { successResponse } from '../../utils/response.js';

export async function getDashboardStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Get counts in parallel
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      todayBookings,
      weekBookings,
      recentBookings,
      pricing,
    ] = await Promise.all([
      // Total bookings
      prisma.booking.count(),

      // Pending confirmations
      prisma.booking.count({
        where: { status: BookingStatus.PENDING },
      }),

      // Confirmed bookings
      prisma.booking.count({
        where: { status: BookingStatus.CONFIRMED },
      }),

      // Today's bookings
      prisma.booking.findMany({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
        },
        include: {
          chalet: {
            select: {
              nameAr: true,
              nameEn: true,
            },
          },
        },
        orderBy: { visitType: 'asc' },
      }),

      // This week's bookings count
      prisma.booking.count({
        where: {
          createdAt: { gte: weekAgo },
        },
      }),

      // Recent bookings (last 5)
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          chalet: {
            select: {
              nameAr: true,
              nameEn: true,
            },
          },
        },
      }),

      // Get pricing for revenue calculation
      prisma.pricing.findMany(),
    ]);

    // Calculate revenue (confirmed + deposit paid bookings)
    const paidBookings = await prisma.booking.count({
      where: {
        paymentStatus: {
          in: [PaymentStatus.DEPOSIT_PAID, PaymentStatus.FULLY_PAID],
        },
        createdAt: { gte: monthAgo },
      },
    });

    // Get deposit amount from pricing
    const depositAmount = pricing[0]?.depositAmount || 700;
    const estimatedRevenue = paidBookings * depositAmount;

    // Weekly booking trend (last 7 days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await prisma.booking.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      weeklyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        count,
      });
    }

    successResponse(res, 'تم جلب إحصائيات لوحة التحكم', {
      overview: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        weekBookings,
        estimatedRevenue,
      },
      todayBookings,
      recentBookings,
      weeklyTrend,
    });
  } catch (error) {
    next(error);
  }
}
