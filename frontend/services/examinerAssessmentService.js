/**
 * Examiner Assessment Service
 * Handles all API interactions for examiner assessment marking functionality
 * Following the API contract in Docs/API/Examiner-Assessment-API-Contracts.md
 */

import apiClient from './apiClient';

// Use mock data if environment variable is set
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

// Mock sessions for three assignments (mixed, individual, group)
const mockMarkingSessionsMixed = {
  assignment: { id: 101, name: "Final Project Defense (Mixed)", type: "mixed" },
  sessions: [
    {
      sessionId: 90011,
      slotId: 5001,
      start: "2025-04-14T10:00:00+10:00",
      end: "2025-04-14T10:30:00+10:00",
      timezone: "Australia/Melbourne",
      entity: { kind: "GROUP", groupId: 501, members: 4 },
      status: "unmarked",
      coExaminers: [{ examinerId: 44, name: "Dr. Sarah Mitchell" }]
    }
  ]
};

const mockMarkingSessionsIndividual = {
  assignment: { id: 102, name: "Midterm Oral (Individual)", type: "individual" },
  sessions: [
    {
      sessionId: 90012,
      slotId: 5002,
      start: "2025-04-14T10:30:00+10:00",
      end: "2025-04-14T11:00:00+10:00",
      timezone: "Australia/Melbourne",
      entity: { kind: "INDIVIDUAL", studentId: 201, name: "Alex Chen" },
      status: "draft",
      coExaminers: [{ examinerId: 44, name: "Dr. Sarah Mitchell" }]
    }
  ]
};

const mockMarkingSessionsGroup = {
  assignment: { id: 103, name: "Capstone Presentation (Group)", type: "group" },
  sessions: [
    {
      sessionId: 90013,
      slotId: 5003,
      start: "2025-04-14T11:00:00+10:00",
      end: "2025-04-14T11:30:00+10:00",
      timezone: "Australia/Melbourne",
      entity: { kind: "GROUP", groupId: 701, members: 3 },
      status: "submitted",
      coExaminers: [{ examinerId: 45, name: "Prof. James Wilson" }]
    }
  ]
};

