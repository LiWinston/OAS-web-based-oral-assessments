/**
 * Course Admin Timeslot Service
 * 
 * Unified interface for timeslot management operations.
 * Automatically switches between real and mock implementations based on configuration.
 */

export { courseAdminTimeslotService, USE_MOCKS } from './serviceFactory';

/**
 * Service Interface Documentation
 * 
 * All methods return a consistent response format:
 * {
 *   success: boolean,
 *   data: any,
 *   message: string,
 *   errors?: string[] // Optional, only for error responses
 * }
 * 
 * Available Methods:
 * 
 * - getSessionConfig(assignmentId): Get session configuration
 * - saveSessionConfig(assignmentId, body): Save session configuration
 * - getCalendar(assignmentId, month): Get calendar data for month (YYYY-MM format)
 * - createTimeSlotsBatch(assignmentId, { timeSlots }): Create multiple time slots
 * - getTimeSlots(assignmentId, filters?): Get time slots with optional filtering
 * - updateTimeSlot(assignmentId, timeSlotId, body): Update specific time slot
 * - deleteTimeSlots(assignmentId, ids): Delete multiple time slots by IDs
 * - duplicateTimeSlot(assignmentId, timeSlotId, body?): Duplicate time slot
 * - getExaminers(assignmentId): Get available examiners
 * - updateExaminerLimits(assignmentId, limits): Update examiner session limits
 * - getScheduleStatus(assignmentId): Get schedule status for release validation
 * - releaseSchedule(assignmentId, payload?): Release schedule to students
 */