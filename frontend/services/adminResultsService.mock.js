// Mock implementation for Admin Results service. Returns server envelope unchanged.

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function round1(x) {
  return Math.round(x * 10) / 10;
}

function isoPlus(ms) {
  return new Date(Date.now() + ms).toISOString();
}

function genName(i) {
  const names = ["Alice Tan", "Bob Lee", "Charlie Kim", "Dana Wong", "Evan Liu", "Fiona Zhang"]; 
  return names[i % names.length];
}

function buildEntity(index, assignmentId) {
  const isGroup = index % 3 === 0;
  const sessionId = 90010 + index;
  const start = new Date(Date.now() + (index - 5) * 86400000);
  const end = new Date(start.getTime() + 30 * 60000);
  const assessments = [
    { examinerId: 101, assessmentStatus: "SUBMITTED", revision: 1, submittedAt: isoPlus(-3600000), examinerScorePct1dp: round1(rand(65, 92)) },
    { examinerId: 102, assessmentStatus: index % 7 === 0 ? "REOPENED" : "SUBMITTED", revision: 1, submittedAt: isoPlus(-3550000), examinerScorePct1dp: round1(rand(60, 95)) },
  ];
  if (index % 4 === 0) assessments[1].assessmentStatus = "DRAFT";

  const final = round1((assessments.map(a => a.examinerScorePct1dp || 0).reduce((a, b) => a + b, 0)) / assessments.length);

  return {
    entity: {
      key: { assignmentId: Number(assignmentId), sessionId, kind: isGroup ? 'GROUP' : 'INDIVIDUAL', entityId: isGroup ? 500 + index : 200000 + index },
      group: isGroup ? { id: 500 + index, name: `Team ${String.fromCharCode(65 + (index % 26))}`, memberCount: 3 + (index % 3) } : undefined,
      student: !isGroup ? { id: 200000 + index, name: genName(index) } : undefined,
    },
    session: {
      id: sessionId,
      start: start.toISOString(),
      end: end.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Melbourne',
      durationMinutes: 30,
      venue: { venueId: 1, name: 'ENG', building: 'ENG', room: `ENG-${201 + (index % 12)}` },
      coExaminers: [{ examinerId: 101, name: 'Dr. Smith' }, { examinerId: 102, name: 'Dr. Johnson' }],
    },
    assessments,
    aggregated: { method: 'average', finalScorePct1dp: final },
    releaseStatus: index % 5 === 0 ? 'RELEASED' : 'NOT_RELEASED',
    anomaly: index % 6 === 0 ? { highDivergence: true } : undefined,
  };
}

function generateConsolidated(assignmentId, total = 42) {
  return Array.from({ length: total }, (_, i) => buildEntity(i + 1, assignmentId));
}

function filterAndPage(allItems, params = {}) {
  let data = [...allItems];
  const {
    q,
    entityKind,
    status,
    from,
    to,
    page = 1,
    pageSize = 20,
    sort = 'sessionStart',
    order = 'desc',
  } = params;

  if (entityKind && entityKind !== 'ALL') {
    data = data.filter(r => r.entity.key.kind === entityKind);
  }

  if (status && status !== 'ALL') {
    if (status === 'RELEASED') {
      data = data.filter(r => r.releaseStatus === 'RELEASED');
    } else {
      data = data.filter(r => (r.assessments || []).some(a => a.assessmentStatus === status));
    }
  }

  if (from) {
    const f = new Date(`${from}T00:00:00Z`).getTime();
    data = data.filter(r => new Date(r.session.start).getTime() >= f);
  }
  if (to) {
    const t = new Date(`${to}T23:59:59Z`).getTime();
    data = data.filter(r => new Date(r.session.start).getTime() <= t);
  }

  if (q) {
    const needle = String(q).toLowerCase();
    data = data.filter(r => {
      const fields = [
        r.entity?.student?.name,
        r.entity?.group?.name,
        r.session?.venue?.name,
      ].filter(Boolean).map(s => String(s).toLowerCase());
      return fields.some(s => s.includes(needle));
    });
  }

  const comparator = (a, b) => {
    let av, bv;
    switch (sort) {
      case 'score':
        av = a.aggregated?.finalScorePct1dp ?? -Infinity;
        bv = b.aggregated?.finalScorePct1dp ?? -Infinity;
        break;
      case 'sessionStart':
      default:
        av = new Date(a.session?.start).getTime();
        bv = new Date(b.session?.start).getTime();
        break;
    }
    if (av < bv) return order === 'asc' ? -1 : 1;
    if (av > bv) return order === 'asc' ? 1 : -1;
    return 0;
  };
  data.sort(comparator);

  const total = data.length;
  const pageNum = Number(page) || 1;
  const size = Number(pageSize) || 20;
  const start = (pageNum - 1) * size;
  const pageItems = data.slice(start, start + size);
  return { page: pageNum, pageSize: size, total, items: pageItems };
}

