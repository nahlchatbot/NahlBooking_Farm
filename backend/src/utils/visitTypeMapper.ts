import { VisitType } from '@prisma/client';

const ARABIC_TO_ENUM: Record<string, VisitType> = {
  'زيارة نهارية': VisitType.DAY_VISIT,
  'إقامة ليلية': VisitType.OVERNIGHT_STAY,
};

const ENUM_TO_ARABIC: Record<VisitType, string> = {
  [VisitType.DAY_VISIT]: 'زيارة نهارية',
  [VisitType.OVERNIGHT_STAY]: 'إقامة ليلية',
};

const ENUM_TO_ENGLISH: Record<VisitType, string> = {
  [VisitType.DAY_VISIT]: 'Day Visit',
  [VisitType.OVERNIGHT_STAY]: 'Overnight Stay',
};

export function mapArabicVisitType(arabic: string): VisitType | null {
  return ARABIC_TO_ENUM[arabic] || null;
}

export function mapEnumToArabic(type: VisitType): string {
  return ENUM_TO_ARABIC[type];
}

export function mapEnumToEnglish(type: VisitType): string {
  return ENUM_TO_ENGLISH[type];
}

export function mapEnumToLocalized(type: VisitType, language: string): string {
  return language === 'en' ? ENUM_TO_ENGLISH[type] : ENUM_TO_ARABIC[type];
}

export function isValidArabicVisitType(value: string): boolean {
  return value in ARABIC_TO_ENUM;
}
