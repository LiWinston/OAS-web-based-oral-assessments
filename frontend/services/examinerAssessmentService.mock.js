/**
 * Examiner Assessment Service (MOCK IMPLEMENTATION)
 *
 * Provides in-memory mock data and API-like methods for the examiner
 * assessment flows until the backend is ready. The real implementation
 * is in `examinerAssessmentService.real.js` and can be switched on via
 * env flag in `examinerAssessmentService.js`.
 */

// Utility delay to simulate network
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Mock rubric used across sessions
const mockRubric = {
  id: 'R-101',
  criteria: [
    {
      criterionId: 'C1',
      description: 'Problem Understanding',
      weight: 30,
      appliesTo: 'BOTH',
      levels: [
        { levelId: 'L1', minPoints: 0, maxPoints: 50, description: 'Basic - limited grasp' },
        { levelId: 'L2', minPoints: 51, maxPoints: 75, description: 'Good - solid grasp' },
        { levelId: 'L3', minPoints: 76, maxPoints: 100, description: 'Excellent - deep insight' },
      ],
    },
    {
      criterionId: 'C2',
      description: 'Technical Approach',
      weight: 40,
      appliesTo: 'BOTH',
      levels: [
        { levelId: 'L1', minPoints: 0, maxPoints: 50, description: 'Basic approach' },
        { levelId: 'L2', minPoints: 51, maxPoints: 75, description: 'Appropriate and sound' },
        { levelId: 'L3', minPoints: 76, maxPoints: 100, description: 'Innovative and rigorous' },
      ],
    },
    {
      criterionId: 'C3',
      description: 'Communication',
      weight: 30,
      appliesTo: 'BOTH',
      levels: [
        { levelId: 'L1', minPoints: 0, maxPoints: 50, description: 'Unclear or incomplete' },
        { levelId: 'L2', minPoints: 51, maxPoints: 75, description: 'Clear and adequate' },
        { levelId: 'L3', minPoints: 76, maxPoints: 100, description: 'Highly effective' },
      ],
    },
  ],
};

// In-memory DB
const DB = {
  predefined: {
    // criterionId -> levelId -> [comments]
    C1: {
      L1: [ { id: 'PC1-1', text: 'Shows limited understanding of requirements' } ],
      L2: [ { id: 'PC1-2', text: 'Understands most requirements with minor gaps' } ],
      L3: [ { id: 'PC1-3', text: 'Thorough grasp of the problem space' } ],
    },
    C2: {
      L2: [ { id: 'PC2-2', text: 'Reasonable trade-offs considered' } ],
      L3: [ { id: 'PC2-3', text: 'Excellent architecture and justification' } ],
    },
    C3: {
      L2: [ { id: 'PC3-2', text: 'Clear and structured presentation' } ],
      L3: [ { id: 'PC3-3', text: 'Exceptional clarity and engagement' } ],
    },
  },
  drafts: new Map(), // key: sessionId -> draft object
};

function isoPlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// Example sessions by assignment type
const sessionsByAssignment = {
  mixed: {
    assignment: { id: 101, name: 'Project Presentation', type: 'mixed' },
    sessions: [
      { sessionId: 90011, start: isoPlusDays(0), end: isoPlusDays(0), status: 'unmarked', entity: { kind: 'GROUP', members: 3 }, coExaminers: [ { name: 'Dr. Lee' } ] },
      { sessionId: 90012, start: isoPlusDays(1), end: isoPlusDays(1), status: 'draft', entity: { kind: 'INDIVIDUAL' }, coExaminers: [ { name: 'Prof. Wang' } ] },
      { sessionId: 90013, start: isoPlusDays(2), end: isoPlusDays(2), status: 'submitted', entity: { kind: 'GROUP', members: 4 }, coExaminers: [ { name: 'Dr. Smith' } ] },
    ],
  },
  individual: {
    assignment: { id: 102, name: 'Code Review', type: 'individual' },
    sessions: [
      { sessionId: 90021, start: isoPlusDays(1), end: isoPlusDays(1), status: 'unmarked', entity: { kind: 'INDIVIDUAL' } },
      { sessionId: 90022, start: isoPlusDays(2), end: isoPlusDays(2), status: 'draft', entity: { kind: 'INDIVIDUAL' } },
    ],
  },
  group: {
    assignment: { id: 103, name: 'Team Demo', type: 'group' },
    sessions: [
      { sessionId: 90031, start: isoPlusDays(3), end: isoPlusDays(3), status: 'unmarked', entity: { kind: 'GROUP', members: 5 } },
      { sessionId: 90032, start: isoPlusDays(4), end: isoPlusDays(4), status: 'submitted', entity: { kind: 'GROUP', members: 5 } },
    ],
  },
};

