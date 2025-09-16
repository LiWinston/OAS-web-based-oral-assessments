'use client';

import { useQuery } from '@tanstack/react-query';
import { examinerResultsService } from '../../../services/examinerResultsService';

export function useAssessmentVersionsQuery(examinerId, assessmentId) {
  return useQuery({
    queryKey: ['examiner', examinerId, 'results', assessmentId, 'versions'],
    queryFn: async () => {
      const res = await examinerResultsService.getResultVersions(examinerId, assessmentId);
      if (res?.success) return res.data;
      throw new Error('Failed to load versions');
    },
    enabled: Boolean(examinerId && assessmentId),
  });
}

export default useAssessmentVersionsQuery;

