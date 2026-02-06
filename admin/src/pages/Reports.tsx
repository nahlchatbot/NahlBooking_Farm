import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import { reportsApi } from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SimpleTabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { TableRoot as Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import clsx from 'clsx';

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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState('bookings');
  const presets = useMemo(() => getPresetDates(), []);
  const [dateRange, setDateRange] = useState(presets.thisMonth);
  const [preset, setPreset] = useState('thisMonth');

  const tabs = [
    { id: 'bookings', label: isRTL ? 'الحجوزات' : 'Bookings', icon: CalendarIcon },
    { id: 'revenue', label: isRTL ? 'الإيرادات' : 'Revenue', icon: CurrencyDollarIcon },
    { id: 'occupancy', label: isRTL ? 'الإشغال' : 'Occupancy', icon: ChartPieIcon },
    { id: 'customers', label: isRTL ? 'العملاء' : 'Customers', icon: UserGroupIcon },
  ];

  const handlePresetChange = (presetKey: string) => {
    setPreset(presetKey);
    setDateRange(presets[presetKey as keyof typeof presets]);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="w-7 h-7 text-primary-600" />
            {isRTL ? 'التقارير' : 'Reports'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isRTL ? 'تحليل البيانات والإحصائيات' : 'Data analysis and statistics'}
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
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => {
                  setPreset('custom');
                  setDateRange(prev => ({ ...prev, startDate: e.target.value }));
                }}
                className="px-3 py-1.5 border rounded-lg text-sm"
              />
              <span className="text-gray-500">{isRTL ? 'إلى' : 'to'}</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => {
                  setPreset('custom');
                  setDateRange(prev => ({ ...prev, endDate: e.target.value }));
                }}
                className="px-3 py-1.5 border rounded-lg text-sm"
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
          color="blue"
        />
        <StatCard
          label={isRTL ? 'مؤكد' : 'Confirmed'}
          value={report?.summary.confirmedBookings || 0}
          color="green"
        />
        <StatCard
          label={isRTL ? 'معلق' : 'Pending'}
          value={report?.summary.pendingBookings || 0}
          color="yellow"
        />
        <StatCard
          label={isRTL ? 'ملغي' : 'Cancelled'}
          value={report?.summary.cancelledBookings || 0}
          color="red"
        />
      </div>

      {/* Visit Type Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isRTL ? 'توزيع نوع الزيارة' : 'Visit Type Distribution'}</CardTitle>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <DocumentArrowDownIcon className="w-4 h-4 me-1" />
              {isRTL ? 'تصدير CSV' : 'Export CSV'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{report?.summary.dayVisits || 0}</div>
              <div className="text-sm text-gray-600 mt-1">{isRTL ? 'زيارات نهارية' : 'Day Visits'}</div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
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
                    <TableCell className="font-mono text-sm">{booking.bookingRef as string}</TableCell>
                    <TableCell>{new Date(booking.date as string).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</TableCell>
                    <TableCell>
                      <Badge variant={booking.visitType === 'DAY_VISIT' ? 'info' : 'default'}>
                        {booking.visitType === 'DAY_VISIT' ? (isRTL ? 'نهاري' : 'Day') : (isRTL ? 'ليلي' : 'Night')}
                      </Badge>
                    </TableCell>
                    <TableCell>{booking.customerName as string}</TableCell>
                    <TableCell>
                      <Badge variant={
                        booking.status === 'CONFIRMED' ? 'success' :
                        booking.status === 'CANCELLED' ? 'danger' : 'warning'
                      }>
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}
          value={`${report?.summary.totalRevenue?.toLocaleString() || 0} ${isRTL ? 'ر.س' : 'SAR'}`}
          color="green"
        />
        <StatCard
          label={isRTL ? 'العربون المحصل' : 'Deposits Collected'}
          value={`${report?.summary.totalDeposits?.toLocaleString() || 0} ${isRTL ? 'ر.س' : 'SAR'}`}
          color="blue"
        />
        <StatCard
          label={isRTL ? 'المتبقي' : 'Outstanding'}
          value={`${report?.summary.outstandingBalance?.toLocaleString() || 0} ${isRTL ? 'ر.س' : 'SAR'}`}
          color="yellow"
        />
        <StatCard
          label={isRTL ? 'متوسط الحجز' : 'Avg. per Booking'}
          value={`${report?.summary.averagePerBooking?.toLocaleString() || 0} ${isRTL ? 'ر.س' : 'SAR'}`}
          color="purple"
        />
      </div>

      {/* Revenue by Type */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isRTL ? 'الإيرادات حسب النوع' : 'Revenue by Type'}</CardTitle>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <DocumentArrowDownIcon className="w-4 h-4 me-1" />
              {isRTL ? 'تصدير CSV' : 'Export CSV'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">{isRTL ? 'زيارات نهارية' : 'Day Visits'}</div>
              <div className="text-2xl font-bold text-blue-600">
                {report?.summary.dayVisitRevenue?.toLocaleString() || 0} {isRTL ? 'ر.س' : 'SAR'}
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">{isRTL ? 'إقامات ليلية' : 'Overnight Stays'}</div>
              <div className="text-2xl font-bold text-purple-600">
                {report?.summary.overnightRevenue?.toLocaleString() || 0} {isRTL ? 'ر.س' : 'SAR'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report?.chartData?.map((month: { month: string; total: number; count: number }) => (
              <div key={month.month} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">{month.month}</div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg transition-all"
                      style={{
                        width: `${Math.min(100, (month.total / (report?.summary.totalRevenue || 1)) * 100 * (report?.chartData?.length || 1))}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-32 text-end font-medium">
                  {month.total.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}
                </div>
              </div>
            ))}
          </div>
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label={isRTL ? 'نسبة الإشغال' : 'Occupancy Rate'}
          value={`${report?.summary.occupancyRate || 0}%`}
          color="green"
        />
        <StatCard
          label={isRTL ? 'إجمالي الأيام' : 'Total Days'}
          value={report?.summary.totalDays || 0}
          color="blue"
        />
        <StatCard
          label={isRTL ? 'أيام متاحة' : 'Available Days'}
          value={report?.summary.availableDays || 0}
          color="gray"
        />
        <StatCard
          label={isRTL ? 'أيام محجوزة' : 'Booked Days'}
          value={report?.summary.bookedDays || 0}
          color="purple"
        />
        <StatCard
          label={isRTL ? 'أيام محجوبة' : 'Blocked Days'}
          value={report?.summary.blackoutDays || 0}
          color="red"
        />
      </div>

      {/* Occupancy by Day of Week */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'الحجوزات حسب يوم الأسبوع' : 'Bookings by Day of Week'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {report?.byDayOfWeek?.map((day: { day: string; dayEn: string; count: number }) => {
              const maxCount = Math.max(...(report?.byDayOfWeek?.map((d: { count: number }) => d.count) || [1]));
              const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

              return (
                <div key={day.dayEn} className="text-center">
                  <div className="h-32 flex items-end justify-center mb-2">
                    <div
                      className="w-full max-w-[40px] bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(heightPercent, 5)}%` }}
                    />
                  </div>
                  <div className="text-sm font-medium">{day.count}</div>
                  <div className="text-xs text-gray-500">{isRTL ? day.day : day.dayEn}</div>
                </div>
              );
            })}
          </div>
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
          color="blue"
        />
        <StatCard
          label={isRTL ? 'عملاء متكررين' : 'Repeat Customers'}
          value={report?.summary.repeatCustomers || 0}
          color="green"
        />
        <StatCard
          label={isRTL ? 'عملاء جدد' : 'New Customers'}
          value={report?.summary.newCustomers || 0}
          color="purple"
        />
        <StatCard
          label={isRTL ? 'معدل التكرار' : 'Repeat Rate'}
          value={`${report?.summary.repeatRate || 0}%`}
          color="yellow"
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
                      <span className={clsx(
                        'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-600'
                      )}>
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

// Stat Card Component
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600',
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-sm text-gray-500 mb-1">{label}</div>
        <div className={clsx('text-2xl font-bold', colorClasses[color] || colorClasses.blue)}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="py-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="py-8">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