function buildBaseContext(type = 'mixed') {
  const individuals = [
    { studentId: 2001, name: 'Alice Chen' },
    { studentId: 2002, name: 'Bob Lee' },
    { studentId: 2003, name: 'Charlie Kim' },
  ];
  const entity = type === 'group'
    ? { kind: 'GROUP', groupId: 'G-10', groupName: 'Team Alpha', members: 3 }
    : type === 'individual'
      ? { kind: 'INDIVIDUAL', individuals: [ individuals[0] ] }
      : { kind: 'MIXED', individuals };
  return {
    assignment: {
      id: type === 'individual' ? 102 : type === 'group' ? 103 : 101,
      name: type === 'individual' ? 'Code Review' : type === 'group' ? 'Team Demo' : 'Project Presentation',
      type,
      rubric: { ...mockRubric },
    },
    entity,
    predefinedComments: DB.predefined,
  };
}

function buildDraftAssessment(type = 'mixed') {
  const base = {
    assessmentId: 'A-901',
    status: 'DRAFT',
    revision: 1,
    updatedAt: new Date().toISOString(),
    entities: [],
  };
  if (type === 'group' || type === 'mixed') {
    base.entities.push({
      kind: 'GROUP',
      items: [
        { criterionId: 'C1', levelId: 'L2', points: 65, comments: [ { text: 'Solid understanding' } ] },
        { criterionId: 'C2', levelId: 'L2', points: 70, comments: [] },
      ],
      overallFeedback: 'Good progress so far',
      notes: 'Consider deeper analysis in part 2',
    });
  }
  if (type === 'individual' || type === 'mixed') {
    base.entities.push({
      kind: 'INDIVIDUAL',
      studentId: 2001,
      items: [
        { criterionId: 'C1', levelId: 'L2', points: 60, comments: [] },
        { criterionId: 'C3', levelId: 'L2', points: 70, comments: [ { text: 'Clear explanation' } ] },
      ],
    });
  }
  return base;
}

