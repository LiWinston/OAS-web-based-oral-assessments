"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import examinerAssessmentService from "../../../services/examinerAssessmentService";
import examinerSessionService from "../../../services/examinerSessionService";
import { assignmentService } from "../../../services/assignmentService";
import { useSessionMetaStore } from "../../../store/sessionMetaStore";

// Helpers to normalize rubric structures (supports mixed buckets)
const ensureArray = (v) => (Array.isArray(v) ? v : []);

function buildLevels(rawLevels = [], resolvedCriterionId) {
  if (!Array.isArray(rawLevels)) return [];
  return rawLevels.map((level, idx) => ({
    levelId: level?.levelId || `L${idx + 1}`,
    minPoints: Number(level?.minPoints ?? level?.startPoint ?? 0),
    maxPoints: Number(level?.maxPoints ?? level?.endPoint ?? 0),
    description: level?.description || `Level ${idx + 1}`,
    preDefinedComment: Array.isArray(level?.preDefinedComment) ? level.preDefinedComment : [],
  }));
}

function mapCriterion(criterion, appliesTo, index) {
  const criterionId = (criterion?.criterionId || `C${index + 1}`).toString();
  return {
    criterionId,
    description: criterion?.title || criterion?.description || `Criterion ${index + 1}`,
    weight: Number(criterion?.weight) || 0,
    scaleType: criterion?.scaleType || "points",
    appliesTo,
    levels: buildLevels(criterion?.levels || criterion?.performanceLevel || [], criterionId),
    performanceLevel: buildLevels(criterion?.performanceLevel || criterion?.levels || [], criterionId).map((l) => ({
      // keep alternative field names for downstream lookups in services
      levelId: l.levelId,
      startPoint: l.minPoints,
      endPoint: l.maxPoints,
      description: l.description,
      preDefinedComment: l.preDefinedComment,
    })),
  };
}

