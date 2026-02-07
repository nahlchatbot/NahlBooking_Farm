import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingApi } from '../api/client';
import { DollarSign, Save, Sun, Moon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

interface PricingItem {
  id: string;
  visitType: 'DAY_VISIT' | 'OVERNIGHT';
  totalPrice: number;
  depositAmount: number;
}

export default function Pricing() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: pricingApi.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { totalPrice: number; depositAmount: number } }) =>
      pricingApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      toast.success(isRTL ? 'تم تحديث الأسعار بنجاح' : 'Pricing updated successfully');
    },
    onError: () => {
      toast.error(isRTL ? 'فشل في تحديث الأسعار' : 'Failed to update pricing');
    },
  });

  const pricing: PricingItem[] = data?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard className="h-72" />
          <SkeletonCard className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <DollarSign className="text-green-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isRTL ? 'إدارة الأسعار' : 'Pricing Management'}
          </h1>
          <p className="text-sm text-gray-500">
            {isRTL ? 'تعيين أسعار ومبالغ العربون لكل نوع زيارة' : 'Set prices and deposit amounts for each visit type'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pricing.map((price) => (
          <PricingCard
            key={price.id}
            price={price}
            onSave={(data) => updateMutation.mutate({ id: price.id, data })}
            isPending={updateMutation.isPending}
            isRTL={isRTL}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

function PricingCard({
  price,
  onSave,
  isPending,
  isRTL,
  t,
}: {
  price: PricingItem;
  onSave: (data: { totalPrice: number; depositAmount: number }) => void;
  isPending: boolean;
  isRTL: boolean;
  t: (key: string) => string;
}) {
  const [totalPrice, setTotalPrice] = useState(price.totalPrice);
  const [depositAmount, setDepositAmount] = useState(price.depositAmount);

  useEffect(() => {
    setTotalPrice(price.totalPrice);
    setDepositAmount(price.depositAmount);
  }, [price.totalPrice, price.depositAmount]);

  const isDay = price.visitType === 'DAY_VISIT';
  const Icon = isDay ? Sun : Moon;
  const accentColor = isDay ? 'blue' : 'purple';
  const depositPercent = totalPrice > 0 ? Math.round((depositAmount / totalPrice) * 100) : 0;

  const handleSave = () => {
    onSave({ totalPrice, depositAmount });
  };

  return (
    <Card className="overflow-hidden">
      {/* Color header strip */}
      <div className={`h-2 ${isDay ? 'bg-blue-500' : 'bg-purple-500'}`} />
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-${accentColor}-100`}>
            <Icon size={22} className={`text-${accentColor}-600`} />
          </div>
          <div>
            <span className="text-lg">
              {isDay ? t('bookings.dayVisit') : t('bookings.overnightStay')}
            </span>
            <p className="text-sm font-normal text-gray-500 mt-0.5">
              {isDay
                ? (isRTL ? 'زيارة نهارية بدون مبيت' : 'Daytime visit without overnight stay')
                : (isRTL ? 'إقامة ليلية كاملة' : 'Full overnight accommodation')}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            label={isRTL ? 'السعر الإجمالي (ريال)' : `Total Price (${t('pricing.sar')})`}
            type="number"
            min={0}
            value={totalPrice}
            onChange={(e) => setTotalPrice(parseInt(e.target.value) || 0)}
            hint={isRTL ? 'السعر الكامل للحجز بالريال السعودي' : 'Full booking price in SAR'}
          />

          <Input
            label={isRTL ? 'مبلغ العربون (ريال)' : `Deposit Amount (${t('pricing.sar')})`}
            type="number"
            min={0}
            value={depositAmount}
            onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
            hint={isRTL ? 'المبلغ المطلوب دفعه مقدماً عند الحجز' : 'Amount required upfront when booking'}
          />

          {/* Deposit percentage indicator */}
          {totalPrice > 0 && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-600">
                    {isRTL ? 'نسبة العربون' : 'Deposit ratio'}
                  </span>
                  <span className={`text-sm font-bold ${depositPercent > 100 ? 'text-red-600' : `text-${accentColor}-600`}`}>
                    {depositPercent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      depositPercent > 100 ? 'bg-red-500' : isDay ? 'bg-blue-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(depositPercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {depositAmount > totalPrice && (
            <p className="text-sm text-red-600">
              {isRTL ? 'العربون أكبر من السعر الإجمالي' : 'Deposit exceeds total price'}
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={isPending || depositAmount > totalPrice}
            className="w-full"
          >
            <Save size={18} />
            {t('common.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
