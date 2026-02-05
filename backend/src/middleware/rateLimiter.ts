import rateLimit from 'express-rate-limit';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    ok: false,
    message: 'طلبات كثيرة، يرجى المحاولة لاحقاً', // Too many requests
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for booking submissions
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bookings per hour per IP
  message: {
    ok: false,
    message: 'تم تجاوز الحد المسموح للحجوزات', // Booking limit exceeded
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    ok: false,
    message: 'محاولات تسجيل دخول كثيرة', // Too many login attempts
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP request limiter
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 OTP requests
  message: {
    ok: false,
    message: 'طلبات رمز التحقق كثيرة، يرجى الانتظار', // Too many OTP requests
  },
  standardHeaders: true,
  legacyHeaders: false,
});
