// Pure mock service for Examiner Results — no real API calls

// --- Mock implementation (contract-aligned minimal) ---
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function randPct() {
  return Math.round((50 + Math.random() * 50) * 10) / 10;
}

function mockHistoryItem(i = 1, overrides = {}) {
  const start = new Date();
  start.setDate(start.getDate() - i);
  const end = new Date(start.getTime() + 45 * 60000);
  const statuses = ["DRAFT", "SUBMITTED", "REOPENED"];
  const assessmentStatus = statuses[i % statuses.length];
  const releaseStatus = i % 3 === 0 ? "RELEASED" : "NOT_RELEASED";
  return {
    assessmentId: `A-${1000 + i}`,
    assignment: {
      id: 100 + (i % 3),
      name: ["Project Presentation", "Code Review", "Team Demo"][i % 3],
      type: ["mixed", "individual", "group"][i % 3],
      courseId: 500 + (i % 2),
      courseCode: ["COMP30023", "COMP90082"][i % 2],
      courseName: ["Computer Networks", "Software Project"][i % 2],
    },
    session: {
      id: 90000 + i,
      start: start.toISOString(),
      end: end.toISOString(),
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "Australia/Melbourne",
      durationMinutes: 45,
      venue: {
        venueId: 1,
        name: "Engineering Building",
        building: "ENG",
        room: `ENG-${100 + i}`,
      },
      coExaminers: [{ examinerId: 2, name: "Dr. Lee" }],
    },
    entity:
      i % 2 === 0
        ? {
            kind: "GROUP",
            group: {
              groupId: 300 + i,
              groupName: `Team ${String.fromCharCode(64 + (i % 26) || 1)}`,
              memberCount: 3,
            },
          }
        : {
            kind: "INDIVIDUAL",
            student: {
              studentId: 2000 + i,
              name: ["Alice Chen", "Bob Lee", "Charlie Kim"][i % 3],
            },
          },
    assessmentStatus,
    releaseStatus,
    revision: 1,
    examinerScorePct1dp: randPct(),
    isEditable: assessmentStatus === "REOPENED",
    ...overrides,
  };
}

function mockReadDTO(assessmentId) {
  const base = {
    assessmentId,
    assignment: {
      id: 101,
      name: "Project Presentation",
      type: "mixed",
      courseId: 501,
      courseCode: "COMP90082",
      courseName: "Software Project",
      rubricMeta: { name: "Default Rubric", totalPoints: 100 },
    },
    session: {
      id: 90123,
      start: new Date(Date.now() - 86400000).toISOString(),
      end: new Date(Date.now() - 86400000 + 3600000).toISOString(),
      timezone: "Australia/Melbourne",
      durationMinutes: 60,
      venue: { venueId: 1, name: "ENG", building: "ENG", room: "ENG-201" },
      coExaminers: [{ examinerId: 2, name: "Dr. Lee" }],
    },
    assessmentStatus: "SUBMITTED",
    releaseStatus: "NOT_RELEASED",
    revision: 1,
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    rubricFrozen: {
      rubricId: "R-101",
      version: 3,
      criteria: [
        {
          criterionId: "C1",
          text: "Problem Understanding",
          weightPct: 30,
          appliesTo: "BOTH",
          levels: [
            {
              levelId: "L1",
              levelLabel: "Basic",
              levelRange: { min: 0, max: 50 },
              description: "Limited grasp",
            },
            {
              levelId: "L2",
              levelLabel: "Good",
              levelRange: { min: 51, max: 75 },
              description: "Solid grasp",
            },
            {
              levelId: "L3",
              levelLabel: "Excellent",
              levelRange: { min: 76, max: 100 },
              description: "Deep insight",
            },
          ],
        },
        {
          criterionId: "C2",
          text: "Technical Approach",
          weightPct: 40,
          appliesTo: "BOTH",
          levels: [
            {
              levelId: "L1",
              levelLabel: "Basic",
              levelRange: { min: 0, max: 50 },
            },
            {
              levelId: "L2",
              levelLabel: "Good",
              levelRange: { min: 51, max: 75 },
            },
            {
              levelId: "L3",
              levelLabel: "Excellent",
              levelRange: { min: 76, max: 100 },
            },
          ],
        },
        {
          criterionId: "C3",
          text: "Communication",
          maxPoints: 30,
          appliesTo: "BOTH",
          levels: [
            {
              levelId: "L1",
              levelLabel: "Needs improvement",
              levelRange: { min: 0, max: 15 },
            },
            {
              levelId: "L2",
              levelLabel: "Good",
              levelRange: { min: 16, max: 24 },
            },
            {
              levelId: "L3",
              levelLabel: "Excellent",
              levelRange: { min: 25, max: 30 },
            },
          ],
        },
      ],
    },
    entities: [],
  };
  // group entity snapshot
  base.entities.push({
    kind: "GROUP",
    groupId: 301,
    overallFeedback: "Good overall performance with clear structure.",
    notes: "Consider deeper analysis in Q2.",
    items: [
      {
        criterionId: "C1",
        levelId: "L2",
        points: 65,
        levelLabel: "Good",
        levelRange: { min: 51, max: 75 },
        comments: [{ source: "custom", text: "Solid understanding" }],
      },
      {
        criterionId: "C2",
        levelId: "L2",
        points: 70,
        levelLabel: "Good",
        levelRange: { min: 51, max: 75 },
        comments: [],
      },
    ],
    computed: { rawPoints: 67.5, examinerScorePct1dp: 67.5 },
  });
  // individual snapshot
  base.entities.push({
    kind: "INDIVIDUAL",
    studentId: 2001,
    studentName: "Alice Chen",
    overallFeedback: "Strong communication skills.",
    notes: "Follow-up on references.",
    items: [
      {
        criterionId: "C1",
        levelId: "L2",
        points: 60,
        levelLabel: "Good",
        levelRange: { min: 51, max: 75 },
      },
      {
        criterionId: "C3",
        levelId: "L2",
        points: 22,
        levelLabel: "Good",
        levelRange: { min: 16, max: 24 },
      },
    ],
    computed: { rawPoints: 65, examinerScorePct1dp: 65.0 },
  });
  // another individual to test multiple
  base.entities.push({
    kind: "INDIVIDUAL",
    studentId: 2002,
    studentName: "Bob Lee",
    items: [
      { criterionId: "C1", levelId: "L3", points: 78, levelLabel: "Excellent", levelRange: { min: 76, max: 100 } },
      { criterionId: "C3", levelId: "L1", points: 15, levelLabel: "Needs improvement", levelRange: { min: 0, max: 15 } },
    ],
    computed: { rawPoints: 62, examinerScorePct1dp: 62.0 },
  });
  return base;
}

