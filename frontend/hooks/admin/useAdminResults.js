import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminResultsService } from '@/services/adminResultsService.js';
import { showSuccess, showError } from '@/lib/notifications.js';

export const adminResultsKeys = {
  list: (subjectId, assignmentId, params) => ['admin-results', subjectId, assignmentId, params],
  detail: (subjectId, assignmentId, submissionId) => ['admin-result', subjectId, assignmentId, submissionId],
};

export function useAssessmentList(subjectId, assignmentId, params = {}) {
  return useQuery({
    queryKey: adminResultsKeys.list(subjectId, assignmentId, params),
    queryFn: async () => {
      const resp = await adminResultsService.listAssessments(subjectId, assignmentId, params);
      return resp?.data;
    },
    enabled: !!subjectId && !!assignmentId,
    staleTime: 30_000,
  });
}

export function useAssessmentDetail(subjectId, assignmentId, submissionId) {
  return useQuery({
    queryKey: adminResultsKeys.detail(subjectId, assignmentId, submissionId),
    queryFn: async () => {
      const resp = await adminResultsService.getAssessmentDetail(subjectId, assignmentId, submissionId);
      return resp?.data;
    },
    enabled: !!subjectId && !!assignmentId && !!submissionId,
  });
}

export function useReviewExaminer(subjectId, assignmentId, submissionId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ examinerId, reason }) => {
      const resp = await adminResultsService.reviewExaminer(
        subjectId,
        assignmentId,
        submissionId,
        examinerId,
        { reason }
      );
      return resp?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-results', subjectId, assignmentId],
      });
      queryClient.invalidateQueries({
        queryKey: adminResultsKeys.detail(subjectId, assignmentId, submissionId),
      });
      showSuccess('Review request sent successfully');
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to request review';
      showError(message);
    }
  });
}

export function useReleaseAssessment(subjectId, assignmentId, submissionId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body) => {
      const resp = await adminResultsService.releaseAssessment(
        subjectId,
        assignmentId,
        submissionId,
        body
      );
      return resp?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: adminResultsKeys.detail(subjectId, assignmentId, submissionId),
      });
      queryClient.invalidateQueries({
        queryKey: ['admin-results', subjectId, assignmentId],
      });

      const notified = data?.notifiedStudents || 0;
      if (notified > 0) {
        showSuccess(`Results released and ${notified} student(s) notified`);
      } else {
        showSuccess('Results released successfully');
      }
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to release results';
      showError(message);
    }
  });
}
