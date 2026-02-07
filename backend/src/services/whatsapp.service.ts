import { Booking, VisitType } from '@prisma/client';
import prisma from '../config/database.js';
import { config } from '../config/index.js';
import { mapEnumToLocalized } from '../utils/visitTypeMapper.js';
import { formatDateLocalized } from '../utils/date.js';

interface WhatsAppMessage {
  phone: string;
  message: string;
}

interface BookingWithChalet extends Booking {
  chalet?: {
    nameAr: string;
    nameEn: string;
  } | null;
}

class WhatsAppService {
  private enabled: boolean;
  private instanceId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    this.enabled = config.greenApi.enabled;
    this.instanceId = config.greenApi.instanceId;
    this.apiToken = config.greenApi.apiToken;
    this.baseUrl = `https://api.green-api.com/waInstance${this.instanceId}`;
  }

  /**
   * Check if WhatsApp service is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled && !!this.instanceId && !!this.apiToken;
  }

  /**
   * Send a WhatsApp message
   */
  async sendMessage(phone: string, message: string): Promise<boolean> {
    if (!this.isEnabled()) {
      console.log('[WhatsApp] Service disabled, skipping message');
      return false;
    }

    try {
      // Format phone number (remove + and ensure it starts with country code)
      const formattedPhone = phone.replace(/[^0-9]/g, '');
      const chatId = `${formattedPhone}@c.us`;

      const response = await fetch(
        `${this.baseUrl}/sendMessage/${this.apiToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId,
            message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[WhatsApp] Send failed:', error);
        return false;
      }

      const result = await response.json() as { idMessage?: string };
      console.log('[WhatsApp] Message sent:', result.idMessage);
      return true;
    } catch (error) {
      console.error('[WhatsApp] Error sending message:', error);
      return false;
    }
  }

  /**
   * Get a message template from settings
   */
  async getTemplate(key: string): Promise<string | null> {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }

  /**
   * Replace template variables with actual values
   */
  replaceTemplateVariables(
    template: string,
    booking: BookingWithChalet,
    extra: Record<string, string> = {}
  ): string {
    const lang = booking.language || 'ar';
    const variables: Record<string, string> = {
      customerName: booking.customerName,
      date: formatDateLocalized(booking.date, lang),
      visitType: mapEnumToLocalized(booking.visitType, lang),
      guests: booking.guests.toString(),
      bookingRef: booking.bookingRef,
      ...extra,
    };

    let message = template;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return message;
  }

  /**
   * Send booking confirmation (new booking received)
   */
  async sendBookingConfirmation(booking: BookingWithChalet): Promise<boolean> {
    const lang = booking.language || 'ar';
    const templateKey = `whatsapp_template_new_booking_${lang}`;
    const template = await this.getTemplate(templateKey);

    if (!template) {
      console.warn(`[WhatsApp] Template not found: ${templateKey}`);
      return false;
    }

    const message = this.replaceTemplateVariables(template, booking);
    return this.sendMessage(booking.customerPhone, message);
  }

  /**
   * Send booking approved notification
   */
  async sendBookingApproved(booking: BookingWithChalet): Promise<boolean> {
    const lang = booking.language || 'ar';
    const templateKey = `whatsapp_template_confirmed_${lang}`;
    const template = await this.getTemplate(templateKey);

    if (!template) {
      console.warn(`[WhatsApp] Template not found: ${templateKey}`);
      return false;
    }

    // Get deposit amount from pricing
    const pricing = await prisma.pricing.findFirst({
      where: { visitType: booking.visitType },
    });
    const depositAmount = pricing?.depositAmount?.toString() || '700';

    const message = this.replaceTemplateVariables(template, booking, {
      depositAmount,
    });

    return this.sendMessage(booking.customerPhone, message);
  }

  /**
   * Send booking cancelled notification
   */
  async sendBookingCancelled(
    booking: BookingWithChalet,
    reason: string = ''
  ): Promise<boolean> {
    const lang = booking.language || 'ar';
    const templateKey = `whatsapp_template_cancelled_${lang}`;
    const template = await this.getTemplate(templateKey);

    if (!template) {
      console.warn(`[WhatsApp] Template not found: ${templateKey}`);
      return false;
    }

    const message = this.replaceTemplateVariables(template, booking, {
      reason: reason || (lang === 'ar' ? 'بناءً على طلبكم' : 'As per your request'),
    });

    return this.sendMessage(booking.customerPhone, message);
  }

  /**
   * Send OTP for booking cancellation
   */
  async sendOtp(phone: string, otp: string, lang: string = 'ar'): Promise<boolean> {
    const message =
      lang === 'ar'
        ? `رمز التحقق لإلغاء حجزك: ${otp}\nصالح لمدة 10 دقائق`
        : `Your verification code to cancel your booking: ${otp}\nValid for 10 minutes`;

    return this.sendMessage(phone, message);
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(booking: BookingWithChalet): Promise<boolean> {
    const lang = booking.language || 'ar';

    // Get deposit amount from pricing
    const pricing = await prisma.pricing.findFirst({
      where: { visitType: booking.visitType },
    });
    const depositAmount = pricing?.depositAmount?.toString() || '700';

    const message =
      lang === 'ar'
        ? `تذكير بسداد العربون 💳\n📋 رقم الحجز: ${booking.bookingRef}\n💰 المبلغ: ${depositAmount} ر.س\nيرجى السداد لتأكيد الحجز`
        : `Payment Reminder 💳\n📋 Booking: ${booking.bookingRef}\n💰 Amount: ${depositAmount} SAR\nPlease pay to confirm your booking`;

    return this.sendMessage(booking.customerPhone, message);
  }

  /**
   * Send booking reminder (upcoming visit)
   */
  async sendBookingReminder(booking: BookingWithChalet): Promise<boolean> {
    const lang = booking.language || 'ar';
    const templateKey = `whatsapp_template_reminder_${lang}`;
    const template = await this.getTemplate(templateKey);

    if (!template) {
      // Fallback message if no template is configured
      const message =
        lang === 'ar'
          ? `تذكير بحجزك القادم 📅\nمرحباً ${booking.customerName}\nرقم الحجز: ${booking.bookingRef}\nالتاريخ: ${formatDateLocalized(booking.date, lang)}\nالنوع: ${mapEnumToLocalized(booking.visitType, lang)}\nعدد الضيوف: ${booking.guests}\nنتطلع لاستقبالك!`
          : `Booking Reminder 📅\nHi ${booking.customerName}\nRef: ${booking.bookingRef}\nDate: ${formatDateLocalized(booking.date, lang)}\nType: ${mapEnumToLocalized(booking.visitType, lang)}\nGuests: ${booking.guests}\nWe look forward to welcoming you!`;

      return this.sendMessage(booking.customerPhone, message);
    }

    const message = this.replaceTemplateVariables(template, booking);
    return this.sendMessage(booking.customerPhone, message);
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
