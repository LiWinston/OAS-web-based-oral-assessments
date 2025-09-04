/**
 * Real API Implementation for Examiner Assessment Service (TEMPLATE)
 * 
 * This file is prepared for backend integration.
 * When backend is ready:
 * 1. Delete examinerAssessmentService.mock.js
 * 2. Rename this file to examinerAssessmentService.js (replacing the current mock version)
 * 3. Remove all mock-related code
 * 
 * Following the API contract in Docs/API/Examiner-Assessment-API-Contracts.md
 */

import apiClient from './apiClient';

const examinerAssessmentServiceReal = {
  /**
   * Get list of sessions to mark for an examiner
   * GET /api/examiners/{examinerId}/assignments/{assignmentId}/marking-sessions
   * 
   * @param {number} examinerId - The examiner's ID
   * @param {number} assignmentId - The assignment ID
   * @param {object} params - Query parameters (status, startDate, endDate, etc.)
   * @returns {Promise} API response with marking sessions
   */
  async getMarkingSessions(examinerId, assignmentId, params = {}) {
    try {
      const response = await apiClient.get(
        `/api/examiners/${examinerId}/assignments/${assignmentId}/marking-sessions`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching marking sessions:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch marking sessions',
        error: error.response?.data
      };
    }
  },

  /**
   * Get session context for marking
   * GET /api/marking/sessions/{sessionId}/context
   * 
   * @param {number} sessionId - The session ID
   * @param {number} examinerId - The examiner's ID
   * @returns {Promise} API response with session context
   */
  async getSessionContext(sessionId, examinerId) {
    try {
      const response = await apiClient.get(
        `/api/marking/sessions/${sessionId}/context`,
        { params: { examinerId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching session context:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch session context',
        error: error.response?.data
      };
    }
  },

  /**
   * Save draft assessment
   * POST /api/marking/sessions/{sessionId}/assessments
   * 
   * @param {number} sessionId - The session ID
   * @param {object} assessmentData - The assessment data to save
   * @returns {Promise} API response with saved assessment info
   */
  async saveDraft(sessionId, assessmentData) {
    try {
      const response = await apiClient.post(
        `/api/marking/sessions/${sessionId}/assessments`,
        assessmentData
      );
      return response.data;
    } catch (error) {
      console.error('Error saving draft:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to save draft',
        error: error.response?.data
      };
    }
  },

  /**
   * Submit assessment (finalize)
   * PATCH /api/marking/sessions/{sessionId}/assessments/{assessmentId}
   * 
   * @param {number} sessionId - The session ID
   * @param {string} assessmentId - The assessment ID
   * @returns {Promise} API response with submission confirmation
   */
  async submitAssessment(sessionId, assessmentId) {
    try {
      const response = await apiClient.patch(
        `/api/marking/sessions/${sessionId}/assessments/${assessmentId}`,
        { status: "SUBMITTED" }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting assessment:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to submit assessment',
        error: error.response?.data
      };
    }
  },

  /**
   * Get current examiner's assessment
   * GET /api/marking/sessions/{sessionId}/assessments
   * 
   * @param {number} sessionId - The session ID
   * @param {number} examinerId - The examiner's ID
   * @returns {Promise} API response with assessment data
   */
  async getExaminerAssessment(sessionId, examinerId) {
    try {
      const response = await apiClient.get(
        `/api/marking/sessions/${sessionId}/assessments`,
        { params: { examinerId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching examiner assessment:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch assessment',
        error: error.response?.data
      };
    }
  },

  /**
   * Get predefined comments for a criterion and level
   * GET /api/assignments/{assignmentId}/rubric/comments
   * 
   * @param {number} assignmentId - The assignment ID
   * @param {string} criterionId - The criterion ID
   * @param {string} levelId - The level ID
   * @returns {Promise} API response with predefined comments
   */
  async getPredefinedComments(assignmentId, criterionId, levelId) {
    try {
      const response = await apiClient.get(
        `/api/assignments/${assignmentId}/rubric/comments`,
        { params: { criterionId, levelId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching predefined comments:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch comments',
        error: error.response?.data
      };
    }
  },

  /**
   * Add predefined comment
   * POST /api/assignments/{assignmentId}/rubric/comments
   * 
   * @param {number} assignmentId - The assignment ID
   * @param {string} criterionId - The criterion ID
   * @param {string} levelId - The level ID
   * @param {string} text - The comment text
   * @returns {Promise} API response with new comment
   */
  async addPredefinedComment(assignmentId, criterionId, levelId, text) {
    try {
      const response = await apiClient.post(
        `/api/assignments/${assignmentId}/rubric/comments`,
        { criterionId, levelId, text }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding predefined comment:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to add comment',
        error: error.response?.data
      };
    }
  },

  /**
   * Reopen submission (Admin only)
   * POST /api/marking/sessions/{sessionId}/assessments/{assessmentId}:reopen
   * 
   * @param {number} sessionId - The session ID
   * @param {string} assessmentId - The assessment ID
   * @returns {Promise} API response with reopened status
   */
  async reopenAssessment(sessionId, assessmentId) {
    try {
      const response = await apiClient.post(
        `/api/marking/sessions/${sessionId}/assessments/${assessmentId}:reopen`
      );
      return response.data;
    } catch (error) {
      console.error('Error reopening assessment:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to reopen assessment',
        error: error.response?.data
      };
    }
  },

  /**
   * Compute totals (optional server-side helper)
   * POST /api/marking/assessments/{assessmentId}:compute
   * 
   * @param {string} assessmentId - The assessment ID
   * @returns {Promise} API response with computation status
   */
  async computeTotals(assessmentId) {
    try {
      const response = await apiClient.post(
        `/api/marking/assessments/${assessmentId}:compute`
      );
      return response.data;
    } catch (error) {
      console.error('Error computing totals:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to compute totals',
        error: error.response?.data
      };
    }
  },

  /**
   * Get all assessments for a session (for viewing co-examiner marks)
   * GET /api/marking/sessions/{sessionId}/all-assessments
   * 
   * @param {number} sessionId - The session ID
   * @returns {Promise} API response with all assessments
   */
  async getAllAssessments(sessionId) {
    try {
      const response = await apiClient.get(
        `/api/marking/sessions/${sessionId}/all-assessments`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching all assessments:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch all assessments',
        error: error.response?.data
      };
    }
  },

  /**
   * Export assessment results
   * GET /api/assignments/{assignmentId}/export
   * 
   * @param {number} assignmentId - The assignment ID
   * @param {string} format - Export format (csv, pdf, excel)
   * @returns {Promise} File download
   */
  async exportResults(assignmentId, format = 'csv') {
    try {
      const response = await apiClient.get(
        `/api/assignments/${assignmentId}/export`,
        { 
          params: { format },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assessment-results-${assignmentId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, code: 'OK' };
    } catch (error) {
      console.error('Error exporting results:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to export results',
        error: error.response?.data
      };
    }
  }
};

export default examinerAssessmentServiceReal;