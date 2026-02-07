import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/client';
import { Settings as SettingsIcon, Save, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.list,
  });

  const isRTL = i18n.language === 'ar';

  const updateMutation = useMutation({
    mutationFn: (settings: Record<string, unknown>) =>
      settingsApi.bulkUpdate(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(isRTL ? 'تم حفظ الإعدادات' : 'Settings saved');
    },
    onError: () => {
      toast.error(isRTL ? 'فشل في حفظ الإعدادات' : 'Failed to save settings');
    },
  });

  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data?.data?.settings) {
      setFormData(data.data.settings);
    }
  }, [data]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('settings.title')}</h1>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {t('common.save')}
        </button>
      </div>

      {/* Contact Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <SettingsIcon size={20} />
          {t('settings.contact')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.whatsapp')}
            </label>
            <input
              type="text"
              value={formData.whatsapp_number || ''}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="966500000000"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resort Name (AR)
            </label>
            <input
              type="text"
              value={formData.resort_name_ar || ''}
              onChange={(e) => handleChange('resort_name_ar', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resort Name (EN)
            </label>
            <input
              type="text"
              value={formData.resort_name_en || ''}
              onChange={(e) => handleChange('resort_name_en', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* GreenAPI Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <MessageSquare size={20} />
          {t('settings.greenapi')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instance ID
            </label>
            <input
              type="text"
              value={formData.greenapi_instance_id || ''}
              onChange={(e) => handleChange('greenapi_instance_id', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Token
            </label>
            <input
              type="password"
              value={formData.greenapi_api_token || ''}
              onChange={(e) => handleChange('greenapi_api_token', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              dir="ltr"
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.greenapi_enabled === 'true'}
                onChange={(e) =>
                  handleChange('greenapi_enabled', e.target.checked ? 'true' : 'false')
                }
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable WhatsApp Notifications
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold mb-4">Cancellation Policy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Free Cancellation (hours before)
            </label>
            <input
              type="number"
              value={formData.cancellation_free_hours || '48'}
              onChange={(e) => handleChange('cancellation_free_hours', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Partial Refund (hours before)
            </label>
            <input
              type="number"
              value={formData.cancellation_partial_hours || '24'}
              onChange={(e) => handleChange('cancellation_partial_hours', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Message Templates */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold mb-4">{t('settings.templates')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Booking Template (Arabic)
            </label>
            <textarea
              value={formData.whatsapp_template_new_booking_ar || ''}
              onChange={(e) =>
                handleChange('whatsapp_template_new_booking_ar', e.target.value)
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Booking Template (English)
            </label>
            <textarea
              value={formData.whatsapp_template_new_booking_en || ''}
              onChange={(e) =>
                handleChange('whatsapp_template_new_booking_en', e.target.value)
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              dir="ltr"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Available variables: {'{customerName}'}, {'{date}'}, {'{visitType}'}, {'{guests}'}, {'{bookingRef}'}, {'{depositAmount}'}
        </p>
      </div>
    </div>
  );
}
