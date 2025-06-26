/**
 * Timezone utilities for passive collection and management
 */

/**
 * Get the user's timezone using JavaScript's built-in detection
 * This is completely passive and works in all modern browsers
 */
export function getUserTimezone(): string {
  try {
    // Use Intl.DateTimeFormat to get the user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone; // e.g., "America/New_York", "Europe/London", "Asia/Tokyo"
  } catch (error) {
    console.warn('Could not detect user timezone:', error);
    return 'America/Los_Angeles'; // Fallback to PST (Pacific Time)
  }
}

/**
 * Get additional timezone information
 */
export function getTimezoneInfo() {
  const timezone = getUserTimezone();
  const now = new Date();
  
  try {
    // Get timezone offset in minutes
    const offsetMinutes = now.getTimezoneOffset();
    const offsetHours = -offsetMinutes / 60; // Convert to hours and flip sign
    
    // Get timezone abbreviation (e.g., "EST", "PST", "GMT")
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const abbreviation = parts.find(part => part.type === 'timeZoneName')?.value || '';
    
    return {
      timezone,
      offsetHours,
      offsetMinutes,
      abbreviation,
      isDST: isDaylightSavingTime(now, timezone)
    };
  } catch (error) {
    console.warn('Error getting timezone info:', error);
    return {
      timezone: 'America/Los_Angeles',
      offsetHours: -8,
      offsetMinutes: 480,
      abbreviation: 'PST',
      isDST: false
    };
  }
}

/**
 * Check if a date is in daylight saving time for a given timezone
 */
function isDaylightSavingTime(date: Date, timezone: string): boolean {
  try {
    // Compare January and July offsets to detect DST
    const january = new Date(date.getFullYear(), 0, 1);
    const july = new Date(date.getFullYear(), 6, 1);
    
    const janOffset = getTimezoneOffset(january, timezone);
    const julOffset = getTimezoneOffset(july, timezone);
    const currentOffset = getTimezoneOffset(date, timezone);
    
    // If current offset differs from standard time, it's likely DST
    return Math.max(janOffset, julOffset) !== currentOffset;
  } catch (error) {
    return false;
  }
}

/**
 * Get timezone offset for a specific date and timezone
 */
function getTimezoneOffset(date: Date, timezone: string): number {
  try {
    const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const local = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (utc.getTime() - local.getTime()) / (1000 * 60); // Return in minutes
  } catch (error) {
    return 0;
  }
}

/**
 * Format timezone for display
 */
export function formatTimezone(timezone: string): string {
  try {
    // Convert timezone to a more readable format
    const parts = timezone.split('/');
    if (parts.length >= 2) {
      return parts[parts.length - 1].replace(/_/g, ' ');
    }
    return timezone;
  } catch (error) {
    return timezone;
  }
}

/**
 * Get optimal send times for different timezones
 * Based on email marketing best practices
 */
export function getOptimalSendTimes() {
  return {
    // Tuesday-Thursday are generally best days
    tuesday: ['09:00', '14:00'],
    wednesday: ['09:00', '14:00'],
    thursday: ['09:00', '14:00'],
    // Monday and Friday are okay but not optimal
    monday: ['10:00'],
    friday: ['10:00'],
    // Weekends - avoid or use sparingly
    saturday: ['11:00'],
    sunday: ['15:00']
  };
}

/**
 * Convert a time string to different timezones
 */
export function convertTimeToTimezone(time: string, fromTimezone: string, toTimezone: string): string {
  try {
    // Create a date object for today with the specified time
    const today = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create date in the source timezone
    const sourceDate = new Date();
    sourceDate.setHours(hours, minutes, 0, 0);
    
    // Convert to target timezone
    const targetTime = new Date(sourceDate.toLocaleString('en-US', { timeZone: toTimezone }));
    
    return `${targetTime.getHours().toString().padStart(2, '0')}:${targetTime.getMinutes().toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('Error converting time between timezones:', error);
    return time; // Return original time as fallback
  }
}

/**
 * Check if a timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
} 