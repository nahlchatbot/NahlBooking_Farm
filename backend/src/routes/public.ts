import { Router } from 'express';
import { checkAvailabilityHandler } from '../controllers/availability.controller.js';
import {
  createBookingHandler,
  getBookingHandler,
  requestCancellationOtpHandler,
  cancelBookingHandler,
  requestPhoneOtpHandler,
  verifyPhoneOtpHandler,
} from '../controllers/booking.controller.js';
import { validate } from '../middleware/validation.js';
import {
  availabilitySchema,
  createBookingSchema,
  cancelBookingSchema,
} from '../types/validation.js';
import { bookingLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import prisma from '../config/database.js';

const router = Router();

// GET /api/availability - Check date availability
router.get(
  '/availability',
  validate(availabilitySchema, 'query'),
  checkAvailabilityHandler
);

// GET /api/chalets - Public list of active chalets with booking types and pricing
router.get('/chalets', async (req, res) => {
  try {
    const chalets = await prisma.chalet.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        slug: true,
        maxGuests: true,
        descriptionAr: true,
        descriptionEn: true,
        amenities: true,
        imageUrl: true,
        images: { orderBy: { sortOrder: 'asc' }, select: { url: true, caption: true } },
        chaletBookingTypes: {
          include: {
            bookingType: {
              select: { id: true, nameAr: true, nameEn: true, slug: true, startTime: true, endTime: true },
            },
          },
        },
        chaletPricings: {
          where: { isActive: true },
          select: {
            bookingTypeId: true,
            totalPrice: true,
            depositAmount: true,
            bookingType: { select: { slug: true, nameAr: true, nameEn: true } },
          },
        },
      },
    });
    res.json({ ok: true, data: { chalets } });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load chalets' });
  }
});

// GET /api/booking-types - Public list of active booking types
router.get('/booking-types', async (req, res) => {
  try {
    const bookingTypes = await prisma.bookingType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, nameAr: true, nameEn: true, slug: true, startTime: true, endTime: true },
    });
    res.json({ ok: true, data: { bookingTypes } });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load booking types' });
  }
});

// POST /api/phone/request-otp - Request OTP for phone verification before booking
router.post('/phone/request-otp', otpLimiter, requestPhoneOtpHandler);

// POST /api/phone/verify-otp - Verify phone OTP
router.post('/phone/verify-otp', verifyPhoneOtpHandler);

// POST /api/booking - Create a new booking
router.post(
  '/booking',
  bookingLimiter,
  validate(createBookingSchema, 'body'),
  createBookingHandler
);

// GET /api/booking/:ref - Get booking details by reference
router.get('/booking/:ref', getBookingHandler);

// POST /api/booking/:ref/request-otp - Request OTP for cancellation
router.post(
  '/booking/:ref/request-otp',
  otpLimiter,
  validate(cancelBookingSchema, 'body'),
  requestCancellationOtpHandler
);

// POST /api/booking/:ref/cancel - Cancel booking with OTP
router.post(
  '/booking/:ref/cancel',
  validate(cancelBookingSchema, 'body'),
  cancelBookingHandler
);

export default router;
