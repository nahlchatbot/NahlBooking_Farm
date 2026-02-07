import { Request, Response, NextFunction } from 'express';
import { BookingStatus, VisitType } from '@prisma/client';
import {
  listBookings,
  getBookingById,
  updateBookingStatus,
  adminCancelBooking,
} from '../../services/booking.service.js';
import { whatsappService } from '../../services/whatsapp.service.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { parseDate } from '../../utils/date.js';

export async function listBookingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      visitType,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    const options: any = {
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
    };

    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      options.status = status as BookingStatus;
    }

    if (visitType && Object.values(VisitType).includes(visitType as VisitType)) {
      options.visitType = visitType as VisitType;
    }

    if (dateFrom) {
      const parsed = parseDate(dateFrom as string);
      if (parsed) options.dateFrom = parsed;
    }

    if (dateTo) {
      const parsed = parseDate(dateTo as string);
      if (parsed) options.dateTo = parsed;
    }

    if (search) {
      options.search = search as string;
    }

    const result = await listBookings(options);

    successResponse(res, 'تم جلب الحجوزات', result);
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
    const { id } = req.params;

    const booking = await getBookingById(id);

    if (!booking) {
      errorResponse(res, 'الحجز غير موجود', 404);
      return;
    }

    successResponse(res, 'تم جلب الحجز', booking);
  } catch (error) {
    next(error);
  }
}

export async function updateBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    const booking = await updateBookingStatus(id, updates);

    successResponse(res, 'تم تحديث الحجز', booking);

    // Send WhatsApp notification if status changed to CONFIRMED
    if (updates.status === 'CONFIRMED') {
      whatsappService.sendBookingApproved(booking).catch(() => {});
    }
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
    const { id } = req.params;
    const { reason } = req.body;

    if (!req.admin) {
      errorResponse(res, 'غير مصرح', 401);
      return;
    }

    const booking = await adminCancelBooking(id, reason, req.admin.id);

    successResponse(res, 'تم إلغاء الحجز', booking);

    // Send WhatsApp cancellation notification
    whatsappService.sendBookingCancelled(booking, reason).catch(() => {});
  } catch (error) {
    next(error);
  }
}

export async function sendReminderHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const booking = await getBookingById(id);

    if (!booking) {
      errorResponse(res, 'الحجز غير موجود', 404);
      return;
    }

    if (booking.status === 'CANCELLED') {
      errorResponse(res, 'لا يمكن إرسال تذكير لحجز ملغي', 400);
      return;
    }

    const sent = await whatsappService.sendBookingReminder(booking);

    if (sent) {
      successResponse(res, 'تم إرسال التذكير بنجاح');
    } else {
      errorResponse(res, 'فشل في إرسال التذكير. تأكد من تفعيل واتساب.', 500);
    }
  } catch (error) {
    next(error);
  }
}
