"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import examinerAssessmentService from "../../../services/examinerAssessmentService";
import { assignmentService } from "../../../services/assignmentService";

export function useMarkingSessionQuery(submissionId, examinerId, sessionId = null, assignmentId = null, subjectType = 'GROUP', subjectId = null) {
  return useQuery({
    queryKey: ["markingSessionContext", submissionId, examinerId, sessionId, assignmentId, subjectType, subjectId],
    queryFn: async () => {
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
            const criteria = Array.isArray(rubricInfo) ? rubricInfo.map((criterion, index) => ({
              criterionId: `C${index + 1}`,
              description: criterion.description || 'Criterion',
              weight: criterion.weight || 0,
              scaleType: criterion.scaleType || 'points',
              appliesTo: 'BOTH',
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
            
            return {
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
          }
        } catch (error) {
          console.error('Failed to fetch assignment details for new assessment:', error);
          
          // Fallback to minimal context if assignment fetch fails
          return {
            assignment: {
              id: assignmentId,
              name: `Assignment ${assignmentId}`,
              type: subjectType.toLowerCase() === 'individual' ? 'individual' : 'mixed',
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
      return res.data;
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
      // Keep cache warm; context can be refetched if needed later
      queryClient.invalidateQueries({ queryKey: ["markingSessionContext", sessionId] });
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
      queryClient.invalidateQueries({ queryKey: ["markingSessionContext", sessionId] });
    },
  });
}
