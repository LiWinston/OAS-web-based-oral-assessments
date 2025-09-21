import apiClient from '@/services/apiClient.js';

const flag = process.env.NEXT_PUBLIC_USE_MOCK_API ?? 'true';
const USE_MOCKS = String(flag) !== 'false';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const wrapOk = (data) => ({ success: true, code: 'OK', data });

// ------------------------------
// Mock dataset helpers
// ------------------------------

const baseRubric = {
  rubricMetaInfo: {
    rubricId: 501,
    name: 'Oral Presentation Rubric',
    scale: 'points',
    maxPoints: 100,
  },
  criteria: [
    {
      criterionId: 'C1',
      title: 'Communication',
      weightOrPoints: 30,
      performanceLevels: [
        { levelId: 'L1', label: 'Competent', value: 18, description: 'Understands topic, some clarity issues' },
        { levelId: 'L2', label: 'Strong', value: 24, description: 'Clear articulation with minor gaps' },
        { levelId: 'L3', label: 'Excellent', value: 30, description: 'Confident, compelling delivery' },
      ],
    },
    {
      criterionId: 'C2',
      title: 'Technical Mastery',
      weightOrPoints: 40,
      performanceLevels: [
        { levelId: 'L1', label: 'Developing', value: 20, description: 'Fundamentals present, several gaps' },
        { levelId: 'L2', label: 'Proficient', value: 32, description: 'Solid reasoning with small issues' },
        { levelId: 'L3', label: 'Exceptional', value: 40, description: 'Deep evidence-based insight' },
      ],
    },
    {
      criterionId: 'C3',
      title: 'Engagement & Response',
      weightOrPoints: 30,
      performanceLevels: [
        { levelId: 'L1', label: 'Limited', value: 18 },
        { levelId: 'L2', label: 'Capable', value: 24 },
        { levelId: 'L3', label: 'Outstanding', value: 30 },
      ],
    },
  ],
};

const mockAssessments = new Map();

const recalcComputed = (detail) => {
  const manual = detail.computed?.manualOverride || null;
  const submitted = detail.examiners.filter((ex) => ex.assessmentStatus === 'SUBMITTED');
  let average = null;
  if (submitted.length > 0) {
    const total = submitted.reduce((sum, ex) => sum + (typeof ex.examinerScorePct1dp === 'number' ? ex.examinerScorePct1dp : 0), 0);
    average = Number((total / submitted.length).toFixed(1));
  }
  const effective = manual?.valuePct1dp ?? average;
  detail.computed = {
    averageScorePct1dp: average,
    effectiveFinalScorePct1dp: effective ?? null,
    ...(manual ? { manualOverride: manual } : {}),
  };
  return detail.computed;
};

const createDetail = ({
  submissionId,
  assignmentId,
  sessionId,
  entity,
  session,
  examiners,
  releaseStatus = 'NOT_RELEASED',
  manualOverride,
  releasedAt,
}) => {
  const assessment = {
    key: {
      assignmentId,
      sessionId,
      submissionId,
      kind: entity.kind,
      entityId: entity.kind === 'GROUP' ? entity.group.id : entity.student.id,
    },
    ...(entity.kind === 'GROUP' ? { group: entity.group } : { student: entity.student }),
  };

  const detail = {
    assessment,
    session,
    rubric: clone(baseRubric),
    examiners: examiners.map((ex, index) => ({
      ...ex,
      examinerId: ex.examinerId ?? (index + 1) * 10,
    })),
    computed: {},
    releaseStatus,
    ...(releasedAt ? { releasedAt } : {}),
  };

  if (manualOverride) {
    detail.computed.manualOverride = {
      valuePct1dp: Number(manualOverride.valuePct1dp),
      reason: manualOverride.reason,
      by: manualOverride.by,
      at: manualOverride.at,
    };
  }

  recalcComputed(detail);
  return detail;
};

