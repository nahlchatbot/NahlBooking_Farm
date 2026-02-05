import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/client';
import { Check, X, Search, Filter } from 'lucide-react';

export default function Bookings() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
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
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
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

      {/* Table */}
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
                {bookings.map((booking: any) => (
                  <tr key={booking.id} className="border-t">
                    <td className="py-3 px-4 font-mono text-sm">
                      {booking.bookingRef}
                    </td>
                    <td className="py-3 px-4">{booking.customerName}</td>
                    <td className="py-3 px-4 font-mono text-sm">
                      {booking.customerPhone}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(booking.date).toLocaleDateString(
                        isRTL ? 'ar-SA' : 'en-US'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {booking.visitType === 'DAY_VISIT'
                        ? t('bookings.dayVisit')
                        : t('bookings.overnightStay')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {t(`bookings.statuses.${booking.status}`)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {booking.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => confirmMutation.mutate(booking.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title={t('bookings.confirmBooking')}
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => cancelMutation.mutate(booking.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title={t('bookings.cancelBooking')}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
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
    </div>
  );
}
