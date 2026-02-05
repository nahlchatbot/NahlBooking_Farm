import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../config/database.js';
import { generateToken } from '../../middleware/auth.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { AdminLoginInput } from '../../types/validation.js';

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as AdminLoginInput;

    // Find admin by email
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      errorResponse(res, 'بيانات تسجيل الدخول غير صحيحة', 401); // Invalid credentials
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      errorResponse(res, 'بيانات تسجيل الدخول غير صحيحة', 401);
      return;
    }

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = generateToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });

    successResponse(res, 'تم تسجيل الدخول بنجاح', {
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function meHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.admin) {
      errorResponse(res, 'غير مصرح', 401);
      return;
    }

    successResponse(res, 'تم جلب بيانات المستخدم', {
      user: req.admin,
    });
  } catch (error) {
    next(error);
  }
}