const examinerAssessmentServiceMock = {
  async getAssessmentsList(examinerId, filters = {}) {
    await delay(300);
    // Mock data that matches the backend JSON structure
    const mockAssessments = [
      {
        submissionId: 12,
        assignmentId: 1,
        sessionId: 623,
        subjectType: "GROUP",
        subjectId: 1,
        examinerId: 5,
        status: "SUBMITTED",
        overallFeedback: "Good work",
        totalScore: 82.5,
        submittedAt: "2025-09-14T16:13:42",
        updatedAt: "2025-09-14T16:13:42",
        rubricMetaSnapshot: JSON.stringify({
          name: "Requirements Analysis Rubric",
          description: "Evaluation of requirements documentation quality",
          totalPoints: 100
        }),
        rubricsInfoSnapshot: JSON.stringify([
          {
            weight: 50.0,
            scaleType: "points",
            description: "Communication Skills1",
            performanceLevel: [
              { endPoint: 100.0, startPoint: 85.0, description: "Excellent" },
              { endPoint: 84.0, startPoint: 70.0, description: "Good" },
              { endPoint: 69.0, startPoint: 60.0, description: "Medium" }
            ]
          },
          {
            weight: 50.0,
            scaleType: "descriptive",
            description: "New Criterion1",
            performanceLevel: [
              { endPoint: 89.0, startPoint: 80.0, description: "Very Good" },
              { endPoint: 79.0, startPoint: 70.0, description: "Good" },
              { endPoint: 69.0, startPoint: 60.0, description: "Satisfactory" },
              { endPoint: 59.0, startPoint: 0.0, description: "Needs Improvement" }
            ]
          }
        ]),
        scoresJson: JSON.stringify([
          {
            weight: 50.0,
            comment: "Well done",
            scaleType: "points",
            description: "Communication Skills1",
            inputPoints: 90.0,
            selectedLevel: null
          },
          {
            weight: 50.0,
            comment: "Pass",
            scaleType: "descriptive",
            description: "New Criterion1",
            inputPoints: 75.0,
            selectedLevel: {
              endPoint: 69.0,
              startPoint: 60.0,
              description: "Satisfactory"
            }
          }
        ])
      },
      {
        submissionId: 1,
        assignmentId: 3,
        sessionId: null,
        subjectType: "INDIVIDUAL",
        subjectId: 2,
        examinerId: 5,
        status: "SUBMITTED",
        overallFeedback: "ok",
        totalScore: 25,
        submittedAt: "2025-09-12T02:33:13",
        updatedAt: "2025-09-13T04:34:47",
        rubricMetaSnapshot: JSON.stringify({
          name: "Presentation Rubric",
          description: "Client presentation evaluation",
          totalPoints: 50
        }),
        rubricsInfoSnapshot: JSON.stringify({
          criteria: [
            {
              weight: 25,
              scaleType: "percentage",
              description: "Communication",
              performanceLevels: [{ level: "Excellent", points: 25 }]
            }
          ]
        }),
        scoresJson: JSON.stringify([
          {
            weight: null,
            comment: "Excellent",
            scaleType: "percentage",
            description: "Communication",
            inputPoints: 100.0,
            selectedLevel: null
          }
        ])
      },
      {
        submissionId: 13,
        assignmentId: 3,
        sessionId: null,
        subjectType: "INDIVIDUAL",
        subjectId: 2,
        examinerId: 5,
        status: "SUBMITTED",
        overallFeedback: "ok",
        totalScore: 25,
        submittedAt: "2025-09-12T02:33:13",
        updatedAt: "2025-09-13T04:34:47",
        rubricMetaSnapshot: JSON.stringify({
          name: "Presentation Rubric",
          description: "Client presentation evaluation",
          totalPoints: 50
        }),
        rubricsInfoSnapshot: JSON.stringify({
          criteria: [
            {
              weight: 25,
              scaleType: "percentage",
              description: "Communication",
              performanceLevels: [{ level: "Excellent", points: 25 }]
            }
          ]
        }),
        scoresJson: JSON.stringify([
          {
            weight: null,
            comment: "Excellent",
            scaleType: "percentage",
            description: "Communication",
            inputPoints: 100.0,
            selectedLevel: null
          }
        ])
      }
    ];
    
    return { success: true, code: 'OK', data: mockAssessments };
  },

  async getMarkingSessions(examinerId, assignmentId, params = {}) {
    await delay(300);
    const id = Number(assignmentId);
    const bucket = id === 102 ? sessionsByAssignment.individual : id === 103 ? sessionsByAssignment.group : sessionsByAssignment.mixed;
    return { success: true, code: 'OK', data: bucket };
  },

  async getSessionContext(submissionId, examinerId) {
    await delay(350);
    const id = Number(submissionId);
    
    // Mock data based on submission IDs from the backend
    if (id === 12) {
      // Group assessment - Requirements Analysis Rubric
      const ctx = buildBaseContext('group');
      ctx.assignment.name = 'Requirements Analysis Rubric';
      ctx.assignment.id = 1;
      ctx.entity = { kind: 'GROUP', groupId: 'G-10', groupName: 'Group Assessment', members: 1 };
      ctx.existingAssessment = {
        ...buildDraftAssessment('group'),
        assessmentId: 'A-12',
        status: 'SUBMITTED',
        submittedAt: '2025-09-14T16:13:42',
        totalScore: 82.5
      };
      return { success: true, code: 'OK', data: ctx };
    }
    if (id === 1) {
      // Individual assessment - Presentation Rubric  
      const ctx = buildBaseContext('individual');
      ctx.assignment.name = 'Presentation Rubric';
      ctx.assignment.id = 3;
      ctx.entity = { kind: 'INDIVIDUAL', individuals: [{ studentId: 2, name: 'Student 2' }] };
      ctx.existingAssessment = {
        ...buildDraftAssessment('individual'),
        assessmentId: 'A-1',
        status: 'SUBMITTED',
        submittedAt: '2025-09-12T02:33:13',
        totalScore: 25
      };
      return { success: true, code: 'OK', data: ctx };
    }
    if (id === 13) {
      // Another individual assessment
      const ctx = buildBaseContext('individual');
      ctx.assignment.name = 'Presentation Rubric';
      ctx.assignment.id = 3;
      ctx.entity = { kind: 'INDIVIDUAL', individuals: [{ studentId: 2, name: 'Student 2' }] };
      ctx.existingAssessment = {
        ...buildDraftAssessment('individual'),
        assessmentId: 'A-13',
        status: 'SUBMITTED',
        submittedAt: '2025-09-12T02:33:13',
        totalScore: 25
      };
      return { success: true, code: 'OK', data: ctx };
    }
    
    // Default: return individual assessment context for any other submission
    const ctx = buildBaseContext('individual');
    ctx.assignment.name = 'Assessment';
    ctx.assignment.id = 1;
    ctx.entity = { kind: 'INDIVIDUAL', individuals: [{ studentId: 2001, name: 'Alice Chen' }] };
    return { success: true, code: 'OK', data: ctx };
  },

  async saveDraft(submissionId, assessmentData) {
    await delay(400);
    const id = String(submissionId);
    const draftId = DB.drafts.get(id)?.assessmentId || `A-${Date.now()}`;
    DB.drafts.set(id, { 
      assessmentId: draftId, 
      status: 'DRAFT', 
      revision: (DB.drafts.get(id)?.revision || 1) + 1, 
      updatedAt: new Date().toISOString(), 
      payload: assessmentData,
      submissionId 
    });
    return { 
      success: true, 
      code: 'OK', 
      data: { 
        assessmentId: draftId, 
        status: 'DRAFT', 
        revision: DB.drafts.get(id).revision, 
        updatedAt: DB.drafts.get(id).updatedAt,
        submissionId 
      } 
    };
  },

  async submitAssessment(submissionId, assessmentData) {
    await delay(350);
    const id = String(submissionId);
    const existing = DB.drafts.get(id) || { assessmentId: assessmentData.assessmentId || `A-${Date.now()}` };
    const submittedAt = new Date().toISOString();
    DB.drafts.set(id, { 
      ...existing, 
      assessmentId: existing.assessmentId || assessmentData.assessmentId, 
      status: 'SUBMITTED', 
      submittedAt,
      submissionId
    });
    return { 
      success: true, 
      code: 'OK', 
      data: { 
        assessmentId: DB.drafts.get(id).assessmentId, 
        status: 'SUBMITTED', 
        submittedAt,
        submissionId 
      } 
    };
  },

  async getExaminerAssessment(sessionId, examinerId) {
    await delay(250);
    const id = String(sessionId);
    const draft = DB.drafts.get(id);
    return { success: true, code: 'OK', data: draft ? { ...draft } : null };
  },

  async getPredefinedComments(assignmentId, criterionId, levelId) {
    await delay(200);
    const list = DB.predefined?.[criterionId]?.[levelId] || [];
    return { success: true, code: 'OK', data: { comments: list } };
  },

  async addPredefinedComment(assignmentId, criterionId, levelId, text) {
    await delay(300);
    const id = `P${Date.now()}`;
    DB.predefined[criterionId] = DB.predefined[criterionId] || {};
    DB.predefined[criterionId][levelId] = DB.predefined[criterionId][levelId] || [];
    DB.predefined[criterionId][levelId].push({ id, text, createdAt: new Date().toISOString() });
    return { success: true, code: 'OK', data: { id, text } };
  },

  async reopenAssessment(sessionId, assessmentId) {
    await delay(250);
    const id = String(sessionId);
    const rec = DB.drafts.get(id);
    if (rec) {
      rec.status = 'REOPENED';
      rec.revision = (rec.revision || 1) + 1;
      DB.drafts.set(id, rec);
    }
    return { success: true, code: 'OK', data: { assessmentId: assessmentId || rec?.assessmentId, status: 'REOPENED' } };
  },

  async computeTotals(assessmentId) {
    await delay(150);
    return { success: true, code: 'OK', data: { updated: true } };
  },

  async getAllAssessments(sessionId) {
    await delay(150);
    return { success: true, code: 'OK', data: [] };
  },

  async exportResults(assignmentId, format = 'csv') {
    await delay(200);
    return { success: true, code: 'OK' };
  },
};

if (typeof window !== 'undefined') {
  console.log('[ExaminerAssessmentService] Using MOCK implementation');
}

export default examinerAssessmentServiceMock;

