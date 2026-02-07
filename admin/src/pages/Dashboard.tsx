import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/client';
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ArrowRight,
  Plus,
  CalendarCheck,
  CalendarX,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Skeleton,
  SkeletonCard,
} from '../components/ui';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, icon: Icon, trend, trendLabel, iconBg, iconColor }: StatCardProps) {
  const hasTrend = trend !== undefined && trend !== 0;
  const isPositive = trend && trend > 0;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            {hasTrend && (
              <div className="mt-2 flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{trend}%
                </span>
                {trendLabel && (
                  <span className="text-sm text-gray-500">{trendLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats,
    refetchInterval: 60000, // Refresh every minute
  });

  const stats = data?.data;

  // Calculate booking distribution for pie chart
  const bookingDistribution = [
    { name: isRTL ? 'مؤكد' : 'Confirmed', value: stats?.overview?.confirmedBookings || 0 },
    { name: isRTL ? 'قيد الانتظار' : 'Pending', value: stats?.overview?.pendingBookings || 0 },
    { name: isRTL ? 'مكتمل' : 'Completed', value: stats?.overview?.completedBookings || 0 },
    { name: isRTL ? 'ملغي' : 'Cancelled', value: stats?.overview?.cancelledBookings || 0 },
  ].filter(item => item.value > 0);

  const quickActions = [
    {
      label: isRTL ? 'حجز جديد' : 'New Booking',
      icon: Plus,
      onClick: () => navigate('/bookings'),
      color: 'bg-primary-600 hover:bg-primary-700 text-white',
    },
    {
      label: isRTL ? 'إدارة الحجوزات' : 'Manage Bookings',
      icon: CalendarCheck,
      onClick: () => navigate('/bookings'),
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      label: isRTL ? 'حجب تاريخ' : 'Block Date',
      icon: CalendarX,
      onClick: () => navigate('/blackout'),
      color: 'bg-red-600 hover:bg-red-700 text-white',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-80" />
          <SkeletonCard className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-4 bg-red-100 rounded-full mb-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {isRTL ? 'فشل في تحميل لوحة التحكم' : 'Failed to Load Dashboard'}
        </h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          {isRTL
            ? 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.'
            : 'An error occurred while loading data. Please try again.'}
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {isRTL ? 'إعادة المحاولة' : 'Try Again'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-500">
            {isRTL ? 'مرحباً بك في لوحة التحكم' : 'Welcome to the admin dashboard'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              onClick={action.onClick}
              className={action.color}
              size="sm"
            >
              <action.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.todayBookings')}
          value={stats?.todayBookings?.length || 0}
          icon={Calendar}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title={t('dashboard.pendingConfirm')}
          value={stats?.overview?.pendingBookings || 0}
          icon={Clock}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <StatCard
          title={t('dashboard.weekBookings')}
          value={stats?.overview?.weekBookings || 0}
          icon={Users}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title={t('dashboard.revenue')}
          value={`${(stats?.overview?.estimatedRevenue || 0).toLocaleString()} ${t('pricing.sar')}`}
          icon={DollarSign}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              {t('dashboard.weeklyTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.weeklyTrend || []}
                  layout="horizontal"
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    reversed={isRTL}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    reversed={isRTL}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isRTL ? 'توزيع الحجوزات' : 'Booking Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center">
              {bookingDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {bookingDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">{t('common.noData')}</p>
              )}
            </div>
            {bookingDistribution.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                {bookingDistribution.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('dashboard.todayBookings')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>
              {isRTL ? 'عرض الكل' : 'View All'}
              <ArrowRight className="h-4 w-4 ms-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.todayBookings?.length > 0 ? (
              <div className="space-y-3">
                {stats.todayBookings.slice(0, 5).map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate('/bookings')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{booking.customerName}</p>
                        <p className="text-sm text-gray-500">
                          {booking.visitType === 'DAY_VISIT'
                            ? t('bookings.dayVisit')
                            : t('bookings.overnightStay')}
                          {' • '}
                          {booking.guests} {isRTL ? 'ضيوف' : 'guests'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        booking.status === 'CONFIRMED' ? 'success' :
                        booking.status === 'CANCELLED' ? 'danger' : 'warning'
                      }
                    >
                      {t(`bookings.statuses.${booking.status}`)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {isRTL ? 'لا توجد حجوزات لهذا اليوم' : 'No bookings for today'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('dashboard.recentBookings')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>
              {isRTL ? 'عرض الكل' : 'View All'}
              <ArrowRight className="h-4 w-4 ms-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {stats?.recentBookings?.length > 0 ? (
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
                        {t('bookings.date')}
                      </th>
                      <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        {t('bookings.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.recentBookings.slice(0, 5).map((booking: any) => (
                      <tr
                        key={booking.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate('/bookings')}
                      >
                        <td className="py-3 px-4 font-mono text-sm text-primary-600">
                          {booking.bookingRef}
                        </td>
                        <td className="py-3 px-4 text-sm">{booking.customerName}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(booking.date).toLocaleDateString(
                            isRTL ? 'ar-SA' : 'en-US'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              booking.status === 'CONFIRMED' ? 'success' :
                              booking.status === 'CANCELLED' ? 'danger' : 'warning'
                            }
                            size="sm"
                          >
                            {t(`bookings.statuses.${booking.status}`)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t('common.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
