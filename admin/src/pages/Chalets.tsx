import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, chaletsApi, Chalet, CreateChaletData, UpdateChaletData, BookingType } from '../api/client';
import {
  Home,
  Users,
  Plus,
  Edit2,
  Trash2,
  Image,
  Grid,
  List,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Modal,
  ModalFooter,
  Input,
  Select,
  ConfirmDialog,
  Skeleton,
  SkeletonCard,
  EmptyState,
  toast,
} from '../components/ui';

const AMENITY_OPTIONS = [
  { value: 'wifi', labelAr: 'واي فاي', labelEn: 'WiFi' },
  { value: 'pool', labelAr: 'مسبح', labelEn: 'Pool' },
  { value: 'bbq', labelAr: 'شواء', labelEn: 'BBQ' },
  { value: 'parking', labelAr: 'موقف سيارات', labelEn: 'Parking' },
  { value: 'playground', labelAr: 'ملعب أطفال', labelEn: 'Playground' },
  { value: 'jacuzzi', labelAr: 'جاكوزي', labelEn: 'Jacuzzi' },
  { value: 'kitchen', labelAr: 'مطبخ', labelEn: 'Kitchen' },
  { value: 'ac', labelAr: 'تكييف', labelEn: 'A/C' },
];

export default function Chalets() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedChalet, setSelectedChalet] = useState<Chalet | null>(null);
  const [formData, setFormData] = useState<Partial<CreateChaletData>>({
    nameAr: '',
    nameEn: '',
    maxGuests: 4,
    descriptionAr: '',
    descriptionEn: '',
    amenities: [],
    bookingTypeIds: [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['chalets'],
    queryFn: chaletsApi.list,
  });

  const { data: bookingTypesData } = useQuery({
    queryKey: ['booking-types'],
    queryFn: () => apiClient.get('/admin/booking-types'),
  });

  const bookingTypes: BookingType[] = bookingTypesData?.data?.data || bookingTypesData?.data || [];

  const createMutation = useMutation({
    mutationFn: chaletsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chalets'] });
      setShowCreateModal(false);
      resetForm();
      toast.success(isRTL ? 'تم إنشاء الشاليه بنجاح' : 'Chalet created successfully');
    },
    onError: () => {
      toast.error(isRTL ? 'حدث خطأ أثناء إنشاء الشاليه' : 'Error creating chalet');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChaletData }) =>
      chaletsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chalets'] });
      setShowEditModal(false);
      setSelectedChalet(null);
      resetForm();
      toast.success(isRTL ? 'تم تحديث الشاليه بنجاح' : 'Chalet updated successfully');
    },
    onError: () => {
      toast.error(isRTL ? 'حدث خطأ أثناء تحديث الشاليه' : 'Error updating chalet');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: chaletsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chalets'] });
      setShowDeleteDialog(false);
      setSelectedChalet(null);
      toast.success(isRTL ? 'تم حذف الشاليه بنجاح' : 'Chalet deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || (isRTL ? 'حدث خطأ أثناء حذف الشاليه' : 'Error deleting chalet'));
    },
  });

  const chalets: Chalet[] = data?.data || [];

  const resetForm = () => {
    setFormData({
      nameAr: '',
      nameEn: '',
      maxGuests: 4,
      descriptionAr: '',
      descriptionEn: '',
      amenities: [],
      bookingTypeIds: [],
    });
  };

  const handleCreate = () => {
    if (!formData.nameAr || !formData.nameEn) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    createMutation.mutate(formData as CreateChaletData);
  };

  const handleUpdate = () => {
    if (!selectedChalet) return;
    updateMutation.mutate({
      id: selectedChalet.id,
      data: formData as UpdateChaletData,
    });
  };

  const handleDelete = () => {
    if (!selectedChalet) return;
    deleteMutation.mutate(selectedChalet.id);
  };

  const openEditModal = (chalet: Chalet) => {
    setSelectedChalet(chalet);
    setFormData({
      nameAr: chalet.nameAr,
      nameEn: chalet.nameEn,
      maxGuests: chalet.maxGuests,
      descriptionAr: chalet.descriptionAr || '',
      descriptionEn: chalet.descriptionEn || '',
      amenities: chalet.amenities || [],
      bookingTypeIds: chalet.chaletBookingTypes?.map((cbt) => cbt.bookingType.id) || [],
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (chalet: Chalet) => {
    setSelectedChalet(chalet);
    setShowDeleteDialog(true);
  };

  const toggleActive = (chalet: Chalet) => {
    updateMutation.mutate({
      id: chalet.id,
      data: { isActive: !chalet.isActive },
    });
  };

  const toggleAmenity = (amenity: string) => {
    const current = formData.amenities || [];
    if (current.includes(amenity)) {
      setFormData({ ...formData, amenities: current.filter((a) => a !== amenity) });
    } else {
      setFormData({ ...formData, amenities: [...current, amenity] });
    }
  };

  const toggleBookingType = (bookingTypeId: string) => {
    const current = formData.bookingTypeIds || [];
    if (current.includes(bookingTypeId)) {
      setFormData({ ...formData, bookingTypeIds: current.filter((id) => id !== bookingTypeId) });
    } else {
      setFormData({ ...formData, bookingTypeIds: [...current, bookingTypeId] });
    }
  };

  const getAmenityLabel = (value: string) => {
    const amenity = AMENITY_OPTIONS.find((a) => a.value === value);
    return amenity ? (isRTL ? amenity.labelAr : amenity.labelEn) : value;
  };

  const getBookingTypeName = (bt: BookingType) => {
    return isRTL ? bt.nameAr : bt.nameEn;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('chalets.title')}</h1>
          <p className="text-gray-500">
            {isRTL ? `${chalets.length} شاليه` : `${chalets.length} chalets`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            {isRTL ? 'إضافة شاليه' : 'Add Chalet'}
          </Button>
        </div>
      </div>

      {/* Chalets Grid/List */}
      {chalets.length === 0 ? (
        <EmptyState
          title={isRTL ? 'لا توجد شاليهات' : 'No Chalets'}
          description={isRTL ? 'لم يتم إضافة أي شاليهات بعد' : 'No chalets have been added yet'}
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              {isRTL ? 'إضافة شاليه' : 'Add Chalet'}
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chalets.map((chalet) => (
            <Card key={chalet.id} className="overflow-hidden">
              {/* Image placeholder */}
              <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                {chalet.imageUrl ? (
                  <img
                    src={chalet.imageUrl}
                    alt={isRTL ? chalet.nameAr : chalet.nameEn}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Home className="h-12 w-12 text-primary-400" />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {isRTL ? chalet.nameAr : chalet.nameEn}
                    </h3>
                    <p className="text-sm text-gray-500">{chalet.slug}</p>
                  </div>
                  <Badge variant={chalet.isActive ? 'success' : 'default'} size="sm">
                    {chalet.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'معطل' : 'Inactive')}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {isRTL ? chalet.descriptionAr : chalet.descriptionEn}
                </p>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Users className="h-4 w-4" />
                  <span>{chalet.maxGuests} {isRTL ? 'ضيوف' : 'guests'}</span>
                </div>

                {chalet.amenities && chalet.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {chalet.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="info" size="sm">
                        {getAmenityLabel(amenity)}
                      </Badge>
                    ))}
                    {chalet.amenities.length > 3 && (
                      <Badge variant="default" size="sm">
                        +{chalet.amenities.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {chalet.chaletBookingTypes && chalet.chaletBookingTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {chalet.chaletBookingTypes.map((cbt) => (
                      <Badge key={cbt.bookingType.id} variant="primary" size="sm">
                        {getBookingTypeName(cbt.bookingType)}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-gray-400">
                    {chalet._count?.bookings || 0} {isRTL ? 'حجز' : 'bookings'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(chalet)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(chalet)}>
                      {chalet.isActive ? (
                        <span className="text-green-600">●</span>
                      ) : (
                        <span className="text-gray-400">○</span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(chalet)}
                      disabled={!!chalet._count?.bookings}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                    {isRTL ? 'الشاليه' : 'Chalet'}
                  </th>
                  <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                    {isRTL ? 'السعة' : 'Capacity'}
                  </th>
                  <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                    {isRTL ? 'أنواع الحجز' : 'Booking Types'}
                  </th>
                  <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                    {isRTL ? 'المميزات' : 'Amenities'}
                  </th>
                  <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                    {isRTL ? 'الحالة' : 'Status'}
                  </th>
                  <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                    {isRTL ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {chalets.map((chalet) => (
                  <tr key={chalet.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Home className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium">{isRTL ? chalet.nameAr : chalet.nameEn}</p>
                          <p className="text-sm text-gray-500">{chalet.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="h-4 w-4" />
                        {chalet.maxGuests}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {chalet.chaletBookingTypes?.map((cbt) => (
                          <Badge key={cbt.bookingType.id} variant="primary" size="sm">
                            {getBookingTypeName(cbt.bookingType)}
                          </Badge>
                        ))}
                        {(!chalet.chaletBookingTypes || chalet.chaletBookingTypes.length === 0) && (
                          <span className="text-sm text-gray-400">{isRTL ? 'لا يوجد' : 'None'}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {chalet.amenities?.slice(0, 2).map((amenity) => (
                          <Badge key={amenity} variant="info" size="sm">
                            {getAmenityLabel(amenity)}
                          </Badge>
                        ))}
                        {chalet.amenities && chalet.amenities.length > 2 && (
                          <Badge variant="default" size="sm">
                            +{chalet.amenities.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={chalet.isActive ? 'success' : 'default'}>
                        {chalet.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'معطل' : 'Inactive')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(chalet)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(chalet)}
                          disabled={!!chalet._count?.bookings}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedChalet(null);
          resetForm();
        }}
        title={showEditModal ? (isRTL ? 'تعديل الشاليه' : 'Edit Chalet') : (isRTL ? 'إضافة شاليه جديد' : 'Add New Chalet')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={isRTL ? 'الاسم بالعربي' : 'Arabic Name'}
              value={formData.nameAr || ''}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              required
            />
            <Input
              label={isRTL ? 'الاسم بالإنجليزي' : 'English Name'}
              value={formData.nameEn || ''}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              required
            />
          </div>

          <Input
            label={isRTL ? 'السعة القصوى' : 'Max Guests'}
            type="number"
            value={formData.maxGuests || 4}
            onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 4 })}
            min={1}
            max={20}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {isRTL ? 'الوصف بالعربي' : 'Arabic Description'}
              </label>
              <textarea
                value={formData.descriptionAr || ''}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {isRTL ? 'الوصف بالإنجليزي' : 'English Description'}
              </label>
              <textarea
                value={formData.descriptionEn || ''}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isRTL ? 'المميزات' : 'Amenities'}
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((amenity) => (
                <button
                  key={amenity.value}
                  type="button"
                  onClick={() => toggleAmenity(amenity.value)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    formData.amenities?.includes(amenity.value)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isRTL ? amenity.labelAr : amenity.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Booking Types checkbox group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isRTL ? 'أنواع الحجز المتاحة' : 'Available Booking Types'}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {isRTL ? 'اختر أنواع الحجز التي يمكن حجزها لهذا الشاليه' : 'Select which booking types can be booked for this chalet'}
            </p>
            {bookingTypes.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                {isRTL ? 'لا توجد أنواع حجز. أضف أنواع حجز أولاً.' : 'No booking types available. Add booking types first.'}
              </p>
            ) : (
              <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                {bookingTypes.map((bt) => (
                  <label
                    key={bt.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.bookingTypeIds?.includes(bt.id) || false}
                      onChange={() => toggleBookingType(bt.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      {getBookingTypeName(bt)}
                    </span>
                    {!bt.isActive && (
                      <Badge variant="default" size="sm">
                        {isRTL ? 'معطل' : 'Inactive'}
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedChalet(null);
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
          setSelectedChalet(null);
        }}
        onConfirm={handleDelete}
        title={isRTL ? 'حذف الشاليه' : 'Delete Chalet'}
        description={
          isRTL
            ? `هل أنت متأكد من حذف الشاليه "${selectedChalet?.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete "${selectedChalet?.nameEn}"? This action cannot be undone.`
        }
        confirmLabel={isRTL ? 'حذف' : 'Delete'}
        cancelLabel={isRTL ? 'إلغاء' : 'Cancel'}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
