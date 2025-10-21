import { useQuery } from '@tanstack/react-query';
import { adminResultsService } from '@/services/adminResultsService.js';

const STATUS_UNKNOWN = 'UNKNOWN';

const safeArray = (value) => (Array.isArray(value) ? value : []);

const coerceNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normaliseSubmissionIds = (value) => {
  const list = Array.isArray(value) ? value : value != null ? [value] : [];
  const ids = [];

  list.forEach((entry) => {
    const numeric = coerceNumber(entry);
    if (numeric != null) {
      ids.push(numeric);
    }
  });

  return ids;
};

const normaliseComments = (comments) => {
  if (!comments) return [];
  if (Array.isArray(comments)) {
    return comments
      .map((entry) => (typeof entry === 'string' ? entry : entry && typeof entry.text === 'string' ? entry.text : null))
      .filter(Boolean);
  }
  if (typeof comments === 'object') {
    return Object.values(comments)
      .map((entry) => (typeof entry === 'string' ? entry : entry && typeof entry.text === 'string' ? entry.text : null))
      .filter(Boolean);
  }
  return [];
};

const normaliseScoreEntry = (entry) => ({
  criterionDescription: entry?.criterionDescription ?? '',
  selectedLevel: entry?.selectedLevel ?? null,
  pointsAwarded: coerceNumber(entry?.pointsAwarded),
  comments: normaliseComments(entry?.comments),
});

const normaliseIndividualScores = (rawIndividual) => {
  const items = safeArray(rawIndividual);

  if (items.length > 0 && Array.isArray(items[0]?.scores)) {
    return items.map((studentEntry) => ({
      studentId: studentEntry?.studentId ?? null,
      studentName: studentEntry?.studentName ?? '',
      finalScore: coerceNumber(studentEntry?.finalScore),
      scores: safeArray(studentEntry?.scores).map(normaliseScoreEntry),
    }));
  }

  const grouped = new Map();

  items.forEach((entry) => {
    const key = entry?.studentId ?? entry?.studentName ?? null;
    if (key === null) return;

    if (!grouped.has(key)) {
      grouped.set(key, {
        studentId: entry?.studentId ?? null,
        studentName: entry?.studentName ?? '',
        finalScore: coerceNumber(entry?.finalScore),
        scores: [],
      });
    }

    const bucket = grouped.get(key);
    if (bucket) {
      bucket.scores.push(normaliseScoreEntry(entry));
      if (bucket.finalScore == null) {
        bucket.finalScore = coerceNumber(entry?.finalScore);
      }
    }
  });

  return Array.from(grouped.values());
};

const normaliseExaminer = (examinerRaw) => {
  if (!examinerRaw || typeof examinerRaw !== 'object') {
    return null;
  }

  const submissionIdsSet = new Set();
  normaliseSubmissionIds(examinerRaw?.submissionIds).forEach((id) => submissionIdsSet.add(id));
  const legacySubmissionId = coerceNumber(examinerRaw?.submissionId);
  if (legacySubmissionId != null) {
    submissionIdsSet.add(legacySubmissionId);
  }
  const submissionIds = Array.from(submissionIdsSet);
  const primarySubmissionId = submissionIds.length > 0 ? submissionIds[0] : null;

  const groupScores = safeArray(examinerRaw?.rubricScores?.group).map(normaliseScoreEntry);
  const individualScores = normaliseIndividualScores(examinerRaw?.rubricScores?.individual);
  const status = (examinerRaw?.assessmentStatus || STATUS_UNKNOWN).toString().toUpperCase();

  return {
    submissionId: primarySubmissionId,
    submissionIds,
    examinerId: examinerRaw?.examinerId ?? null,
    examinerName: examinerRaw?.examinerName ?? '',
    assessmentStatus: status,
    submittedAt: examinerRaw?.submittedAt ?? null,
    reopenedAt: examinerRaw?.reopenedAt ?? null,
    overallFeedback: examinerRaw?.overallFeedback ?? null,
    totalScore: coerceNumber(examinerRaw?.totalScore),
    rubricScores: {
      group: groupScores,
      individual: individualScores,
    },
    hasGroupScores: groupScores.length > 0,
    hasIndividualScores: individualScores.some((student) => student.scores.length > 0),
  };
};

