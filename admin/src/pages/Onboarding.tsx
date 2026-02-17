import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { FileText, Eye, AlertCircle, Clock, MapPin, Phone, Globe, User, Hash } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

// --- Types ---

interface OnboardingChalet {
  nameAr: string;
  nameEn: string;
  maxGuests: number;
  description?: string;
  amenities?: string[];
  imageUrl?: string;
}

interface OnboardingSubmission {
  id: string;
  resortNameAr: string;
  resortNameEn: string;
  chalets: OnboardingChalet[];
  dayVisitStart?: string;
  dayVisitEnd?: string;
  overnightStart?: string;
  overnightEnd?: string;
  pricing?: string;
  whatsappNumber: string;
  location?: string;
  cancellationHrs?: number;
  domain?: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  notes?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  galleryUrls?: string[];
  status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
}

// --- API ---

const onboardingApi = {
  list: async () => {
    const res = await apiClient.get('/admin/onboarding');
    return res.data;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await apiClient.patch(`/admin/onboarding/${id}`, { status });
    return res.data;
  },
};

// --- Status helpers ---

const getStatusBadge = (status: OnboardingSubmission['status'], isRTL: boolean) => {
  const map: Record<
    OnboardingSubmission['status'],
    { variant: 'info' | 'warning' | 'success'; label: string }
  > = {
    NEW: { variant: 'info', label: isRTL ? 'جديد' : 'New' },
    IN_PROGRESS: { variant: 'warning', label: isRTL ? 'قيد المعالجة' : 'In Progress' },
    COMPLETED: { variant: 'success', label: isRTL ? 'مكتمل' : 'Completed' },
  };
  return map[status];
};

const statusOptions = (isRTL: boolean) => [
  { value: 'NEW', label: isRTL ? 'جديد' : 'New' },
  { value: 'IN_PROGRESS', label: isRTL ? 'قيد المعالجة' : 'In Progress' },
  { value: 'COMPLETED', label: isRTL ? 'مكتمل' : 'Completed' },
];

// --- Amenity label map ---

const amenityLabels: Record<string, { ar: string; en: string }> = {
  pool: { ar: 'مسبح', en: 'Pool' },
  wifi: { ar: 'واي فاي', en: 'Wi-Fi' },
  bbq: { ar: 'شواية', en: 'BBQ' },
  parking: { ar: 'موقف سيارات', en: 'Parking' },
  ac: { ar: 'تكييف', en: 'A/C' },
  kitchen: { ar: 'مطبخ', en: 'Kitchen' },
  playground: { ar: 'ملعب أطفال', en: 'Playground' },
  football: { ar: 'ملعب كرة قدم', en: 'Football Field' },
  volleyball: { ar: 'ملعب كرة طائرة', en: 'Volleyball Court' },
  garden: { ar: 'حديقة', en: 'Garden' },
  jacuzzi: { ar: 'جاكوزي', en: 'Jacuzzi' },
  sauna: { ar: 'ساونا', en: 'Sauna' },
};

const getAmenityLabel = (key: string, isRTL: boolean): string => {
  const entry = amenityLabels[key];
  if (entry) return isRTL ? entry.ar : entry.en;
  return key;
};

// --- Component ---

