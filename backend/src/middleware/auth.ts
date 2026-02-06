import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../config/database.js';

import { AdminRole } from '@prisma/client';

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export async function authenticateAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ ok: false, message: 'غير مصرح' }); // Unauthorized
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as AdminPayload;

      // Verify admin still exists and is active
      const admin = await prisma.adminUser.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });

      if (!admin || !admin.isActive) {
        res.status(401).json({ ok: false, message: 'جلسة غير صالحة' }); // Invalid session
        return;
      }

      req.admin = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      };

      next();
    } catch {
      res.status(401).json({ ok: false, message: 'جلسة منتهية' }); // Session expired
    }
  } catch (error) {
    next(error);
  }
}

export function generateToken(admin: AdminPayload): string {
  return jwt.sign(admin, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as string,
  } as jwt.SignOptions);
}
