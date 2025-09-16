'use client';

import { useQuery } from '@tanstack/react-query';
import { examinerResultsService } from '../../../services/examinerResultsService';

export function useExaminerResultsQuery(examinerId, params) {
  return useQuery({
    queryKey: ['examiner', examinerId, 'results', params],
    queryFn: async () => {
      const res = await examinerResultsService.listResults(examinerId, params);
      if (res?.success) return res.data;
      throw new Error('Failed to load results');
    },
    enabled: Boolean(examinerId),
  });
}

export default useExaminerResultsQuery;

