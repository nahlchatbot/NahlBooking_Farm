import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { calendarApi, chaletsApi, CalendarDate, CalendarData, Chalet } from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedChaletId, setSelectedChaletId] = useState('');
  const [blockForm, setBlockForm] = useState({
    startDate: '',
    endDate: '',
    visitType: '',
    reason: '',
    chaletId: '',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Fetch chalets for filter
  const { data: chaletsData } = useQuery({
    queryKey: ['chalets'],
    queryFn: async () => {
      const res = await chaletsApi.list();
      return (res.data || []) as Chalet[];
    },
  });
  const chalets = chaletsData || [];

  const { data, isLoading, error } = useQuery({
    queryKey: ['calendar', year, month, selectedChaletId],
    queryFn: async () => {
      const res = await calendarApi.get(year, month, selectedChaletId || undefined);
      return res.data as CalendarData;
    },
  });

  const blockMutation = useMutation({
    mutationFn: (data: { startDate: string; endDate?: string; visitType?: string; reason?: string }) =>
      calendarApi.block(data as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success(isRTL ? 'تم حجب التواريخ بنجاح' : 'Dates blocked successfully');
      setShowBlockModal(false);
      setBlockForm({ startDate: '', endDate: '', visitType: '', reason: '', chaletId: '' });
    },
    onError: () => {
      toast.error(isRTL ? 'فشل في حجب التواريخ' : 'Failed to block dates');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: ({ date, visitType }: { date: string; visitType?: string }) =>
      calendarApi.unblock(date, visitType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success(isRTL ? 'تم إلغاء حجب التاريخ' : 'Date unblocked successfully');
      setSelectedDate(null);
    },
    onError: () => {
      toast.error(isRTL ? 'فشل في إلغاء حجب التاريخ' : 'Failed to unblock date');
    },
  });

  // Build calendar grid
  const calendarGrid = useMemo(() => {
    if (!data?.dates) return [];

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const grid: (CalendarDate | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateData = data.dates.find(d => d.date === dateStr);
      grid.push(dateData || { date: dateStr, dayVisit: 'available', overnight: 'available', bookings: [] });
    }

    return grid;
  }, [data, year, month]);

  const navigateMonth = (delta: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockForm.startDate) return;

    blockMutation.mutate({
      startDate: blockForm.startDate,
      endDate: blockForm.endDate || undefined,
      visitType: blockForm.visitType || undefined,
      reason: blockForm.reason || undefined,
      chaletId: blockForm.chaletId || undefined,
    });
  };

  const getDateStatusColor = (date: CalendarDate) => {
    const hasDayBlackout = date.dayVisit === 'blackout';
    const hasNightBlackout = date.overnight === 'blackout';
    const hasDayBooked = date.dayVisit === 'booked';
    const hasNightBooked = date.overnight === 'booked';

    if (hasDayBlackout && hasNightBlackout) return 'bg-red-100 dark:bg-red-900/30 border-red-300';
    if (hasDayBlackout || hasNightBlackout) return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300';
    if (hasDayBooked && hasNightBooked) return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300';
    if (hasDayBooked || hasNightBooked) return 'bg-sky-100 dark:bg-sky-900/30 border-sky-300';
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 hover:bg-green-100';
  };

  const days = isRTL ? DAYS_AR : DAYS_EN;
  const months = isRTL ? MONTHS_AR : MONTHS_EN;

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600">{isRTL ? 'فشل في تحميل التقويم' : 'Failed to load calendar'}</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['calendar'] })} className="mt-4">
              {isRTL ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDaysIcon className="w-7 h-7 text-primary-600" />
            {isRTL ? 'التقويم' : 'Calendar'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isRTL ? 'عرض وإدارة الحجوزات والتواريخ المحجوبة' : 'View and manage bookings and blocked dates'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedChaletId}
            onChange={(e) => setSelectedChaletId(e.target.value)}
            options={[
              { value: '', label: isRTL ? 'كل الشاليهات' : 'All Chalets' },
              ...chalets.map((c) => ({
                value: c.id,
                label: isRTL ? c.nameAr : c.nameEn,
              })),
            ]}
          />
          <Button onClick={() => setShowBlockModal(true)}>
            {isRTL ? 'حجب تواريخ' : 'Block Dates'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-green-600">{data.summary.available}</div>
              <div className="text-sm text-gray-500">{isRTL ? 'متاح' : 'Available'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{data.summary.booked}</div>
              <div className="text-sm text-gray-500">{isRTL ? 'محجوز' : 'Booked'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-red-600">{data.summary.blackout}</div>
              <div className="text-sm text-gray-500">{isRTL ? 'محجوب' : 'Blocked'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{data.summary.totalBookings}</div>
              <div className="text-sm text-gray-500">{isRTL ? 'إجمالي الحجوزات' : 'Total Bookings'}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
                {isRTL ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
              </Button>
              <CardTitle className="min-w-[180px] text-center">
                {months[month - 1]} {year}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
                {isRTL ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
              </Button>
            </div>
            <Button variant="secondary" size="sm" onClick={goToToday}>
              {isRTL ? 'اليوم' : 'Today'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {days.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarGrid.map((date, index) => (
                  <div
                    key={index}
                    className={clsx(
                      'min-h-[100px] rounded-lg border p-2 transition-all',
                      date ? getDateStatusColor(date) + ' cursor-pointer' : 'bg-gray-50 dark:bg-gray-800/50'
                    )}
                    onClick={() => date && setSelectedDate(date)}
                  >
                    {date && (
                      <>
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {new Date(date.date).getDate()}
                        </div>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-1">
                            <span className={clsx(
                              'w-2 h-2 rounded-full',
                              date.dayVisit === 'available' ? 'bg-green-500' :
                              date.dayVisit === 'booked' ? 'bg-blue-500' : 'bg-red-500'
                            )} />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {isRTL ? 'نهاري' : 'Day'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={clsx(
                              'w-2 h-2 rounded-full',
                              date.overnight === 'available' ? 'bg-green-500' :
                              date.overnight === 'booked' ? 'bg-blue-500' : 'bg-red-500'
                            )} />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {isRTL ? 'ليلي' : 'Night'}
                            </span>
                          </div>
                        </div>
                        {date.bookings.length > 0 && (
                          <div className="mt-1 text-xs text-blue-600 font-medium">
                            {date.bookings.length} {isRTL ? 'حجز' : 'booking(s)'}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">{isRTL ? 'متاح' : 'Available'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-gray-600">{isRTL ? 'محجوز' : 'Booked'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600">{isRTL ? 'محجوب' : 'Blocked'}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Date Details Modal */}
      <Modal
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? new Date(selectedDate.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : ''}
      >
        {selectedDate && (
          <div className="space-y-4">
            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className={clsx(
                'p-4 rounded-xl border',
                selectedDate.dayVisit === 'available' ? 'bg-green-50 border-green-200' :
                selectedDate.dayVisit === 'booked' ? 'bg-blue-50 border-blue-200' :
                'bg-red-50 border-red-200'
              )}>
                <div className="text-sm font-medium text-gray-700 mb-2">{isRTL ? 'زيارة نهارية' : 'Day Visit'}</div>
                <Badge variant={
                  selectedDate.dayVisit === 'available' ? 'success' :
                  selectedDate.dayVisit === 'booked' ? 'info' : 'danger'
                }>
                  {selectedDate.dayVisit === 'available' ? (isRTL ? 'متاح' : 'Available') :
                   selectedDate.dayVisit === 'booked' ? (isRTL ? 'محجوز' : 'Booked') :
                   (isRTL ? 'محجوب' : 'Blocked')}
                </Badge>
              </div>
              <div className={clsx(
                'p-4 rounded-xl border',
                selectedDate.overnight === 'available' ? 'bg-green-50 border-green-200' :
                selectedDate.overnight === 'booked' ? 'bg-blue-50 border-blue-200' :
                'bg-red-50 border-red-200'
              )}>
                <div className="text-sm font-medium text-gray-700 mb-2">{isRTL ? 'إقامة ليلية' : 'Overnight Stay'}</div>
                <Badge variant={
                  selectedDate.overnight === 'available' ? 'success' :
                  selectedDate.overnight === 'booked' ? 'info' : 'danger'
                }>
                  {selectedDate.overnight === 'available' ? (isRTL ? 'متاح' : 'Available') :
                   selectedDate.overnight === 'booked' ? (isRTL ? 'محجوز' : 'Booked') :
                   (isRTL ? 'محجوب' : 'Blocked')}
                </Badge>
              </div>
            </div>

            {/* Bookings */}
            {selectedDate.bookings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">{isRTL ? 'الحجوزات' : 'Bookings'}</h4>
                <div className="space-y-2">
                  {selectedDate.bookings.map(booking => (
                    <div key={booking.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{booking.customerName}</div>
                          <div className="text-sm text-gray-500">{booking.bookingRef}</div>
                        </div>
                        <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'warning'}>
                          {booking.status === 'CONFIRMED' ? (isRTL ? 'مؤكد' : 'Confirmed') : (isRTL ? 'معلق' : 'Pending')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {booking.visitType === 'DAY_VISIT' ? (isRTL ? 'زيارة نهارية' : 'Day Visit') : (isRTL ? 'إقامة ليلية' : 'Overnight Stay')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              {(selectedDate.dayVisit === 'blackout' || selectedDate.overnight === 'blackout') && (
                <Button
                  variant="danger"
                  onClick={() => unblockMutation.mutate({ date: selectedDate.date })}
                  disabled={unblockMutation.isPending}
                >
                  {isRTL ? 'إلغاء الحجب' : 'Unblock Date'}
                </Button>
              )}
              {(selectedDate.dayVisit === 'available' || selectedDate.overnight === 'available') && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setBlockForm(prev => ({ ...prev, startDate: selectedDate.date }));
                    setSelectedDate(null);
                    setShowBlockModal(true);
                  }}
                >
                  {isRTL ? 'حجب التاريخ' : 'Block Date'}
                </Button>
              )}
              <Button variant="ghost" onClick={() => setSelectedDate(null)}>
                {isRTL ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Block Dates Modal */}
      <Modal
        open={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        title={isRTL ? 'حجب تواريخ' : 'Block Dates'}
      >
        <form onSubmit={handleBlockSubmit} className="space-y-4">
          <Input
            label={isRTL ? 'تاريخ البداية' : 'Start Date'}
            type="date"
            value={blockForm.startDate}
            onChange={(e) => setBlockForm(prev => ({ ...prev, startDate: e.target.value }))}
            required
          />
          <Input
            label={isRTL ? 'تاريخ النهاية (اختياري)' : 'End Date (optional)'}
            type="date"
            value={blockForm.endDate}
            onChange={(e) => setBlockForm(prev => ({ ...prev, endDate: e.target.value }))}
          />
          <Select
            label={isRTL ? 'نوع الزيارة' : 'Visit Type'}
            value={blockForm.visitType}
            onChange={(e) => setBlockForm(prev => ({ ...prev, visitType: e.target.value }))}
            options={[
              { value: '', label: isRTL ? 'كلاهما' : 'Both' },
              { value: 'DAY_VISIT', label: isRTL ? 'زيارة نهارية فقط' : 'Day Visit Only' },
              { value: 'OVERNIGHT_STAY', label: isRTL ? 'إقامة ليلية فقط' : 'Overnight Only' },
            ]}
          />
          <Select
            label={isRTL ? 'الشاليه (اختياري)' : 'Chalet (optional)'}
            value={blockForm.chaletId}
            onChange={(e) => setBlockForm(prev => ({ ...prev, chaletId: e.target.value }))}
            options={[
              { value: '', label: isRTL ? 'كل الشاليهات' : 'All Chalets (Global)' },
              ...chalets.map((c) => ({
                value: c.id,
                label: isRTL ? c.nameAr : c.nameEn,
              })),
            ]}
          />
          <Input
            label={isRTL ? 'السبب (اختياري)' : 'Reason (optional)'}
            value={blockForm.reason}
            onChange={(e) => setBlockForm(prev => ({ ...prev, reason: e.target.value }))}
            placeholder={isRTL ? 'مثال: صيانة' : 'e.g., Maintenance'}
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowBlockModal(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={blockMutation.isPending}>
              {blockMutation.isPending ? (isRTL ? 'جارٍ الحجب...' : 'Blocking...') : (isRTL ? 'حجب' : 'Block')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
