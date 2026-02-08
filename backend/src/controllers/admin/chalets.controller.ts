import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { CreateChaletInput, UpdateChaletInput } from '../../types/validation.js';
import { createAuditLog } from '../../services/audit.service.js';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function listChaletsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const chalets = await prisma.chalet.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        chaletBookingTypes: {
          include: {
            bookingType: {
              select: { id: true, nameAr: true, nameEn: true, slug: true },
            },
          },
        },
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
        images: {
          orderBy: { sortOrder: 'asc' },
        },
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

export async function createChaletHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = req.body as CreateChaletInput;

    // Generate slug from English name
    let slug = generateSlug(data.nameEn);

    // Ensure slug is unique
    const existingSlug = await prisma.chalet.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Extract bookingTypeIds from request body
    const { bookingTypeIds, ...chaletData } = req.body;

    const chalet = await prisma.chalet.create({
      data: {
        ...chaletData,
        slug,
        ...(bookingTypeIds?.length && {
          chaletBookingTypes: {
            create: bookingTypeIds.map((btId: string) => ({ bookingTypeId: btId })),
          },
        }),
      },
      include: {
        images: true,
        chaletBookingTypes: {
          include: { bookingType: { select: { id: true, nameAr: true, nameEn: true } } },
        },
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entity: 'Chalet',
      entityId: chalet.id,
      changes: { nameEn: data.nameEn, nameAr: data.nameAr },
      req,
    });

    successResponse(res, 'تم إنشاء الشاليه بنجاح', chalet, 201);
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

    // Handle bookingTypeIds separately
    const { bookingTypeIds, ...chaletUpdates } = req.body;

    // Update booking type associations if provided
    if (bookingTypeIds !== undefined) {
      await prisma.chaletBookingType.deleteMany({ where: { chaletId: id } });
      if (bookingTypeIds.length > 0) {
        await prisma.chaletBookingType.createMany({
          data: bookingTypeIds.map((btId: string) => ({ chaletId: id, bookingTypeId: btId })),
        });
      }
    }

    const updated = await prisma.chalet.update({
      where: { id },
      data: chaletUpdates,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        chaletBookingTypes: {
          include: { bookingType: { select: { id: true, nameAr: true, nameEn: true } } },
        },
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Chalet',
      entityId: id,
      changes: chaletUpdates,
      req,
    });

    successResponse(res, 'تم تحديث الشاليه', updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteChaletHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const chalet = await prisma.chalet.findUnique({
      where: { id },
      include: {
        _count: { select: { bookings: true } },
      },
    });

    if (!chalet) {
      errorResponse(res, 'الشاليه غير موجود', 404);
      return;
    }

    // Check if chalet has bookings
    if (chalet._count.bookings > 0) {
      errorResponse(res, 'لا يمكن حذف الشاليه لوجود حجوزات مرتبطة به', 400);
      return;
    }

    await prisma.chalet.delete({
      where: { id },
    });

    await createAuditLog({
      action: 'DELETE',
      entity: 'Chalet',
      entityId: id,
      changes: { nameEn: chalet.nameEn, nameAr: chalet.nameAr },
      req,
    });

    successResponse(res, 'تم حذف الشاليه بنجاح');
  } catch (error) {
    next(error);
  }
}

// Image management
export async function addChaletImageHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { url, caption } = req.body;

    const chalet = await prisma.chalet.findUnique({
      where: { id },
    });

    if (!chalet) {
      errorResponse(res, 'الشاليه غير موجود', 404);
      return;
    }

    // Get max sort order
    const maxOrder = await prisma.chaletImage.findFirst({
      where: { chaletId: id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const image = await prisma.chaletImage.create({
      data: {
        url,
        caption,
        chaletId: id,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });

    successResponse(res, 'تم إضافة الصورة بنجاح', image, 201);
  } catch (error) {
    next(error);
  }
}

export async function deleteChaletImageHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id, imageId } = req.params;

    const image = await prisma.chaletImage.findFirst({
      where: {
        id: imageId,
        chaletId: id,
      },
    });

    if (!image) {
      errorResponse(res, 'الصورة غير موجودة', 404);
      return;
    }

    await prisma.chaletImage.delete({
      where: { id: imageId },
    });

    successResponse(res, 'تم حذف الصورة بنجاح');
  } catch (error) {
    next(error);
  }
}

export async function reorderChaletImagesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { imageIds } = req.body as { imageIds: string[] };

    const chalet = await prisma.chalet.findUnique({
      where: { id },
    });

    if (!chalet) {
      errorResponse(res, 'الشاليه غير موجود', 404);
      return;
    }

    // Update sort order for each image
    await Promise.all(
      imageIds.map((imageId, index) =>
        prisma.chaletImage.update({
          where: { id: imageId },
          data: { sortOrder: index },
        })
      )
    );

    successResponse(res, 'تم تحديث ترتيب الصور');
  } catch (error) {
    next(error);
  }
}