const seedMockData = () => {
  if (mockAssessments.size > 0) return;
  const details = [
    createDetail({
      submissionId: 712345,
      assignmentId: 101,
      sessionId: 90011,
      entity: { kind: 'INDIVIDUAL', student: { id: 200045, name: 'Alice Tan' } },
      session: {
        id: 90011,
        start: '2025-04-14T10:00:00+10:00',
        end: '2025-04-14T10:30:00+10:00',
        timezone: 'Australia/Melbourne',
        venue: { venueId: 1, name: 'Engineering Building · A101' },
      },
      examiners: [
        {
          examinerId: 44,
          name: 'Dr. Emma Smith',
          assessmentStatus: 'SUBMITTED',
          submittedAt: '2025-04-14T10:41:00+10:00',
          examinerScorePct1dp: 87.5,
          items: [
            { criterionId: 'C1', levelId: 'L3', points: 28, comments: [{ source: 'custom', text: 'Excellent narrative arc' }] },
            { criterionId: 'C2', levelId: 'L2', points: 32 },
            { criterionId: 'C3', levelId: 'L3', points: 27 },
          ],
          overallFeedback: 'Engaging delivery with strong structure.',
          notes: 'Include more citations for background claims.',
        },
        {
          examinerId: 45,
          name: 'Prof. Leo Chan',
          assessmentStatus: 'SUBMITTED',
          submittedAt: '2025-04-14T10:44:00+10:00',
          examinerScorePct1dp: 82.0,
          items: [
            { criterionId: 'C1', levelId: 'L2', points: 24 },
            { criterionId: 'C2', levelId: 'L2', points: 30 },
            { criterionId: 'C3', levelId: 'L2', points: 24 },
          ],
          overallFeedback: 'Solid understanding; polish conclusions.',
          notes: '',
        },
      ],
    }),
    createDetail({
      submissionId: 712346,
      assignmentId: 101,
      sessionId: 90012,
      entity: {
        kind: 'GROUP',
        group: {
          id: 301102,
          name: 'Team Beta',
          memberCount: 4,
        },
      },
      session: {
        id: 90012,
        start: '2025-04-14T11:00:00+10:00',
        end: '2025-04-14T11:45:00+10:00',
        timezone: 'Australia/Melbourne',
        venue: { venueId: 2, name: 'ICT Building · 203' },
      },
      examiners: [
        {
          examinerId: 47,
          name: 'Ms. Priya Kaur',
          assessmentStatus: 'SUBMITTED',
          submittedAt: '2025-04-14T11:52:00+10:00',
          examinerScorePct1dp: 76.0,
          items: [
            { criterionId: 'C1', levelId: 'L2', points: 24 },
            { criterionId: 'C2', levelId: 'L1', points: 20 },
            { criterionId: 'C3', levelId: 'L2', points: 24 },
          ],
          overallFeedback: 'Collaboration evident; tighten technical descriptions.',
          notes: '',
        },
        {
          examinerId: 52,
          name: 'Dr. Alex Morgan',
          assessmentStatus: 'SUBMITTED',
          submittedAt: '2025-04-14T11:55:00+10:00',
          examinerScorePct1dp: 79.0,
          items: [
            { criterionId: 'C1', levelId: 'L2', points: 24 },
            { criterionId: 'C2', levelId: 'L2', points: 32 },
            { criterionId: 'C3', levelId: 'L1', points: 18 },
          ],
          overallFeedback: 'Good responses to questions; slides a little busy.',
          notes: 'Recommend follow-up on dataset assumptions.',
        },
      ],
      releaseStatus: 'RELEASED',
      manualOverride: {
        valuePct1dp: 78.0,
        reason: 'Moderation board adjustment',
        by: { id: 901, name: 'Course Coordinator' },
        at: '2025-04-15T09:10:00+10:00',
      },
      releasedAt: '2025-04-16T08:00:00+10:00',
    }),
    createDetail({
      submissionId: 712347,
      assignmentId: 101,
      sessionId: 90013,
      entity: { kind: 'INDIVIDUAL', student: { id: 200046, name: 'Bob Chen' } },
      session: {
        id: 90013,
        start: '2025-04-15T09:30:00+10:00',
        end: '2025-04-15T10:00:00+10:00',
        timezone: 'Australia/Melbourne',
        venue: { venueId: 3, name: 'Chemistry Building · 2E' },
      },
      examiners: [
        {
          examinerId: 54,
          name: 'Dr. Helena Stone',
          assessmentStatus: 'SUBMITTED',
          submittedAt: '2025-04-15T10:05:00+10:00',
          examinerScorePct1dp: 68.5,
          items: [
            { criterionId: 'C1', levelId: 'L1', points: 18 },
            { criterionId: 'C2', levelId: 'L2', points: 30 },
            { criterionId: 'C3', levelId: 'L1', points: 20 },
          ],
          overallFeedback: 'Needs clearer articulation of methodology.',
          notes: '',
        },
        {
          examinerId: 55,
          name: 'Prof. Amir Rashid',
          assessmentStatus: 'DRAFT',
          items: [
            { criterionId: 'C1', levelId: 'L2', points: 24 },
          ],
          notes: 'Paused due to tech issue, will finalise after rewatch.',
        },
      ],
    }),
    createDetail({
      submissionId: 712348,
      assignmentId: 101,
      sessionId: 90014,
      entity: {
        kind: 'GROUP',
        group: {
          id: 301110,
          name: 'Team Gamma',
          memberCount: 3,
        },
      },
      session: {
        id: 90014,
        start: '2025-04-15T10:30:00+10:00',
        end: '2025-04-15T11:15:00+10:00',
        timezone: 'Australia/Melbourne',
        venue: { venueId: 2, name: 'ICT Building · 203' },
      },
      examiners: [
        {
          examinerId: 56,
          name: 'Dr. Hannah Cooper',
          assessmentStatus: 'REOPENED',
          examinerScorePct1dp: 72.0,
          items: [
            { criterionId: 'C1', levelId: 'L2', points: 24 },
            { criterionId: 'C2', levelId: 'L2', points: 30 },
            { criterionId: 'C3', levelId: 'L2', points: 24 },
          ],
          overallFeedback: 'Please expand on the dataset limitations.',
          notes: 'Awaiting clarification on rubric interpretation.',
        },
        {
          examinerId: 57,
          name: 'Dr. Mark Nguyen',
          assessmentStatus: 'SUBMITTED',
          submittedAt: '2025-04-15T11:22:00+10:00',
          examinerScorePct1dp: 81.0,
          items: [
            { criterionId: 'C1', levelId: 'L2', points: 24 },
            { criterionId: 'C2', levelId: 'L3', points: 38 },
            { criterionId: 'C3', levelId: 'L2', points: 24 },
          ],
          overallFeedback: 'Strong answers; justifying trade-offs would help.',
          notes: '',
        },
      ],
      releaseStatus: 'NOT_RELEASED',
    }),
    createDetail({
      submissionId: 712349,
      assignmentId: 101,
      sessionId: 90015,
      entity: { kind: 'INDIVIDUAL', student: { id: 200047, name: 'Grace Liu' } },
      session: {
        id: 90015,
        start: '2025-04-16T09:00:00+10:00',
        end: '2025-04-16T09:30:00+10:00',
        timezone: 'Australia/Melbourne',
        venue: { venueId: 4, name: 'Business School · 315' },
      },
      examiners: [
        {
          examinerId: 60,
          name: 'Ms. Carla Pace',
          assessmentStatus: 'DRAFT',
          items: [],
          notes: 'Student requested reschedule; waiting for confirmation.',
        },
        {
          examinerId: 61,
          name: 'Dr. Javier Torres',
          assessmentStatus: 'DRAFT',
          items: [],
          notes: '',
        },
      ],
      releaseStatus: 'NOT_RELEASED',
    }),
  ];

  details.forEach((detail) => {
    recalcComputed(detail);
    mockAssessments.set(detail.assessment.key.submissionId, detail);
  });
};

