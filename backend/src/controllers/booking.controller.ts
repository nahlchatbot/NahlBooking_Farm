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

export async function createBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as CreateBookingInput;

    const booking = await createBooking(input);

    // Return success response matching the expected format
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

    // Format for customer view
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

    // Get booking to determine language
    const booking = await getBookingByRef(ref);
    const lang = booking?.language || 'ar';

    // Send OTP via WhatsApp
    whatsappService.sendOtp(phone, otp, lang).catch((err) => {
      console.error('[WhatsApp] Failed to send OTP:', err);
    });

    // Log OTP in development for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP for ${ref}: ${otp}`);
    }

    successResponse(res, 'تم إرسال رمز التحقق إلى رقم الجوال', {
      message: 'تم إرسال رمز التحقق',
      // Only include OTP in development for testing
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

    // Send cancellation notification via WhatsApp
    whatsappService.sendBookingCancelled(booking).catch((err) => {
      console.error('[WhatsApp] Failed to send cancellation notification:', err);
    });
  } catch (error) {
    next(error);
  }
}
