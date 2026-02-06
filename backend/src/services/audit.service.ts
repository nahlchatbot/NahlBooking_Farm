import { Request } from 'express';
import prisma from '../config/database.js';

interface AuditLogParams {
  action: string;
  entity: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  req: Request;
}

export async function createAuditLog({
  action,
  entity,
  entityId,
  changes,
  req,
}: AuditLogParams): Promise<void> {
  if (!req.admin) return;

  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        changes: changes ? JSON.stringify(changes) : null,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        adminId: req.admin.id,
      },
    });
  } catch (error) {
    // Don't throw - audit logging shouldn't break the main operation
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(params: {
  adminId?: string;
  entity?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}) {
  const { adminId, entity, entityId, limit = 50, offset = 0 } = params;

  const where: Record<string, unknown> = {};
  if (adminId) where.adminId = adminId;
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}
