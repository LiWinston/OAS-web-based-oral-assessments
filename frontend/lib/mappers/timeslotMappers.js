/**
 * Data mappers for timeslot data transformation
 * Handles conversion between API formats and UI formats
 * 
 * @typedef {import('../types/timeslot.js').TimeSlot} TimeSlot
 * @typedef {import('../types/timeslot.js').SessionConfig} SessionConfig
 * @typedef {import('../types/timeslot.js').Examiner} Examiner
 * @typedef {import('../types/timeslot.js').CalendarData} CalendarData
 */

import { to12Hour, to24Hour } from '../utils/timeMath.js';

/**
 * Determine status based on assigned and required examiners
 * @param {number} assignedCount - Number of assigned examiners
 * @param {number} requiredCount - Number of required examiners
 * @returns {string} Status: 'empty', 'partial', or 'full'
 */
export function determineStatus(assignedCount, requiredCount) {
  if (assignedCount === 0) return 'empty';
  if (assignedCount < requiredCount) return 'partial';
  return 'full';
}

/**
 * Map timeslot data from API format to UI format
 * @param {Object} apiTimeSlot - Timeslot data from API
 * @returns {TimeSlot|null} Timeslot data formatted for UI
 */
export function mapTimeSlotFromApi(apiTimeSlot) {
  if (!apiTimeSlot) return null;

  return {
    id: apiTimeSlot.id,
    date: apiTimeSlot.date, // Keep YYYY-MM-DD format
    startTime: apiTimeSlot.startTime, // Keep 24h format per spec - API uses 24h
    endTime: apiTimeSlot.endTime,
    venue: apiTimeSlot.venue,
    requiredExaminers: apiTimeSlot.requiredExaminers,
    sessionCount: apiTimeSlot.sessionCount, // Use consistent field name
    status: determineStatus(
      apiTimeSlot.assignedExaminers?.length || 0,
      apiTimeSlot.requiredExaminers
    ),
    assignedExaminers: apiTimeSlot.assignedExaminers || []
  };
}

/**
 * Map timeslot data from UI format to API format
 * @param {TimeSlot} uiTimeSlot - Timeslot data from UI
 * @returns {Object|null} Timeslot data formatted for API
 */
export function mapTimeSlotToApi(uiTimeSlot) {
  if (!uiTimeSlot) return null;

  return {
    id: uiTimeSlot.id,
    date: uiTimeSlot.date, // Keep YYYY-MM-DD format
    startTime: uiTimeSlot.startTime, // Already 24h format per spec
    endTime: uiTimeSlot.endTime,
    venue: uiTimeSlot.venue,
    requiredExaminers: uiTimeSlot.requiredExaminers,
    sessionCount: uiTimeSlot.sessionCount,
    assignedExaminers: uiTimeSlot.assignedExaminers || []
  };
}

/**
 * Map multiple timeslots from API format
 * @param {Array} apiTimeSlots - Array of timeslots from API
 * @returns {Array} Array of timeslots formatted for UI
 */
export function mapTimeSlotsFromApi(apiTimeSlots) {
  if (!Array.isArray(apiTimeSlots)) return [];
  
  return apiTimeSlots.map(mapTimeSlotFromApi).filter(Boolean);
}

/**
 * Map multiple timeslots to API format
 * @param {Array} uiTimeSlots - Array of timeslots from UI
 * @returns {Array} Array of timeslots formatted for API
 */
export function mapTimeSlotsToApi(uiTimeSlots) {
  if (!Array.isArray(uiTimeSlots)) return [];
  
  return uiTimeSlots.map(mapTimeSlotToApi).filter(Boolean);
}

/**
 * Map session configuration from API format
 * @param {Object} apiConfig - Session config from API
 * @returns {Object} Session config formatted for UI
 */
