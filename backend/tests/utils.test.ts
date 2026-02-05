import { describe, it, expect } from 'vitest';
import { parseDate, formatDate, isPastDate, formatDateLocalized } from '../src/utils/date.js';
import { mapArabicVisitType, mapEnumToArabic, mapEnumToEnglish, mapEnumToLocalized } from '../src/utils/visitTypeMapper.js';
import { VisitType } from '@prisma/client';

describe('Date Utilities', () => {
  describe('parseDate', () => {
    it('should parse valid date string', () => {
      const result = parseDate('2024-12-25');
      expect(result).not.toBeNull();
      expect(result?.toISOString().startsWith('2024-12-25')).toBe(true);
    });

    it('should return null for invalid format', () => {
      expect(parseDate('12-25-2024')).toBeNull();
      expect(parseDate('2024/12/25')).toBeNull();
      expect(parseDate('invalid')).toBeNull();
    });
  });

  describe('formatDate', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date('2024-12-25T00:00:00.000Z');
      expect(formatDate(date)).toBe('2024-12-25');
    });
  });

  describe('isPastDate', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isPastDate(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isPastDate(futureDate)).toBe(false);
    });
  });

  describe('formatDateLocalized', () => {
    it('should format date in Arabic', () => {
      const date = new Date('2024-12-25T00:00:00.000Z');
      const result = formatDateLocalized(date, 'ar');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should format date in English', () => {
      const date = new Date('2024-12-25T00:00:00.000Z');
      const result = formatDateLocalized(date, 'en');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });
});

describe('Visit Type Mapper', () => {
  describe('mapArabicVisitType', () => {
    it('should map زيارة نهارية to DAY_VISIT', () => {
      expect(mapArabicVisitType('زيارة نهارية')).toBe(VisitType.DAY_VISIT);
    });

    it('should map إقامة ليلية to OVERNIGHT_STAY', () => {
      expect(mapArabicVisitType('إقامة ليلية')).toBe(VisitType.OVERNIGHT_STAY);
    });

    it('should return null for invalid input', () => {
      expect(mapArabicVisitType('invalid')).toBeNull();
    });
  });

  describe('mapEnumToArabic', () => {
    it('should map DAY_VISIT to زيارة نهارية', () => {
      expect(mapEnumToArabic(VisitType.DAY_VISIT)).toBe('زيارة نهارية');
    });

    it('should map OVERNIGHT_STAY to إقامة ليلية', () => {
      expect(mapEnumToArabic(VisitType.OVERNIGHT_STAY)).toBe('إقامة ليلية');
    });
  });

  describe('mapEnumToEnglish', () => {
    it('should map DAY_VISIT to Day Visit', () => {
      expect(mapEnumToEnglish(VisitType.DAY_VISIT)).toBe('Day Visit');
    });

    it('should map OVERNIGHT_STAY to Overnight Stay', () => {
      expect(mapEnumToEnglish(VisitType.OVERNIGHT_STAY)).toBe('Overnight Stay');
    });
  });

  describe('mapEnumToLocalized', () => {
    it('should return Arabic for ar language', () => {
      expect(mapEnumToLocalized(VisitType.DAY_VISIT, 'ar')).toBe('زيارة نهارية');
    });

    it('should return English for en language', () => {
      expect(mapEnumToLocalized(VisitType.DAY_VISIT, 'en')).toBe('Day Visit');
    });
  });
});
