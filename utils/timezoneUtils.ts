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
  } catch (_error) {
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
  } catch (_error) {
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
  } catch (_error) {
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
    const _today = new Date();
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
  } catch (_error) {
    return false;
  }
}

/**
 * PST/PDT timezone constant for promotions
 * Uses America/Los_Angeles which automatically handles PST/PDT
 */
export const PST_TIMEZONE = 'America/Los_Angeles';

/**
 * Convert a PST date string (YYYY-MM-DD) to UTC ISO string for database storage
 * @param dateString - Date string in YYYY-MM-DD format
 * @param isEndDate - If true, sets time to 23:59:59 PST (end of day). If false, sets to 00:00:00 PST (start of day)
 * 
 * PST is UTC-8, PDT is UTC-7. This function tries both and picks the correct one.
 */
export function pstDateToUTC(dateString: string | null | undefined, isEndDate: boolean = false): string | null {
  if (!dateString) return null;
  
  // If already an ISO string, return as is
  if (dateString.includes('T') && dateString.includes('Z')) {
    return dateString;
  }
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: PST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    if (isEndDate) {
      // For end dates: We want 23:59:59 PST on the specified date
      // 23:59:59 PST = 07:59:59 UTC on the next day (PST is UTC-8)
      // 23:59:59 PDT = 06:59:59 UTC on the next day (PDT is UTC-7)
      
      // Try PST first (UTC-8): Next day at 07:59:59 UTC
      let date = new Date(Date.UTC(year, month - 1, day + 1, 7, 59, 59));
      let parts = formatter.formatToParts(date);
      let formattedDate = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
      let hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      let minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
      let second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
      
      if (formattedDate === dateString && hour === 23 && minute === 59 && second === 59) {
        return date.toISOString();
      }
      
      // Try PDT (UTC-7): Next day at 06:59:59 UTC
      date = new Date(Date.UTC(year, month - 1, day + 1, 6, 59, 59));
      parts = formatter.formatToParts(date);
      formattedDate = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
      hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
      second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
      
      if (formattedDate === dateString && hour === 23 && minute === 59 && second === 59) {
        return date.toISOString();
      }
      
      // Default: Use PST (UTC-8) - next day at 07:59:59 UTC
      return new Date(Date.UTC(year, month - 1, day + 1, 7, 59, 59)).toISOString();
    } else {
      // For start dates: We want 00:00:00 PST on the specified date
      // 00:00:00 PST = 08:00:00 UTC on the same day (PST is UTC-8)
      // 00:00:00 PDT = 07:00:00 UTC on the same day (PDT is UTC-7)
      
      // Try PST first (UTC-8): Same day at 08:00:00 UTC
      let date = new Date(Date.UTC(year, month - 1, day, 8, 0, 0));
      let parts = formatter.formatToParts(date);
      let formattedDate = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
      let hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      let minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
      let second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
      
      if (formattedDate === dateString && hour === 0 && minute === 0 && second === 0) {
        return date.toISOString();
      }
      
      // Try PDT (UTC-7): Same day at 07:00:00 UTC
      date = new Date(Date.UTC(year, month - 1, day, 7, 0, 0));
      parts = formatter.formatToParts(date);
      formattedDate = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
      hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
      second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
      
      if (formattedDate === dateString && hour === 0 && minute === 0 && second === 0) {
        return date.toISOString();
      }
      
      // Default: Use PST (UTC-8) - same day at 08:00:00 UTC
      return new Date(Date.UTC(year, month - 1, day, 8, 0, 0)).toISOString();
    }
  } catch (error) {
    console.warn('Error converting PST date to UTC:', error);
    // Final fallback
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      if (isEndDate) {
        // End of day: 23:59:59 PST
        return new Date(Date.UTC(year, month - 1, day + 1, 7, 59, 59)).toISOString();
      } else {
        // Start of day: 00:00:00 PST
        return new Date(Date.UTC(year, month - 1, day, 8, 0, 0)).toISOString();
      }
    } catch (_e) {
      return new Date(dateString + (isEndDate ? 'T23:59:59.000Z' : 'T00:00:00.000Z')).toISOString();
    }
  }
}

/**
 * Convert a UTC ISO string to PST date string (YYYY-MM-DD) for display
 */
export function utcToPSTDate(utcString: string | null): string | null {
  if (!utcString) return null;
  
  try {
    const date = new Date(utcString);
    
    // Format date in PST timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: PST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    return formatter.format(date);
  } catch (error) {
    console.warn('Error converting UTC to PST date:', error);
    return null;
  }
}

/**
 * Get current date/time in PST
 */
export function getCurrentPSTDate(): Date {
  const now = new Date();
  const pstString = now.toLocaleString('en-US', { timeZone: PST_TIMEZONE });
  return new Date(pstString);
}

/**
 * Format a UTC date string for display in PST
 */
export function formatPSTDate(utcString: string | null): string {
  if (!utcString) return 'No limit';
  
  try {
    const date = new Date(utcString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: PST_TIMEZONE,
    });
  } catch (error) {
    console.warn('Error formatting PST date:', error);
    return 'Invalid date';
  }
}

/**
 * Compare dates in PST timezone
 * Returns true if the UTC date (stored in DB) represents a date/time in PST that is before now (PST)
 */
export function isPSTDateBeforeNow(utcDateString: string | null): boolean {
  if (!utcDateString) return false;
  
  try {
    const utcDate = new Date(utcDateString);
    const now = new Date();
    
    // Get the date part in PST for both dates
    const pstFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: PST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const pstDateStr = pstFormatter.format(utcDate);
    const pstNowStr = pstFormatter.format(now);
    
    // Compare as strings (YYYY-MM-DD HH:MM:SS format)
    return pstDateStr < pstNowStr;
  } catch (error) {
    console.warn('Error comparing PST dates:', error);
    return false;
  }
}

/**
 * Compare dates in PST timezone
 * Returns true if the UTC date (stored in DB) represents a date/time in PST that is after now (PST)
 */
export function isPSTDateAfterNow(utcDateString: string | null): boolean {
  if (!utcDateString) return false;
  
  try {
    const utcDate = new Date(utcDateString);
    const now = new Date();
    
    // Get the date part in PST for both dates
    const pstFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: PST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const pstDateStr = pstFormatter.format(utcDate);
    const pstNowStr = pstFormatter.format(now);
    
    // Compare as strings (YYYY-MM-DD HH:MM:SS format)
    return pstDateStr > pstNowStr;
  } catch (error) {
    console.warn('Error comparing PST dates:', error);
    return false;
  }
} 