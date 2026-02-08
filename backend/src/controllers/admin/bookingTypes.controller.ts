import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { createAuditLog } from '../../services/audit.service.js';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function listBookingTypesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const bookingTypes = await prisma.bookingType.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { chaletBookingTypes: true },
        },
      },
    });

    successResponse(res, 'تم جلب أنواع الحجز', { bookingTypes });
  } catch (error) {
    next(error);
  }
}

export async function getBookingTypeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const bookingType = await prisma.bookingType.findUnique({
      where: { id },
      include: {
        chaletBookingTypes: {
          include: {
            chalet: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                slug: true,
                isActive: true,
              },
            },
          },
        },
        chaletPricings: {
          include: {
            chalet: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
        _count: {
          select: {
            chaletBookingTypes: true,
            bookings: true,
          },
        },
      },
    });

    if (!bookingType) {
      errorResponse(res, 'نوع الحجز غير موجود', 404);
      return;
    }

    successResponse(res, 'تم جلب نوع الحجز', bookingType);
  } catch (error) {
    next(error);
  }
}

export async function createBookingTypeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { nameAr, nameEn, slug: inputSlug, startTime, endTime, sortOrder } = req.body;

    // Generate slug from English name if not provided
    let slug = inputSlug ? inputSlug : generateSlug(nameEn);

    // Ensure slug is unique
    const existingSlug = await prisma.bookingType.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const bookingType = await prisma.bookingType.create({
      data: {
        nameAr,
        nameEn,
        slug,
        startTime,
        endTime,
        sortOrder: sortOrder ?? 0,
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entity: 'BookingType',
      entityId: bookingType.id,
      changes: { nameEn, nameAr, slug, startTime, endTime },
      req,
    });

    successResponse(res, 'تم إنشاء نوع الحجز بنجاح', bookingType, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateBookingTypeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    const bookingType = await prisma.bookingType.findUnique({
      where: { id },
    });

    if (!bookingType) {
      errorResponse(res, 'نوع الحجز غير موجود', 404);
      return;
    }

    const updated = await prisma.bookingType.update({
      where: { id },
      data: updates,
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'BookingType',
      entityId: id,
      changes: updates,
      req,
    });

    successResponse(res, 'تم تحديث نوع الحجز', updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteBookingTypeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const bookingType = await prisma.bookingType.findUnique({
      where: { id },
      include: {
        _count: { select: { bookings: true } },
      },
    });

    if (!bookingType) {
      errorResponse(res, 'نوع الحجز غير موجود', 404);
      return;
    }

    // Prevent deletion if bookings exist
    if (bookingType._count.bookings > 0) {
      errorResponse(res, 'لا يمكن حذف نوع الحجز لوجود حجوزات مرتبطة به', 400);
      return;
    }

    await prisma.bookingType.delete({
      where: { id },
    });

    await createAuditLog({
      action: 'DELETE',
      entity: 'BookingType',
      entityId: id,
      changes: { nameEn: bookingType.nameEn, nameAr: bookingType.nameAr },
      req,
    });

    successResponse(res, 'تم حذف نوع الحجز بنجاح');
  } catch (error) {
    next(error);
  }
}
