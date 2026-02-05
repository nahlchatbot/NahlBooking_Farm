import { describe, it, expect } from 'vitest';
import {
  availabilitySchema,
  createBookingSchema,
  adminLoginSchema,
} from '../src/types/validation.js';

describe('Validation Schemas', () => {
  describe('availabilitySchema', () => {
    it('should accept valid input', () => {
      const input = {
        date: '2024-12-25',
        visitType: 'زيارة نهارية',
      };
      const result = availabilitySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const input = {
        date: '12-25-2024',
        visitType: 'زيارة نهارية',
      };
      const result = availabilitySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid visit type', () => {
      const input = {
        date: '2024-12-25',
        visitType: 'invalid',
      };
      const result = availabilitySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept overnight stay', () => {
      const input = {
        date: '2024-12-25',
        visitType: 'إقامة ليلية',
      };
      const result = availabilitySchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('createBookingSchema', () => {
    it('should accept valid booking data', () => {
      const input = {
        date: '2024-12-25',
        visitType: 'زيارة نهارية',
        customerName: 'Ali Ahmed',
        customerPhone: '966512345678',
      };
      const result = createBookingSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject short customer name', () => {
      const input = {
        date: '2024-12-25',
        visitType: 'زيارة نهارية',
        customerName: 'A',
        customerPhone: '966512345678',
      };
      const result = createBookingSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone format', () => {
      const input = {
        date: '2024-12-25',
        visitType: 'زيارة نهارية',
        customerName: 'Ali Ahmed',
        customerPhone: '123',
      };
      const result = createBookingSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const input = {
        date: '2024-12-25',
        visitType: 'إقامة ليلية',
        customerName: 'Ali Ahmed',
        customerPhone: '966512345678',
        email: 'ali@example.com',
        guests: 4,
        notes: 'Special request',
      };
      const result = createBookingSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.guests).toBe(4);
        expect(result.data.email).toBe('ali@example.com');
      }
    });

    it('should use defaults for missing optional fields', () => {
      const input = {
        date: '2024-12-25',
        visitType: 'زيارة نهارية',
        customerName: 'Ali Ahmed',
        customerPhone: '966512345678',
      };
      const result = createBookingSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.guests).toBe(2); // default
        expect(result.data.language).toBe('ar'); // default
      }
    });
  });

  describe('adminLoginSchema', () => {
    it('should accept valid credentials', () => {
      const input = {
        email: 'admin@example.com',
        password: 'password123',
      };
      const result = adminLoginSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const input = {
        email: 'not-an-email',
        password: 'password123',
      };
      const result = adminLoginSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const input = {
        email: 'admin@example.com',
        password: '123',
      };
      const result = adminLoginSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
