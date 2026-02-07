import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  BarChart as BarChartIcon,
  Download,
  Calendar,
  DollarSign,
  Users,
  PieChart as PieChartIcon,
  TrendingUp,
  UserCheck,
  UserPlus,
  Percent,
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
import { reportsApi } from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { SimpleTabs } from '../components/ui/Tabs';
import { SkeletonCard } from '../components/ui/Skeleton';
import { TableRoot as Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

// Date presets
const getPresetDates = () => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const firstOfYear = new Date(today.getFullYear(), 0, 1);
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    thisMonth: { startDate: firstOfMonth.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] },
    lastMonth: { startDate: firstOfLastMonth.toISOString().split('T')[0], endDate: lastOfLastMonth.toISOString().split('T')[0] },
    last30Days: { startDate: thirtyDaysAgo.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] },
    thisYear: { startDate: firstOfYear.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] },
  };
};

export default function Reports() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState('bookings');
  const presets = useMemo(() => getPresetDates(), []);
  const [dateRange, setDateRange] = useState(presets.thisMonth);
  const [preset, setPreset] = useState('thisMonth');

  const tabs = [
    { id: 'bookings', label: isRTL ? 'الحجوزات' : 'Bookings', icon: Calendar },
    { id: 'revenue', label: isRTL ? 'الإيرادات' : 'Revenue', icon: DollarSign },
    { id: 'occupancy', label: isRTL ? 'الإشغال' : 'Occupancy', icon: PieChartIcon },
    { id: 'customers', label: isRTL ? 'العملاء' : 'Customers', icon: Users },
  ];

  const handlePresetChange = (presetKey: string) => {
    setPreset(presetKey);
    setDateRange(presets[presetKey as keyof typeof presets]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <BarChartIcon className="text-indigo-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isRTL ? 'التقارير والتحليلات' : 'Reports & Analytics'}
          </h1>
          <p className="text-sm text-gray-500">
            {isRTL ? 'تحليل البيانات والإحصائيات لأداء المنتجع' : 'Analyze resort performance data and statistics'}
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <Button
                variant={preset === 'thisMonth' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handlePresetChange('thisMonth')}
              >
                {isRTL ? 'هذا الشهر' : 'This Month'}
              </Button>
              <Button
                variant={preset === 'lastMonth' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handlePresetChange('lastMonth')}
              >
                {isRTL ? 'الشهر الماضي' : 'Last Month'}
              </Button>
              <Button
                variant={preset === 'last30Days' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handlePresetChange('last30Days')}
              >
                {isRTL ? 'آخر 30 يوم' : 'Last 30 Days'}
              </Button>
              <Button
                variant={preset === 'thisYear' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handlePresetChange('thisYear')}
              >
                {isRTL ? 'هذا العام' : 'This Year'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => {
                  setPreset('custom');
                  setDateRange(prev => ({ ...prev, startDate: e.target.value }));
                }}
                className="!py-1.5 text-sm"
              />
              <span className="text-gray-500 text-sm">{isRTL ? 'إلى' : 'to'}</span>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => {
                  setPreset('custom');
                  setDateRange(prev => ({ ...prev, endDate: e.target.value }));
                }}
                className="!py-1.5 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <SimpleTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'bookings' && <BookingsReport dateRange={dateRange} />}
      {activeTab === 'revenue' && <RevenueReport dateRange={dateRange} />}
      {activeTab === 'occupancy' && <OccupancyReport dateRange={dateRange} />}
      {activeTab === 'customers' && <CustomersReport dateRange={dateRange} />}
    </div>
  );
}