function buildDetailFromRow(row) {
  // Build a plausible AdminEntityDetailDTO
  const { entity, session, assessments, aggregated } = row;
  const assignment = {
    id: entity.key.assignmentId,
    name: 'Oral Exam 1',
    type: entity.key.kind === 'GROUP' ? 'group' : 'individual',
    aggregationMethod: aggregated?.method || 'average',
  };

  const submissions = (assessments || []).map((a, idx) => ({
    examinerId: a.examinerId,
    examinerName: idx === 0 ? 'Dr. Smith' : 'Dr. Johnson',
    assessmentStatus: a.assessmentStatus,
    revision: a.revision,
    submittedAt: a.submittedAt,
    items: [
      { criterionId: 'C1', levelId: 'L2', points: 60 },
      { criterionId: 'C2', levelId: 'L3', points: 85 },
      { criterionId: 'C3', levelId: 'L2', points: 22 },
    ],
    computed: { examinerScorePct1dp: a.examinerScorePct1dp },
  }));

  return {
    entity,
    assignment,
    session,
    submissions,
    aggregated: {
      method: aggregated?.method || 'average',
      finalScorePct1dp: aggregated?.finalScorePct1dp ?? 0,
      effectiveFinalScorePct1dp: aggregated?.finalScorePct1dp ?? 0,
    },
    releaseStatus: row.releaseStatus,
  };
}

const db = {
  cache: new Map(), // key: assignmentId -> full list
  schedule: new Map(), // key: assignmentId -> schedule dto
  overrides: new Map(), // key: `${aid}:${sid}:${kind}:${eid}` -> { valuePct1dp, reason }
};

const adminResultsServiceMock = {
  async getConsolidatedResults(assignmentId, params = {}) {
    await delay(120);
    if (!db.cache.has(assignmentId)) {
      db.cache.set(assignmentId, generateConsolidated(assignmentId, 48));
    }
    const all = db.cache.get(assignmentId);
    const data = filterAndPage(all, params);
    return { success: true, code: 'OK', data };
  },

  async getEntityDetail(assignmentId, sessionId, kind, entityId) {
    await delay(100);
    if (!db.cache.has(assignmentId)) {
      db.cache.set(assignmentId, generateConsolidated(assignmentId, 24));
    }
    const all = db.cache.get(assignmentId);
    const row = all.find(r => (
      r.entity.key.assignmentId === Number(assignmentId) &&
      r.entity.key.sessionId === Number(sessionId) &&
      r.entity.key.kind === String(kind) &&
      r.entity.key.entityId === Number(entityId)
    ));
    if (!row) {
      return { success: false, code: 'ENTITY_NOT_FOUND', data: null };
    }
    const dto = buildDetailFromRow(row);
    return { success: true, code: 'OK', data: dto };
  },

  async getAggregationMethod(assignmentId) {
    await delay(60);
    // Static for mock
    return { success: true, code: 'OK', data: { method: 'average' } };
  },

  async setAggregationMethod(assignmentId, method) {
    await delay(80);
    return { success: true, code: 'OK', data: { method } };
  },

  async releaseResults(assignmentId, body) {
    await delay(100);
    const count = Array.isArray(body?.entities) ? body.entities.length : 0;
    return { success: true, code: 'OK', data: { releasedCount: count, notifiedStudents: Math.max(0, count * 2) } };
  },

  async withdrawResults(assignmentId, body) {
    await delay(100);
    const count = Array.isArray(body?.entities) ? body.entities.length : 0;
    return { success: true, code: 'OK', data: { unreleasedCount: count } };
  },

  async getPublicationSchedule(assignmentId) {
    await delay(40);
    const sched = db.schedule.get(assignmentId) || { status: 'DISABLED', at: null, notify: false, lastRun: null };
    return { success: true, code: 'OK', data: sched };
  },

  async setPublicationSchedule(assignmentId, schedule) {
    await delay(80);
    const sched = { status: schedule?.status || 'DISABLED', at: schedule?.at || null, notify: !!schedule?.notify };
    db.schedule.set(assignmentId, sched);
    return { success: true, code: 'OK', data: sched };
  },

  async setOverride(assignmentId, sessionId, kind, entityId, body) {
    await delay(90);
    const key = `${assignmentId}:${sessionId}:${kind}:${entityId}`;
    db.overrides.set(key, { valuePct1dp: body?.finalOverridePct1dp, reason: body?.reason });
    // Return a refreshed detail (simplified)
    const detail = await this.getEntityDetail(assignmentId, sessionId, kind, entityId);
    if (detail?.success && detail?.data) {
      detail.data.aggregated.effectiveFinalScorePct1dp = Number(body?.finalOverridePct1dp);
      detail.data.aggregated.override = {
        valuePct1dp: Number(body?.finalOverridePct1dp),
        reason: body?.reason || '',
        by: { id: 9001, name: 'Course Admin' },
        at: new Date().toISOString(),
      };
      return { success: true, code: 'OK', data: detail.data };
    }
    return { success: false, code: 'ENTITY_NOT_FOUND', data: null };
  },

  async clearOverride(assignmentId, sessionId, kind, entityId) {
    await delay(90);
    const key = `${assignmentId}:${sessionId}:${kind}:${entityId}`;
    db.overrides.delete(key);
    return { success: true, code: 'OK', data: { cleared: true, entity: { assignmentId: Number(assignmentId), sessionId: Number(sessionId), kind, entityId: Number(entityId) } } };
  },

  async reviewEntity(assignmentId, sessionId, kind, entityId, request) {
    await delay(120);
    return { success: true, code: 'OK', data: {
      entity: { assignmentId: Number(assignmentId), sessionId: Number(sessionId), kind, entityId: Number(entityId) },
      review: { ...request, timestamp: new Date().toISOString() },
      effects: { releaseStatus: 'NOT_RELEASED', reopenedAssessments: [{ examinerId: 102, status: 'REOPENED' }] }
    } };
  },
};

export default adminResultsServiceMock;
