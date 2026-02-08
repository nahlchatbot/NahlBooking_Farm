-- CreateTable: BookingType
CREATE TABLE "BookingType" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingType_slug_key" ON "BookingType"("slug");

-- CreateTable: ChaletBookingType (junction)
CREATE TABLE "ChaletBookingType" (
    "chaletId" TEXT NOT NULL,
    "bookingTypeId" TEXT NOT NULL,

    CONSTRAINT "ChaletBookingType_pkey" PRIMARY KEY ("chaletId","bookingTypeId")
);

-- CreateTable: ChaletPricing
CREATE TABLE "ChaletPricing" (
    "id" TEXT NOT NULL,
    "chaletId" TEXT NOT NULL,
    "bookingTypeId" TEXT NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "depositAmount" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChaletPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChaletPricing_chaletId_bookingTypeId_key" ON "ChaletPricing"("chaletId", "bookingTypeId");

-- Add phone verification fields to Booking
ALTER TABLE "Booking" ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Booking" ADD COLUMN "phoneOtpCode" TEXT;
ALTER TABLE "Booking" ADD COLUMN "phoneOtpExpiresAt" TIMESTAMP(3);

-- Add bookingTypeId to Booking
ALTER TABLE "Booking" ADD COLUMN "bookingTypeId" TEXT;

-- Add chaletId and bookingTypeId to BlackoutDate
ALTER TABLE "BlackoutDate" ADD COLUMN "chaletId" TEXT;
ALTER TABLE "BlackoutDate" ADD COLUMN "bookingTypeId" TEXT;

-- Drop old unique constraint on BlackoutDate (date, visitType) and create new one (date, visitType, chaletId)
ALTER TABLE "BlackoutDate" DROP CONSTRAINT IF EXISTS "BlackoutDate_date_visitType_key";
CREATE UNIQUE INDEX "BlackoutDate_date_visitType_chaletId_key" ON "BlackoutDate"("date", "visitType", "chaletId");

-- AddForeignKey
ALTER TABLE "ChaletBookingType" ADD CONSTRAINT "ChaletBookingType_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChaletBookingType" ADD CONSTRAINT "ChaletBookingType_bookingTypeId_fkey" FOREIGN KEY ("bookingTypeId") REFERENCES "BookingType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChaletPricing" ADD CONSTRAINT "ChaletPricing_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChaletPricing" ADD CONSTRAINT "ChaletPricing_bookingTypeId_fkey" FOREIGN KEY ("bookingTypeId") REFERENCES "BookingType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookingTypeId_fkey" FOREIGN KEY ("bookingTypeId") REFERENCES "BookingType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BlackoutDate" ADD CONSTRAINT "BlackoutDate_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlackoutDate" ADD CONSTRAINT "BlackoutDate_bookingTypeId_fkey" FOREIGN KEY ("bookingTypeId") REFERENCES "BookingType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default booking types
INSERT INTO "BookingType" ("id", "nameAr", "nameEn", "slug", "startTime", "endTime", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'زيارة نهارية', 'Day Visit', 'day-visit', '08:00', '19:00', 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'إقامة ليلية', 'Overnight Stay', 'overnight-stay', '20:00', '07:00', 2, true, NOW(), NOW());