seedMockData();

const findDetail = (submissionId) => {
  const id = Number(submissionId);
  const detail = mockAssessments.get(id);
  if (!detail) return null;
  return detail;
};

const buildSummary = (detail) => {
  recalcComputed(detail);
  return {
    assessment: clone(detail.assessment),
    session: clone(detail.session),
    computed: clone(detail.computed),
    releaseStatus: detail.releaseStatus,
  };
};

const filterDetails = (details, { q, sessionId, status }) => {
  let result = Array.from(details.values());
  if (q) {
    const needle = String(q).trim().toLowerCase();
    if (needle) {
      result = result.filter((detail) => {
        const fields = [];
        const { student, group } = detail.assessment;
        if (student?.name) fields.push(student.name.toLowerCase());
        if (group?.name) fields.push(group.name.toLowerCase());
        fields.push(String(detail.assessment.key.submissionId));
        return fields.some((value) => value.includes(needle));
      });
    }
  }
  if (sessionId) {
    const sid = Number(sessionId);
    result = result.filter((detail) => Number(detail.session.id) === sid);
  }
  if (status && status !== 'all') {
    result = result.filter((detail) => {
      if (status === 'released') return detail.releaseStatus === 'RELEASED';
      if (status === 'not_released') return detail.releaseStatus !== 'RELEASED';
      return true;
    });
  }
  return result;
};

const base = (subjectId, assignmentId) => `/api/admin/subjects/${subjectId}/assignments/${assignmentId}`;

// ------------------------------
// Service implementation
// ------------------------------