export function mapSessionConfigFromApi(apiConfig) {
  if (!apiConfig) {
    return {
      sessionLength: 30,
      gapTime: 5,
      examinersPerSession: 2,
      isConfigured: false
    };
  }

  return {
    sessionLength: apiConfig.sessionLength || 30,
    gapTime: apiConfig.gapTime || 5,
    examinersPerSession: apiConfig.examinersPerSession || 2,
    isConfigured: apiConfig.isConfigured || false
  };
}

/**
 * Map session configuration to API format
 * @param {Object} uiConfig - Session config from UI
 * @returns {Object} Session config formatted for API
 */
export function mapSessionConfigToApi(uiConfig) {
  return {
    sessionLength: parseInt(uiConfig.sessionLength, 10),
    gapTime: parseInt(uiConfig.gapTime, 10),
    examinersPerSession: parseInt(uiConfig.examinersPerSession, 10),
    isConfigured: true
  };
}

/**
 * Map examiner data from API format
 * @param {Object} apiExaminer - Examiner data from API
 * @returns {Object} Examiner data formatted for UI
 */
export function mapExaminerFromApi(apiExaminer) {
  if (!apiExaminer) return null;

  return {
    id: apiExaminer.id,
    name: apiExaminer.name,
    email: apiExaminer.email,
    avatar: apiExaminer.avatar || '/api/placeholder/24/24',
    maxSessions: apiExaminer.maxSessions || 0,
    assignments: apiExaminer.assignments || apiExaminer.currentAssignments || 0
  };
}

/**
 * Map multiple examiners from API format
 * @param {Array} apiExaminers - Array of examiners from API
 * @returns {Array} Array of examiners formatted for UI
 */
export function mapExaminersFromApi(apiExaminers) {
  if (!Array.isArray(apiExaminers)) return [];
  
  return apiExaminers.map(mapExaminerFromApi).filter(Boolean);
}

/**
 * Map calendar data from API format
 * @param {Object} apiCalendarData - Calendar data from API
 * @returns {Object} Calendar data formatted for UI
 */
export function mapCalendarFromApi(apiCalendarData) {
  if (!apiCalendarData || typeof apiCalendarData !== 'object') return {};

  const mappedData = {};
  
  Object.entries(apiCalendarData).forEach(([date, dayData]) => {
    mappedData[date] = {
      slotCount: dayData.slotCount || 0,
      status: dayData.status || 'empty',
      totalSessions: dayData.totalSessions || 0
    };
  });

  return mappedData;
}

/**
 * Normalize date format (handle various input formats)
 * @param {string} dateStr - Date string in various formats
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function normalizeDateFormat(dateStr) {
  if (!dateStr) return '';
  
  // Handle DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // Assume DD/MM/YYYY or MM/DD/YYYY - convert to YYYY-MM-DD
      const [first, second, third] = parts;
      if (third.length === 4) {
        // third is year
        return `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
      }
    }
  }
  
  // Handle YYYY-MM-DD format (keep as is)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try to parse and format
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return dateStr; // Return as-is if we can't parse it
}

/**
 * Create status pill data for display
 * @param {Object} timeSlot - Timeslot object
 * @returns {Object} Status pill display data
 */
export function createStatusPillData(timeSlot) {
  const status = determineStatus(
    timeSlot.assignedExaminers?.length || 0,
    timeSlot.requiredExaminers || 0
  );
  
  const statusConfig = {
    full: {
      className: 'bg-green-100 dark:bg-green-900 dark:bg-opacity-30 text-green-800 dark:text-green-200',
      label: 'Fully Staffed'
    },
    partial: {
      className: 'bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30 text-yellow-800 dark:text-yellow-200',
      label: 'Partially Staffed'
    },
    empty: {
      className: 'bg-red-100 dark:bg-red-900 dark:bg-opacity-30 text-red-800 dark:text-red-200',
      label: 'Unstaffed'
    }
  };
  
  return {
    status,
    className: statusConfig[status].className,
    label: statusConfig[status].label,
    text: `${timeSlot.assignedExaminers?.length || 0}/${timeSlot.requiredExaminers || 0} examiners`
  };
}