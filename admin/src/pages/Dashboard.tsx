import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/client';
import {
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats,
  });

  const stats = data?.data;

  const statCards = [
    {
      title: t('dashboard.todayBookings'),
      value: stats?.todayBookings?.length || 0,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: t('dashboard.pendingConfirm'),
      value: stats?.overview?.pendingBookings || 0,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: t('dashboard.weekBookings'),
      value: stats?.overview?.weekBookings || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: t('dashboard.revenue'),
      value: `${stats?.overview?.estimatedRevenue || 0} ${t('pricing.sar')}`,
      icon: DollarSign,
      color: 'bg-purple-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4"
          >
            <div className={`${stat.color} p-3 rounded-lg text-white`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly trend chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.weeklyTrend')}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.weeklyTrend || []}
                layout="horizontal"
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  reversed={isRTL}
                />
                <YAxis allowDecimals={false} reversed={isRTL} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's bookings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.todayBookings')}</h2>
          {stats?.todayBookings?.length > 0 ? (
            <div className="space-y-3">
              {stats.todayBookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{booking.customerName}</p>
                    <p className="text-sm text-gray-500">
                      {booking.visitType === 'DAY_VISIT'
                        ? t('bookings.dayVisit')
                        : t('bookings.overnightStay')}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {t(`bookings.statuses.${booking.status}`)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('common.noData')}</p>
          )}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">{t('dashboard.recentBookings')}</h2>
        {stats?.recentBookings?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-start py-3 px-4 font-medium text-gray-500">
                    {t('bookings.ref')}
                  </th>
                  <th className="text-start py-3 px-4 font-medium text-gray-500">
                    {t('bookings.customer')}
                  </th>
                  <th className="text-start py-3 px-4 font-medium text-gray-500">
                    {t('bookings.date')}
                  </th>
                  <th className="text-start py-3 px-4 font-medium text-gray-500">
                    {t('bookings.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((booking: any) => (
                  <tr key={booking.id} className="border-b last:border-0">
                    <td className="py-3 px-4 font-mono text-sm">
                      {booking.bookingRef}
                    </td>
                    <td className="py-3 px-4">{booking.customerName}</td>
                    <td className="py-3 px-4">
                      {new Date(booking.date).toLocaleDateString(
                        isRTL ? 'ar-SA' : 'en-US'
                      )}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">{t('common.noData')}</p>
        )}
      </div>
    </div>
  );
}
