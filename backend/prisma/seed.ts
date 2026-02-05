import { PrismaClient, VisitType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed Chalets
  const chalets = [
    {
      nameAr: 'شاليه مطل على النخيل',
      nameEn: 'Palm View Chalet',
      slug: 'palm-view',
      maxGuests: 4,
      description: 'أفضل خيار للهدوء مع إطلالة على النخيل',
    },
    {
      nameAr: 'شاليه عائلي',
      nameEn: 'Family Chalet',
      slug: 'family',
      maxGuests: 8,
      description: 'مساحة أوسع مناسبة للعائلات',
    },
    {
      nameAr: 'شاليه خاص',
      nameEn: 'Private Chalet',
      slug: 'private',
      maxGuests: 6,
      description: 'خصوصية أعلى للمناسبات الخاصة',
    },
  ];

  for (const chalet of chalets) {
    await prisma.chalet.upsert({
      where: { slug: chalet.slug },
      update: chalet,
      create: chalet,
    });
  }
  console.log('✓ Chalets seeded');

  // Seed Pricing
  const pricing = [
    { visitType: VisitType.DAY_VISIT, totalPrice: 1400, depositAmount: 700 },
    { visitType: VisitType.OVERNIGHT_STAY, totalPrice: 1400, depositAmount: 700 },
  ];

  for (const price of pricing) {
    await prisma.pricing.upsert({
      where: { visitType: price.visitType },
      update: price,
      create: price,
    });
  }
  console.log('✓ Pricing seeded');

  // Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@farmresort.com';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'changeme123';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Admin',
    },
  });
  console.log(`✓ Admin user seeded (${adminEmail})`);

  // Seed Settings
  const settings = [
    { key: 'whatsapp_number', value: '966500000000', type: 'string' },
    { key: 'resort_name_ar', value: 'منتجع المزرعة', type: 'string' },
    { key: 'resort_name_en', value: 'Farm Resort', type: 'string' },
    { key: 'cancellation_free_hours', value: '48', type: 'number' },
    { key: 'cancellation_partial_hours', value: '24', type: 'number' },
    { key: 'greenapi_enabled', value: 'false', type: 'boolean' },
    { key: 'greenapi_instance_id', value: '', type: 'string' },
    { key: 'greenapi_api_token', value: '', type: 'string' },
    {
      key: 'whatsapp_template_new_booking_ar',
      value: 'مرحباً {customerName}،\nتم استلام طلب حجزك في منتجع المزرعة.\n📅 التاريخ: {date}\n🕐 النوع: {visitType}\n👥 عدد الضيوف: {guests}\n📋 رقم الحجز: {bookingRef}\nسيتم التواصل معك قريباً للتأكيد.',
      type: 'string',
    },
    {
      key: 'whatsapp_template_new_booking_en',
      value: 'Hello {customerName},\nYour booking request has been received at Farm Resort.\n📅 Date: {date}\n🕐 Type: {visitType}\n👥 Guests: {guests}\n📋 Booking Ref: {bookingRef}\nWe will contact you shortly for confirmation.',
      type: 'string',
    },
    {
      key: 'whatsapp_template_confirmed_ar',
      value: 'تم تأكيد حجزك ✅\n📅 {date} - {visitType}\n📋 رقم الحجز: {bookingRef}\nالعربون المطلوب: {depositAmount} ر.س\nنتطلع لاستضافتكم!',
      type: 'string',
    },
    {
      key: 'whatsapp_template_confirmed_en',
      value: 'Your booking is confirmed ✅\n📅 {date} - {visitType}\n📋 Booking Ref: {bookingRef}\nDeposit required: {depositAmount} SAR\nWe look forward to hosting you!',
      type: 'string',
    },
    {
      key: 'whatsapp_template_cancelled_ar',
      value: 'تم إلغاء حجزك ❌\n📋 رقم الحجز: {bookingRef}\n📅 التاريخ: {date}\nالسبب: {reason}\nنأمل أن نراكم قريباً.',
      type: 'string',
    },
    {
      key: 'whatsapp_template_cancelled_en',
      value: 'Your booking has been cancelled ❌\n📋 Booking Ref: {bookingRef}\n📅 Date: {date}\nReason: {reason}\nWe hope to see you soon.',
      type: 'string',
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, type: setting.type },
      create: setting,
    });
  }
  console.log('✓ Settings seeded');

  // Initialize booking counter for current year
  const currentYear = new Date().getFullYear();
  await prisma.bookingCounter.upsert({
    where: { year: currentYear },
    update: {},
    create: { year: currentYear, count: 0 },
  });
  console.log('✓ Booking counter initialized');

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
