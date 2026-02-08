import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blackoutApi, chaletsApi, Chalet } from '../api/client';
import { CalendarX, Plus, Trash2, AlertCircle, Home } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

interface BlackoutDate {
  id: string;
  date: string;
  visitType?: string | null;
  reason?: string | null;
  chaletId?: string | null;
  chalet?: { id: string; nameAr: string; nameEn: string } | null;
}

export default function BlackoutDates() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newChaletId, setNewChaletId] = useState('');
  const [filterChaletId, setFilterChaletId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BlackoutDate | null>(null);

  // Fetch chalets for filter and form
  const { data: chaletsData } = useQuery({
    queryKey: ['chalets'],
    queryFn: async () => {
      const res = await chaletsApi.list();
      return (res.data || []) as Chalet[];
    },
  });
  const chalets = chaletsData || [];

  const { data, isLoading, error } = useQuery({
    queryKey: ['blackout-dates', filterChaletId],
    queryFn: () => blackoutApi.list(filterChaletId ? { chaletId: filterChaletId } : undefined),
  });

  const createMutation = useMutation({
    mutationFn: blackoutApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blackout-dates'] });
      toast.success(isRTL ? 'تم إضافة التاريخ المحجوب بنجاح' : 'Blackout date added successfully');
      setNewDate('');
      setNewType('');
      setNewReason('');
      setNewChaletId('');
    },
    onError: () => {
      toast.error(isRTL ? 'فشل في إضافة التاريخ' : 'Failed to add blackout date');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: blackoutApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blackout-dates'] });
      toast.success(isRTL ? 'تم إزالة التاريخ المحجوب' : 'Blackout date removed');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error(isRTL ? 'فشل في إزالة التاريخ' : 'Failed to remove blackout date');
      setDeleteTarget(null);
    },
  });

  const handleAdd = () => {
    if (!newDate) return;
    createMutation.mutate({
      date: newDate,
      visitType: newType || undefined,
      reason: newReason || undefined,
      chaletId: newChaletId || undefined,
    } as any);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const blackoutDates: BlackoutDate[] = data?.data || [];

  const visitTypeOptions = [
    { value: '', label: isRTL ? 'الكل (نهاري + مبيت)' : 'All (Day + Overnight)' },
    { value: 'DAY_VISIT', label: t('bookings.dayVisit') },
    { value: 'OVERNIGHT_STAY', label: t('bookings.overnightStay') },
  ];

  const getVisitTypeBadge = (visitType?: string | null) => {
    if (visitType === 'DAY_VISIT') {
      return <Badge variant="info">{t('bookings.dayVisit')}</Badge>;
    }
    if (visitType === 'OVERNIGHT_STAY') {
      return <Badge variant="primary">{t('bookings.overnightStay')}</Badge>;
    }
    return <Badge variant="warning">{isRTL ? 'الكل' : 'All Types'}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-lg">
          <CalendarX className="text-red-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isRTL ? 'التواريخ المحجوبة' : 'Blackout Dates'}
          </h1>
          <p className="text-sm text-gray-500">
            {isRTL ? 'حجب تواريخ عندما يكون المنتجع غير متاح للحجز' : 'Block dates when the resort is unavailable for booking'}
          </p>
        </div>
      </div>

      {/* Chalet Filter */}
      <div className="flex items-center gap-3">
        <Home size={18} className="text-gray-400" />
        <Select
          value={filterChaletId}
          onChange={(e) => setFilterChaletId(e.target.value)}
          options={[
            { value: '', label: isRTL ? 'كل الشاليهات' : 'All Chalets' },
            ...chalets.map((c) => ({
              value: c.id,
              label: isRTL ? c.nameAr : c.nameEn,
            })),
          ]}
        />
      </div>

      {/* Add New Date Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus size={20} className="text-green-500" />
            {isRTL ? 'إضافة تاريخ محجوب' : 'Add Blackout Date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <Input
              label={isRTL ? 'التاريخ' : 'Date'}
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              hint={isRTL ? 'اختر التاريخ الذي تريد حجبه' : 'Select the date to block'}
            />
            <Select
              label={isRTL ? 'الشاليه' : 'Chalet'}
              value={newChaletId}
              onChange={(e) => setNewChaletId(e.target.value)}
              options={[
                { value: '', label: isRTL ? 'كل الشاليهات' : 'All Chalets (Global)' },
                ...chalets.map((c) => ({
                  value: c.id,
                  label: isRTL ? c.nameAr : c.nameEn,
                })),
              ]}
              hint={isRTL ? 'حجب شاليه محدد أو الكل' : 'Block a specific chalet or all'}
            />
            <Select
              label={isRTL ? 'نوع الحجز' : 'Visit Type'}
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              options={visitTypeOptions}
              hint={isRTL ? 'أي نوع حجوزات تريد حجبه في هذا التاريخ' : 'Which booking types to block on this date'}
            />
            <Input
              label={isRTL ? 'السبب' : 'Reason'}
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder={isRTL ? 'مثال: صيانة، حدث خاص' : 'e.g. Maintenance, Private event'}
              hint={isRTL ? 'ملاحظة اختيارية لفريقك' : 'Optional note for your team'}
            />
            <Button
              onClick={handleAdd}
              disabled={!newDate || createMutation.isPending}
              loading={createMutation.isPending}
            >
              <Plus size={18} />
              {isRTL ? 'إضافة' : 'Add Date'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-3">{isRTL ? 'فشل في تحميل التواريخ المحجوبة' : 'Failed to load blackout dates'}</p>
          <Button variant="secondary" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['blackout-dates'] })}>
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Blackout Dates List */}
      {!error && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isRTL ? 'التواريخ المحجوبة الحالية' : 'Current Blackout Dates'}
              {blackoutDates.length > 0 && (
                <Badge variant="default" className="ms-2">{blackoutDates.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {blackoutDates.length === 0 ? (
              <EmptyState
                icon="calendar"
                title={isRTL ? 'لا توجد تواريخ محجوبة' : 'No Blackout Dates'}
                description={isRTL ? 'جميع التواريخ متاحة للحجز حالياً. استخدم النموذج أعلاه لحجب تاريخ.' : 'All dates are currently available for booking. Use the form above to block a date.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        {isRTL ? 'التاريخ' : 'Date'}
                      </th>
                      <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        {isRTL ? 'الشاليه' : 'Chalet'}
                      </th>
                      <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        {isRTL ? 'نوع الحجز' : 'Visit Type'}
                      </th>
                      <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        {isRTL ? 'السبب' : 'Reason'}
                      </th>
                      <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        {isRTL ? 'الإجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {blackoutDates.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {new Date(item.date).toLocaleDateString(
                            isRTL ? 'ar-SA' : 'en-US',
                            { year: 'numeric', month: 'long', day: 'numeric' }
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {item.chalet ? (
                            <Badge variant="primary">
                              {isRTL ? item.chalet.nameAr : item.chalet.nameEn}
                            </Badge>
                          ) : (
                            <Badge variant="warning">
                              {isRTL ? 'الكل' : 'All'}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getVisitTypeBadge(item.visitType)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {item.reason || (
                            <span className="text-gray-300 italic">
                              {isRTL ? 'بدون سبب' : 'No reason'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(item)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={isRTL ? 'إزالة التاريخ المحجوب؟' : 'Remove Blackout Date?'}
        description={
          isRTL
            ? 'سيتم فتح الحجوزات لهذا التاريخ مرة أخرى. هل أنت متأكد؟'
            : 'Bookings will become available again for this date. Are you sure?'
        }
        confirmLabel={isRTL ? 'إزالة' : 'Remove'}
        cancelLabel={isRTL ? 'إلغاء' : 'Cancel'}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