export const adminResultsService = {
  async listAssessments(subjectId, assignmentId, { pageNum = 1, pageSize = 20, q, sessionId, status } = {}) {
    if (USE_MOCKS) {
      await delay();
      const filtered = filterDetails(mockAssessments, { q, sessionId, status });
      const total = filtered.length;
      const start = (pageNum - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize).map((detail) => buildSummary(detail));
      return wrapOk({ pageNum, pageSize, total, items });
    }
    const resp = await apiClient.get(`${base(subjectId, assignmentId)}/assessments`, { params: { pageNum, pageSize, q, sessionId, status } });
    return resp.data;
  },

  async getAssessmentDetail(subjectId, assignmentId, submissionId) {
    if (USE_MOCKS) {
      await delay();
      const detail = findDetail(submissionId);
      if (!detail) {
        const error = new Error('Assessment not found');
        error.code = 'SUBMISSION_NOT_FOUND';
        throw error;
      }
      recalcComputed(detail);
      return wrapOk(clone(detail));
    }
    const resp = await apiClient.get(`${base(subjectId, assignmentId)}/assessments/${submissionId}`);
    return resp.data;
  },

  async reviewExaminer(subjectId, assignmentId, submissionId, examinerId, body) {
    if (USE_MOCKS) {
      await delay();
      const detail = findDetail(submissionId);
      if (!detail) {
        const error = new Error('Assessment not found');
        error.code = 'SUBMISSION_NOT_FOUND';
        throw error;
      }
      const examiner = detail.examiners.find((ex) => Number(ex.examinerId) === Number(examinerId));
      if (!examiner) {
        const error = new Error('Examiner not found');
        error.code = 'EXAMINER_NOT_FOUND';
        throw error;
      }
      if (examiner.assessmentStatus === 'REOPENED') {
        const error = new Error('Examiner already reopened');
        error.code = 'ALREADY_REOPENED';
        throw error;
      }
      examiner.assessmentStatus = 'REOPENED';
      examiner.submittedAt = undefined;
      detail.releaseStatus = 'NOT_RELEASED';
      recalcComputed(detail);
      return wrapOk({ reopened: true, releaseStatus: detail.releaseStatus, notified: true, reason: body?.reason });
    }
    const resp = await apiClient.post(`${base(subjectId, assignmentId)}/assessments/${submissionId}/examiners/${examinerId}/review`, body);
    return resp.data;
  },

  async setFinalScore(subjectId, assignmentId, submissionId, body) {
    if (USE_MOCKS) {
      await delay();
      const detail = findDetail(submissionId);
      if (!detail) {
        const error = new Error('Assessment not found');
        error.code = 'SUBMISSION_NOT_FOUND';
        throw error;
      }
      const value = Number(body?.finalScorePct1dp);
      if (Number.isNaN(value) || value < 0 || value > 100) {
        const error = new Error('Final score must be between 0 and 100');
        error.code = 'VALIDATION_RANGE';
        throw error;
      }
      detail.computed.manualOverride = {
        valuePct1dp: Number(value.toFixed(1)),
        reason: body?.reason,
        by: { id: 1001, name: 'Course Admin Mock' },
        at: new Date().toISOString(),
      };
      recalcComputed(detail);
      return wrapOk(clone(detail));
    }
    const resp = await apiClient.put(`${base(subjectId, assignmentId)}/assessments/${submissionId}/final-score`, body);
    return resp.data;
  },

  async releaseAssessment(subjectId, assignmentId, submissionId, body = {}) {
    if (USE_MOCKS) {
      await delay();
      const detail = findDetail(submissionId);
      if (!detail) {
        const error = new Error('Assessment not found');
        error.code = 'SUBMISSION_NOT_FOUND';
        throw error;
      }
      const submittedCount = detail.examiners.filter((ex) => ex.assessmentStatus === 'SUBMITTED').length;
      if (submittedCount === 0) {
        const error = new Error('At least one examiner must be SUBMITTED before releasing results.');
        error.code = 'NO_SUBMITTED_EXAMINERS';
        throw error;
      }
      detail.releaseStatus = 'RELEASED';
      detail.releasedAt = new Date().toISOString();
      recalcComputed(detail);
      return wrapOk({ released: true, notifiedStudents: body?.notify ? 1 : 0 });
    }
    const resp = await apiClient.post(`${base(subjectId, assignmentId)}/assessments/${submissionId}/release`, body);
    return resp.data;
  },
};

export default adminResultsService;