export default function Onboarding() {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [selectedSubmission, setSelectedSubmission] = useState<OnboardingSubmission | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['onboarding'],
    queryFn: onboardingApi.list,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      onboardingApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      toast.success(isRTL ? 'تم تحديث الحالة بنجاح' : 'Status updated successfully');
      setSelectedSubmission(null);
    },
    onError: () => {
      toast.error(isRTL ? 'فشل في تحديث الحالة' : 'Failed to update status');
    },
  });

  const submissions: OnboardingSubmission[] = data?.data ?? [];

  const handleOpenDetail = (submission: OnboardingSubmission) => {
    setSelectedSubmission(submission);
    setEditStatus(submission.status);
  };

  const handleSaveStatus = () => {
    if (!selectedSubmission) return;
    if (editStatus === selectedSubmission.status) {
      setSelectedSubmission(null);
      return;
    }
    updateStatusMutation.mutate({ id: selectedSubmission.id, status: editStatus });
  };

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 rounded-lg">
          <FileText className="text-primary-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isRTL ? 'طلبات العملاء' : 'Client Requests'}
          </h1>
          <p className="text-sm text-gray-500">
            {isRTL
              ? 'طلبات إعداد نظام الحجز من العملاء الجدد'
              : 'Booking system setup requests from new clients'}
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-3">
            {isRTL ? 'فشل في تحميل الطلبات' : 'Failed to load submissions'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['onboarding'] })}
          >
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Table */}
      {!error && (
        <Card>
          <CardContent className="p-0">
            {submissions.length === 0 ? (
              <EmptyState
                icon="file"
                title={isRTL ? 'لا توجد طلبات' : 'No Submissions'}
                description={
                  isRTL
                    ? 'لم يتم تقديم أي طلبات إعداد حتى الآن.'
                    : 'No onboarding submissions have been received yet.'
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        {isRTL ? 'اسم المنتجع' : 'Resort Name'}
                      </th>
                      <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        {isRTL ? 'المسؤول' : 'Contact'}
                      </th>
                      <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        {isRTL ? 'الشاليهات' : 'Chalets'}
                      </th>
                      <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        {isRTL ? 'الحالة' : 'Status'}
                      </th>
                      <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        {isRTL ? 'التاريخ' : 'Date'}
                      </th>
                      <th className="text-start py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        {isRTL ? 'إجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {submissions.map((submission) => {
                      const badge = getStatusBadge(submission.status, isRTL);
                      return (
                        <tr
                          key={submission.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleOpenDetail(submission)}
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {submission.resortNameAr}
                            </div>
                            <div className="text-sm text-gray-500">
                              {submission.resortNameEn}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium text-gray-900">
                              {submission.adminName}
                            </div>
                            <div className="text-sm text-gray-500 font-mono" dir="ltr">
                              {submission.adminPhone}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {isRTL
                              ? `${submission.chalets.length} شاليهات`
                              : `${submission.chalets.length} chalet${submission.chalets.length !== 1 ? 's' : ''}`}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={badge.variant} size="sm">
                              {badge.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(submission.createdAt).toLocaleDateString(
                              isRTL ? 'ar-SA' : 'en-US'
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDetail(submission)}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Eye size={16} />
                                {isRTL ? 'عرض' : 'View'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        title={isRTL ? 'تفاصيل الطلب' : 'Submission Details'}
        size="xl"
      >
        {selectedSubmission && (
          <div className="space-y-6">
            {/* Resort Name */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Hash size={14} />
                {isRTL ? 'اسم المنتجع' : 'Resort Name'}
              </div>
              <div className="font-semibold text-gray-900 text-lg">
                {selectedSubmission.resortNameAr}
              </div>
              <div className="text-gray-600">{selectedSubmission.resortNameEn}</div>
            </div>

            {/* Logo */}
            {selectedSubmission.logoUrl && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-2">
                  {isRTL ? 'الشعار' : 'Logo'}
                </div>
                <img
                  src={selectedSubmission.logoUrl}
                  alt="Logo"
                  className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-white p-2"
                />
              </div>
            )}

            {/* Hero Image */}
            {selectedSubmission.heroImageUrl && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-2">
                  {isRTL ? 'الصورة الرئيسية' : 'Hero Image'}
                </div>
                <img
                  src={selectedSubmission.heroImageUrl}
                  alt="Hero"
                  className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}

            {/* Gallery */}
            {selectedSubmission.galleryUrls && selectedSubmission.galleryUrls.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-2">
                  {isRTL ? 'صور المعرض' : 'Gallery'} ({selectedSubmission.galleryUrls.length})
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedSubmission.galleryUrls.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Chalets */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-3">
                {isRTL ? 'الشاليهات' : 'Chalets'} ({selectedSubmission.chalets.length})
              </div>
              <div className="space-y-3">
                {selectedSubmission.chalets.map((chalet, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-900">
                        {isRTL ? chalet.nameAr : chalet.nameEn}
                        <span className="text-gray-400 font-normal mx-2">|</span>
                        <span className="text-gray-500 font-normal">
                          {isRTL ? chalet.nameEn : chalet.nameAr}
                        </span>
                      </div>
                      <Badge variant="default" size="sm">
                        {isRTL
                          ? `${chalet.maxGuests} ضيوف`
                          : `${chalet.maxGuests} guest${chalet.maxGuests !== 1 ? 's' : ''}`}
                      </Badge>
                    </div>
                    {chalet.description && (
                      <p className="text-sm text-gray-500 mt-1">{chalet.description}</p>
                    )}
                    {chalet.imageUrl && (
                      <img
                        src={chalet.imageUrl}
                        alt={isRTL ? chalet.nameAr : chalet.nameEn}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 mt-2"
                      />
                    )}
                    {chalet.amenities && chalet.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {chalet.amenities.map((amenity) => (
                          <Badge key={amenity} variant="primary" size="sm">
                            {getAmenityLabel(amenity, isRTL)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Visit Times */}
            {(selectedSubmission.dayVisitStart || selectedSubmission.overnightStart) && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Clock size={14} />
                  {isRTL ? 'أوقات الزيارات' : 'Visit Times'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSubmission.dayVisitStart && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">
                        {isRTL ? 'زيارة يومية' : 'Day Visit'}
                      </div>
                      <div className="text-sm font-medium" dir="ltr">
                        {selectedSubmission.dayVisitStart} - {selectedSubmission.dayVisitEnd}
                      </div>
                    </div>
                  )}
                  {selectedSubmission.overnightStart && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">
                        {isRTL ? 'إقامة ليلية' : 'Overnight Stay'}
                      </div>
                      <div className="text-sm font-medium" dir="ltr">
                        {selectedSubmission.overnightStart} - {selectedSubmission.overnightEnd}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pricing */}
            {selectedSubmission.pricing && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-2">
                  {isRTL ? 'الأسعار' : 'Pricing'}
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {selectedSubmission.pricing}
                </pre>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp Number */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Phone size={14} />
                  {isRTL ? 'رقم واتساب' : 'WhatsApp Number'}
                </div>
                <div className="font-mono text-sm" dir="ltr">
                  {selectedSubmission.whatsappNumber}
                </div>
              </div>

              {/* Location */}
              {selectedSubmission.location && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <MapPin size={14} />
                    {isRTL ? 'الموقع' : 'Location'}
                  </div>
                  <div className="text-sm">{selectedSubmission.location}</div>
                </div>
              )}

              {/* Cancellation Policy */}
              {selectedSubmission.cancellationHrs != null && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Clock size={14} />
                    {isRTL ? 'سياسة الإلغاء' : 'Cancellation Policy'}
                  </div>
                  <div className="text-sm">
                    {isRTL
                      ? `${selectedSubmission.cancellationHrs} ساعة قبل الموعد`
                      : `${selectedSubmission.cancellationHrs} hours before booking`}
                  </div>
                </div>
              )}

              {/* Domain */}
              {selectedSubmission.domain && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Globe size={14} />
                    {isRTL ? 'الدومين' : 'Domain'}
                  </div>
                  <div className="text-sm font-mono" dir="ltr">
                    {selectedSubmission.domain}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Contact */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <User size={14} />
                {isRTL ? 'بيانات المسؤول' : 'Admin Contact'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">
                    {isRTL ? 'الاسم' : 'Name'}
                  </div>
                  <div className="text-sm font-medium">{selectedSubmission.adminName}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">
                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                  </div>
                  <div className="text-sm font-mono" dir="ltr">
                    {selectedSubmission.adminEmail}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">
                    {isRTL ? 'الهاتف' : 'Phone'}
                  </div>
                  <div className="text-sm font-mono" dir="ltr">
                    {selectedSubmission.adminPhone}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedSubmission.notes && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-2">
                  {isRTL ? 'ملاحظات' : 'Notes'}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedSubmission.notes}
                </p>
              </div>
            )}

            {/* Status Update */}
            <ModalFooter>
              <div className="flex items-center gap-3 w-full">
                <div className="w-48">
                  <Select
                    label={isRTL ? 'الحالة' : 'Status'}
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    options={statusOptions(isRTL)}
                  />
                </div>
                <div className="flex items-center gap-2 mt-auto pt-6">
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedSubmission(null)}
                    disabled={updateStatusMutation.isPending}
                  >
                    {isRTL ? 'إغلاق' : 'Close'}
                  </Button>
                  <Button
                    onClick={handleSaveStatus}
                    loading={updateStatusMutation.isPending}
                    disabled={updateStatusMutation.isPending}
                  >
                    {isRTL ? 'حفظ' : 'Save'}
                  </Button>
                </div>
              </div>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  );
}
