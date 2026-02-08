import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { DollarSign, Save, Grid3X3, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────

interface Chalet {
  id: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}

interface BookingType {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  isActive: boolean;
}

interface MatrixPricing {
  id?: string;
  chaletId: string;
  bookingTypeId: string;
  totalPrice: number;
  depositAmount: number;
}

// Key for the local editing state per cell
type CellKey = `${string}_${string}`;

interface CellState {
  totalPrice: number;
  depositAmount: number;
  dirty: boolean;
}

// ─── Main Component ──────────────────────────────────────────────────

export default function Pricing() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  // ── Queries ──────────────────────────────────────────────────────

  const chaletsQuery = useQuery({
    queryKey: ['chalets'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/chalets');
      return res.data;
    },
  });

  const bookingTypesQuery = useQuery({
    queryKey: ['booking-types'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/booking-types');
      return res.data;
    },
  });

  const matrixQuery = useQuery({
    queryKey: ['pricing-matrix'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/pricing/matrix');
      return res.data;
    },
  });

  // ── Derived data ─────────────────────────────────────────────────

  const chalets: Chalet[] = chaletsQuery.data?.data ?? [];
  const bookingTypes: BookingType[] = bookingTypesQuery.data?.data?.bookingTypes ?? [];
  const matrixPricings: MatrixPricing[] = matrixQuery.data?.data?.pricings ?? [];

  // ── Local cell state ─────────────────────────────────────────────

  const [cells, setCells] = useState<Record<CellKey, CellState>>({});
  const [savingCells, setSavingCells] = useState<Set<CellKey>>(new Set());

  // Build a lookup from the fetched matrix pricings
  const buildCellKey = (chaletId: string, bookingTypeId: string): CellKey =>
    `${chaletId}_${bookingTypeId}`;

  // Sync cells from server data whenever matrixPricings changes
  useEffect(() => {
    if (!chalets.length || !bookingTypes.length) return;

    const newCells: Record<CellKey, CellState> = {};
    for (const chalet of chalets) {
      for (const bt of bookingTypes) {
        const key = buildCellKey(chalet.id, bt.id);
        const existing = matrixPricings.find(
          (p) => p.chaletId === chalet.id && p.bookingTypeId === bt.id
        );
        // Preserve dirty edits that haven't been saved yet
        if (cells[key]?.dirty) {
          newCells[key] = cells[key];
        } else {
          newCells[key] = {
            totalPrice: existing?.totalPrice ?? 0,
            depositAmount: existing?.depositAmount ?? 0,
            dirty: false,
          };
        }
      }
    }
    setCells(newCells);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrixPricings, chalets, bookingTypes]);

  // ── Cell update handler ──────────────────────────────────────────

  const updateCell = useCallback(
    (key: CellKey, field: 'totalPrice' | 'depositAmount', value: number) => {
      setCells((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value,
          dirty: true,
        },
      }));
    },
    []
  );

  // ── Save mutation (matrix) ───────────────────────────────────────

  const matrixSaveMutation = useMutation({
    mutationFn: async (payload: {
      chaletId: string;
      bookingTypeId: string;
      totalPrice: number;
      depositAmount: number;
    }) => {
      const res = await apiClient.post('/admin/pricing/matrix', payload);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      const key = buildCellKey(variables.chaletId, variables.bookingTypeId);
      setCells((prev) => ({
        ...prev,
        [key]: { ...prev[key], dirty: false },
      }));
      queryClient.invalidateQueries({ queryKey: ['pricing-matrix'] });
      toast.success(isRTL ? 'تم حفظ السعر بنجاح' : 'Price saved successfully');
    },
    onError: () => {
      toast.error(isRTL ? 'فشل في حفظ السعر' : 'Failed to save price');
    },
    onSettled: (_data, _error, variables) => {
      const key = buildCellKey(variables.chaletId, variables.bookingTypeId);
      setSavingCells((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    },
  });

  const handleSaveCell = (chaletId: string, bookingTypeId: string) => {
    const key = buildCellKey(chaletId, bookingTypeId);
    const cell = cells[key];
    if (!cell) return;

    setSavingCells((prev) => new Set(prev).add(key));
    matrixSaveMutation.mutate({
      chaletId,
      bookingTypeId,
      totalPrice: cell.totalPrice,
      depositAmount: cell.depositAmount,
    });
  };

  // ── Loading state ────────────────────────────────────────────────

  const isLoading =
    chaletsQuery.isLoading || bookingTypesQuery.isLoading || matrixQuery.isLoading;

  const hasError =
    chaletsQuery.isError || bookingTypesQuery.isError || matrixQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <DollarSign className="text-yellow-600" size={24} />
          </div>
          <div>
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-72 bg-gray-200 rounded animate-pulse mt-1.5" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-48" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <PageHeader isRTL={isRTL} />
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 bg-red-100 rounded-full mb-4">
                <AlertCircle className="text-red-600" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {isRTL ? 'حدث خطأ في تحميل البيانات' : 'Failed to load data'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {isRTL
                  ? 'يرجى المحاولة مرة أخرى'
                  : 'Please try again'}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  chaletsQuery.refetch();
                  bookingTypesQuery.refetch();
                  matrixQuery.refetch();
                }}
              >
                <RefreshCw size={16} />
                {isRTL ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Currency suffix ──────────────────────────────────────────────

  const currencySuffix = isRTL ? 'ر.س' : 'SAR';

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader isRTL={isRTL} />

      {/* Pricing Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 size={20} className="text-yellow-600" />
            {isRTL ? 'مصفوفة الأسعار' : 'Pricing Matrix'}
            <Badge variant="info" size="sm" className={isRTL ? 'mr-2' : 'ml-2'}>
              {chalets.length} x {bookingTypes.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {chalets.length === 0 || bookingTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="p-3 bg-gray-100 rounded-full mb-4">
                <Grid3X3 className="text-gray-400" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {isRTL ? 'لا توجد بيانات كافية' : 'Insufficient Data'}
              </h3>
              <p className="text-sm text-gray-500 max-w-md">
                {chalets.length === 0
                  ? (isRTL ? 'يرجى إضافة شاليهات أولاً من صفحة الشاليهات' : 'Please add chalets first from the Chalets page')
                  : (isRTL ? 'يرجى إضافة أنواع الحجز أولاً' : 'Please add booking types first')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-border">
                    <th
                      className={`px-4 py-3 text-sm font-semibold text-gray-700 ${
                        isRTL ? 'text-right' : 'text-left'
                      } min-w-[160px] sticky ${isRTL ? 'right-0' : 'left-0'} bg-gray-50 z-10`}
                    >
                      {isRTL ? 'الشاليه' : 'Chalet'}
                    </th>
                    {bookingTypes.map((bt) => (
                      <th
                        key={bt.id}
                        className="px-4 py-3 text-sm font-semibold text-gray-700 text-center min-w-[240px]"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{isRTL ? bt.nameAr : bt.nameEn}</span>
                          {!bt.isActive && (
                            <Badge variant="warning" size="sm">
                              {isRTL ? 'غير مفعل' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {chalets.map((chalet, chaletIdx) => (
                    <tr
                      key={chalet.id}
                      className={chaletIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    >
                      <td
                        className={`px-4 py-4 sticky ${isRTL ? 'right-0' : 'left-0'} z-10 ${
                          chaletIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 text-sm">
                            {isRTL ? chalet.nameAr : chalet.nameEn}
                          </span>
                          {!chalet.isActive && (
                            <Badge variant="warning" size="sm">
                              {isRTL ? 'غير مفعل' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                      </td>
                      {bookingTypes.map((bt) => {
                        const key = buildCellKey(chalet.id, bt.id);
                        const cell = cells[key];
                        const isSaving = savingCells.has(key);
                        const depositExceedsTotal =
                          cell && cell.depositAmount > cell.totalPrice && cell.totalPrice > 0;

                        return (
                          <td key={bt.id} className="px-3 py-3">
                            <div className="space-y-2">
                              {/* Total Price */}
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-500 mb-0.5">
                                    {isRTL ? 'السعر الإجمالي' : 'Total Price'}
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min={0}
                                      value={cell?.totalPrice ?? 0}
                                      onChange={(e) =>
                                        updateCell(key, 'totalPrice', parseInt(e.target.value) || 0)
                                      }
                                      className={`w-full px-3 py-1.5 text-sm border rounded-lg transition-all duration-200
                                        focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                                        ${cell?.dirty ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                                    />
                                    <span
                                      className={`absolute top-1/2 -translate-y-1/2 text-xs text-gray-400 ${
                                        isRTL ? 'left-2.5' : 'right-2.5'
                                      }`}
                                    >
                                      {currencySuffix}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Deposit Amount */}
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-500 mb-0.5">
                                    {isRTL ? 'العربون' : 'Deposit'}
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min={0}
                                      value={cell?.depositAmount ?? 0}
                                      onChange={(e) =>
                                        updateCell(key, 'depositAmount', parseInt(e.target.value) || 0)
                                      }
                                      className={`w-full px-3 py-1.5 text-sm border rounded-lg transition-all duration-200
                                        focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                                        ${depositExceedsTotal
                                          ? 'border-red-400 bg-red-50'
                                          : cell?.dirty
                                            ? 'border-yellow-400 bg-yellow-50'
                                            : 'border-gray-300 bg-white hover:border-gray-400'}`}
                                    />
                                    <span
                                      className={`absolute top-1/2 -translate-y-1/2 text-xs text-gray-400 ${
                                        isRTL ? 'left-2.5' : 'right-2.5'
                                      }`}
                                    >
                                      {currencySuffix}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Deposit exceeds warning */}
                              {depositExceedsTotal && (
                                <p className="text-xs text-red-600">
                                  {isRTL ? 'العربون يتجاوز السعر' : 'Deposit exceeds price'}
                                </p>
                              )}

                              {/* Save button */}
                              <Button
                                size="sm"
                                variant={cell?.dirty ? 'primary' : 'secondary'}
                                className="w-full"
                                disabled={
                                  !cell?.dirty ||
                                  isSaving ||
                                  (depositExceedsTotal ?? false)
                                }
                                loading={isSaving}
                                onClick={() => handleSaveCell(chalet.id, bt.id)}
                              >
                                <Save size={14} />
                                {isRTL ? 'حفظ' : 'Save'}
                              </Button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

// ─── Page Header ─────────────────────────────────────────────────────

function PageHeader({ isRTL }: { isRTL: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-yellow-100 rounded-lg">
        <DollarSign className="text-yellow-600" size={24} />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          {isRTL ? 'إدارة الأسعار' : 'Pricing Management'}
        </h1>
        <p className="text-sm text-gray-500">
          {isRTL
            ? 'تعيين أسعار ومبالغ العربون لكل شاليه ونوع حجز'
            : 'Set prices and deposit amounts per chalet and booking type'}
        </p>
      </div>
    </div>
  );
}

