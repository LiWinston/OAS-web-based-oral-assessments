'use client';

import { useQuery } from '@tanstack/react-query';
import { examinerResultsService } from '../../../services/examinerResultsService';

export function useExaminerResultsQuery(examinerId, params) {
  return useQuery({
    queryKey: ['examiner', examinerId, 'results', params],
    queryFn: async () => {
      console.log('useExaminerResultsQuery called with:', { examinerId, params });
      const res = await examinerResultsService.listResults(examinerId, params);
      console.log('useExaminerResultsQuery service response:', res);
      if (res?.success) {
        console.log('useExaminerResultsQuery returning data:', res.data);
        return res.data;
      }
      console.error('useExaminerResultsQuery failed:', res);
      throw new Error('Failed to load results');
    },
    enabled: Boolean(examinerId),
  });
}

export default useExaminerResultsQuery;

