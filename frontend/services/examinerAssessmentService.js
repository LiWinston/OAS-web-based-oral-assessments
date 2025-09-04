/**
 * Examiner Assessment Service (USING MOCK DATA)
 * 
 * This service currently uses mock data for development.
 * When backend is ready:
 * 1. Replace this file with examinerAssessmentService.real.js
 * 2. Delete examinerAssessmentService.mock.js
 * 
 * Following the API contract in Docs/API/Examiner-Assessment-API-Contracts.md
 */

import {
  mockMarkingSessionsMixed,
  mockMarkingSessionsIndividual,
  mockMarkingSessionsGroup,
  mockSessionContext,
  mockDraftAssessment,
  buildIndividualContext,
  buildGroupContext
} from './examinerAssessmentService.mock';

const examinerAssessmentService = {
  /**
   * Get list of sessions to mark for an examiner
   * GET /api/examiners/{examinerId}/assignments/{assignmentId}/marking-sessions
   */
  async getMarkingSessions(examinerId, assignmentId, params = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return different mock data based on assignmentId
    let payload = mockMarkingSessionsMixed;
    if (Number(assignmentId) === 102) payload = mockMarkingSessionsIndividual;
    if (Number(assignmentId) === 103) payload = mockMarkingSessionsGroup;
    
    return { success: true, code: 'OK', data: payload };
  },

  /**
   * Get session context for marking
   * GET /api/marking/sessions/{sessionId}/context
   */
  async getSessionContext(sessionId, examinerId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Mixed session (unmarked)
    if (Number(sessionId) === 90011) {
      return { success: true, code: 'OK', data: mockSessionContext };
    }
    
    // Individual session (draft)
    if (Number(sessionId) === 90012) {
      const ctx = buildIndividualContext();
      const draft = JSON.parse(JSON.stringify(mockDraftAssessment));
      draft.assignmentId = 102;
      draft.sessionId = 90012;
      draft.status = 'DRAFT';
      draft.entities = draft.entities.filter(e => e.kind === 'INDIVIDUAL');
      ctx.existingAssessment = draft;
      return { success: true, code: 'OK', data: ctx };
    }
    
    // Group session (submitted)
    if (Number(sessionId) === 90013) {
      const ctx = buildGroupContext();
      const submitted = {
        assessmentId: 'A-777',
        assignmentId: 103,
        sessionId: 90013,
        examinerId: 33,
        status: 'SUBMITTED',
        revision: 1,
        entities: mockDraftAssessment.entities.filter(e => e.kind === 'GROUP'),
        totals: { groupScore: mockDraftAssessment.totals.groupScore },
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      ctx.existingAssessment = submitted;
      return { success: true, code: 'OK', data: ctx };
    }
    
    return { success: true, code: 'OK', data: mockSessionContext };
  },

  /**
   * Save draft assessment
   * POST /api/marking/sessions/{sessionId}/assessments
   */
  async saveDraft(sessionId, assessmentData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log('[MOCK] Saving draft assessment:', assessmentData);
    
    return {
      success: true,
      code: 'OK',
      data: {
        assessmentId: "A-901",
        status: "DRAFT",
        revision: 2,
        updatedAt: new Date().toISOString()
      }
    };
  },

  /**
   * Submit assessment (finalize)
   * PATCH /api/marking/sessions/{sessionId}/assessments/{assessmentId}
   */
  async submitAssessment(sessionId, assessmentId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    console.log('[MOCK] Submitting assessment:', { sessionId, assessmentId });
    
    return {
      success: true,
      code: 'OK',
      data: {
        assessmentId: assessmentId,
        status: "SUBMITTED",
        submittedAt: new Date().toISOString()
      }
    };
  },

  /**
   * Get current examiner's assessment
   * GET /api/marking/sessions/{sessionId}/assessments
   */
  async getExaminerAssessment(sessionId, examinerId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return different mock data based on sessionId
    if (Number(sessionId) === 90011) {
      return { success: true, code: 'OK', data: null };
    }
    
    if (Number(sessionId) === 90012) {
      const draft = JSON.parse(JSON.stringify(mockDraftAssessment));
      draft.assignmentId = 102;
      draft.sessionId = 90012;
      draft.status = 'DRAFT';
      draft.entities = draft.entities.filter(e => e.kind === 'INDIVIDUAL');
      return { success: true, code: 'OK', data: draft };
    }
    
    if (Number(sessionId) === 90013) {
      const submitted = {
        assessmentId: 'A-777',
        assignmentId: 103,
        sessionId: 90013,
        examinerId: 33,
        status: 'SUBMITTED',
        revision: 1,
        entities: mockDraftAssessment.entities.filter(e => e.kind === 'GROUP'),
        totals: { groupScore: mockDraftAssessment.totals.groupScore },
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return { success: true, code: 'OK', data: submitted };
    }
    
    return { success: true, code: 'OK', data: null };
  },

  /**
   * Get predefined comments for a criterion and level
   * GET /api/assignments/{assignmentId}/rubric/comments
   */
  async getPredefinedComments(assignmentId, criterionId, levelId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const comments = mockSessionContext.predefinedComments[criterionId]?.[levelId] || [];
    return {
      success: true,
      code: 'OK',
      data: { comments }
    };
  },

  /**
   * Add predefined comment
   * POST /api/assignments/{assignmentId}/rubric/comments
   */
  async addPredefinedComment(assignmentId, criterionId, levelId, text) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('[MOCK] Adding predefined comment:', { assignmentId, criterionId, levelId, text });
    
    return {
      success: true,
      code: 'OK',
      data: {
        id: `P${Date.now()}`,
        text,
        createdBy: 33,
        createdAt: new Date().toISOString()
      }
    };
  },

  /**
   * Reopen submission (Admin only)
   * POST /api/marking/sessions/{sessionId}/assessments/{assessmentId}:reopen
   */
  async reopenAssessment(sessionId, assessmentId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('[MOCK] Reopening assessment:', { sessionId, assessmentId });
    
    return {
      success: true,
      code: 'OK',
      data: {
        assessmentId,
        status: "REOPENED"
      }
    };
  },

  /**
   * Compute totals (optional server-side helper)
   * POST /api/marking/assessments/{assessmentId}:compute
   */
  async computeTotals(assessmentId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    console.log('[MOCK] Computing totals for assessment:', assessmentId);
    
    return {
      success: true,
      code: 'OK',
      data: { updated: true }
    };
  }
};

// Log that we're using mock data
if (typeof window !== 'undefined') {
  console.log('[ExaminerAssessmentService] Using MOCK data - Replace with real API when backend is ready');
}

export default examinerAssessmentService;