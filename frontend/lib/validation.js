/**
 * Validation utilities for form fields and business rules
 */

/**
 * Validate session configuration
 * @param {Object} config - Session configuration object
 * @param {number} config.sessionLength - Session length in minutes
 * @param {number} config.gapTime - Gap time in minutes
 * @param {number} config.examinersPerSession - Examiners per session
 * @returns {Object} Validation result with isValid and errors
 */
export function validateSessionConfig(config) {
  const errors = [];
  
  if (!config.sessionLength || config.sessionLength <= 0) {
    errors.push('Session length must be greater than 0');
  }
  
  if (config.sessionLength > 480) { // 8 hours max
    errors.push('Session length cannot exceed 8 hours (480 minutes)');
  }
  
  if (config.gapTime < 0) {
    errors.push('Gap time cannot be negative');
  }
  
  if (config.gapTime > 60) { // 1 hour max
    errors.push('Gap time cannot exceed 1 hour (60 minutes)');
  }
  
  if (!config.examinersPerSession || config.examinersPerSession <= 0) {
    errors.push('Examiners per session must be greater than 0');
  }
  
  if (config.examinersPerSession > 10) { // reasonable limit
    errors.push('Examiners per session cannot exceed 10');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate time slot data
 * @param {Object} timeSlot - Time slot data
 * @param {string} timeSlot.date - Date in YYYY-MM-DD format
 * @param {string} timeSlot.startTime - Start time
 * @param {string} timeSlot.venue - Venue name
 * @param {number} timeSlot.sessions - Number of sessions
 * @param {number} timeSlot.requiredExaminers - Required examiners
 * @returns {Object} Validation result
 */
export function validateTimeSlot(timeSlot) {
  const errors = [];
  
  // Date validation
  if (!timeSlot.date) {
    errors.push('Date is required');
  } else {
    const date = new Date(timeSlot.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    } else if (date < today) {
      errors.push('Date cannot be in the past');
    }
  }
  
  // Start time validation
  if (!timeSlot.startTime) {
    errors.push('Start time is required');
  }
  
  // Venue validation
  if (!timeSlot.venue || timeSlot.venue.trim().length === 0) {
    errors.push('Venue is required');
  } else if (timeSlot.venue.length > 100) {
    errors.push('Venue name cannot exceed 100 characters');
  }
  
  // Sessions validation
  if (!timeSlot.sessions || timeSlot.sessions <= 0) {
    errors.push('Number of sessions must be greater than 0');
  } else if (timeSlot.sessions > 20) {
    errors.push('Number of sessions cannot exceed 20');
  }
  
  // Required examiners validation
  if (!timeSlot.requiredExaminers || timeSlot.requiredExaminers <= 0) {
    errors.push('Required examiners must be greater than 0');
  } else if (timeSlot.requiredExaminers > 10) {
    errors.push('Required examiners cannot exceed 10');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check for time slot conflicts
 * @param {Object} newTimeSlot - New time slot to check
 * @param {Array} existingTimeSlots - Array of existing time slots
 * @param {number} excludeId - ID to exclude from conflict check (for updates)
 * @returns {Object} Conflict check result
 */
export function checkTimeSlotConflicts(newTimeSlot, existingTimeSlots, excludeId = null) {
  const conflicts = [];
  
  existingTimeSlots.forEach(existing => {
    if (excludeId && existing.id === excludeId) return;
    
    // Check for same date, venue, and overlapping time
    if (existing.date === newTimeSlot.date && existing.venue === newTimeSlot.venue) {
      // For now, we'll check for exact start time conflicts
      // In a more sophisticated system, we'd check for time range overlaps
      if (existing.startTime === newTimeSlot.startTime) {
        conflicts.push({
          type: 'venue_time_conflict',
          message: `Time slot conflicts with existing slot at ${existing.startTime} in ${existing.venue}`,
          conflictingSlot: existing
        });
      }
    }
  });
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  };
}

/**
 * Validate examiner capacity against total sessions
 * @param {Array} examiners - Array of examiner objects with maxSessions
 * @param {number} totalSessions - Total number of sessions to assign
 * @param {number} examinersPerSession - Required examiners per session
 * @returns {Object} Capacity validation result
 */
export function validateExaminerCapacity(examiners, totalSessions, examinersPerSession) {
  const totalCapacity = examiners.reduce((sum, examiner) => sum + (examiner.maxSessions || 0), 0);
  const requiredCapacity = totalSessions * examinersPerSession;
  
  const errors = [];
  const warnings = [];
  
  if (totalCapacity < requiredCapacity) {
    errors.push(
      `Insufficient examiner capacity. Required: ${requiredCapacity}, Available: ${totalCapacity}`
    );
  } else if (totalCapacity < requiredCapacity * 1.2) { // Less than 20% buffer
    warnings.push(
      'Low examiner capacity buffer. Consider adding more examiner sessions for flexibility.'
    );
  }
  
  // Check individual examiner limits
  examiners.forEach(examiner => {
    if (examiner.maxSessions > 100) { // Reasonable upper limit
      warnings.push(`${examiner.name} has unusually high session limit (${examiner.maxSessions})`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
    totalCapacity,
    requiredCapacity,
    utilizationRate: totalCapacity > 0 ? (requiredCapacity / totalCapacity) * 100 : 0
  };
}

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate time format (12-hour or 24-hour)
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} True if valid time format
 */
export function validateTimeFormat(timeStr) {
  // 12-hour format: "HH:mm AM/PM"
  const time12Regex = /^(1[0-2]|[1-9]):[0-5][0-9] (AM|PM)$/i;
  // 24-hour format: "HH:mm"
  const time24Regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  return time12Regex.test(timeStr) || time24Regex.test(timeStr);
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid date format
 */
export function validateDateFormat(dateStr) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  
  const date = new Date(dateStr + 'T00:00:00');
  return !isNaN(date.getTime());
}

/**
 * Sanitize text input
 * @param {string} text - Text to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized text
 */
export function sanitizeText(text, maxLength = 255) {
  if (typeof text !== 'string') return '';
  
  return text
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Basic XSS prevention
}