export function useMarkingSessionQuery(submissionId, examinerId, sessionId = null, assignmentId = null, subjectType = 'GROUP', subjectId = null) {
  return useQuery({
    queryKey: ["markingSessionContext", submissionId, examinerId, sessionId, assignmentId, subjectType, subjectId],
    queryFn: async () => {
      // Helper: prefetch session meta (date/time/venue) from schedule API
      const prefetchSessionMeta = async (exId, aId, sId) => {
        try {
          if (!exId || !aId || !sId) return null;
          const schedule = await examinerSessionService.getExaminerSchedule(exId, { assignmentId: Number(aId) });
          const assignments = schedule?.data?.assignments || [];
          const assn = assignments.find((a) => a.assignmentId === Number(aId));
          const sessions = assn?.sessions || [];
          const found = sessions.find((s) => Number(s.sessionId) === Number(sId));
          if (!found) return null;
          // Normalize to the structure SessionInfo expects
          return {
            start: found.start || (found.date && found.startTime ? `${found.date}T${found.startTime}` : null),
            end: found.end || (found.date && found.endTime ? `${found.date}T${found.endTime}` : null),
            venue: found.venue || (found.venueName ? { venueName: found.venueName } : undefined),
            coExaminers: found.assignedExaminers || [],
          };
        } catch (_) {
          return null;
        }
      };
      // For new assessments (submissionId === 'new'), skip the assessment API call
      // and directly fetch assignment details
      if (submissionId === 'new') {
        // For new assessments, fetch assignment details to get complete rubric information
        try {
          const assignmentResponse = await assignmentService.getAssignmentById(assignmentId);
          if (assignmentResponse?.success && assignmentResponse?.data) {
            const assignment = assignmentResponse.data;

            // parse rubric meta (may be string)
            let meta = assignment.rubricMetaInfo;
            if (typeof meta === 'string') {
              try { meta = JSON.parse(meta); } catch (_) { meta = {}; }
            }

            const rawRubrics = assignment.rubricsInfo || assignment.rubricInfo || [];
            const individualRubrics = ensureArray(meta?.individualRubrics);
            const groupRubrics = ensureArray(meta?.groupRubrics);

            let criteria = [];
            let inferredType = (assignment.type || 'mixed').toLowerCase();

            if (individualRubrics.length || groupRubrics.length) {
              // New bucketed schema from admin builder
              criteria = [
                ...groupRubrics.map((c, i) => mapCriterion(c, 'GROUP', i)),
                ...individualRubrics.map((c, i) => mapCriterion(c, 'INDIVIDUAL', i + groupRubrics.length)),
              ];
              inferredType = (groupRubrics.length && individualRubrics.length)
                ? 'mixed'
                : (groupRubrics.length ? 'group' : 'individual');
            } else if (Array.isArray(rawRubrics) && rawRubrics.length) {
              // Legacy flattened schema; fall back to assignment.type
              const appliesFromType = (assignment.type === 'group')
                ? 'GROUP'
                : (assignment.type === 'individual')
                  ? 'INDIVIDUAL'
                  : 'BOTH';
              criteria = rawRubrics.map((criterion, index) => mapCriterion(criterion, appliesFromType, index));
            }

            const weightBasis = (meta?.weightBasis === 'points' || meta?.weightBasis === 'percentage')
              ? meta?.weightBasis
              : 'percentage';

            // derive bucket weights; meta already validated to map to criteria totals by admin UI
            const individualWeight = Number(meta?.individualWeight ?? 0) || 0;
            const groupWeight = Number(meta?.groupWeight ?? 0) || 0;

            const ctx = {
              assignment: {
                id: assignment.id,
                name: assignment.name || `Assignment ${assignmentId}`,
                type: inferredType,
                groupWeight,
                individualWeight,
                rubric: {
                  name: meta?.name || 'Assessment Rubric',
                  description: meta?.description || '',
                  totalPoints: Number(meta?.totalPoints) || 100,
                  weightBasis,
                  criteria,
                }
              },
              entity: {
                kind: subjectType.toUpperCase(),
                ...(subjectType.toUpperCase() === 'GROUP' ? {
                  groupId: `G-${subjectId}`,
                  groupName: `Group ${subjectId}`,
                  members: 1
                } : {
                  individuals: [{
                    studentId: subjectId,
                    name: `Student ${subjectId}`
                  }]
                })
              },
              existingAssessment: null,
              sessionId: sessionId, // Include sessionId for API calls
              predefinedComments: {}
            };

            // 1) Use session meta persisted from the Sessions list (fast path)
            const persisted = useSessionMetaStore.getState().getSessionMeta(assignmentId, sessionId);
            if (persisted) {
              ctx.session = persisted;
            }

            // 2) Prefetch session meta from schedule (students/detailed doesn't include timing/venue)
            if (sessionId && examinerId) {
              const meta = await prefetchSessionMeta(examinerId, assignmentId, sessionId);
              if (meta) ctx.session = { ...(ctx.session || {}), ...meta };
            }

            // Enrich with session participants from detailed API
            if (sessionId && examinerId) {
              try {
                const detailed = await examinerSessionService.getSessionDetailed(sessionId, examinerId);
                const data = detailed?.data;
                if (data && Array.isArray(data.students)) {
                  const individuals = data.students.map((s) => ({
                    studentId: Number(s.userId),
                    name: s.studentName || `Student ${s.userId}`,
                    studentNumber: s.studentNumber,
                    email: s.email,
                    submissionId: s.assessmentStatus?.submissionId,
                  }));
                  if (individuals.length) ctx.entity.individuals = individuals;
                }
                if (data && Array.isArray(data.groups) && data.groups.length && ctx.entity.kind === 'GROUP') {
                  const g = data.groups[0];
                  ctx.entity.groupId = g.groupId || ctx.entity.groupId;
                  ctx.entity.groupName = g.groupName || ctx.entity.groupName;
                  ctx.entity.members = Array.isArray(g.members) ? g.members.length : ctx.entity.members;
                }
              } catch (_) {}
            }
            return ctx;
          }
        } catch (error) {
          console.error('Failed to fetch assignment details for new assessment:', error);
          
          // Fallback to minimal context if assignment fetch fails
          const ctx = {
            assignment: {
              id: assignmentId,
              name: `Assignment ${assignmentId}`,
              type: subjectType.toLowerCase() === 'individual' ? 'individual' : (subjectType.toLowerCase() === 'group' ? 'group' : 'mixed'),
              rubric: {
                criteria: []
              }
            },
            entity: {
              kind: subjectType.toUpperCase(),
              ...(subjectType.toUpperCase() === 'GROUP' ? {
                groupId: `G-${subjectId}`,
                groupName: `Group ${subjectId}`,
                members: 1
              } : {
                individuals: [{
                  studentId: subjectId,
                  name: `Student ${subjectId}`
                }]
              })
            },
            existingAssessment: null
          };

          // 1) Use persisted session meta if still missing
          if (!ctx.session && (sessionId || ctx.sessionId)) {
            const sid = sessionId || ctx.sessionId;
            const aId = assignmentId || ctx.assignment?.id;
            const persisted = useSessionMetaStore.getState().getSessionMeta(aId, sid);
            if (persisted) ctx.session = persisted;
          }

          // 2) Best-effort session meta from schedule
          if (sessionId && examinerId) {
            const meta = await prefetchSessionMeta(examinerId, assignmentId, sessionId);
            if (meta) ctx.session = { ...(ctx.session || {}), ...meta };
          }

          return ctx;
        }
      }
      
      // For existing assessments with submissionId, call the assessment API
      const res = await examinerAssessmentService.getSessionContext(
        submissionId,
        examinerId
      );
      
      if (!res?.success) {
        const err = new Error(res?.message || "Failed to load session context");
        err.code = res?.code || "ERROR";
        throw err;
      }
      const ctx = res.data;

      // Enrich rubric: try to parse meta snapshot fields into bucketed appliesTo + weights
      if (ctx?.assignment?.rubric?.criteria?.length) {
        // noop; already normalized by service mapping
      }

      // 1) Use persisted session meta if missing
      if (!ctx.session && (sessionId || ctx.sessionId) && examinerId) {
        const sid = sessionId || ctx.sessionId;
        const aId = assignmentId || ctx.assignment?.id;
        const persisted = useSessionMetaStore.getState().getSessionMeta(aId, sid);
        if (persisted) ctx.session = persisted;
      }

      // 2) Enrich with session meta from schedule as second fallback
      if (!ctx.session && (sessionId || ctx.sessionId) && examinerId) {
        const sid = sessionId || ctx.sessionId;
        const aId = assignmentId || ctx.assignment?.id;
        const meta = await prefetchSessionMeta(examinerId, aId, sid);
        if (meta) ctx.session = meta;
      }

      // 3) Enrich participants from /api/sessions/students/detailed to get real names
      if ((sessionId || ctx.sessionId) && examinerId) {
        try {
          const sid = sessionId || ctx.sessionId;
          const detailed = await examinerSessionService.getSessionDetailed(sid, examinerId);
          const data = detailed?.data;
          if (data && Array.isArray(data.students)) {
            const individuals = data.students.map((s) => ({
              studentId: Number(s.userId),
              name: s.studentName || `Student ${s.userId}`,
              studentNumber: s.studentNumber,
              email: s.email,
              submissionId: s.assessmentStatus?.submissionId,
            }));
            if (individuals.length) ctx.entity.individuals = individuals;
          }
          if (data && Array.isArray(data.groups) && data.groups.length && ctx.entity.kind === 'GROUP') {
            const g = data.groups[0];
            ctx.entity.groupId = g.groupId || ctx.entity.groupId;
            ctx.entity.groupName = g.groupName || ctx.entity.groupName;
            ctx.entity.members = Array.isArray(g.members) ? g.members.length : ctx.entity.members;
          }
        } catch (e) {
          console.warn('Failed to enrich participants from detailed session API:', e);
        }
      }

      return ctx;
    },
    enabled: Boolean(submissionId && examinerId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSaveDraftMutation(sessionId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["saveAssessmentDraft", sessionId],
    mutationFn: async (payload) => {
      const res = await examinerAssessmentService.saveDraft(sessionId, payload);
      if (!res?.success) {
        const err = new Error(res?.message || "Failed to save draft");
        err.code = res?.code || "ERROR";
        throw err;
      }
      return res.data;
    },
    onSuccess: () => {
      // 失效全部 markingSessionContext 相关缓存，避免 key 维度不一致
      queryClient.invalidateQueries({ queryKey: ["markingSessionContext"] });
    },
  });
}

export function useSubmitAssessmentMutation(sessionId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["submitAssessment", sessionId],
    mutationFn: async (assessmentData) => {
      const res = await examinerAssessmentService.submitAssessment(
        sessionId,
        assessmentData // Pass complete assessment data
      );
      if (!res?.success) {
        const err = new Error(res?.message || "Failed to submit assessment");
        err.code = res?.code || "ERROR";
        throw err;
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markingSessionContext"] });
    },
  });
}
