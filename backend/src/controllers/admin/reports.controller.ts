import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database.js';
import { successResponse } from '../../utils/response.js';

// Helper to parse date range
function getDateRange(req: Request) {
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // First of current month

  const endDate = req.query.endDate
    ? new Date(req.query.endDate as string)
    : new Date(); // Today

  // Set end of day for endDate
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

// GET /admin/reports/bookings
export async function getBookingsReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = getDateRange(req);
    const visitType = req.query.visitType as string | undefined;
    const status = req.query.status as string | undefined;

    const whereClause: Record<string, unknown> = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (visitType) whereClause.visitType = visitType;
    if (status) whereClause.status = status;

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        chalet: {
          select: { nameAr: true, nameEn: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate summary stats
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;

    const dayVisits = bookings.filter(b => b.visitType === 'DAY_VISIT').length;
    const overnightStays = bookings.filter(b => b.visitType === 'OVERNIGHT_STAY').length;

    // Get pricing for revenue calculation
    const pricing = await prisma.pricing.findMany();
    const dayPrice = pricing.find(p => p.visitType === 'DAY_VISIT')?.totalPrice ?? 0;
    const nightPrice = pricing.find(p => p.visitType === 'OVERNIGHT_STAY')?.totalPrice ?? 0;

    if (!pricing.length) {
      console.warn('No pricing data found - revenue calculations will show 0');
    }

    const estimatedRevenue = (dayVisits * dayPrice) + (overnightStays * nightPrice);
    const confirmedRevenue = bookings
      .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum, b) => {
        const price = b.visitType === 'DAY_VISIT' ? dayPrice : nightPrice;
        return sum + price;
      }, 0);

    successResponse(res, 'تم جلب تقرير الحجوزات', {
      bookings: bookings.map(b => ({
        id: b.id,
        bookingRef: b.bookingRef,
        date: b.date,
        visitType: b.visitType,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        guests: b.guests,
        chalet: b.chalet,
        status: b.status,
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt,
      })),
      summary: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        pendingBookings,
        dayVisits,
        overnightStays,
        estimatedRevenue,
        confirmedRevenue,
      },
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    next(error);
  }
}

// GET /admin/reports/revenue
export async function getRevenueReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = getDateRange(req);

    // Get confirmed/completed bookings
    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['CONFIRMED', 'COMPLETED'],
        },
      },
      orderBy: { date: 'asc' },
    });

    // Get pricing
    const pricing = await prisma.pricing.findMany();
    const dayPrice = pricing.find(p => p.visitType === 'DAY_VISIT')?.totalPrice ?? 0;
    const nightPrice = pricing.find(p => p.visitType === 'OVERNIGHT_STAY')?.totalPrice ?? 0;
    const dayDeposit = pricing.find(p => p.visitType === 'DAY_VISIT')?.depositAmount ?? 0;
    const nightDeposit = pricing.find(p => p.visitType === 'OVERNIGHT_STAY')?.depositAmount ?? 0;

    // Group by month for chart
    const monthlyRevenue: Record<string, { total: number; deposits: number; count: number }> = {};

    bookings.forEach(booking => {
      const monthKey = new Date(booking.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = { total: 0, deposits: 0, count: 0 };
      }

      const price = booking.visitType === 'DAY_VISIT' ? dayPrice : nightPrice;
      const deposit = booking.visitType === 'DAY_VISIT' ? dayDeposit : nightDeposit;

      monthlyRevenue[monthKey].total += price;
      monthlyRevenue[monthKey].deposits += deposit;
      monthlyRevenue[monthKey].count += 1;
    });

    // Convert to array for chart
    const chartData = Object.entries(monthlyRevenue)
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate totals
    const totalRevenue = bookings.reduce((sum, b) => {
      return sum + (b.visitType === 'DAY_VISIT' ? dayPrice : nightPrice);
    }, 0);

    const totalDeposits = bookings.reduce((sum, b) => {
      return sum + (b.visitType === 'DAY_VISIT' ? dayDeposit : nightDeposit);
    }, 0);

    // Revenue by visit type
    const dayVisitRevenue = bookings
      .filter(b => b.visitType === 'DAY_VISIT')
      .length * dayPrice;

    const overnightRevenue = bookings
      .filter(b => b.visitType === 'OVERNIGHT_STAY')
      .length * nightPrice;

    successResponse(res, 'تم جلب تقرير الإيرادات', {
      chartData,
      summary: {
        totalRevenue,
        totalDeposits,
        outstandingBalance: totalRevenue - totalDeposits,
        totalBookings: bookings.length,
        dayVisitRevenue,
        overnightRevenue,
        averagePerBooking: bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0,
      },
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    next(error);
  }
}

