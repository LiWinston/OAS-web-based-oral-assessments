"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import examinerAssessmentService from "../../../services/examinerAssessmentService";
import examinerSessionService from "../../../services/examinerSessionService";
import { assignmentService } from "../../../services/assignmentService";
import { useSessionMetaStore } from "../../../store/sessionMetaStore";

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
            
            // Transform assignment rubric data to expected format
            const rubricInfo = assignment.rubricsInfo || [];
            const appliesFromType = (assignment.type === 'group')
              ? 'GROUP'
              : (assignment.type === 'individual')
                ? 'INDIVIDUAL'
                : 'BOTH';
            const criteria = Array.isArray(rubricInfo) ? rubricInfo.map((criterion, index) => ({
              criterionId: `C${index + 1}`,
              description: criterion.description || 'Criterion',
              weight: criterion.weight || 0,
              scaleType: criterion.scaleType || 'points',
              appliesTo: appliesFromType,
              // Create levels from performanceLevel
              levels: Array.isArray(criterion.performanceLevel) ? criterion.performanceLevel.map((level, levelIndex) => ({
                levelId: level.levelId || `L${levelIndex + 1}`,
                minPoints: level.startPoint || 0,
                maxPoints: level.endPoint || 100,
                description: level.description || 'Level',
                levelLabel: level.description,
                levelRange: {
                  min: level.startPoint || 0,
                  max: level.endPoint || 100
                }
              })) : [],
              // Keep performanceLevel for API compatibility
              performanceLevel: criterion.performanceLevel || []
            })) : [];
            
            const ctx = {
              assignment: {
                id: assignment.id,
                name: assignment.name || `Assignment ${assignmentId}`,
                type: assignment.type || 'mixed',
                rubric: {
                  name: assignment.rubricMetaInfo?.name || 'Assessment Rubric',
                  description: assignment.rubricMetaInfo?.description || '',
                  totalPoints: assignment.rubricMetaInfo?.totalPoints || 100,
                  criteria: criteria
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
