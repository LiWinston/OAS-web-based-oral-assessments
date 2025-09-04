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
  async getMarkingSessions(examinerId, assignmentId, params = {}) {
    await delay(300);
    const id = Number(assignmentId);
    const bucket = id === 102 ? sessionsByAssignment.individual : id === 103 ? sessionsByAssignment.group : sessionsByAssignment.mixed;
    return { success: true, code: 'OK', data: bucket };
  },

  async getSessionContext(sessionId, examinerId) {
    await delay(350);
    const id = Number(sessionId);
    if (id === 90011) {
      // mixed, unmarked
      return { success: true, code: 'OK', data: buildBaseContext('mixed') };
    }
    if (id === 90012) {
      // individual draft
      const ctx = buildBaseContext('individual');
      ctx.existingAssessment = buildDraftAssessment('individual');
      return { success: true, code: 'OK', data: ctx };
    }
    if (id === 90013) {
      // group submitted
      const ctx = buildBaseContext('group');
      ctx.existingAssessment = {
        ...buildDraftAssessment('group'),
        assessmentId: 'A-777',
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
      };
      return { success: true, code: 'OK', data: ctx };
    }
    // default to mixed
    return { success: true, code: 'OK', data: buildBaseContext('mixed') };
  },

  async saveDraft(sessionId, assessmentData) {
    await delay(400);
    const id = String(sessionId);
    const draftId = DB.drafts.get(id)?.assessmentId || `A-${Date.now()}`;
    DB.drafts.set(id, { assessmentId: draftId, status: 'DRAFT', revision: (DB.drafts.get(id)?.revision || 1) + 1, updatedAt: new Date().toISOString(), payload: assessmentData });
    return { success: true, code: 'OK', data: { assessmentId: draftId, status: 'DRAFT', revision: DB.drafts.get(id).revision, updatedAt: DB.drafts.get(id).updatedAt } };
  },

  async submitAssessment(sessionId, assessmentId) {
    await delay(350);
    const id = String(sessionId);
    const existing = DB.drafts.get(id) || { assessmentId };
    const submittedAt = new Date().toISOString();
    DB.drafts.set(id, { ...existing, assessmentId: existing.assessmentId || assessmentId, status: 'SUBMITTED', submittedAt });
    return { success: true, code: 'OK', data: { assessmentId: DB.drafts.get(id).assessmentId, status: 'SUBMITTED', submittedAt } };
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

