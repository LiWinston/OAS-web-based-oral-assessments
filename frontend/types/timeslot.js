/**
 * JSDoc type definitions for Course Admin Timeslot Management
 * As specified in the refactor document Section 6
 */

/**
 * @typedef {Object} SessionConfig
 * @property {string} assignmentId
 * @property {number} sessionLength
 * @property {number} gapTime
 * @property {number} examinersPerSession
 * @property {boolean} isConfigured
 */

/**
 * @typedef {Object} TimeSlot
 * @property {number} id
 * @property {string} date              // YYYY-MM-DD
 * @property {string} startTime         // HH:mm 24h
 * @property {string} endTime           // HH:mm 24h
 * @property {string} venue
 * @property {number} requiredExaminers
 * @property {number} sessionCount
 * @property {"empty"|"partial"|"full"} status
 * @property {Array<{id:number,name:string,email?:string}>} assignedExaminers
 */

/**
 * @typedef {Object} Examiner
 * @property {number} id
 * @property {string} name
 * @property {string} [email]
 * @property {string} [avatar]
 * @property {number} maxSessions
 * @property {number} [assignments] - Current assignment count
 */

/**
 * @typedef {Object} CalendarDay
 * @property {number} slotCount
 * @property {"empty"|"partial"|"full"} status
 * @property {number} totalSessions
 */

/**
 * @typedef {Object.<string, CalendarDay>} CalendarData
 * Calendar data object with date strings (YYYY-MM-DD) as keys
 */

/**
 * @typedef {Object} ScheduleStatus
 * @property {number} totalSlots
 * @property {number} fullyStaffedSlots
 * @property {number} partiallyStaffedSlots
 * @property {number} unstaffedSlots
 * @property {boolean} canRelease
 * @property {Array<string>} [issues]
 */

/**
 * @typedef {Object} ServiceResponse
 * @property {boolean} success
 * @property {*} data
 * @property {string} message
 * @property {Array<string>} [errors]
 */

export {}; // Make this a module