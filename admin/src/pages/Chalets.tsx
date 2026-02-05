import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chaletsApi } from '../api/client';
import { Home, Users, ToggleLeft, ToggleRight } from 'lucide-react';

export default function Chalets() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['chalets'],
    queryFn: chaletsApi.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      chaletsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chalets'] });
    },
  });

  const chalets = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('chalets.title')}</h1>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chalets.map((chalet: any) => (
            <div
              key={chalet.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Home className="text-primary-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {isRTL ? chalet.nameAr : chalet.nameEn}
                      </h3>
                      <p className="text-sm text-gray-500">{chalet.slug}</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      updateMutation.mutate({
                        id: chalet.id,
                        data: { isActive: !chalet.isActive },
                      })
                    }
                    className={`p-1 rounded ${
                      chalet.isActive ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {chalet.isActive ? (
                      <ToggleRight size={28} />
                    ) : (
                      <ToggleLeft size={28} />
                    )}
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-4">{chalet.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Users size={16} />
                    <span>
                      {t('chalets.capacity')}: {chalet.maxGuests}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      chalet.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {chalet.isActive ? t('chalets.active') : t('chalets.inactive')}
                  </span>
                </div>

                {chalet._count && (
                  <p className="text-xs text-gray-400 mt-3">
                    {chalet._count.bookings} {t('sidebar.bookings')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