const gatherStudents = (participant, participantType, examiners) => {
  const map = new Map();

  if (participantType === 'GROUP') {
    safeArray(participant?.members).forEach((member) => {
      if (member?.studentId == null) return;
      const key = Number(member.studentId);
      map.set(key, {
        studentId: key,
        name: member?.name || `Student ${key}`,
        finalScore: coerceNumber(member?.finalScore),
      });
    });
  } else if (participantType === 'INDIVIDUAL' && participant?.studentId != null) {
    const key = Number(participant.studentId);
    map.set(key, {
      studentId: key,
      name: participant?.name || `Student ${key}`,
      finalScore: coerceNumber(participant?.finalScore ?? participant?.overallScore ?? null),
    });
  }

  examiners.forEach((examiner) => {
    safeArray(examiner?.rubricScores?.individual).forEach((entry) => {
      if (entry?.studentId == null) return;
      const key = Number(entry.studentId);
      const existing = map.get(key);
      map.set(key, {
        studentId: key,
        name: entry?.studentName || existing?.name || `Student ${key}`,
        finalScore: existing?.finalScore ?? coerceNumber(entry?.finalScore),
      });
    });
  });

  return Array.from(map.values()).sort((a, b) => a.studentId - b.studentId);
};

const summariseExaminers = (examiners) => {
  const counts = {};

  examiners.forEach((examiner) => {
    const status = examiner?.assessmentStatus || STATUS_UNKNOWN;
    counts[status] = (counts[status] || 0) + 1;
  });

  const total = examiners.length;
  const submitted = counts.SUBMITTED || 0;
  const draft = counts.DRAFT || 0;
  const reopened = counts.REOPENED || 0;

  return {
    total,
    counts,
    submitted,
    draft,
    reopened,
    hasSubmitted: submitted > 0,
    allSubmitted: total > 0 && submitted === total,
  };
};

const normaliseParticipantResult = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const participant = raw?.participant ?? {};
  const participantType = (participant?.type || (participant?.groupId != null ? 'GROUP' : 'INDIVIDUAL')).toString().toUpperCase();
  const examiners = safeArray(raw?.examiners)
    .map(normaliseExaminer)
    .filter(Boolean);

  const rubricSnapshot = raw?.rubricSnapshot ?? null;
  const groupRubrics = safeArray(rubricSnapshot?.groupRubrics);
  const individualRubrics = safeArray(rubricSnapshot?.individualRubrics);

  const students = gatherStudents(participant, participantType, examiners);
  const examinerSummary = summariseExaminers(examiners);

  let finalScore = coerceNumber(raw?.finalScore);

  if (finalScore == null && participantType === 'INDIVIDUAL') {
    finalScore = coerceNumber(participant?.finalScore ?? participant?.overallScore ?? null);
  }

  if (finalScore == null) {
    const examinerTotals = examiners
      .map((examiner) => coerceNumber(examiner?.totalScore))
      .filter((value) => value != null);

    if (examinerTotals.length > 0) {
      const sum = examinerTotals.reduce((acc, value) => acc + value, 0);
      finalScore = sum / examinerTotals.length;
    }
  }

  return {
    assignment: raw?.assignment ?? null,
    session: raw?.session ?? null,
    participant,
    participantType,
    // finalScore represents the entity-level average across examiners; member-level scores stay on participant.members.
    finalScore,
    rubricSnapshot,
    hasGroupRubric: groupRubrics.length > 0,
    hasIndividualRubric: individualRubrics.length > 0,
    examiners,
    examinerSummary,
    students,
    raw,
  };
};

export const adminResultsKeys = {
  participant: (subjectId, assignmentId, participantType, participantId) => [
    'admin-results-participant-detail',
    participantType,
    subjectId,
    assignmentId,
    participantId,
  ],
};

export function useGroupResultDetail(subjectId, assignmentId, groupId, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: adminResultsKeys.participant(subjectId, assignmentId, 'GROUP', groupId),
    queryFn: async () => {
      const response = await adminResultsService.getGroupResultDetail(subjectId, assignmentId, groupId);
      return normaliseParticipantResult(response?.data ?? response);
    },
    enabled: Boolean(subjectId && assignmentId && groupId && enabled),
    staleTime: 30_000,
  });
}

export function useIndividualResultDetail(subjectId, assignmentId, studentId, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: adminResultsKeys.participant(subjectId, assignmentId, 'INDIVIDUAL', studentId),
    queryFn: async () => {
      const response = await adminResultsService.getIndividualResultDetail(subjectId, assignmentId, studentId);
      return normaliseParticipantResult(response?.data ?? response);
    },
    enabled: Boolean(subjectId && assignmentId && studentId && enabled),
    staleTime: 30_000,
  });
}

export default {
  useGroupResultDetail,
  useIndividualResultDetail,
};
