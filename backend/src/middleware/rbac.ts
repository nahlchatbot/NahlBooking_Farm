import { Request, Response, NextFunction } from 'express';
import { AdminRole } from '@prisma/client';

// Role hierarchy: SUPER_ADMIN > ADMIN > VIEWER
const roleHierarchy: Record<AdminRole, number> = {
  SUPER_ADMIN: 3,
  ADMIN: 2,
  VIEWER: 1,
};

export function requireRole(...allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ ok: false, message: 'غير مصرح' });
      return;
    }

    const userRole = req.admin.role;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        ok: false,
        message: 'ليس لديك صلاحية لهذا الإجراء' // You don't have permission for this action
      });
      return;
    }

    next();
  };
}

export function requireMinRole(minRole: AdminRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ ok: false, message: 'غير مصرح' });
      return;
    }

    const userRoleLevel = roleHierarchy[req.admin.role];
    const minRoleLevel = roleHierarchy[minRole];

    if (userRoleLevel < minRoleLevel) {
      res.status(403).json({
        ok: false,
        message: 'ليس لديك صلاحية لهذا الإجراء'
      });
      return;
    }

    next();
  };
}

// Convenience middleware for common use cases
export const requireSuperAdmin = requireRole('SUPER_ADMIN');
export const requireAdmin = requireMinRole('ADMIN');
export const requireViewer = requireMinRole('VIEWER');
