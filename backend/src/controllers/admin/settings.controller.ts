import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export async function listSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });

    // Convert to key-value object for easier frontend use
    const settingsMap: Record<string, any> = {};
    for (const setting of settings) {
      let value: any = setting.value;

      // Parse based on type
      if (setting.type === 'number') {
        value = parseInt(value, 10);
      } else if (setting.type === 'boolean') {
        value = value === 'true';
      } else if (setting.type === 'json') {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if JSON parse fails
        }
      }

      settingsMap[setting.key] = value;
    }

    successResponse(res, 'تم جلب الإعدادات', {
      settings: settingsMap,
      raw: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      errorResponse(res, 'القيمة مطلوبة', 400);
      return;
    }

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      errorResponse(res, 'الإعداد غير موجود', 404);
      return;
    }

    // Convert value to string for storage
    let stringValue: string;
    if (typeof value === 'object') {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }

    const updated = await prisma.setting.update({
      where: { key },
      data: { value: stringValue },
    });

    successResponse(res, 'تم تحديث الإعداد', updated);
  } catch (error) {
    next(error);
  }
}

export async function bulkUpdateSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updates = req.body as Record<string, any>;

    const results = [];

    for (const [key, value] of Object.entries(updates)) {
      let stringValue: string;
      if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }

      const updated = await prisma.setting.upsert({
        where: { key },
        update: { value: stringValue },
        create: {
          key,
          value: stringValue,
          type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
        },
      });

      results.push(updated);
    }

    successResponse(res, 'تم تحديث الإعدادات', results);
  } catch (error) {
    next(error);
  }
}
