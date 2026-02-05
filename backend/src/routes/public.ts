import { Router } from 'express';
import { checkAvailabilityHandler } from '../controllers/availability.controller.js';
import {
  createBookingHandler,
  getBookingHandler,
  requestCancellationOtpHandler,
  cancelBookingHandler,
} from '../controllers/booking.controller.js';
import { validate } from '../middleware/validation.js';
import {
  availabilitySchema,
  createBookingSchema,
  cancelBookingSchema,
} from '../types/validation.js';
import { bookingLimiter, otpLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /api/availability - Check date availability
router.get(
  '/availability',
  validate(availabilitySchema, 'query'),
  checkAvailabilityHandler
);

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
