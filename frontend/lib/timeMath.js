/**
 * Time calculation and conversion utilities
 * Centralized logic for time operations used across the application
 */

/**
 * Convert 12-hour format time string to 24-hour format
 * @param {string} timeStr - Time string in format "HH:mm AM/PM"
 * @returns {string} Time string in format "HH:mm" (24-hour)
 */
export function to24Hour(timeStr) {
  if (!timeStr) return '';
  
  const [time, period] = timeStr.split(' ');
  if (!time || !period) return timeStr; // Return as-is if already in 24h format
  
  let [hour, minute] = time.split(':');
  let h = parseInt(hour, 10);
  
  if (period === 'PM' && h < 12) {
    h += 12;
  } else if (period === 'AM' && h === 12) {
    h = 0;
  }
  
  return `${String(h).padStart(2, '0')}:${minute}`;
}

/**
 * Convert 24-hour format time string to 12-hour format
 * @param {string} timeStr - Time string in format "HH:mm"
 * @returns {string} Time string in format "HH:mm AM/PM"
 */
export function to12Hour(timeStr) {
  if (!timeStr) return '';
  
  const [hour, minute] = timeStr.split(':');
  let h = parseInt(hour, 10);
  let period = 'AM';
  
  if (h >= 12) {
    period = 'PM';
    if (h > 12) {
      h -= 12;
    }
  }
  
  if (h === 0) {
    h = 12;
  }
  
  return `${h}:${minute} ${period}`;
}

/**
 * Calculate end time based on start time, session count, session length, and gap time
 * @param {string} startTime - Start time in 12-hour format "HH:mm AM/PM"
 * @param {number} sessionCount - Number of sessions
 * @param {number} sessionLength - Length of each session in minutes
 * @param {number} gapTime - Gap between sessions in minutes
 * @returns {string} End time in 12-hour format "HH:mm AM/PM"
 */
export function calculateEndTime(startTime, sessionCount, sessionLength, gapTime) {
  if (!startTime || sessionCount <= 0) return 'N/A';
  
  // Parse start time
  const [time, period] = startTime.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  let startHour = parseInt(hourStr, 10);
  const startMinute = parseInt(minuteStr, 10);
  
  // Convert to 24-hour format
  if (period === 'PM' && startHour < 12) {
    startHour += 12;
  } else if (period === 'AM' && startHour === 12) {
    startHour = 0;
  }
  
  // Calculate total minutes
  const totalSessionTime = sessionCount * sessionLength;
  const totalGapTime = (sessionCount - 1) * gapTime;
  const totalMinutes = totalSessionTime + totalGapTime;
  
  // Calculate end time
  let endHour = startHour + Math.floor((startMinute + totalMinutes) / 60);
  let endMinute = (startMinute + totalMinutes) % 60;
  
  // Handle day overflow
  endHour = endHour % 24;
  
  // Convert back to 12-hour format
  let endPeriod = 'AM';
  if (endHour >= 12) {
    endPeriod = 'PM';
    if (endHour > 12) {
      endHour -= 12;
    }
  }
  if (endHour === 0) {
    endHour = 12;
  }
  
  return `${endHour}:${endMinute.toString().padStart(2, '0')} ${endPeriod}`;
}

/**
 * Calculate end time with session config object
 * @param {string} startTime - Start time in 12-hour format
 * @param {number} sessionCount - Number of sessions
 * @param {Object} sessionConfig - Session configuration object
 * @param {number} sessionConfig.sessionLength - Session length in minutes
 * @param {number} sessionConfig.gapTime - Gap time in minutes
 * @returns {string} End time in 12-hour format
 */
export function calculateEndTimeWithConfig(startTime, sessionCount, sessionConfig) {
  return calculateEndTime(
    startTime, 
    sessionCount, 
    sessionConfig.sessionLength, 
    sessionConfig.gapTime
  );
}

/**
 * Parse time string into components
 * @param {string} timeStr - Time string in either 12-hour or 24-hour format
 * @returns {Object} Object with hour, minute, and period (if 12-hour format)
 */
export function parseTimeString(timeStr) {
  if (!timeStr) return { hour: 0, minute: 0, period: null };
  
  const parts = timeStr.split(' ');
  const [hourStr, minuteStr] = parts[0].split(':');
  
  return {
    hour: parseInt(hourStr, 10),
    minute: parseInt(minuteStr, 10),
    period: parts[1] || null
  };
}

/**
 * Format time components into time string
 * @param {number} hour - Hour (1-12 for 12-hour, 0-23 for 24-hour)
 * @param {number} minute - Minute (0-59)
 * @param {string|null} period - AM/PM for 12-hour format, null for 24-hour
 * @returns {string} Formatted time string
 */
export function formatTime(hour, minute, period = null) {
  const minuteStr = minute.toString().padStart(2, '0');
  
  if (period) {
    return `${hour}:${minuteStr} ${period}`;
  } else {
    return `${hour.toString().padStart(2, '0')}:${minuteStr}`;
  }
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date
 */
export function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format date for display
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Add days to a date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {number} days - Number of days to add
 * @returns {string} New date in YYYY-MM-DD format
 */
export function addDays(dateStr, days) {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}