// Stat Card with Icon
function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            <Icon size={20} className={iconColor} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Bookings Report Tab
function BookingsReport({ dateRange }: { dateRange: { startDate: string; endDate: string } }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'bookings', dateRange],
    queryFn: () => reportsApi.bookings(dateRange),
  });

  const handleExport = () => {
    reportsApi.exportBookingsCsv(dateRange);
  };

  if (isLoading) {
    return <ReportSkeleton />;
  }

  const report = data?.data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={isRTL ? 'إجمالي الحجوزات' : 'Total Bookings'}
          value={report?.summary.totalBookings || 0}
          icon={Calendar}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label={isRTL ? 'مؤكد' : 'Confirmed'}
          value={report?.summary.confirmedBookings || 0}
          icon={TrendingUp}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          label={isRTL ? 'معلق' : 'Pending'}
          value={report?.summary.pendingBookings || 0}
          icon={Calendar}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <StatCard
          label={isRTL ? 'ملغي' : 'Cancelled'}
          value={report?.summary.cancelledBookings || 0}
          icon={Calendar}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* Visit Type Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isRTL ? 'توزيع نوع الزيارة' : 'Visit Type Distribution'}</CardTitle>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={16} />
              {isRTL ? 'تصدير CSV' : 'Export CSV'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <div className="text-3xl font-bold text-blue-600">{report?.summary.dayVisits || 0}</div>
              <div className="text-sm text-gray-600 mt-1">{isRTL ? 'زيارات نهارية' : 'Day Visits'}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <div className="text-3xl font-bold text-purple-600">{report?.summary.overnightStays || 0}</div>
              <div className="text-sm text-gray-600 mt-1">{isRTL ? 'إقامات ليلية' : 'Overnight Stays'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'تفاصيل الحجوزات' : 'Booking Details'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? 'رقم الحجز' : 'Ref'}</TableHead>
                  <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{isRTL ? 'النوع' : 'Type'}</TableHead>
                  <TableHead>{isRTL ? 'العميل' : 'Customer'}</TableHead>
                  <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report?.bookings?.slice(0, 20).map((booking: Record<string, unknown>) => (
                  <TableRow key={booking.id as string}>
                    <TableCell className="font-mono text-sm text-primary-600">{booking.bookingRef as string}</TableCell>
                    <TableCell>{new Date(booking.date as string).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</TableCell>
                    <TableCell>
                      <Badge variant={booking.visitType === 'DAY_VISIT' ? 'info' : 'primary'} size="sm">
                        {booking.visitType === 'DAY_VISIT' ? (isRTL ? 'نهاري' : 'Day') : (isRTL ? 'ليلي' : 'Night')}
                      </Badge>
                    </TableCell>
                    <TableCell>{booking.customerName as string}</TableCell>
                    <TableCell>
                      <Badge variant={
                        booking.status === 'CONFIRMED' ? 'success' :
                        booking.status === 'CANCELLED' ? 'danger' : 'warning'
                      } size="sm">
                        {booking.status === 'CONFIRMED' ? (isRTL ? 'مؤكد' : 'Confirmed') :
                         booking.status === 'CANCELLED' ? (isRTL ? 'ملغي' : 'Cancelled') :
                         (isRTL ? 'معلق' : 'Pending')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {report?.bookings?.length > 20 && (
              <div className="text-center text-gray-500 text-sm mt-4">
                {isRTL ? `عرض 20 من ${report.bookings.length} حجز` : `Showing 20 of ${report.bookings.length} bookings`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Revenue Report Tab
function RevenueReport({ dateRange }: { dateRange: { startDate: string; endDate: string } }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'revenue', dateRange],
    queryFn: () => reportsApi.revenue(dateRange),
  });

  const handleExport = () => {
    reportsApi.exportRevenueCsv(dateRange);
  };

  if (isLoading) {
    return <ReportSkeleton />;
  }

  const report = data?.data;
  const sar = isRTL ? 'ر.س' : 'SAR';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}
          value={`${report?.summary.totalRevenue?.toLocaleString() || 0} ${sar}`}
          icon={DollarSign}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          label={isRTL ? 'العربون المحصل' : 'Deposits Collected'}
          value={`${report?.summary.totalDeposits?.toLocaleString() || 0} ${sar}`}
          icon={TrendingUp}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label={isRTL ? 'المتبقي' : 'Outstanding'}
          value={`${report?.summary.outstandingBalance?.toLocaleString() || 0} ${sar}`}
          icon={DollarSign}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <StatCard
          label={isRTL ? 'متوسط الحجز' : 'Avg. per Booking'}
          value={`${report?.summary.averagePerBooking?.toLocaleString() || 0} ${sar}`}
          icon={DollarSign}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Revenue by Type */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isRTL ? 'الإيرادات حسب النوع' : 'Revenue by Type'}</CardTitle>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={16} />
              {isRTL ? 'تصدير CSV' : 'Export CSV'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">{isRTL ? 'زيارات نهارية' : 'Day Visits'}</div>
              <div className="text-2xl font-bold text-blue-600">
                {report?.summary.dayVisitRevenue?.toLocaleString() || 0} {sar}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">{isRTL ? 'إقامات ليلية' : 'Overnight Stays'}</div>
              <div className="text-2xl font-bold text-purple-600">
                {report?.summary.overnightRevenue?.toLocaleString() || 0} {sar}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon size={20} className="text-green-500" />
            {isRTL ? 'الإيرادات الشهرية' : 'Monthly Revenue'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report?.chartData?.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={report.chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    reversed={isRTL}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} ${sar}`, isRTL ? 'الإيرادات' : 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="total" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {isRTL ? 'لا توجد بيانات للفترة المحددة' : 'No data for selected period'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Occupancy Report Tab
function OccupancyReport({ dateRange }: { dateRange: { startDate: string; endDate: string } }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'occupancy', dateRange],
    queryFn: () => reportsApi.occupancy(dateRange),
  });

  if (isLoading) {
    return <ReportSkeleton />;
  }

  const report = data?.data;

  // Prepare chart data for day of week
  const dayOfWeekChartData = report?.byDayOfWeek?.map((day: { day: string; dayEn: string; count: number }) => ({
    name: isRTL ? day.day : day.dayEn,
    count: day.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label={isRTL ? 'نسبة الإشغال' : 'Occupancy Rate'}
          value={`${report?.summary.occupancyRate || 0}%`}
          icon={Percent}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          label={isRTL ? 'إجمالي الأيام' : 'Total Days'}
          value={report?.summary.totalDays || 0}
          icon={Calendar}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label={isRTL ? 'أيام متاحة' : 'Available Days'}
          value={report?.summary.availableDays || 0}
          icon={Calendar}
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
        />
        <StatCard
          label={isRTL ? 'أيام محجوزة' : 'Booked Days'}
          value={report?.summary.bookedDays || 0}
          icon={TrendingUp}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          label={isRTL ? 'أيام محجوبة' : 'Blocked Days'}
          value={report?.summary.blackoutDays || 0}
          icon={Calendar}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* Day of Week Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon size={20} className="text-primary-500" />
            {isRTL ? 'الحجوزات حسب يوم الأسبوع' : 'Bookings by Day of Week'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dayOfWeekChartData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dayOfWeekChartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    reversed={isRTL}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, isRTL ? 'حجوزات' : 'Bookings']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {isRTL ? 'لا توجد بيانات للفترة المحددة' : 'No data for selected period'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Occupancy Visual */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'نسبة الإشغال المرئية' : 'Occupancy Visual'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 start-0 bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
              style={{ width: `${report?.summary.occupancyRate || 0}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
              {report?.summary.occupancyRate || 0}% {isRTL ? 'إشغال' : 'Occupied'}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>{isRTL ? 'فارغ' : 'Empty'}</span>
            <span>{isRTL ? 'ممتلئ' : 'Full'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Customers Report Tab
function CustomersReport({ dateRange }: { dateRange: { startDate: string; endDate: string } }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'customers', dateRange],
    queryFn: () => reportsApi.customers(dateRange),
  });

  if (isLoading) {
    return <ReportSkeleton />;
  }

  const report = data?.data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={isRTL ? 'إجمالي العملاء' : 'Total Customers'}
          value={report?.summary.totalCustomers || 0}
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label={isRTL ? 'عملاء متكررين' : 'Repeat Customers'}
          value={report?.summary.repeatCustomers || 0}
          icon={UserCheck}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          label={isRTL ? 'عملاء جدد' : 'New Customers'}
          value={report?.summary.newCustomers || 0}
          icon={UserPlus}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          label={isRTL ? 'معدل التكرار' : 'Repeat Rate'}
          value={`${report?.summary.repeatRate || 0}%`}
          icon={Percent}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
        />
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'أفضل العملاء' : 'Top Customers'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{isRTL ? 'الاسم' : 'Name'}</TableHead>
                  <TableHead>{isRTL ? 'الجوال' : 'Phone'}</TableHead>
                  <TableHead>{isRTL ? 'عدد الحجوزات' : 'Bookings'}</TableHead>
                  <TableHead>{isRTL ? 'آخر حجز' : 'Last Booking'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report?.topCustomers?.map((customer: {
                  name: string;
                  phone: string;
                  bookingCount: number;
                  lastBooking: string;
                }, index: number) => (
                  <TableRow key={customer.phone}>
                    <TableCell>
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="font-mono text-sm">{customer.phone}</TableCell>
                    <TableCell>
                      <Badge variant="info">{customer.bookingCount}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(customer.lastBooking).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading Skeleton
function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <SkeletonCard key={i} className="h-24" />
        ))}
      </div>
      <SkeletonCard className="h-72" />
    </div>
  );
}