const mockExaminerResultsService = {
  async listResults(examinerId, params = {}) {
    await delay(250);
    const page = Number(params?.page || 1);
    const pageSize = Number(params?.pageSize || 20);

    // Build full dataset
    const totalAll = 50;
    let all = Array.from({ length: totalAll }, (_, i) => mockHistoryItem(i + 1));

    // Filters
    const { status, assignmentId, q, from, to, entityKind, sort = 'sessionStart', order = 'desc' } = params || {};

    if (assignmentId) {
      const ids = Array.isArray(assignmentId)
        ? assignmentId.map((x) => Number(x))
        : String(assignmentId).split(',').map((x) => Number(x.trim())).filter(Boolean);
      all = all.filter((it) => ids.includes(Number(it.assignment?.id)));
    }

    if (status && status !== 'all') {
      if (status === 'RELEASED') {
        all = all.filter((it) => it.releaseStatus === 'RELEASED');
      } else {
        all = all.filter((it) => it.assessmentStatus === status);
      }
    }

    if (entityKind) {
      all = all.filter((it) => it.entity?.kind === entityKind);
    }

    if (from) {
      const f = new Date(from + 'T00:00:00Z').getTime();
      all = all.filter((it) => new Date(it.session?.start).getTime() >= f);
    }
    if (to) {
      const t = new Date(to + 'T23:59:59Z').getTime();
      all = all.filter((it) => new Date(it.session?.start).getTime() <= t);
    }

    if (q) {
      const needle = String(q).toLowerCase();
      all = all.filter((it) => {
        const fields = [
          it.assessmentId,
          it.assignment?.name,
          it.assignment?.courseCode,
          it.assignment?.courseName,
          it.entity?.group?.groupName,
          it.entity?.student?.name,
        ]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase());
        return fields.some((s) => s.includes(needle));
      });
    }

    // Sorting
    const compare = (a, b) => {
      let av, bv;
      switch (sort) {
        case 'assignmentName':
          av = a.assignment?.name || ''; bv = b.assignment?.name || ''; break;
        case 'score':
          av = a.examinerScorePct1dp ?? -Infinity; bv = b.examinerScorePct1dp ?? -Infinity; break;
        case 'sessionStart':
        default:
          av = new Date(a.session?.start).getTime(); bv = new Date(b.session?.start).getTime();
      }
      if (av < bv) return order === 'asc' ? -1 : 1;
      if (av > bv) return order === 'asc' ? 1 : -1;
      return 0;
    };
    all.sort(compare);

    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    return { success: true, code: 'OK', data: { page, pageSize, total, items } };
  },

  async getResultDetail(examinerId, assessmentId, { version = 'latest' } = {}) {
    await delay(220);
    const dto = mockReadDTO(assessmentId);
    const n = parseInt(String(assessmentId).replace(/\D/g, ''), 10) || 0;
    if (n % 5 === 0) dto.assessmentStatus = 'REOPENED';
    if (n % 3 === 0) dto.releaseStatus = 'RELEASED';
    // Simulate historical snapshot values for versioned view
    if (version !== 'latest') {
      const vNum = Number(version) || 1;
      dto.revision = vNum;
      dto.submittedAt = new Date(Date.now() - (5 - vNum) * 86400000).toISOString();
      dto.entities = dto.entities.map((e) => ({
        ...e,
        computed: e.computed?.examinerScorePct1dp != null ? { ...e.computed, examinerScorePct1dp: Math.max(0, (e.computed.examinerScorePct1dp - (3 - vNum))).toFixed ? Number((e.computed.examinerScorePct1dp - (3 - vNum)).toFixed(1)) : e.computed.examinerScorePct1dp } : e.computed,
      }));
    }
    return { success: true, code: 'OK', data: dto };
  },

  async getResultVersions(examinerId, assessmentId) {
    await delay(180);
    const now = new Date();
    return {
      success: true,
      code: "OK",
      data: {
        versions: [
          {
            version: 1,
            status: "SUBMITTED",
            at: new Date(now.getTime() - 86400000 * 5).toISOString(),
            by: { role: "EXAMINER", id: examinerId },
            summary: {
              examinerScorePct1dp: 66.2,
              entityKinds: ["GROUP", "INDIVIDUAL"],
            },
          },
          {
            version: 2,
            status: "SUBMITTED",
            at: new Date(now.getTime() - 86400000 * 2).toISOString(),
            by: { role: "EXAMINER", id: examinerId },
            summary: {
              examinerScorePct1dp: 67.5,
              entityKinds: ["GROUP", "INDIVIDUAL"],
            },
          },
        ],
      },
    };
  },
};

export const examinerResultsService = mockExaminerResultsService;
export default examinerResultsService;
