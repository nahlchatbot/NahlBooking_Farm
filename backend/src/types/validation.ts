import { z } from 'zod';

// Visit type validation (accepts Arabic values from frontend)
const visitTypeValues = ['زيارة نهارية', 'إقامة ليلية'] as const;

// Availability check schema
export const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  visitType: z.enum(visitTypeValues, {
    errorMap: () => ({ message: 'Invalid visit type' }),
  }),
});

// Booking creation schema
export const createBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  visitType: z.enum(visitTypeValues),
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  customerPhone: z.string().regex(/^9665\d{8}$/, 'Phone must be in format 9665xxxxxxxx'),
  guests: z.coerce.number().int().min(1).max(20).optional().default(2),
  chaletType: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
  notes: z.string().max(500).optional(),
  language: z.enum(['ar', 'en']).optional().default('ar'),
});

// Booking cancellation schema
export const cancelBookingSchema = z.object({
  phone: z.string().regex(/^9665\d{8}$/, 'Phone must match booking phone'),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
});

// Admin login schema
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Admin booking update schema
export const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  paymentStatus: z.enum(['PENDING', 'DEPOSIT_PAID', 'FULLY_PAID', 'REFUNDED', 'CANCELLED']).optional(),
  adminConfirmed: z.boolean().optional(),
  cancellationReason: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

// Blackout date schema
export const createBlackoutDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  visitType: z.enum(visitTypeValues).optional(),
  reason: z.string().max(200).optional(),
});

// Pricing update schema
export const updatePricingSchema = z.object({
  totalPrice: z.number().int().min(0).optional(),
  depositAmount: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Chalet create schema
export const createChaletSchema = z.object({
  nameAr: z.string().min(2).max(100),
  nameEn: z.string().min(2).max(100),
  maxGuests: z.number().int().min(1).max(20),
  descriptionAr: z.string().max(1000).optional(),
  descriptionEn: z.string().max(1000).optional(),
  amenities: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
});

// Chalet update schema
export const updateChaletSchema = z.object({
  nameAr: z.string().min(2).max(100).optional(),
  nameEn: z.string().min(2).max(100).optional(),
  maxGuests: z.number().int().min(1).max(20).optional(),
  descriptionAr: z.string().max(1000).optional().nullable(),
  descriptionEn: z.string().max(1000).optional().nullable(),
  amenities: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// Chalet image schema
export const addChaletImageSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(200).optional(),
});

// Admin user schemas
export const createAdminUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'VIEWER']).default('ADMIN'),
  phone: z.string().max(20).optional(),
});

export const updateAdminUserSchema = z.object({
  email: z.string().email('Invalid email').optional(),
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'VIEWER']).optional(),
  phone: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Type exports
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CreateBlackoutDateInput = z.infer<typeof createBlackoutDateSchema>;
export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;
export type CreateChaletInput = z.infer<typeof createChaletSchema>;
export type UpdateChaletInput = z.infer<typeof updateChaletSchema>;
export type AddChaletImageInput = z.infer<typeof addChaletImageSchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
