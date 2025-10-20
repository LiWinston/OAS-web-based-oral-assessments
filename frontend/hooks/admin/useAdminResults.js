import { useQuery } from '@tanstack/react-query';
import { adminResultsService } from '@/services/adminResultsService.js';

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
      return response?.data;
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
      return response?.data;
    },
    enabled: Boolean(subjectId && assignmentId && studentId && enabled),
    staleTime: 30_000,
  });
}

export default {
  useGroupResultDetail,
  useIndividualResultDetail,
};