// GET /admin/reports/occupancy
export async function getOccupancyReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = getDateRange(req);

    // Calculate total days in range
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Get bookings in range
    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'COMPLETED'],
        },
      },
    });

    // Get blackout dates
    const blackoutDates = await prisma.blackoutDate.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate unique booked days
    const bookedDays = new Set(bookings.map(b => new Date(b.date).toISOString().split('T')[0]));
    const blackoutDayCount = new Set(blackoutDates.map(b => new Date(b.date).toISOString().split('T')[0])).size;

    // Available days (total - blackout)
    const availableDays = totalDays - blackoutDayCount;

    // Occupancy rate
    const occupancyRate = availableDays > 0
      ? Math.round((bookedDays.size / availableDays) * 100)
      : 0;

    // Day-by-day occupancy for chart
    const dailyOccupancy: { date: string; dayVisit: boolean; overnight: boolean }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayBookings = bookings.filter(
        b => new Date(b.date).toISOString().split('T')[0] === dateStr
      );

      dailyOccupancy.push({
        date: dateStr,
        dayVisit: dayBookings.some(b => b.visitType === 'DAY_VISIT'),
        overnight: dayBookings.some(b => b.visitType === 'OVERNIGHT_STAY'),
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // By day of week
    const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    bookings.forEach(b => {
      const day = new Date(b.date).getDay();
      byDayOfWeek[day]++;
    });

    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayOfWeekData = dayNames.map((name, index) => ({
      day: name,
      dayEn: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
      count: byDayOfWeek[index],
    }));

    successResponse(res, 'تم جلب تقرير الإشغال', {
      summary: {
        totalDays,
        availableDays,
        bookedDays: bookedDays.size,
        blackoutDays: blackoutDayCount,
        occupancyRate,
      },
      dailyOccupancy,
      byDayOfWeek: dayOfWeekData,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    next(error);
  }
}

// GET /admin/reports/customers
export async function getCustomersReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = getDateRange(req);

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by customer phone (unique customers)
    const customerMap = new Map<string, {
      name: string;
      phone: string;
      bookingCount: number;
      firstBooking: Date;
      lastBooking: Date;
    }>();

    bookings.forEach(b => {
      const existing = customerMap.get(b.customerPhone);
      if (existing) {
        existing.bookingCount++;
        if (b.createdAt > existing.lastBooking) {
          existing.lastBooking = b.createdAt;
        }
        if (b.createdAt < existing.firstBooking) {
          existing.firstBooking = b.createdAt;
        }
      } else {
        customerMap.set(b.customerPhone, {
          name: b.customerName,
          phone: b.customerPhone,
          bookingCount: 1,
          firstBooking: b.createdAt,
          lastBooking: b.createdAt,
        });
      }
    });

    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.bookingCount - a.bookingCount);

    // Summary
    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter(c => c.bookingCount > 1).length;
    const newCustomers = customers.filter(c => c.bookingCount === 1).length;

    // Top customers
    const topCustomers = customers.slice(0, 10);

    successResponse(res, 'تم جلب تقرير العملاء', {
      customers,
      topCustomers,
      summary: {
        totalCustomers,
        repeatCustomers,
        newCustomers,
        repeatRate: totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0,
        totalBookings: bookings.length,
        averageBookingsPerCustomer: totalCustomers > 0 ? (bookings.length / totalCustomers).toFixed(1) : '0',
      },
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    next(error);
  }
}

// GET /admin/reports/export/bookings - CSV export
export async function exportBookingsCsvHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = getDateRange(req);

    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        chalet: {
          select: { nameAr: true, nameEn: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Generate CSV content
    const headers = [
      'رقم الحجز',
      'التاريخ',
      'نوع الزيارة',
      'اسم العميل',
      'رقم الجوال',
      'عدد الضيوف',
      'الشاليه',
      'الحالة',
      'حالة الدفع',
      'تاريخ الإنشاء',
    ];

    const rows = bookings.map(b => [
      b.bookingRef,
      new Date(b.date).toLocaleDateString('ar-SA'),
      b.visitType === 'DAY_VISIT' ? 'زيارة نهارية' : 'إقامة ليلية',
      b.customerName,
      b.customerPhone,
      b.guests.toString(),
      b.chalet?.nameAr || '-',
      b.status,
      b.paymentStatus,
      new Date(b.createdAt).toLocaleDateString('ar-SA'),
    ]);

    // Add BOM for Arabic support in Excel
    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=bookings-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

// GET /admin/reports/export/revenue - CSV export
export async function exportRevenueCsvHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = getDateRange(req);

    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['CONFIRMED', 'COMPLETED'],
        },
      },
      orderBy: { date: 'asc' },
    });

    // Get pricing
    const pricing = await prisma.pricing.findMany();
    const dayPrice = pricing.find(p => p.visitType === 'DAY_VISIT')?.totalPrice ?? 0;
    const nightPrice = pricing.find(p => p.visitType === 'OVERNIGHT_STAY')?.totalPrice ?? 0;

    const headers = [
      'رقم الحجز',
      'التاريخ',
      'نوع الزيارة',
      'اسم العميل',
      'المبلغ',
      'حالة الدفع',
    ];

    const rows = bookings.map(b => [
      b.bookingRef,
      new Date(b.date).toLocaleDateString('ar-SA'),
      b.visitType === 'DAY_VISIT' ? 'زيارة نهارية' : 'إقامة ليلية',
      b.customerName,
      (b.visitType === 'DAY_VISIT' ? dayPrice : nightPrice).toString(),
      b.paymentStatus,
    ]);

    // Calculate totals
    const totalRevenue = bookings.reduce((sum, b) => {
      return sum + (b.visitType === 'DAY_VISIT' ? dayPrice : nightPrice);
    }, 0);

    rows.push(['', '', '', 'الإجمالي', totalRevenue.toString(), '']);

    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=revenue-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}
