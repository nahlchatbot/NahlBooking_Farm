import { PrismaClient, VisitType, AdminRole } from '@prisma/client';
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
      descriptionAr: 'أفضل خيار للهدوء مع إطلالة على النخيل',
      descriptionEn: 'Best choice for tranquility with a palm view',
      amenities: ['wifi', 'pool', 'bbq', 'parking'],
      sortOrder: 1,
    },
    {
      nameAr: 'شاليه عائلي',
      nameEn: 'Family Chalet',
      slug: 'family',
      maxGuests: 8,
      descriptionAr: 'مساحة أوسع مناسبة للعائلات',
      descriptionEn: 'Spacious area suitable for families',
      amenities: ['wifi', 'pool', 'bbq', 'parking', 'playground'],
      sortOrder: 2,
    },
    {
      nameAr: 'شاليه خاص',
      nameEn: 'Private Chalet',
      slug: 'private',
      maxGuests: 6,
      descriptionAr: 'خصوصية أعلى للمناسبات الخاصة',
      descriptionEn: 'Higher privacy for special occasions',
      amenities: ['wifi', 'pool', 'bbq', 'parking', 'jacuzzi'],
      sortOrder: 3,
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

  // Seed Booking Types
  const bookingTypes = [
    { nameAr: 'زيارة نهارية', nameEn: 'Day Visit', slug: 'day-visit', startTime: '08:00', endTime: '19:00', sortOrder: 1 },
    { nameAr: 'إقامة ليلية', nameEn: 'Overnight Stay', slug: 'overnight-stay', startTime: '20:00', endTime: '07:00', sortOrder: 2 },
  ];

  const seededBookingTypes = [];
  for (const bt of bookingTypes) {
    const result = await prisma.bookingType.upsert({
      where: { slug: bt.slug },
      update: bt,
      create: bt,
    });
    seededBookingTypes.push(result);
  }
  console.log('✓ Booking Types seeded');

  // Seed ChaletBookingTypes and placeholder ChaletPricings
  // NOTE: Admin should set actual prices via Admin Dashboard > Pricing page
  const allChalets = await prisma.chalet.findMany();
  for (const chalet of allChalets) {
    for (const bt of seededBookingTypes) {
      await prisma.chaletBookingType.upsert({
        where: { chaletId_bookingTypeId: { chaletId: chalet.id, bookingTypeId: bt.id } },
        update: {},
        create: { chaletId: chalet.id, bookingTypeId: bt.id },
      });
      const existing = await prisma.chaletPricing.findUnique({
        where: { chaletId_bookingTypeId: { chaletId: chalet.id, bookingTypeId: bt.id } },
      });
      if (!existing) {
        await prisma.chaletPricing.create({
          data: { chaletId: chalet.id, bookingTypeId: bt.id, totalPrice: 0, depositAmount: 0 },
        });
      }
    }
  }
  console.log('✓ Chalet Booking Types & Pricing seeded');

  // Seed Legacy Pricing
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
    update: { role: AdminRole.SUPER_ADMIN },
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Admin',
      role: AdminRole.SUPER_ADMIN,
    },
  });
  console.log(`✓ Admin user seeded (${adminEmail})`);

  // Seed Settings
  const settings = [
    { key: 'whatsapp_number', value: '966570698531', type: 'string' },
    { key: 'resort_name_ar', value: 'منتجع الواحة', type: 'string' },
    { key: 'resort_name_en', value: 'Oasis Resort', type: 'string' },
    { key: 'cancellation_free_hours', value: '48', type: 'number' },
    { key: 'cancellation_partial_hours', value: '24', type: 'number' },
    { key: 'greenapi_enabled', value: 'false', type: 'boolean' },
    { key: 'greenapi_instance_id', value: '', type: 'string' },
    { key: 'greenapi_api_token', value: '', type: 'string' },
    {
      key: 'whatsapp_template_new_booking_ar',
      value: 'مرحباً {customerName}،\nتم استلام طلب حجزك في منتجع الواحة.\n📅 التاريخ: {date}\n🕐 النوع: {visitType}\n👥 عدد الضيوف: {guests}\n📋 رقم الحجز: {bookingRef}\nسيتم التواصل معك قريباً للتأكيد.',
      type: 'string',
    },
    {
      key: 'whatsapp_template_new_booking_en',
      value: 'Hello {customerName},\nYour booking request has been received at Oasis Resort.\n📅 Date: {date}\n🕐 Type: {visitType}\n👥 Guests: {guests}\n📋 Booking Ref: {bookingRef}\nWe will contact you shortly for confirmation.',
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
