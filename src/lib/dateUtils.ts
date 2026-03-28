// Date utilities for consistent timezone handling across the app

/**
 * Format a date string for display in IST timezone
 */
export function formatDisplayDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Format a time string for display in IST timezone
 */
export function formatDisplayTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Format date + time together
 */
export function formatDisplayDateTime(isoString: string): string {
  return `${formatDisplayDate(isoString)} at ${formatDisplayTime(isoString)}`;
}

/**
 * Combine a date string and time string into a UTC ISO string.
 * Avoids timezone day-shift by constructing local Date properly.
 */
export function scheduleAppointment(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hour, minute);
  return localDate.toISOString();
}

/**
 * Create a UTC ISO string for a date with default time (09:00 local).
 */
export function dateToDefaultTime(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const localDate = new Date(year, month - 1, day, 9, 0);
  return localDate.toISOString();
}

/**
 * Get tomorrow at 10:00 AM local time as ISO string
 */
export function tomorrowAt10AM(): string {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0);
  return tomorrow.toISOString();
}

/**
 * Short date format for tables
 */
export function formatShortDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}
