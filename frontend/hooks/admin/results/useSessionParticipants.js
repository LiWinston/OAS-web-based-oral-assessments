import { useQuery } from '@tanstack/react-query';
import { adminResultsService } from '@/services/adminResultsService.js';

const QUERY_KEY = 'admin-results-participants';

const defaultResult = {
  pageNum: 1,
  pageSize: 20,
  total: 0,
  items: [],
};

function normaliseParticipantsResponse(response) {
  if (!response) return defaultResult;

  const root = response.data ?? response;
  if (!root || typeof root !== 'object') return defaultResult;

  const items = Array.isArray(root.participants)
    ? root.participants
    : Array.isArray(root.items)
      ? root.items
      : [];

  const total = typeof root.total === 'number'
    ? root.total
    : typeof root.totalCount === 'number'
      ? root.totalCount
      : items.length;

  const pageNum = typeof root.pageNum === 'number'
    ? root.pageNum
    : typeof root.page === 'number'
      ? root.page
      : defaultResult.pageNum;

  const pageSize = typeof root.pageSize === 'number'
    ? root.pageSize
    : typeof root.limit === 'number'
      ? root.limit
      : defaultResult.pageSize;

  return {
    pageNum,
    pageSize,
    total,
    items,
  };
}

export function useSessionParticipants(subjectId, assignmentId, sessionId, params = {}, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [QUERY_KEY, subjectId, assignmentId, sessionId, params],
    queryFn: async () => {
      const response = await adminResultsService.listSessionParticipants(subjectId, assignmentId, sessionId, params);
      return normaliseParticipantsResponse(response);
    },
    enabled: Boolean(subjectId && assignmentId && sessionId && enabled),
    keepPreviousData: true,
    staleTime: 30_000,
  });
}

export default useSessionParticipants;
