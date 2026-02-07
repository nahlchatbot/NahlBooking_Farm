import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/client';
import { Check, X, Search, Filter, Eye, AlertCircle } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function Bookings() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Record<string, unknown> | null>(null);

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
      toast.success(isRTL ? 'تم تأكيد الحجز' : 'Booking confirmed');
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
    },
    onError: () => {
      toast.error(isRTL ? 'فشل في إلغاء الحجز' : 'Failed to cancel booking');
    },
  });

  const bookings = data?.data?.bookings || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('bookings.title')}</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('common.filter')}</option>
            <option value="PENDING">{t('bookings.statuses.PENDING')}</option>
            <option value="CONFIRMED">{t('bookings.statuses.CONFIRMED')}</option>
            <option value="CANCELLED">{t('bookings.statuses.CANCELLED')}</option>
          </select>
        </div>
      </div>

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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">{t('common.noData')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-start py-3 px-4 font-medium text-gray-500">
                      {t('bookings.ref')}
                    </th>
                    <th className="text-start py-3 px-4 font-medium text-gray-500">
                      {t('bookings.customer')}
                    </th>
                    <th className="text-start py-3 px-4 font-medium text-gray-500">
                      {t('bookings.phone')}
                    </th>
                    <th className="text-start py-3 px-4 font-medium text-gray-500">
                      {t('bookings.date')}
                    </th>
                    <th className="text-start py-3 px-4 font-medium text-gray-500">
                      {t('bookings.visitType')}
                    </th>
                    <th className="text-start py-3 px-4 font-medium text-gray-500">
                      {t('bookings.status')}
                    </th>
                    <th className="text-start py-3 px-4 font-medium text-gray-500">
                      {t('bookings.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking: Record<string, unknown>) => (
                    <tr key={booking.id as string} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                      <td className="py-3 px-4 font-mono text-sm">
                        {booking.bookingRef as string}
                      </td>
                      <td className="py-3 px-4">{booking.customerName as string}</td>
                      <td className="py-3 px-4 font-mono text-sm">
                        {booking.customerPhone as string}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(booking.date as string).toLocaleDateString(
                          isRTL ? 'ar-SA' : 'en-US'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {booking.visitType === 'DAY_VISIT'
                          ? t('bookings.dayVisit')
                          : t('bookings.overnightStay')}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          booking.status === 'CONFIRMED' ? 'success' :
                          booking.status === 'CANCELLED' ? 'danger' : 'warning'
                        }>
                          {t(`bookings.statuses.${booking.status}`)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title={t('bookings.viewDetails')}
                          >
                            <Eye size={18} />
                          </button>
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => confirmMutation.mutate(booking.id as string)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title={t('bookings.confirmBooking')}
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => cancelMutation.mutate(booking.id as string)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title={t('bookings.cancelBooking')}
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded ${
                      p === page
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          )}
        </div>
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
            {selectedBooking.status === 'PENDING' && (
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => confirmMutation.mutate(selectedBooking.id as string)} disabled={confirmMutation.isPending}>
                  {isRTL ? 'تأكيد الحجز' : 'Confirm Booking'}
                </Button>
                <Button variant="danger" onClick={() => cancelMutation.mutate(selectedBooking.id as string)} disabled={cancelMutation.isPending}>
                  {isRTL ? 'إلغاء الحجز' : 'Cancel Booking'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
