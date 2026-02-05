import { Booking, BookingStatus, PaymentStatus, VisitType } from '@prisma/client';
import prisma from '../config/database.js';
import { generateBookingRef } from '../utils/bookingRef.js';
import { parseDate, hoursUntil } from '../utils/date.js';
import { mapArabicVisitType } from '../utils/visitTypeMapper.js';
import { checkAvailability } from './availability.service.js';
import { CreateBookingInput } from '../types/validation.js';
import { AppError } from '../middleware/errorHandler.js';

export interface BookingWithChalet extends Booking {
  chalet?: {
    id: string;
    nameAr: string;
    nameEn: string;
    slug: string;
  } | null;
}

export async function createBooking(input: CreateBookingInput): Promise<BookingWithChalet> {
  // Check availability first
  const availability = await checkAvailability(input.date, input.visitType);
  if (!availability.available) {
    throw new AppError('هذا التاريخ غير متوفر للحجز', 400); // Date not available
  }

  // Parse date
  const date = parseDate(input.date);
  if (!date) {
    throw new AppError('تاريخ غير صالح', 400); // Invalid date
  }

  // Map visit type
  const visitType = mapArabicVisitType(input.visitType);
  if (!visitType) {
    throw new AppError('نوع الزيارة غير صالح', 400); // Invalid visit type
  }

  // Find chalet if specified
  let chaletId: string | undefined;
  if (input.chaletType && input.chaletType !== '' && input.chaletType !== 'يتم الاختيار لاحقاً') {
    const chalet = await prisma.chalet.findFirst({
      where: {
        nameAr: input.chaletType,
        isActive: true,
      },
    });
    if (chalet) {
      chaletId = chalet.id;
    }
  }

  // Generate booking reference
  const bookingRef = await generateBookingRef();

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      bookingRef,
      date,
      visitType,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      email: input.email,
      guests: input.guests,
      notes: input.notes,
      language: input.language,
      chaletId,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    },
    include: {
      chalet: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
        },
      },
    },
  });

  return booking;
}

export async function getBookingByRef(bookingRef: string): Promise<BookingWithChalet | null> {
  return prisma.booking.findUnique({
    where: { bookingRef },
    include: {
      chalet: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
        },
      },
    },
  });
}

export async function getBookingById(id: string): Promise<BookingWithChalet | null> {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      chalet: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
        },
      },
    },
  });
}

export async function generateCancellationOtp(bookingRef: string, phone: string): Promise<string> {
  const booking = await prisma.booking.findUnique({
    where: { bookingRef },
  });

  if (!booking) {
    throw new AppError('الحجز غير موجود', 404); // Booking not found
  }

  if (booking.customerPhone !== phone) {
    throw new AppError('رقم الجوال غير مطابق', 400); // Phone doesn't match
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new AppError('الحجز ملغي بالفعل', 400); // Already cancelled
  }

  if (booking.status === BookingStatus.COMPLETED) {
    throw new AppError('لا يمكن إلغاء حجز مكتمل', 400); // Cannot cancel completed
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.booking.update({
    where: { bookingRef },
    data: {
      otpCode: otp,
      otpExpiresAt,
    },
  });

  return otp;
}

export async function cancelBookingWithOtp(
  bookingRef: string,
  phone: string,
  otp: string
): Promise<BookingWithChalet> {
  const booking = await prisma.booking.findUnique({
    where: { bookingRef },
  });

  if (!booking) {
    throw new AppError('الحجز غير موجود', 404);
  }

  if (booking.customerPhone !== phone) {
    throw new AppError('رقم الجوال غير مطابق', 400);
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new AppError('الحجز ملغي بالفعل', 400);
  }

  if (!booking.otpCode || !booking.otpExpiresAt) {
    throw new AppError('يرجى طلب رمز التحقق أولاً', 400); // Please request OTP first
  }

  if (new Date() > booking.otpExpiresAt) {
    throw new AppError('رمز التحقق منتهي الصلاحية', 400); // OTP expired
  }

  if (booking.otpCode !== otp) {
    throw new AppError('رمز التحقق غير صحيح', 400); // Invalid OTP
  }

  // Cancel the booking
  return prisma.booking.update({
    where: { bookingRef },
    data: {
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: 'Customer requested cancellation',
      otpCode: null,
      otpExpiresAt: null,
    },
    include: {
      chalet: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
        },
      },
    },
  });
}

export async function adminCancelBooking(
  bookingId: string,
  reason: string,
  adminId: string
): Promise<BookingWithChalet> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError('الحجز غير موجود', 404);
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new AppError('الحجز ملغي بالفعل', 400);
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: reason || `Cancelled by admin`,
    },
    include: {
      chalet: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
        },
      },
    },
  });
}

export async function updateBookingStatus(
  bookingId: string,
  updates: {
    status?: BookingStatus;
    paymentStatus?: PaymentStatus;
    adminConfirmed?: boolean;
    notes?: string;
  }
): Promise<BookingWithChalet> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError('الحجز غير موجود', 404);
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      ...updates,
      adminConfirmed: updates.status === BookingStatus.CONFIRMED ? true : updates.adminConfirmed,
    },
    include: {
      chalet: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
        },
      },
    },
  });
}

export interface BookingListOptions {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  visitType?: VisitType;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export async function listBookings(options: BookingListOptions) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (options.status) {
    where.status = options.status;
  }

  if (options.visitType) {
    where.visitType = options.visitType;
  }

  if (options.dateFrom || options.dateTo) {
    where.date = {};
    if (options.dateFrom) where.date.gte = options.dateFrom;
    if (options.dateTo) where.date.lte = options.dateTo;
  }

  if (options.search) {
    where.OR = [
      { customerName: { contains: options.search, mode: 'insensitive' } },
      { customerPhone: { contains: options.search } },
      { bookingRef: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        chalet: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
