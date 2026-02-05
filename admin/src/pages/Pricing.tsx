import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingApi } from '../api/client';
import { DollarSign, Save } from 'lucide-react';

export default function Pricing() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: pricingApi.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      pricingApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });

  const pricing = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('pricing.title')}</h1>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pricing.map((price: any) => (
            <PricingCard
              key={price.id}
              price={price}
              onSave={(data) => updateMutation.mutate({ id: price.id, data })}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PricingCard({
  price,
  onSave,
  t,
}: {
  price: any;
  onSave: (data: any) => void;
  t: any;
}) {
  const [totalPrice, setTotalPrice] = useState(price.totalPrice);
  const [depositAmount, setDepositAmount] = useState(price.depositAmount);

  const handleSave = () => {
    onSave({ totalPrice, depositAmount });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gold-100 rounded-lg">
          <DollarSign className="text-gold-600" size={24} />
        </div>
        <h3 className="font-semibold text-lg">
          {price.visitType === 'DAY_VISIT'
            ? t('bookings.dayVisit')
            : t('bookings.overnightStay')}
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('pricing.total')} ({t('pricing.sar')})
          </label>
          <input
            type="number"
            value={totalPrice}
            onChange={(e) => setTotalPrice(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('pricing.deposit')} ({t('pricing.sar')})
          </label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Save size={18} />
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}
