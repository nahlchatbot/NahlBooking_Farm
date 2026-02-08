import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { parseDate } from '../../utils/date.js';
import { mapArabicVisitType } from '../../utils/visitTypeMapper.js';
import { CreateBlackoutDateInput } from '../../types/validation.js';

export async function listBlackoutDatesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { from, to, chaletId } = req.query;

    const where: any = {};

    if (from || to) {
      where.date = {};
      if (from) {
        const parsed = parseDate(from as string);
        if (parsed) where.date.gte = parsed;
      }
      if (to) {
        const parsed = parseDate(to as string);
        if (parsed) where.date.lte = parsed;
      }
    }

    if (chaletId) {
      where.chaletId = chaletId as string;
    }

    let blackoutDates;
    try {
      blackoutDates = await prisma.blackoutDate.findMany({
        where,
        orderBy: { date: 'asc' },
        include: {
          chalet: { select: { id: true, nameAr: true, nameEn: true } },
        },
      });
    } catch {
      // Fallback: query without chalet relation if column doesn't exist yet
      blackoutDates = await prisma.blackoutDate.findMany({
        where: from || to ? { date: where.date } : {},
        orderBy: { date: 'asc' },
      });
    }

    successResponse(res, 'تم جلب التواريخ المحجوبة', blackoutDates);
  } catch (error) {
    next(error);
  }
}

export async function createBlackoutDateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as CreateBlackoutDateInput;

    const date = parseDate(input.date);
    if (!date) {
      errorResponse(res, 'تاريخ غير صالح', 400);
      return;
    }

    // Map visit type if provided
    let visitType = null;
    if (input.visitType) {
      visitType = mapArabicVisitType(input.visitType);
    }

    const chaletId = (req.body as any).chaletId || null;

    // Check if already exists
    const existing = await prisma.blackoutDate.findFirst({
      where: {
        date,
        visitType,
        chaletId,
      },
    });

    if (existing) {
      errorResponse(res, 'هذا التاريخ محجوب بالفعل', 400);
      return;
    }

    const blackoutDate = await prisma.blackoutDate.create({
      data: {
        date,
        visitType,
        reason: input.reason,
        createdBy: req.admin?.id,
        chaletId,
      },
    });

    successResponse(res, 'تم حجب التاريخ بنجاح', blackoutDate, 201);
  } catch (error) {
    next(error);
  }
}

export async function deleteBlackoutDateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const blackoutDate = await prisma.blackoutDate.findUnique({
      where: { id },
    });

    if (!blackoutDate) {
      errorResponse(res, 'التاريخ المحجوب غير موجود', 404);
      return;
    }

    await prisma.blackoutDate.delete({
      where: { id },
    });

    successResponse(res, 'تم إلغاء حجب التاريخ');
  } catch (error) {
    next(error);
  }
}