const mockSessionContext = {
  assignment: {
    id: 101,
    name: "Final Project Defense",
    type: "mixed",
    groupWeight: 0.6,
    individualWeight: 0.4,
    rubricMeta: { 
      name: "Software Project Oral Assessment", 
      description: "Comprehensive assessment for final project presentation",
      totalPoints: 100 
    },
    rubric: {
      criteria: [
        {
          criterionId: "C1",
          description: "Content & Structure",
          weight: 25,
          markingScale: "descriptive",
          appliesTo: "GROUP",
          levels: [
            { levelId: "L1", description: "Poor - Incomplete, disorganized", minPoints: 0, maxPoints: 49 },
            { levelId: "L2", description: "Fair - Basic coverage, weak structure", minPoints: 50, maxPoints: 59 },
            { levelId: "L3", description: "Good - Solid content, clear structure", minPoints: 60, maxPoints: 74 },
            { levelId: "L4", description: "Very Good - Comprehensive, well-structured", minPoints: 75, maxPoints: 89 },
            { levelId: "L5", description: "Excellent - Exceptional, perfectly structured", minPoints: 90, maxPoints: 100 }
          ]
        },
        {
          criterionId: "C2",
          description: "Clarity & Communication",
          weight: 25,
          markingScale: "descriptive",
          appliesTo: "GROUP",
          levels: [
            { levelId: "L1", description: "Poor - Unclear, difficult to follow", minPoints: 0, maxPoints: 49 },
            { levelId: "L2", description: "Fair - Sometimes clear, inconsistent", minPoints: 50, maxPoints: 59 },
            { levelId: "L3", description: "Good - Mostly clear, effective communication", minPoints: 60, maxPoints: 74 },
            { levelId: "L4", description: "Very Good - Clear, highly effective", minPoints: 75, maxPoints: 89 },
            { levelId: "L5", description: "Excellent - Exceptionally clear, engaging", minPoints: 90, maxPoints: 100 }
          ]
        },
        {
          criterionId: "C3",
          description: "Technical Demonstration",
          weight: 30,
          markingScale: "descriptive",
          appliesTo: "GROUP",
          levels: [
            { levelId: "L1", description: "Poor - Failed or severely limited demo", minPoints: 0, maxPoints: 49 },
            { levelId: "L2", description: "Fair - Basic demo with significant issues", minPoints: 50, maxPoints: 59 },
            { levelId: "L3", description: "Good - Effective demo with minor issues", minPoints: 60, maxPoints: 74 },
            { levelId: "L4", description: "Very Good - Smooth demo, no significant issues", minPoints: 75, maxPoints: 89 },
            { levelId: "L5", description: "Excellent - Flawless, impressive demonstration", minPoints: 90, maxPoints: 100 }
          ]
        },
        {
          criterionId: "C4",
          description: "Individual Contribution",
          weight: 20,
          markingScale: "descriptive",
          appliesTo: "INDIVIDUAL",
          levels: [
            { levelId: "L1", description: "Poor - Minimal contribution", minPoints: 0, maxPoints: 49 },
            { levelId: "L2", description: "Fair - Limited contribution", minPoints: 50, maxPoints: 59 },
            { levelId: "L3", description: "Good - Adequate contribution", minPoints: 60, maxPoints: 74 },
            { levelId: "L4", description: "Very Good - Strong contribution", minPoints: 75, maxPoints: 89 },
            { levelId: "L5", description: "Excellent - Outstanding contribution", minPoints: 90, maxPoints: 100 }
          ]
        }
      ]
    }
  },
  session: {
    sessionId: 90011,
    slotId: 5001,
    start: "2025-04-14T10:00:00+10:00",
    end: "2025-04-14T10:30:00+10:00",
    timezone: "Australia/Melbourne",
    venue: { venueId: 1, name: "Engineering Building", building: "Building 405", room: "Room 405" },
    coExaminers: [{ examinerId: 44, name: "Dr. Sarah Mitchell" }]
  },
  entity: {
    kind: "GROUP",
    group: {
      groupId: 501,
      groupName: "Team Innovate",
      members: [
        { studentId: 201, name: "Alex Chen", email: "alex.chen@student.unimelb.edu.au" },
        { studentId: 202, name: "Maria Rodriguez", email: "maria.rodriguez@student.unimelb.edu.au" },
        { studentId: 203, name: "David Kim", email: "david.kim@student.unimelb.edu.au" },
        { studentId: 204, name: "Sarah Johnson", email: "sarah.johnson@student.unimelb.edu.au" }
      ]
    },
    individuals: [
      { studentId: 201, name: "Alex Chen", email: "alex.chen@student.unimelb.edu.au" },
      { studentId: 202, name: "Maria Rodriguez", email: "maria.rodriguez@student.unimelb.edu.au" },
      { studentId: 203, name: "David Kim", email: "david.kim@student.unimelb.edu.au" },
      { studentId: 204, name: "Sarah Johnson", email: "sarah.johnson@student.unimelb.edu.au" }
    ]
  },
  predefinedComments: {
    "C1": {
      "L1": [
        { id: "P1", text: "Content is severely lacking and disorganized", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P2", text: "Major content gaps with no logical flow", createdBy: 9, createdAt: "2025-04-10T12:05:00Z" }
      ],
      "L2": [
        { id: "P3", text: "Basic content coverage but lacks depth", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P4", text: "Presentation structure needs significant improvement", createdBy: 9, createdAt: "2025-04-10T12:05:00Z" }
      ],
      "L3": [
        { id: "P5", text: "Well-structured presentation with good content coverage", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P6", text: "The presentation follows a logical order with appropriate transitions", createdBy: 9, createdAt: "2025-04-10T12:05:00Z" },
        { id: "P7", text: "Good balance between technical details and high-level concepts", createdBy: 33, createdAt: "2025-04-11T14:00:00Z" }
      ],
      "L4": [
        { id: "P8", text: "Very well organized with comprehensive content", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P9", text: "Excellent content depth with strong supporting details", createdBy: 33, createdAt: "2025-04-11T14:00:00Z" }
      ],
      "L5": [
        { id: "P10", text: "Exceptionally well-structured with outstanding depth", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P11", text: "Perfect organization with comprehensive and insightful content", createdBy: 9, createdAt: "2025-04-10T12:05:00Z" }
      ]
    },
    "C2": {
      "L3": [
        { id: "P12", text: "Clear explanations of technical concepts", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P13", text: "Good use of examples to illustrate key points", createdBy: 9, createdAt: "2025-04-10T12:05:00Z" }
      ]
    },
    "C3": {
      "L4": [
        { id: "P14", text: "Demonstration showcased all key functionality effectively", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P15", text: "Very smooth demo flow with only minor hiccups", createdBy: 9, createdAt: "2025-04-10T12:05:00Z" }
      ]
    },
    "C4": {
      "L3": [
        { id: "P16", text: "Demonstrated adequate understanding of their contribution", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P17", text: "Participated effectively in the presentation", createdBy: 33, createdAt: "2025-04-11T14:00:00Z" }
      ]
    }
  },
  existingAssessment: null
};

// Helpers to derive individual-only and group-only contexts from base
function buildIndividualContext() {
  const base = JSON.parse(JSON.stringify(mockSessionContext));
  base.assignment.id = 102;
  base.assignment.name = "Midterm Oral (Individual)";
  base.assignment.type = "individual";
  delete base.assignment.groupWeight;
  delete base.assignment.individualWeight;
  // entity should emphasize individual
  base.session.sessionId = 90012;
  base.session.slotId = 5002;
  base.entity.kind = "INDIVIDUAL";
  // keep individuals array; group not necessary for individual-only
  delete base.entity.group;
  return base;
}

function buildGroupContext() {
  const base = JSON.parse(JSON.stringify(mockSessionContext));
  base.assignment.id = 103;
  base.assignment.name = "Capstone Presentation (Group)";
  base.assignment.type = "group";
  delete base.assignment.groupWeight;
  delete base.assignment.individualWeight;
  // session mapping
  base.session.sessionId = 90013;
  base.session.slotId = 5003;
  // entity should be group-only
  base.entity.kind = "GROUP";
  delete base.entity.individuals;
  return base;
}

const mockDraftAssessment = {
  assessmentId: "A-901",
  assignmentId: 101,
  sessionId: 90011,
  examinerId: 33,
  status: "DRAFT",
  revision: 1,
  entities: [
    {
      kind: "GROUP",
      groupId: 501,
      overallFeedback: "The presentation has a good overall structure with logical flow between sections.",
      notes: "Team seemed nervous at the beginning but gained confidence. Technical demo was well-prepared.",
      items: [
        { 
          criterionId: "C1", 
          levelId: "L3", 
          points: 70,
          comments: [
            { source: "predefined", text: "Well-structured presentation with good content coverage", predefinedId: "P5" }
          ]
        },
        { 
          criterionId: "C2", 
          levelId: "L3", 
          points: 65,
          comments: [
            { source: "predefined", text: "Clear explanations of technical concepts", predefinedId: "P12" },
            { source: "custom", text: "Could improve eye contact with audience" }
          ]
        },
        { 
          criterionId: "C3", 
          levelId: "L4", 
          points: 85,
          comments: [
            { source: "predefined", text: "Demonstration showcased all key functionality effectively", predefinedId: "P14" }
          ]
        }
      ],
      computed: {
        rawPoints: 73.75,
        weightedScore: 44.25
      }
    },
    {
      kind: "INDIVIDUAL",
      studentId: 201,
      items: [
        { 
          criterionId: "C4", 
          levelId: "L4", 
          points: 80,
          comments: [
            { source: "custom", text: "Strong leadership and technical knowledge demonstrated" }
          ]
        }
      ],
      computed: {
        rawPoints: 80,
        weightedScore: 16
      }
    },
    {
      kind: "INDIVIDUAL",
      studentId: 202,
      items: [
        { 
          criterionId: "C4", 
          levelId: "L3", 
          points: 70,
          comments: [
            { source: "predefined", text: "Participated effectively in the presentation", predefinedId: "P17" }
          ]
        }
      ],
      computed: {
        rawPoints: 70,
        weightedScore: 14
      }
    },
    {
      kind: "INDIVIDUAL",
      studentId: 203,
      items: [
        { 
          criterionId: "C4", 
          levelId: "L3", 
          points: 72,
          comments: [
            { source: "custom", text: "Good technical contributions during Q&A" }
          ]
        }
      ],
      computed: {
        rawPoints: 72,
        weightedScore: 14.4
      }
    },
    {
      kind: "INDIVIDUAL",
      studentId: 204,
      items: [
        { 
          criterionId: "C4", 
          levelId: "L3", 
          points: 68,
          comments: [
            { source: "predefined", text: "Demonstrated adequate understanding of their contribution", predefinedId: "P16" }
          ]
        }
      ],
      computed: {
        rawPoints: 68,
        weightedScore: 13.6
      }
    }
  ],
  totals: {
    perStudent: [
      { studentId: 201, finalScore: 60.25 }, // 44.25 (group * 0.6) + 16 (individual * 0.4)
      { studentId: 202, finalScore: 58.25 },
      { studentId: 203, finalScore: 58.65 },
      { studentId: 204, finalScore: 57.85 }
    ],
    groupScore: 73.75
  },
  updatedAt: "2025-04-14T10:22:00+10:00"
};

const examinerAssessmentService = {
  /**
   * Get list of sessions to mark for an examiner
   * GET /api/examiners/{examinerId}/assignments/{assignmentId}/marking-sessions
   */
  async getMarkingSessions(examinerId, assignmentId, params = {}) {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      let payload = mockMarkingSessionsMixed;
      if (Number(assignmentId) === 102) payload = mockMarkingSessionsIndividual;
      if (Number(assignmentId) === 103) payload = mockMarkingSessionsGroup;
      return { success: true, code: 'OK', data: payload };
    }

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
        message: error.response?.data?.message || 'Failed to fetch marking sessions'
      };
    }
  },

  /**
   * Get session context for marking
   * GET /api/marking/sessions/{sessionId}/context
   */
  async getSessionContext(sessionId, examinerId) {
    if (USE_MOCK_DATA) {
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
        // Keep only individual entities
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
    }

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
        message: error.response?.data?.message || 'Failed to fetch session context'
      };
    }
  },

  /**
   * Save draft assessment
   * POST /api/marking/sessions/{sessionId}/assessments
   */
  async saveDraft(sessionId, assessmentData) {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 800));
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
    }

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
        message: error.response?.data?.message || 'Failed to save draft'
      };
    }
  },

  /**
   * Submit assessment (finalize)
   * PATCH /api/marking/sessions/{sessionId}/assessments/{assessmentId}
   */
  async submitAssessment(sessionId, assessmentId) {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 700));
      return {
        success: true,
        code: 'OK',
        data: {
          assessmentId: assessmentId,
          status: "SUBMITTED",
          submittedAt: new Date().toISOString()
        }
      };
    }

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
        message: error.response?.data?.message || 'Failed to submit assessment'
      };
    }
  },

  /**
   * Get current examiner's assessment
   * GET /api/marking/sessions/{sessionId}/assessments
   */
  async getExaminerAssessment(sessionId, examinerId) {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
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
    }

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
        message: error.response?.data?.message || 'Failed to fetch assessment'
      };
    }
  },

  /**
   * Get predefined comments for a criterion and level
   * GET /api/assignments/{assignmentId}/rubric/comments
   */
  async getPredefinedComments(assignmentId, criterionId, levelId) {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const comments = mockSessionContext.predefinedComments[criterionId]?.[levelId] || [];
      return {
        success: true,
        code: 'OK',
        data: { comments }
      };
    }

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
        message: error.response?.data?.message || 'Failed to fetch comments'
      };
    }
  },

  /**
   * Add predefined comment
   * POST /api/assignments/{assignmentId}/rubric/comments
   */
  async addPredefinedComment(assignmentId, criterionId, levelId, text) {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
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
    }

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
        message: error.response?.data?.message || 'Failed to add comment'
      };
    }
  },

  /**
   * Reopen submission (Admin only)
   * POST /api/marking/sessions/{sessionId}/assessments/{assessmentId}:reopen
   */
  async reopenAssessment(sessionId, assessmentId) {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        code: 'OK',
        data: {
          assessmentId,
          status: "REOPENED"
        }
      };
    }

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
        message: error.response?.data?.message || 'Failed to reopen assessment'
      };
    }
  },

  /**
   * Compute totals (optional server-side helper)
   * POST /api/marking/assessments/{assessmentId}:compute
   */
  async computeTotals(assessmentId) {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return {
        success: true,
        code: 'OK',
        data: { updated: true }
      };
    }

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
        message: error.response?.data?.message || 'Failed to compute totals'
      };
    }
  }
};

export default examinerAssessmentService;
