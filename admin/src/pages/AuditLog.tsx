import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../api/client';
import { Shield, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: string;
  ipAddress?: string;
  createdAt: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
}

const ACTION_COLORS: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'danger',
  LOGIN: 'info',
  LOGOUT: 'info',
  BLOCK: 'danger',
  UNBLOCK: 'success',
  CONFIRM: 'success',
  CANCEL: 'danger',
  EXPORT: 'info',
};

export default function AuditLog() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, entityFilter, actionFilter],
    queryFn: () =>
      auditLogsApi.list({
        page: page.toString(),
        limit: '30',
        ...(entityFilter && { entity: entityFilter }),
      }),
  });

  const logs: AuditLogEntry[] = data?.data?.logs || [];
  const pagination = data?.data?.pagination;

  const filteredLogs = actionFilter
    ? logs.filter((log) => log.action === actionFilter)
    : logs;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatChanges = (changesStr?: string) => {
    if (!changesStr) return null;
    try {
      const changes = JSON.parse(changesStr);
      return Object.entries(changes).map(([key, value]) => (
        <span key={key} className="inline-flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-0.5 me-1 mb-1">
          <span className="font-medium text-gray-600">{key}:</span>
          <span className="text-gray-800 max-w-[150px] truncate">{String(value)}</span>
        </span>
      ));
    } catch {
      return null;
    }
  };

  const entities = ['Booking', 'Chalet', 'Setting', 'BlackoutDate', 'AdminUser', 'Pricing'];
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'CONFIRM', 'CANCEL', 'BLOCK', 'UNBLOCK', 'EXPORT'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Shield className="text-purple-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isRTL ? 'سجل المراجعة' : 'Audit Log'}
          </h1>
          <p className="text-sm text-gray-500">
            {isRTL ? 'تتبع جميع إجراءات المسؤولين' : 'Track all admin actions'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter size={18} className="text-gray-400" />
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="">{isRTL ? 'جميع الكيانات' : 'All Entities'}</option>
          {entities.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="">{isRTL ? 'جميع الإجراءات' : 'All Actions'}</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{isRTL ? 'فشل في تحميل السجلات' : 'Failed to load audit logs'}</p>
        </div>
      )}

      {/* Log Entries */}
      {!error && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              {isRTL ? 'جارٍ التحميل...' : 'Loading...'}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {isRTL ? 'لا توجد سجلات' : 'No audit logs found'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={ACTION_COLORS[log.action] || 'info'}>
                          {log.action}
                        </Badge>
                        <span className="text-sm font-medium text-gray-700">{log.entity}</span>
                        {log.entityId && (
                          <span className="text-xs text-gray-400 font-mono">{log.entityId.slice(0, 8)}...</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span className="font-medium">{log.admin.name}</span>
                        <span className="text-gray-300">|</span>
                        <span>{log.admin.email}</span>
                        {log.ipAddress && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="font-mono text-xs">{log.ipAddress}</span>
                          </>
                        )}
                      </div>
                      {log.changes && (
                        <div className="flex flex-wrap mt-1">
                          {formatChanges(log.changes)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-500">
                {isRTL
                  ? `صفحة ${pagination.page} من ${pagination.totalPages} (${pagination.total} سجل)`
                  : `Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} entries)`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
