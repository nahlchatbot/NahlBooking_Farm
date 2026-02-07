import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/client';
import { Settings as SettingsIcon, Save, MessageSquare, Phone, Shield, FileText, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.list,
  });

  const updateMutation = useMutation({
    mutationFn: (settings: Record<string, unknown>) =>
      settingsApi.bulkUpdate(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
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
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
      </div>
    );
  }

  const whatsappEnabled = formData.greenapi_enabled === 'true';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <SettingsIcon className="text-gray-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isRTL ? 'الإعدادات' : 'Settings'}
            </h1>
            <p className="text-sm text-gray-500">
              {isRTL ? 'إدارة إعدادات المنتجع والتواصل والسياسات' : 'Configure resort contact info, WhatsApp, and policies'}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save size={18} />
          {t('common.save')}
        </Button>
      </div>

      {/* Contact Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone size={20} className="text-blue-500" />
            {isRTL ? 'معلومات التواصل' : 'Contact Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={isRTL ? 'رقم واتساب الحجز' : 'Booking WhatsApp Number'}
              value={formData.whatsapp_number || ''}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              hint={isRTL ? 'أدخل الرقم مع رمز الدولة، مثال: 966501234567' : 'Enter with country code, e.g. 966501234567'}
              placeholder="966501234567"
              dir="ltr"
            />
            <Input
              label={isRTL ? 'اسم المنتجع (عربي)' : 'Resort Name (Arabic)'}
              value={formData.resort_name_ar || ''}
              onChange={(e) => handleChange('resort_name_ar', e.target.value)}
              hint={isRTL ? 'يظهر في رسائل تأكيد الحجز' : 'Shown on booking confirmation messages'}
            />
            <Input
              label={isRTL ? 'اسم المنتجع (إنجليزي)' : 'Resort Name (English)'}
              value={formData.resort_name_en || ''}
              onChange={(e) => handleChange('resort_name_en', e.target.value)}
              hint={isRTL ? 'يظهر في رسائل التأكيد بالإنجليزية' : 'Shown on English confirmation messages'}
            />
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp / GreenAPI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={20} className="text-green-500" />
            {isRTL ? 'إعدادات واتساب' : 'WhatsApp Settings'}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ms-2 ${whatsappEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`w-2 h-2 rounded-full ${whatsappEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              {whatsappEnabled ? (isRTL ? 'مفعّل' : 'Active') : (isRTL ? 'معطّل' : 'Inactive')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={isRTL ? 'معرّف الجلسة' : 'Instance ID'}
              value={formData.greenapi_instance_id || ''}
              onChange={(e) => handleChange('greenapi_instance_id', e.target.value)}
              hint={isRTL ? 'تجده في لوحة تحكم GreenAPI' : 'Find this in your GreenAPI dashboard'}
              dir="ltr"
            />
            <Input
              label={isRTL ? 'مفتاح API' : 'API Token'}
              type="password"
              value={formData.greenapi_api_token || ''}
              onChange={(e) => handleChange('greenapi_api_token', e.target.value)}
              hint={isRTL ? 'مفتاح الوصول من GreenAPI' : 'Access token from GreenAPI'}
              dir="ltr"
            />
          </div>
          <label className="flex items-center gap-3 mt-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={whatsappEnabled}
              onChange={(e) =>
                handleChange('greenapi_enabled', e.target.checked ? 'true' : 'false')
              }
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                {isRTL ? 'تفعيل إشعارات واتساب' : 'Enable WhatsApp Notifications'}
              </span>
              <p className="text-xs text-gray-500">
                {isRTL ? 'إرسال تأكيد الحجز والإلغاء تلقائياً عبر واتساب' : 'Auto-send booking confirmations and cancellations via WhatsApp'}
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} className="text-orange-500" />
            {isRTL ? 'سياسة الإلغاء' : 'Cancellation Policy'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={isRTL ? 'إلغاء مجاني (ساعات قبل الحجز)' : 'Free Cancellation (hours before)'}
              type="number"
              min={0}
              value={formData.cancellation_free_hours || '48'}
              onChange={(e) => handleChange('cancellation_free_hours', e.target.value)}
              hint={isRTL ? 'عدد الساعات التي يمكن فيها الإلغاء مجاناً' : 'Hours before booking date for free cancellation'}
            />
            <Input
              label={isRTL ? 'إلغاء جزئي (ساعات قبل الحجز)' : 'Partial Refund (hours before)'}
              type="number"
              min={0}
              value={formData.cancellation_partial_hours || '24'}
              onChange={(e) => handleChange('cancellation_partial_hours', e.target.value)}
              hint={isRTL ? 'ساعات قبل الموعد للاسترداد الجزئي' : 'Hours before booking for partial refund'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} className="text-purple-500" />
            {isRTL ? 'قوالب رسائل واتساب' : 'WhatsApp Message Templates'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* How it works explanation */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
            <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">
                {isRTL ? 'كيف تعمل القوالب؟' : 'How do templates work?'}
              </p>
              <p className="text-blue-700">
                {isRTL
                  ? 'عندما يتم إنشاء حجز أو تأكيده أو إلغاؤه، يتم إرسال رسالة واتساب تلقائياً للعميل. استخدم المتغيرات أدناه ليتم استبدالها ببيانات الحجز الفعلية.'
                  : 'When a booking is created, confirmed, or cancelled, a WhatsApp message is automatically sent to the customer. Use the variables below — they will be replaced with actual booking data.'}
              </p>
            </div>
          </div>

          {/* Variables reference */}
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <p className="text-sm font-medium text-purple-800 mb-3">
              {isRTL ? 'المتغيرات المتاحة (انسخ والصق في القالب):' : 'Available variables (copy & paste into templates):'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { var: '{customerName}', desc: isRTL ? 'اسم العميل' : 'Customer name' },
                { var: '{date}', desc: isRTL ? 'تاريخ الحجز' : 'Booking date' },
                { var: '{visitType}', desc: isRTL ? 'نوع الزيارة (نهاري/ليلي)' : 'Visit type (Day/Night)' },
                { var: '{guests}', desc: isRTL ? 'عدد الضيوف' : 'Number of guests' },
                { var: '{bookingRef}', desc: isRTL ? 'رقم الحجز' : 'Booking reference' },
                { var: '{depositAmount}', desc: isRTL ? 'مبلغ العربون' : 'Deposit amount' },
                { var: '{reason}', desc: isRTL ? 'سبب الإلغاء (للإلغاء فقط)' : 'Cancellation reason (cancel only)' },
              ].map(({ var: v, desc }) => (
                <div key={v} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100">
                  <code className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-mono flex-shrink-0">
                    {v}
                  </code>
                  <span className="text-xs text-gray-600">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* New Booking Template */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <h4 className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {isRTL ? 'رسالة حجز جديد' : 'New Booking Message'}
              </h4>
              <p className="text-xs text-green-700 mb-3">
                {isRTL ? 'تُرسل تلقائياً عند إنشاء حجز جديد من الموقع' : 'Sent automatically when a new booking is made from the website'}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isRTL ? 'النسخة العربية' : 'Arabic version'}
                  </label>
                  <textarea
                    value={formData.whatsapp_template_new_booking_ar || ''}
                    onChange={(e) => handleChange('whatsapp_template_new_booking_ar', e.target.value)}
                    rows={4}
                    placeholder={isRTL
                      ? 'مثال: مرحباً {customerName}! تم استلام حجزك 📋\nرقم الحجز: {bookingRef}\nالتاريخ: {date}\nالنوع: {visitType}\nسيتم تأكيد حجزك قريباً'
                      : 'Example: مرحباً {customerName}! تم استلام حجزك...'}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 transition-all text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isRTL ? 'النسخة الإنجليزية' : 'English version'}
                  </label>
                  <textarea
                    value={formData.whatsapp_template_new_booking_en || ''}
                    onChange={(e) => handleChange('whatsapp_template_new_booking_en', e.target.value)}
                    rows={4}
                    dir="ltr"
                    placeholder="Example: Hi {customerName}! Your booking has been received 📋&#10;Ref: {bookingRef}&#10;Date: {date}&#10;Type: {visitType}&#10;We'll confirm shortly!"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 transition-all text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Confirmed Template */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h4 className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {isRTL ? 'رسالة تأكيد الحجز' : 'Booking Confirmed Message'}
              </h4>
              <p className="text-xs text-blue-700 mb-3">
                {isRTL ? 'تُرسل تلقائياً عند تأكيد الحجز من لوحة التحكم' : 'Sent automatically when you confirm a booking from the admin panel'}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isRTL ? 'النسخة العربية' : 'Arabic version'}
                  </label>
                  <textarea
                    value={formData.whatsapp_template_confirmed_ar || ''}
                    onChange={(e) => handleChange('whatsapp_template_confirmed_ar', e.target.value)}
                    rows={4}
                    placeholder={isRTL
                      ? 'مثال: تم تأكيد حجزك ✅\nرقم الحجز: {bookingRef}\nالتاريخ: {date}\nالعربون: {depositAmount} ر.س\nنتطلع لاستقبالك!'
                      : 'Example: تم تأكيد حجزك ✅...'}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 transition-all text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isRTL ? 'النسخة الإنجليزية' : 'English version'}
                  </label>
                  <textarea
                    value={formData.whatsapp_template_confirmed_en || ''}
                    onChange={(e) => handleChange('whatsapp_template_confirmed_en', e.target.value)}
                    rows={4}
                    dir="ltr"
                    placeholder="Example: Your booking is confirmed! ✅&#10;Ref: {bookingRef}&#10;Date: {date}&#10;Deposit: {depositAmount} SAR&#10;We look forward to welcoming you!"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 transition-all text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Cancelled Template */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <h4 className="text-sm font-semibold text-red-800 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {isRTL ? 'رسالة إلغاء الحجز' : 'Booking Cancelled Message'}
              </h4>
              <p className="text-xs text-red-700 mb-3">
                {isRTL ? 'تُرسل تلقائياً عند إلغاء الحجز من لوحة التحكم' : 'Sent automatically when you cancel a booking from the admin panel'}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isRTL ? 'النسخة العربية' : 'Arabic version'}
                  </label>
                  <textarea
                    value={formData.whatsapp_template_cancelled_ar || ''}
                    onChange={(e) => handleChange('whatsapp_template_cancelled_ar', e.target.value)}
                    rows={4}
                    placeholder={isRTL
                      ? 'مثال: تم إلغاء حجزك ❌\nرقم الحجز: {bookingRef}\nالسبب: {reason}\nللاستفسار تواصل معنا'
                      : 'Example: تم إلغاء حجزك ❌...'}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 transition-all text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isRTL ? 'النسخة الإنجليزية' : 'English version'}
                  </label>
                  <textarea
                    value={formData.whatsapp_template_cancelled_en || ''}
                    onChange={(e) => handleChange('whatsapp_template_cancelled_en', e.target.value)}
                    rows={4}
                    dir="ltr"
                    placeholder="Example: Your booking has been cancelled ❌&#10;Ref: {bookingRef}&#10;Reason: {reason}&#10;Contact us for any questions."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 transition-all text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Reminder Template */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <h4 className="text-sm font-semibold text-yellow-800 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                {isRTL ? 'رسالة تذكير بالحجز' : 'Booking Reminder Message'}
              </h4>
              <p className="text-xs text-yellow-700 mb-3">
                {isRTL ? 'تُرسل يدوياً عند الضغط على "إرسال تذكير" في صفحة الحجوزات' : 'Sent manually when you click "Send Reminder" on the Bookings page'}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isRTL ? 'النسخة العربية' : 'Arabic version'}
                  </label>
                  <textarea
                    value={formData.whatsapp_template_reminder_ar || ''}
                    onChange={(e) => handleChange('whatsapp_template_reminder_ar', e.target.value)}
                    rows={4}
                    placeholder={isRTL
                      ? 'مثال: تذكير بحجزك القادم 📅\nمرحباً {customerName}\nرقم الحجز: {bookingRef}\nالتاريخ: {date}\nالنوع: {visitType}\nنتطلع لاستقبالك!'
                      : 'Example: تذكير بحجزك القادم 📅...'}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 transition-all text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isRTL ? 'النسخة الإنجليزية' : 'English version'}
                  </label>
                  <textarea
                    value={formData.whatsapp_template_reminder_en || ''}
                    onChange={(e) => handleChange('whatsapp_template_reminder_en', e.target.value)}
                    rows={4}
                    dir="ltr"
                    placeholder="Example: Booking Reminder 📅&#10;Hi {customerName}&#10;Ref: {bookingRef}&#10;Date: {date}&#10;Type: {visitType}&#10;We look forward to welcoming you!"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 transition-all text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
