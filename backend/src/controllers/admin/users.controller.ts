import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../config/database.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { createAuditLog } from '../../services/audit.service.js';
import {
  CreateAdminUserInput,
  UpdateAdminUserInput,
  ChangePasswordInput,
} from '../../types/validation.js';

export async function listAdminUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, 'تم جلب قائمة المستخدمين', { users });
  } catch (error) {
    next(error);
  }
}

export async function getAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.adminUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      errorResponse(res, 'المستخدم غير موجود', 404);
      return;
    }

    successResponse(res, 'تم جلب بيانات المستخدم', { user });
  } catch (error) {
    next(error);
  }
}

export async function createAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, name, role, phone } = req.body as CreateAdminUserInput;

    // Check if email already exists
    const existing = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existing) {
      errorResponse(res, 'البريد الإلكتروني مستخدم بالفعل', 400);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        phone,
        createdById: req.admin?.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entity: 'AdminUser',
      entityId: user.id,
      changes: { email, name, role },
      req,
    });

    successResponse(res, 'تم إنشاء المستخدم بنجاح', { user }, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const data = req.body as UpdateAdminUserInput;

    // Check if user exists
    const existing = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!existing) {
      errorResponse(res, 'المستخدم غير موجود', 404);
      return;
    }

    // Prevent deactivating yourself
    if (id === req.admin?.id && data.isActive === false) {
      errorResponse(res, 'لا يمكنك تعطيل حسابك الخاص', 400);
      return;
    }

    // Prevent demoting yourself from SUPER_ADMIN
    if (id === req.admin?.id && data.role && data.role !== 'SUPER_ADMIN' && existing.role === 'SUPER_ADMIN') {
      errorResponse(res, 'لا يمكنك تخفيض صلاحيات حسابك الخاص', 400);
      return;
    }

    // Check email uniqueness if changing email
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.adminUser.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        errorResponse(res, 'البريد الإلكتروني مستخدم بالفعل', 400);
        return;
      }
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'AdminUser',
      entityId: user.id,
      changes: data,
      req,
    });

    successResponse(res, 'تم تحديث المستخدم بنجاح', { user });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.admin?.id) {
      errorResponse(res, 'لا يمكنك حذف حسابك الخاص', 400);
      return;
    }

    const user = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!user) {
      errorResponse(res, 'المستخدم غير موجود', 404);
      return;
    }

    // Soft delete by deactivating
    await prisma.adminUser.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      action: 'DELETE',
      entity: 'AdminUser',
      entityId: id,
      changes: { email: user.email, name: user.name },
      req,
    });

    successResponse(res, 'تم حذف المستخدم بنجاح');
  } catch (error) {
    next(error);
  }
}

export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { newPassword } = req.body as ChangePasswordInput;

    const user = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!user) {
      errorResponse(res, 'المستخدم غير موجود', 404);
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.adminUser.update({
      where: { id },
      data: { passwordHash },
    });

    await createAuditLog({
      action: 'CHANGE_PASSWORD',
      entity: 'AdminUser',
      entityId: id,
      req,
    });

    successResponse(res, 'تم تغيير كلمة المرور بنجاح');
  } catch (error) {
    next(error);
  }
}
