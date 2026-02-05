import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { UpdateChaletInput } from '../../types/validation.js';

export async function listChaletsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const chalets = await prisma.chalet.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    successResponse(res, 'تم جلب الشاليهات', chalets);
  } catch (error) {
    next(error);
  }
}

export async function getChaletHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const chalet = await prisma.chalet.findUnique({
      where: { id },
      include: {
        bookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            bookingRef: true,
            date: true,
            visitType: true,
            customerName: true,
            status: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!chalet) {
      errorResponse(res, 'الشاليه غير موجود', 404);
      return;
    }

    successResponse(res, 'تم جلب الشاليه', chalet);
  } catch (error) {
    next(error);
  }
}

export async function updateChaletHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateChaletInput;

    const chalet = await prisma.chalet.findUnique({
      where: { id },
    });

    if (!chalet) {
      errorResponse(res, 'الشاليه غير موجود', 404);
      return;
    }

    const updated = await prisma.chalet.update({
      where: { id },
      data: updates,
    });

    successResponse(res, 'تم تحديث الشاليه', updated);
  } catch (error) {
    next(error);
  }
}
