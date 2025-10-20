import { useQuery } from '@tanstack/react-query';
import { adminResultsService } from '@/services/adminResultsService.js';

const QUERY_KEY = 'admin-results-sessions';

const defaultResult = {
  pageNum: 1,
  pageSize: 10,
  total: 0,
  items: [],
};

function normaliseSessionsResponse(response) {
  if (!response) return defaultResult;

  const root = response.data ?? response;
  if (!root || typeof root !== 'object') return defaultResult;

  const items =
    Array.isArray(root.sessions)
      ? root.sessions
      : Array.isArray(root.items)
        ? root.items
        : Array.isArray(root.data)
          ? root.data
          : [];

  const total =
    typeof root.total === 'number'
      ? root.total
      : typeof root.totalCount === 'number'
        ? root.totalCount
        : items.length;

  const pageNum =
    typeof root.pageNum === 'number'
      ? root.pageNum
      : typeof root.page === 'number'
        ? root.page
        : defaultResult.pageNum;

  const pageSize =
    typeof root.pageSize === 'number'
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

export function useAssignmentSessions(subjectId, assignmentId, params = {}, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [QUERY_KEY, subjectId, assignmentId, params],
    queryFn: async () => {
      const response = await adminResultsService.listAssignmentSessions(subjectId, assignmentId, params);
      return normaliseSessionsResponse(response);
    },
    enabled: Boolean(subjectId && assignmentId && enabled),
    keepPreviousData: true,
    staleTime: 30_000,
  });
}

export default useAssignmentSessions;
