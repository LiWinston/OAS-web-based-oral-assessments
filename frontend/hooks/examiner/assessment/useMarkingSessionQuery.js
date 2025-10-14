"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import examinerAssessmentService from "../../../services/examinerAssessmentService";
import examinerSessionService from "../../../services/examinerSessionService";
import { assignmentService } from "../../../services/assignmentService";
import { useSessionMetaStore } from "../../../store/sessionMetaStore";

// Helpers to normalize rubric structures (supports mixed buckets)
const ensureArray = (v) => (Array.isArray(v) ? v : []);

function buildLevels(rawLevels = []) {
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
    levels: buildLevels(criterion?.levels || criterion?.performanceLevel || []),
    performanceLevel: buildLevels(criterion?.performanceLevel || criterion?.levels || []).map((l) => ({
      // keep alternative field names for downstream lookups in services
      levelId: l.levelId,
      startPoint: l.minPoints,
      endPoint: l.maxPoints,
      description: l.description,
      preDefinedComment: l.preDefinedComment,
    })),
  };
}

function parseRubricMeta(meta, options = {}) {
  const safeMeta = meta && typeof meta === "object" ? meta : {};
  const groupRubrics = ensureArray(safeMeta.groupRubrics);
  const individualRubrics = ensureArray(safeMeta.individualRubrics);

  const criteria = [];
  let counter = 0;
  groupRubrics.forEach((criterion) => {
    criteria.push(mapCriterion(criterion, "GROUP", counter));
    counter += 1;
  });
  individualRubrics.forEach((criterion) => {
    criteria.push(mapCriterion(criterion, "INDIVIDUAL", counter));
    counter += 1;
  });

  const weightBasis = safeMeta.weightBasis === "points" ? "points" : "percentage";

  return {
    name: safeMeta.name || options.fallbackName || "Assessment Rubric",
    description: safeMeta.description || "",
    totalPoints: Number(safeMeta.totalPoints) || Number(options.fallbackTotalPoints) || 100,
    criteria,
    bucketInfo: {
      group: {
        weight: Number(safeMeta.groupWeight ?? 0) || 0,
        criteria: criteria.filter((c) => c.appliesTo === "GROUP"),
      },
      individual: {
        weight: Number(safeMeta.individualWeight ?? 0) || 0,
        criteria: criteria.filter((c) => c.appliesTo === "INDIVIDUAL"),
      },
    },
    weightBasis,
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
            const rubric = parseRubricMeta(meta, {
              fallbackName: assignment.name || `Assignment ${assignmentId}`,
              fallbackTotalPoints: assignment.totalPoints,
            });

            const ctx = {
              assignment: {
                id: assignment.id,
                name: assignment.name || `Assignment ${assignmentId}`,
                rubric: {
                  name: rubric.name,
                  description: rubric.description,
                  totalPoints: rubric.totalPoints,
                  weightBasis: rubric.weightBasis,
                  criteria: rubric.criteria,
                },
                weights: {
                  group: rubric.bucketInfo.group.weight,
                  individual: rubric.bucketInfo.individual.weight,
                },
                groupWeight: rubric.bucketInfo.group.weight,
                individualWeight: rubric.bucketInfo.individual.weight,
                rubricMeta: meta,
              },
              entity: {
                group: null,
                individuals: [],
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
              const metaInfo = await prefetchSessionMeta(examinerId, assignmentId, sessionId);
              if (metaInfo) ctx.session = { ...(ctx.session || {}), ...metaInfo };
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
                if (data && Array.isArray(data.groups) && data.groups.length) {
                  const g = data.groups[0];
                  ctx.entity.group = {
                    groupId: g.groupId,
                    groupName: g.groupName,
                    members: Array.isArray(g.members) ? g.members : [],
                  };
                  ctx.entity.groupId = ctx.entity.group.groupId;
                  ctx.entity.groupName = ctx.entity.group.groupName;
                }
              } catch (_) {}
            }
            return ctx;
          }
        } catch (error) {
          console.error('Failed to fetch assignment details for new assessment:', error);
          throw error;
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

      if (!ctx?.assignment?.rubricMeta) {
        throw new Error('Missing rubric meta information in assessment context');
      }

      const rubric = parseRubricMeta(ctx.assignment.rubricMeta, {
        fallbackName: ctx.assignment.name,
        fallbackTotalPoints: ctx.assignment.rubric?.totalPoints,
      });

      ctx.assignment = {
        ...ctx.assignment,
        rubric: {
          name: rubric.name,
          description: rubric.description,
          totalPoints: rubric.totalPoints,
          weightBasis: rubric.weightBasis,
          criteria: rubric.criteria,
        },
        weights: {
          group: rubric.bucketInfo.group.weight,
          individual: rubric.bucketInfo.individual.weight,
        },
        rubricMeta: ctx.assignment.rubricMeta,
      };

      ctx.assignment.groupWeight = ctx.assignment.weights.group;
      ctx.assignment.individualWeight = ctx.assignment.weights.individual;

      ctx.entity = ctx.entity || {};
      if (!ctx.entity.individuals) ctx.entity.individuals = [];
      if (!ctx.entity.group && ctx.entity.groupId) {
        ctx.entity.group = {
          groupId: ctx.entity.groupId,
          groupName: ctx.entity.groupName,
          members: ctx.entity.members || [],
        };
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
          if (data && Array.isArray(data.groups) && data.groups.length) {
            const g = data.groups[0];
            ctx.entity.group = {
              groupId: g.groupId,
              groupName: g.groupName,
              members: Array.isArray(g.members) ? g.members : [],
            };
            ctx.entity.groupId = ctx.entity.group.groupId;
            ctx.entity.groupName = ctx.entity.group.groupName;
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
