import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blackoutApi } from '../api/client';
import { Plus, Trash2 } from 'lucide-react';

export default function BlackoutDates() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState('');
  const [newReason, setNewReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['blackout-dates'],
    queryFn: () => blackoutApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: blackoutApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blackout-dates'] });
      setNewDate('');
      setNewType('');
      setNewReason('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: blackoutApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blackout-dates'] });
    },
  });

  const handleAdd = () => {
    if (!newDate) return;
    createMutation.mutate({
      date: newDate,
      visitType: newType || undefined,
      reason: newReason || undefined,
    });
  };

  const blackoutDates = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('blackout.title')}</h1>

      {/* Add new date */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Plus size={20} />
          {t('blackout.addDate')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('blackout.both')}</option>
            <option value="زيارة نهارية">{t('bookings.dayVisit')}</option>
            <option value="إقامة ليلية">{t('bookings.overnightStay')}</option>
          </select>
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder={t('blackout.reason')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newDate || createMutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {t('blackout.addDate')}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : blackoutDates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('common.noData')}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-start py-3 px-4 font-medium text-gray-500">
                  {t('blackout.date')}
                </th>
                <th className="text-start py-3 px-4 font-medium text-gray-500">
                  {t('blackout.type')}
                </th>
                <th className="text-start py-3 px-4 font-medium text-gray-500">
                  {t('blackout.reason')}
                </th>
                <th className="text-start py-3 px-4 font-medium text-gray-500">
                  {t('bookings.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {blackoutDates.map((item: any) => (
                <tr key={item.id} className="border-t">
                  <td className="py-3 px-4">
                    {new Date(item.date).toLocaleDateString(
                      isRTL ? 'ar-SA' : 'en-US'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {item.visitType === 'DAY_VISIT'
                      ? t('bookings.dayVisit')
                      : item.visitType === 'OVERNIGHT_STAY'
                      ? t('bookings.overnightStay')
                      : t('blackout.both')}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {item.reason || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title={t('blackout.removeDate')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
