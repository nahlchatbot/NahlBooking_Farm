/**
 * Parse a date string in YYYY-MM-DD format to a Date object
 */
export function parseDate(dateString: string): Date | null {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return null;
  }

  const date = new Date(dateString + 'T00:00:00.000Z');
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format a Date object to localized string
 */
export function formatDateLocalized(date: Date, language: string): string {
  const locale = language === 'en' ? 'en-SA' : 'ar-SA';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Check if a date is in the past (before today)
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Get today's date at midnight UTC
 */
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Calculate hours until a date
 */
export function hoursUntil(date: Date): number {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}
