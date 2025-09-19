import apiClient from '@/services/apiClient.js';

// Mock-first toggle; default to mocks unless explicitly disabled
const flag = process.env.NEXT_PUBLIC_USE_MOCK_API ?? 'true';
const USE_MOCKS = String(flag) !== 'false';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

function wrapOk(data) {
  return { success: true, code: 'OK', data };
}

// Minimal mock dataset aligned with the API contract
function makeMockList(pageNum = 1, pageSize = 20) {
  const items = [];
  for (let i = 0; i < Math.min(5, pageSize); i++) {
    const idx = (pageNum - 1) * pageSize + i + 1;
    const submissionId = 700000 + idx;
    const released = idx % 3 === 0;
    const studentName = ['Alice Tan', 'Bob Chen', 'Group Beta', 'Group Gamma'][idx % 4];
    const isGroup = studentName.startsWith('Group');
    items.push({
      assessment: {
        key: {
          assignmentId: 101,
          sessionId: 90010 + (idx % 2),
          submissionId,
          kind: isGroup ? 'GROUP' : 'INDIVIDUAL',
          entityId: isGroup ? 3000 + idx : 2000 + idx,
        },
        student: !isGroup ? { id: 2000 + idx, name: studentName } : undefined,
        group: isGroup ? { id: 3000 + idx, name: studentName, memberCount: 3 } : undefined,
      },
      session: {
        id: 90010 + (idx % 2),
        start: '2025-04-14T10:00:00+10:00',
        end: '2025-04-14T10:30:00+10:00',
        timezone: 'Australia/Melbourne',
        venue: { venueId: 1, name: 'Room A101' },
      },
      computed: {
        averageScorePct1dp: released ? 80.0 : idx % 2 === 0 ? 83.0 : null,
        effectiveFinalScorePct1dp: released ? 80.0 : 83.0,
      },
      releaseStatus: released ? 'RELEASED' : 'NOT_RELEASED',
    });
  }
  return {
    pageNum,
    pageSize,
    total: 40,
    items,
  };
}

function makeMockDetail(submissionId) {
  const student = { id: 200045, name: 'Alice Tan' };
  const rubric = {
    rubricMetaInfo: { rubricId: 501, name: 'Oral Exam 1 Rubric', scale: 'points', maxPoints: 100 },
    criteria: [
      {
        criterionId: 'C1',
        title: 'Communication',
        weightOrPoints: 30,
        performanceLevels: [
          { levelId: 'L3', label: 'Good', value: 24, description: 'Clear with minor issues' },
          { levelId: 'L4', label: 'Excellent', value: 30, description: 'Clear and persuasive' },
        ],
      },
      {
        criterionId: 'C2',
        title: 'Technical',
        weightOrPoints: 40,
        performanceLevels: [
          { levelId: 'L2', label: 'Fair', value: 24 },
          { levelId: 'L3', label: 'Good', value: 32 },
        ],
      },
    ],
  };
  const examiners = [
    {
      examinerId: 44,
      name: 'Dr. Smith',
      assessmentStatus: 'SUBMITTED',
      submittedAt: '2025-04-14T10:41:00+10:00',
      examinerScorePct1dp: 83.0,
      items: [
        { criterionId: 'C1', levelId: 'L3', points: 24, comments: [{ source: 'custom', text: 'Well structured' }] },
        { criterionId: 'C2', levelId: 'L3', points: 32 },
      ],
      overallFeedback: 'Good structuring of arguments.',
      notes: 'Keep an eye on time management.',
    },
    {
      examinerId: 52,
      name: 'Prof. Lee',
      assessmentStatus: 'SUBMITTED',
      submittedAt: '2025-04-14T10:45:00+10:00',
      examinerScorePct1dp: 81.0,
      items: [
        { criterionId: 'C1', levelId: 'L3', points: 24 },
        { criterionId: 'C2', levelId: 'L2', points: 24 },
      ],
      overallFeedback: 'Solid technical depth.',
      notes: 'Consider referencing more sources.',
    },
  ];
  return {
    assessment: {
      key: { assignmentId: 101, sessionId: 90011, submissionId, kind: 'INDIVIDUAL', entityId: 200045 },
      student,
    },
    session: { id: 90011, start: '2025-04-14T10:00:00+10:00', end: '2025-04-14T10:30:00+10:00', timezone: 'Australia/Melbourne' },
    rubric,
    examiners,
    computed: { averageScorePct1dp: 82.0, effectiveFinalScorePct1dp: 82.0 },
    releaseStatus: 'NOT_RELEASED',
  };
}

const base = (subjectId, assignmentId) => `/api/admin/subjects/${subjectId}/assignments/${assignmentId}`;

export const adminResultsService = {
  async listAssessments(subjectId, assignmentId, { pageNum = 1, pageSize = 20, q, sessionId } = {}) {
    if (USE_MOCKS) {
      await delay(220);
      return wrapOk(makeMockList(pageNum, pageSize));
    }
    const resp = await apiClient.get(`${base(subjectId, assignmentId)}/assessments`, { params: { pageNum, pageSize, q, sessionId } });
    return resp.data;
  },

  async getAssessmentDetail(subjectId, assignmentId, submissionId) {
    if (USE_MOCKS) {
      await delay(220);
      return wrapOk(makeMockDetail(Number(submissionId)));
    }
    const resp = await apiClient.get(`${base(subjectId, assignmentId)}/assessments/${submissionId}`);
    return resp.data;
  },

  async reviewExaminer(subjectId, assignmentId, submissionId, examinerId, body) {
    if (USE_MOCKS) {
      await delay(150);
      return wrapOk({ reopened: true, releaseStatus: 'NOT_RELEASED', notified: true });
    }
    const resp = await apiClient.post(`${base(subjectId, assignmentId)}/assessments/${submissionId}/examiners/${examinerId}/review`, body);
    return resp.data;
  },

  async setFinalScore(subjectId, assignmentId, submissionId, body) {
    if (USE_MOCKS) {
      await delay(150);
      // Return updated detail for convenience
      const dto = makeMockDetail(Number(submissionId));
      dto.computed = { ...dto.computed, effectiveFinalScorePct1dp: body?.finalScorePct1dp };
      dto.manualOverride = { valuePct1dp: body?.finalScorePct1dp, reason: body?.reason, by: { id: 1, name: 'Admin' }, at: new Date().toISOString() };
      return wrapOk(dto);
    }
    const resp = await apiClient.put(`${base(subjectId, assignmentId)}/assessments/${submissionId}/final-score`, body);
    return resp.data;
  },

  async releaseAssessment(subjectId, assignmentId, submissionId, body) {
    if (USE_MOCKS) {
      await delay(150);
      return wrapOk({ released: true, notifiedStudents: 1 });
    }
    const resp = await apiClient.post(`${base(subjectId, assignmentId)}/assessments/${submissionId}/release`, body);
    return resp.data;
  },
};

export default adminResultsService;

