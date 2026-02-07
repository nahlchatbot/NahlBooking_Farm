import { Request, Response, NextFunction } from 'express';
import { getAuditLogs } from '../../services/audit.service.js';
import { successResponse } from '../../utils/response.js';

export async function listAuditLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      page = '1',
      limit = '50',
      adminId,
      entity,
      entityId,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    const { logs, total } = await getAuditLogs({
      adminId,
      entity,
      entityId,
      limit: limitNum,
      offset,
    });

    successResponse(res, 'Audit logs retrieved', {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}
