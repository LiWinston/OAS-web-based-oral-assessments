import { useQuery } from '@tanstack/react-query';
import { adminResultsService } from '@/services/adminResultsService.js';

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

