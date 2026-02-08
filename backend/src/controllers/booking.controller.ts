import { Request, Response, NextFunction } from 'express';
import {
  createBooking,
  getBookingByRef,
  generateCancellationOtp,
  cancelBookingWithOtp,
} from '../services/booking.service.js';
import { whatsappService } from '../services/whatsapp.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { CreateBookingInput, CancelBookingInput } from '../types/validation.js';
import { mapEnumToLocalized } from '../utils/visitTypeMapper.js';
import { formatDateLocalized } from '../utils/date.js';
import prisma from '../config/database.js';

// In-memory store for phone OTP verification
const phoneOtpStore = new Map<string, { otp: string; expiresAt: Date; verified: boolean }>();

// Clean up expired entries every 15 minutes
setInterval(() => {
  const now = new Date();
  for (const [phone, data] of phoneOtpStore) {
    if (now > data.expiresAt) phoneOtpStore.delete(phone);
  }
}, 15 * 60 * 1000);

export async function requestPhoneOtpHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone } = req.body;
    if (!phone || !/^9665\d{8}$/.test(phone)) {
      errorResponse(res, 'رقم الجوال غير صالح. استخدم الصيغة 9665xxxxxxxx', 400);
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    phoneOtpStore.set(phone, { otp, expiresAt, verified: false });

    const lang = (req.body.language as string) || 'ar';
    const message = lang === 'ar'
      ? `رمز التحقق لتأكيد رقمك: ${otp}\nصالح لمدة 10 دقائق`
      : `Your verification code: ${otp}\nValid for 10 minutes`;

    whatsappService.sendMessage(phone, message).catch((err) => {
      console.error('[WhatsApp] Failed to send phone OTP:', err);
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Phone OTP for ${phone}: ${otp}`);
    }

    successResponse(res, 'تم إرسال رمز التحقق إلى واتساب', {
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyPhoneOtpHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      errorResponse(res, 'رقم الجوال ورمز التحقق مطلوبان', 400);
      return;
    }

    const stored = phoneOtpStore.get(phone);
    if (!stored) {
      errorResponse(res, 'يرجى طلب رمز التحقق أولاً', 400);
      return;
    }

    if (new Date() > stored.expiresAt) {
      phoneOtpStore.delete(phone);
      errorResponse(res, 'رمز التحقق منتهي الصلاحية', 400);
      return;
    }

    if (stored.otp !== otp) {
      errorResponse(res, 'رمز التحقق غير صحيح', 400);
      return;
    }

    phoneOtpStore.set(phone, { ...stored, verified: true });
    successResponse(res, 'تم التحقق من رقم الجوال بنجاح', { verified: true });
  } catch (error) {
    next(error);
  }
}

function isPhoneVerified(phone: string): boolean {
  const stored = phoneOtpStore.get(phone);
  if (!stored) return false;
  if (new Date() > stored.expiresAt) {
    phoneOtpStore.delete(phone);
    return false;
  }
  return stored.verified;
}

export async function createBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as CreateBookingInput;

    // Check phone verification
    if (!isPhoneVerified(input.customerPhone)) {
      errorResponse(res, 'يرجى التحقق من رقم الجوال أولاً عبر رمز OTP', 400);
      return;
    }

    // Validate guest count against chalet capacity
    if (input.chaletType && input.chaletType !== '' && input.chaletType !== 'يتم الاختيار لاحقاً') {
      const chalet = await prisma.chalet.findFirst({
        where: { OR: [{ nameAr: input.chaletType }, { id: input.chaletType }], isActive: true },
      });
      if (chalet && input.guests && input.guests > chalet.maxGuests) {
        errorResponse(
          res,
          `عدد الضيوف (${input.guests}) يتجاوز سعة الشاليه "${chalet.nameAr}" (${chalet.maxGuests} ضيوف كحد أقصى)`,
          400
        );
        return;
      }
    }

    const booking = await createBooking(input);

    // Clear phone verification after successful booking
    phoneOtpStore.delete(input.customerPhone);

    res.status(201).json({
      ok: true,
      message: '✅ تم إرسال طلب الحجز بنجاح.',
      bookingRef: booking.bookingRef,
      data: {
        id: booking.id,
        bookingRef: booking.bookingRef,
        date: booking.date,
        visitType: booking.visitType,
        customerName: booking.customerName,
        status: booking.status,
      },
    });

    // Send WhatsApp notification (async, don't wait)
    whatsappService.sendBookingConfirmation(booking).catch((err) => {
      console.error('[WhatsApp] Failed to send booking confirmation:', err);
    });
  } catch (error) {
    next(error);
  }
}

export async function getBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { ref } = req.params;

    const booking = await getBookingByRef(ref);

    if (!booking) {
      errorResponse(res, 'الحجز غير موجود', 404);
      return;
    }

    const language = (req.query.lang as string) || booking.language || 'ar';

    successResponse(res, 'تم جلب بيانات الحجز', {
      bookingRef: booking.bookingRef,
      date: formatDateLocalized(booking.date, language),
      dateRaw: booking.date.toISOString().split('T')[0],
      visitType: mapEnumToLocalized(booking.visitType, language),
      customerName: booking.customerName,
      guests: booking.guests,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      chalet: booking.chalet
        ? {
            name: language === 'en' ? booking.chalet.nameEn : booking.chalet.nameAr,
          }
        : null,
      notes: booking.notes,
      canCancel: booking.status === 'PENDING' || booking.status === 'CONFIRMED',
    });
  } catch (error) {
    next(error);
  }
}

export async function requestCancellationOtpHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { ref } = req.params;
    const { phone } = req.body as CancelBookingInput;

    const otp = await generateCancellationOtp(ref, phone);

    const booking = await getBookingByRef(ref);
    const lang = booking?.language || 'ar';

    whatsappService.sendOtp(phone, otp, lang).catch((err) => {
      console.error('[WhatsApp] Failed to send OTP:', err);
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP for ${ref}: ${otp}`);
    }

    successResponse(res, 'تم إرسال رمز التحقق إلى رقم الجوال', {
      message: 'تم إرسال رمز التحقق',
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { ref } = req.params;
    const { phone, otp } = req.body as CancelBookingInput;

    if (!otp) {
      errorResponse(res, 'يرجى إدخال رمز التحقق', 400);
      return;
    }

    const booking = await cancelBookingWithOtp(ref, phone, otp);

    successResponse(res, 'تم إلغاء الحجز بنجاح', {
      bookingRef: booking.bookingRef,
      status: booking.status,
      cancelledAt: booking.cancelledAt,
    });

    whatsappService.sendBookingCancelled(booking).catch((err) => {
      console.error('[WhatsApp] Failed to send cancellation notification:', err);
    });
  } catch (error) {
    next(error);
  }
}
