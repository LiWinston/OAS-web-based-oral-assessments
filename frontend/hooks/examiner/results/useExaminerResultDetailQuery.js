'use client';

import { useQuery } from '@tanstack/react-query';
import { examinerResultsService } from '../../../services/examinerResultsService';

export function useExaminerResultDetailQuery(examinerId, assessmentId, { version = 'latest' } = {}) {
  return useQuery({
    queryKey: ['examiner', examinerId, 'results', assessmentId, { version }],
    queryFn: async () => {
      const res = await examinerResultsService.getResultDetail(examinerId, assessmentId, { version });
      if (res?.success) return res.data;
      throw new Error('Failed to load result detail');
    },
    enabled: Boolean(examinerId && assessmentId),
  });
}

export default useExaminerResultDetailQuery;

