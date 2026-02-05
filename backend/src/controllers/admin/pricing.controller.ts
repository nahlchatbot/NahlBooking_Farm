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
