import apiClient from './apiClient.js';

/**
 * Real service implementation for Course Admin Timeslot management
 * Connects to Spring Boot backend APIs
 */

export const courseAdminTimeslotServiceReal = {
  /**
   * Get session configuration for an assignment
   */
  async getSessionConfig(assignmentId) {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}/session-config`);
      return {
        success: true,
        data: response.data,
        message: 'Session configuration retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to retrieve session configuration'
      };
    }
  },

  /**
   * Save session configuration
   */
  async saveSessionConfig(assignmentId, body) {
    try {
      const response = await apiClient.put(`/assignments/${assignmentId}/session-config`, body);
      return {
        success: true,
        data: response.data,
        message: 'Session configuration saved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to save session configuration'
      };
    }
  },

  /**
   * Get calendar data for a specific month
   */
  async getCalendar(assignmentId, month) {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}/calendar`, {
        params: { month }
      });
      return {
        success: true,
        data: response.data,
        message: 'Calendar data retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to retrieve calendar data'
      };
    }
  },

  /**
   * Create multiple time slots in batch
   */
  async createTimeSlotsBatch(assignmentId, { timeSlots }) {
    try {
      const response = await apiClient.post(`/assignments/${assignmentId}/timeslots/batch`, {
        timeSlots
      });
      return {
        success: true,
        data: response.data,
        message: 'Time slots created successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to create time slots',
        errors: error.response?.data?.errors || []
      };
    }
  },

  /**
   * Get time slots with optional filtering
   */
  async getTimeSlots(assignmentId, filters = {}) {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}/timeslots`, {
        params: filters
      });
      return {
        success: true,
        data: response.data,
        message: 'Time slots retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to retrieve time slots'
      };
    }
  },

  /**
   * Update a specific time slot
   */
  async updateTimeSlot(assignmentId, timeSlotId, body) {
    try {
      const response = await apiClient.put(`/assignments/${assignmentId}/timeslots/${timeSlotId}`, body);
      return {
        success: true,
        data: response.data,
        message: 'Time slot updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update time slot'
      };
    }
  },

  /**
   * Delete multiple time slots
   */
  async deleteTimeSlots(assignmentId, ids) {
    try {
      const response = await apiClient.delete(`/assignments/${assignmentId}/timeslots`, {
        data: { ids }
      });
      return {
        success: true,
        data: response.data,
        message: 'Time slots deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to delete time slots'
      };
    }
  },

  /**
   * Duplicate a time slot
   */
  async duplicateTimeSlot(assignmentId, timeSlotId, body = {}) {
    try {
      const response = await apiClient.post(`/assignments/${assignmentId}/timeslots/${timeSlotId}/duplicate`, body);
      return {
        success: true,
        data: response.data,
        message: 'Time slot duplicated successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to duplicate time slot'
      };
    }
  },

  /**
   * Get examiners for assignment
   */
  async getExaminers(assignmentId) {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}/examiners`);
      return {
        success: true,
        data: response.data,
        message: 'Examiners retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to retrieve examiners'
      };
    }
  },

  /**
   * Update examiner session limits
   */
  async updateExaminerLimits(assignmentId, limits) {
    try {
      const response = await apiClient.put(`/assignments/${assignmentId}/examiners/session-limits`, {
        limits
      });
      return {
        success: true,
        data: response.data,
        message: 'Examiner limits updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update examiner limits'
      };
    }
  },

  /**
   * Get schedule status for release validation
   */
  async getScheduleStatus(assignmentId) {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}/schedule/status`);
      return {
        success: true,
        data: response.data,
        message: 'Schedule status retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to retrieve schedule status'
      };
    }
  },

  /**
   * Release schedule to students
   */
  async releaseSchedule(assignmentId, payload = {}) {
    try {
      const response = await apiClient.post(`/assignments/${assignmentId}/schedule/release`, payload);
      return {
        success: true,
        data: response.data,
        message: 'Schedule released successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to release schedule',
        errors: error.response?.data?.errors || []
      };
    }
  }
};