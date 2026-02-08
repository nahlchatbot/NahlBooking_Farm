import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Clock, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

// Types
interface BookingType {
  id: string;
  nameAr: string;
  nameEn: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface BookingTypeFormData {
  nameAr: string;
  nameEn: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
}

// API
const bookingTypesApi = {
  list: async () => {
    const res = await apiClient.get('/admin/booking-types');
    return res.data;
  },
  create: async (data: BookingTypeFormData) => {
    const res = await apiClient.post('/admin/booking-types', data);
    return res.data;
  },
  update: async (id: string, data: Partial<BookingTypeFormData & { isActive: boolean }>) => {
    const res = await apiClient.patch(`/admin/booking-types/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/admin/booking-types/${id}`);
    return res.data;
  },
};

const defaultFormData: BookingTypeFormData = {
  nameAr: '',
  nameEn: '',
  startTime: '08:00',
  endTime: '18:00',
  sortOrder: 0,
};

export default function BookingTypes() {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<BookingType | null>(null);
  const [formData, setFormData] = useState<BookingTypeFormData>({ ...defaultFormData });

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['booking-types'],
    queryFn: bookingTypesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: bookingTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-types'] });
      setShowCreateModal(false);
      resetForm();
      toast.success(isRTL ? 'تم إنشاء نوع الحجز بنجاح' : 'Booking type created successfully');
    },
    onError: () => {
      toast.error(isRTL ? 'حدث خطأ أثناء إنشاء نوع الحجز' : 'Error creating booking type');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookingTypeFormData & { isActive: boolean }> }) =>
      bookingTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-types'] });
      setShowEditModal(false);
      setSelectedType(null);
      resetForm();
      toast.success(isRTL ? 'تم تحديث نوع الحجز بنجاح' : 'Booking type updated successfully');
    },
    onError: () => {
      toast.error(isRTL ? 'حدث خطأ أثناء تحديث نوع الحجز' : 'Error updating booking type');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: bookingTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-types'] });
      setShowDeleteDialog(false);
      setSelectedType(null);
      toast.success(isRTL ? 'تم حذف نوع الحجز بنجاح' : 'Booking type deleted successfully');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          (isRTL ? 'حدث خطأ أثناء حذف نوع الحجز' : 'Error deleting booking type')
      );
    },
  });

  const bookingTypes: BookingType[] = data?.data?.bookingTypes ?? [];

  const resetForm = () => {
    setFormData({ ...defaultFormData });
  };

  const handleCreate = () => {
    if (!formData.nameAr || !formData.nameEn) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedType) return;
    updateMutation.mutate({
      id: selectedType.id,
      data: formData,
    });
  };

  const handleDelete = () => {
    if (!selectedType) return;
    deleteMutation.mutate(selectedType.id);
  };

  const openEditModal = (bookingType: BookingType) => {
    setSelectedType(bookingType);
    setFormData({
      nameAr: bookingType.nameAr,
      nameEn: bookingType.nameEn,
      startTime: bookingType.startTime,
      endTime: bookingType.endTime,
      sortOrder: bookingType.sortOrder,
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (bookingType: BookingType) => {
    setSelectedType(bookingType);
    setShowDeleteDialog(true);
  };

  const toggleActive = (bookingType: BookingType) => {
    updateMutation.mutate({
      id: bookingType.id,
      data: { isActive: !bookingType.isActive },
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? (isRTL ? 'م' : 'PM') : (isRTL ? 'ص' : 'AM');
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-7 w-48 mb-1" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Clock className="text-purple-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isRTL ? 'أنواع الحجز' : 'Booking Types'}
            </h1>
            <p className="text-sm text-gray-500">
              {isRTL
                ? 'إدارة أنواع الحجز المختلفة مثل الزيارة النهارية والمبيت'
                : 'Manage different booking types like day visit, overnight stay, etc.'}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          {isRTL ? 'إضافة نوع' : 'Add Type'}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-3">
            {isRTL ? 'فشل في تحميل أنواع الحجز' : 'Failed to load booking types'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['booking-types'] })}
          >
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Booking Types Grid */}
      {!error && bookingTypes.length === 0 ? (
        <EmptyState
          icon="package"
          title={isRTL ? 'لا توجد أنواع حجز' : 'No Booking Types'}
          description={
            isRTL
              ? 'لم يتم إضافة أي أنواع حجز بعد. أضف نوعًا جديدًا للبدء.'
              : 'No booking types have been added yet. Add a new type to get started.'
          }
          action={{
            label: isRTL ? 'إضافة نوع حجز' : 'Add Booking Type',
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookingTypes.map((bookingType) => (
            <Card key={bookingType.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {isRTL ? bookingType.nameAr : bookingType.nameEn}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {isRTL ? bookingType.nameEn : bookingType.nameAr}
                      </p>
                    </div>
                  </div>
                  <Badge variant={bookingType.isActive ? 'success' : 'default'} size="sm">
                    {bookingType.isActive
                      ? (isRTL ? 'نشط' : 'Active')
                      : (isRTL ? 'معطل' : 'Inactive')}
                  </Badge>
                </div>

                {/* Time Range */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-500">{isRTL ? 'من' : 'From'}</span>
                      <span className="font-medium text-gray-900 ms-2">
                        {formatTime(bookingType.startTime)}
                      </span>
                    </div>
                    <div className="text-gray-300">&#8594;</div>
                    <div>
                      <span className="text-gray-500">{isRTL ? 'إلى' : 'To'}</span>
                      <span className="font-medium text-gray-900 ms-2">
                        {formatTime(bookingType.endTime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sort Order */}
                <div className="text-xs text-gray-400 mb-4">
                  {isRTL ? 'الترتيب' : 'Sort Order'}: {bookingType.sortOrder}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <button
                    onClick={() => toggleActive(bookingType)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      bookingType.isActive
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {bookingType.isActive
                      ? (isRTL ? 'تعطيل' : 'Deactivate')
                      : (isRTL ? 'تفعيل' : 'Activate')}
                  </button>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(bookingType)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(bookingType)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedType(null);
          resetForm();
        }}
        title={
          showEditModal
            ? (isRTL ? 'تعديل نوع الحجز' : 'Edit Booking Type')
            : (isRTL ? 'إضافة نوع حجز جديد' : 'Add New Booking Type')
        }
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={isRTL ? 'الاسم بالعربي' : 'Arabic Name'}
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              placeholder={isRTL ? 'مثال: زيارة نهارية' : 'e.g. زيارة نهارية'}
              hint={isRTL ? 'اسم نوع الحجز كما سيظهر للعملاء' : 'Name shown to Arabic-speaking customers'}
              required
            />
            <Input
              label={isRTL ? 'الاسم بالإنجليزي' : 'English Name'}
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              placeholder={isRTL ? 'e.g. Day Visit' : 'e.g. Day Visit'}
              hint={isRTL ? 'اسم نوع الحجز بالإنجليزية' : 'Name shown to English-speaking customers'}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={isRTL ? 'وقت البداية' : 'Start Time'}
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              hint={isRTL ? 'وقت بداية هذا النوع من الحجز' : 'When this booking type begins'}
            />
            <Input
              label={isRTL ? 'وقت النهاية' : 'End Time'}
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              hint={isRTL ? 'وقت نهاية هذا النوع من الحجز' : 'When this booking type ends'}
            />
          </div>

          <Input
            label={isRTL ? 'ترتيب العرض' : 'Sort Order'}
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) ?? 0 })}
            min={0}
            hint={isRTL ? 'رقم أصغر = يظهر أولاً في القائمة' : 'Lower number = appears first in the list'}
          />
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedType(null);
              resetForm();
            }}
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={showEditModal ? handleUpdate : handleCreate}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {showEditModal ? (isRTL ? 'حفظ' : 'Save') : (isRTL ? 'إنشاء' : 'Create')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedType(null);
        }}
        onConfirm={handleDelete}
        title={isRTL ? 'حذف نوع الحجز' : 'Delete Booking Type'}
        description={
          isRTL
            ? `هل أنت متأكد من حذف "${selectedType?.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete "${selectedType?.nameEn}"? This action cannot be undone.`
        }
        confirmLabel={isRTL ? 'حذف' : 'Delete'}
        cancelLabel={isRTL ? 'إلغاء' : 'Cancel'}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
