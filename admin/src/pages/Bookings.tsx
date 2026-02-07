import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, reportsApi } from '../api/client';
import { ClipboardList, Check, X, Eye, AlertCircle, Download, Bell } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

export default function Bookings() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Record<string, unknown> | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings', page, search, statusFilter],
    queryFn: () =>
      bookingsApi.list({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      }),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) =>
      bookingsApi.update(id, { status: 'CONFIRMED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success(isRTL ? 'تم تأكيد الحجز بنجاح' : 'Booking confirmed successfully');
      setSelectedBooking(null);
    },
    onError: () => {
      toast.error(isRTL ? 'فشل في تأكيد الحجز' : 'Failed to confirm booking');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success(isRTL ? 'تم إلغاء الحجز' : 'Booking cancelled');
      setSelectedBooking(null);
      setCancelTarget(null);
    },
    onError: () => {
      toast.error(isRTL ? 'فشل في إلغاء الحجز' : 'Failed to cancel booking');
      setCancelTarget(null);
    },
  });

  const reminderMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.sendReminder(id),
    onSuccess: () => {
      toast.success(isRTL ? 'تم إرسال التذكير بنجاح' : 'Reminder sent successfully');
    },
    onError: () => {
      toast.error(isRTL ? 'فشل في إرسال التذكير. تأكد من تفعيل واتساب.' : 'Failed to send reminder. Make sure WhatsApp is enabled.');
    },
  });

  const bookings = data?.data?.bookings || [];
  const pagination = data?.data?.pagination;

  const statusOptions = [
    { value: '', label: isRTL ? 'جميع الحالات' : 'All Statuses' },
    { value: 'PENDING', label: t('bookings.statuses.PENDING') },
    { value: 'CONFIRMED', label: t('bookings.statuses.CONFIRMED') },
    { value: 'CANCELLED', label: t('bookings.statuses.CANCELLED') },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ClipboardList className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isRTL ? 'إدارة الحجوزات' : 'Bookings Management'}
            </h1>
            <p className="text-sm text-gray-500">
              {isRTL ? 'عرض وإدارة جميع حجوزات الضيوف' : 'View and manage all guest bookings'}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => reportsApi.exportBookingsCsv()}
        >
          <Download size={16} />
          {isRTL ? 'تصدير CSV' : 'Export CSV'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={isRTL ? 'بحث بالاسم، الهاتف، أو رقم الحجز...' : 'Search by name, phone, or booking ref...'}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                options={statusOptions}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-3">{isRTL ? 'فشل في تحميل الحجوزات' : 'Failed to load bookings'}</p>
          <Button variant="secondary" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['bookings'] })}>
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Table */}
      {!error && (
        <Card>
          <CardContent className="p-0">
            {bookings.length === 0 ? (
              <EmptyState
                icon="search"
                title={isRTL ? 'لا توجد حجوزات' : 'No Bookings Found'}
                description={
                  search || statusFilter
                    ? (isRTL ? 'لم يتم العثور على حجوزات تطابق بحثك. جرب تغيير معايير البحث.' : 'No bookings match your search. Try adjusting your filters.')
                    : (isRTL ? 'لم يتم إجراء أي حجوزات بعد.' : 'No bookings have been made yet.')
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          {t('bookings.ref')}
                        </th>
                        <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          {t('bookings.customer')}
                        </th>
                        <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          {t('bookings.phone')}
                        </th>
                        <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          {t('bookings.date')}
                        </th>
                        <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          {t('bookings.visitType')}
                        </th>
                        <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          {t('bookings.status')}
                        </th>
                        <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          {t('bookings.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bookings.map((booking: Record<string, unknown>) => (
                        <tr
                          key={booking.id as string}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <td className="py-3 px-4 font-mono text-sm text-primary-600">
                            {booking.bookingRef as string}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {booking.customerName as string}
                          </td>
                          <td className="py-3 px-4 font-mono text-sm text-gray-500">
                            {booking.customerPhone as string}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(booking.date as string).toLocaleDateString(
                              isRTL ? 'ar-SA' : 'en-US'
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={booking.visitType === 'DAY_VISIT' ? 'info' : 'primary'} size="sm">
                              {booking.visitType === 'DAY_VISIT'
                                ? t('bookings.dayVisit')
                                : t('bookings.overnightStay')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={
                              booking.status === 'CONFIRMED' ? 'success' :
                              booking.status === 'CANCELLED' ? 'danger' : 'warning'
                            } size="sm">
                              {t(`bookings.statuses.${booking.status}`)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedBooking(booking)}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Eye size={16} />
                              </Button>
                              {booking.status === 'PENDING' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => confirmMutation.mutate(booking.id as string)}
                                    className="text-green-600 hover:bg-green-50"
                                  >
                                    <Check size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCancelTarget(booking.id as string)}
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <X size={16} />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-gray-500">
                      {isRTL
                        ? `صفحة ${page} من ${pagination.totalPages} (${pagination.total} حجز)`
                        : `Page ${page} of ${pagination.totalPages} (${pagination.total} bookings)`}
                    </p>
                    <div className="flex gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                        (p) => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              p === page
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Detail Modal */}
      <Modal
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title={isRTL ? 'تفاصيل الحجز' : 'Booking Details'}
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{t('bookings.ref')}</div>
                <div className="font-mono font-medium">{selectedBooking.bookingRef as string}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{t('bookings.status')}</div>
                <Badge variant={
                  selectedBooking.status === 'CONFIRMED' ? 'success' :
                  selectedBooking.status === 'CANCELLED' ? 'danger' : 'warning'
                }>
                  {t(`bookings.statuses.${selectedBooking.status}`)}
                </Badge>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{t('bookings.customer')}</div>
                <div className="font-medium">{selectedBooking.customerName as string}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{t('bookings.phone')}</div>
                <div className="font-mono">{selectedBooking.customerPhone as string}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{t('bookings.date')}</div>
                <div>{new Date(selectedBooking.date as string).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{t('bookings.visitType')}</div>
                <div>{selectedBooking.visitType === 'DAY_VISIT' ? t('bookings.dayVisit') : t('bookings.overnightStay')}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{t('bookings.guests')}</div>
                <div>{selectedBooking.guests as number}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{t('bookings.payment')}</div>
                <Badge variant={
                  selectedBooking.paymentStatus === 'FULLY_PAID' ? 'success' :
                  selectedBooking.paymentStatus === 'DEPOSIT_PAID' ? 'info' : 'warning'
                }>
                  {t(`bookings.paymentStatuses.${selectedBooking.paymentStatus}`)}
                </Badge>
              </div>
            </div>
            {selectedBooking.email && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Email</div>
                <div>{selectedBooking.email as string}</div>
              </div>
            )}
            {selectedBooking.notes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{isRTL ? 'ملاحظات' : 'Notes'}</div>
                <div>{selectedBooking.notes as string}</div>
              </div>
            )}
            {selectedBooking.status !== 'CANCELLED' && (
              <div className="flex gap-2 pt-4 border-t">
                {selectedBooking.status === 'PENDING' && (
                  <Button onClick={() => confirmMutation.mutate(selectedBooking.id as string)} disabled={confirmMutation.isPending}>
                    <Check size={16} />
                    {isRTL ? 'تأكيد الحجز' : 'Confirm Booking'}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => reminderMutation.mutate(selectedBooking.id as string)}
                  disabled={reminderMutation.isPending}
                  loading={reminderMutation.isPending}
                >
                  <Bell size={16} />
                  {isRTL ? 'إرسال تذكير' : 'Send Reminder'}
                </Button>
                {selectedBooking.status === 'PENDING' && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      setCancelTarget(selectedBooking.id as string);
                    }}
                    disabled={cancelMutation.isPending}
                  >
                    <X size={16} />
                    {isRTL ? 'إلغاء الحجز' : 'Cancel Booking'}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget)}
        title={isRTL ? 'إلغاء هذا الحجز؟' : 'Cancel This Booking?'}
        description={
          isRTL
            ? 'سيتم إلغاء الحجز وإخطار العميل عبر واتساب. هل أنت متأكد؟'
            : 'The booking will be cancelled and the customer will be notified via WhatsApp. Are you sure?'
        }
        confirmLabel={isRTL ? 'إلغاء الحجز' : 'Cancel Booking'}
        cancelLabel={isRTL ? 'تراجع' : 'Go Back'}
        variant="danger"
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
