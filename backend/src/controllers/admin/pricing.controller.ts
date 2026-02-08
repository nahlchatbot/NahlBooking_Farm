import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { UpdatePricingInput } from '../../types/validation.js';

export async function listPricingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pricing = await prisma.pricing.findMany({
      orderBy: { visitType: 'asc' },
    });

    successResponse(res, 'تم جلب الأسعار', pricing);
  } catch (error) {
    next(error);
  }
}

export async function updatePricingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body as UpdatePricingInput;

    const pricing = await prisma.pricing.findUnique({
      where: { id },
    });

    if (!pricing) {
      errorResponse(res, 'السعر غير موجود', 404);
      return;
    }

    const updated = await prisma.pricing.update({
      where: { id },
      data: updates,
    });

    successResponse(res, 'تم تحديث السعر', updated);
  } catch (error) {
    next(error);
  }
}

// --- Chalet x BookingType Pricing Matrix ---

export async function listPricingMatrixHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pricings = await prisma.chaletPricing.findMany({
      include: {
        chalet: { select: { id: true, nameAr: true, nameEn: true } },
        bookingType: { select: { id: true, nameAr: true, nameEn: true } },
      },
      orderBy: [{ chalet: { sortOrder: 'asc' } }, { bookingType: { sortOrder: 'asc' } }],
    });

    successResponse(res, 'تم جلب مصفوفة الأسعار', { pricings });
  } catch (error) {
    next(error);
  }
}

export async function upsertPricingMatrixHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { chaletId, bookingTypeId, totalPrice, depositAmount } = req.body;

    if (!chaletId || !bookingTypeId || totalPrice == null || depositAmount == null) {
      errorResponse(res, 'جميع الحقول مطلوبة', 400);
      return;
    }

    const pricing = await prisma.chaletPricing.upsert({
      where: {
        chaletId_bookingTypeId: { chaletId, bookingTypeId },
      },
      update: { totalPrice, depositAmount },
      create: { chaletId, bookingTypeId, totalPrice, depositAmount },
      include: {
        chalet: { select: { id: true, nameAr: true, nameEn: true } },
        bookingType: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    successResponse(res, 'تم حفظ السعر بنجاح', pricing);
  } catch (error) {
    next(error);
  }
}
