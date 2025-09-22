import { useQuery } from '@tanstack/react-query';
import { adminResultsService } from '@/services/adminResultsService.js';

const QUERY_KEY = 'admin-results-summary';
const PAGE_SIZE = 200;

function normaliseListResponse(response) {
  if (!response) {
    return { total: 0, items: [] };
  }

  const payload = response.data ?? response;
  if (!payload) {
    return { total: 0, items: [] };
  }

  if (Array.isArray(payload)) {
    return { total: payload.length, items: payload };
  }

  const directItems = payload.items ?? payload.data;
  if (Array.isArray(directItems)) {
    return {
      total: typeof payload.total === 'number' ? payload.total : directItems.length,
      items: directItems,
    };
  }

  const nested = payload.data;
  if (nested && typeof nested === 'object') {
    const nestedItems = nested.items ?? nested.data;
    return {
      total: typeof nested.total === 'number' ? nested.total : Array.isArray(nestedItems) ? nestedItems.length : 0,
      items: Array.isArray(nestedItems) ? nestedItems : [],
    };
  }

  return { total: 0, items: [] };
}

async function fetchAssignmentSummary(subjectId, assignmentId) {
  let pageNum = 1;
  let accumulated = [];
  let total = 0;
  let shouldContinue = true;

  while (shouldContinue) {
    const response = await adminResultsService.listAssessments(subjectId, assignmentId, {
      pageNum,
      pageSize: PAGE_SIZE,
    });

    const { items, total: reportedTotal } = normaliseListResponse(response);

    if (pageNum === 1 && typeof reportedTotal === 'number') {
      total = reportedTotal;
    }

    if (items.length === 0) {
      shouldContinue = false;
    } else {
      accumulated = accumulated.concat(items);
    }

    const fetched = accumulated.length;
    if (fetched >= total || items.length < PAGE_SIZE) {
      shouldContinue = false;
    } else {
      pageNum += 1;
    }
  }

  if (!total && accumulated.length) {
    total = accumulated.length;
  }

  const summary = accumulated.reduce(
    (result, item) => {
      const releaseStatus = item.releaseStatus ?? item.release?.status;
      if (releaseStatus === 'RELEASED') {
        result.released += 1;
      }

      if (typeof item.computed?.averageScorePct1dp === 'number') {
        result.totalAverage += item.computed.averageScorePct1dp;
        result.averageSampleCount += 1;
      }

      return result;
    },
    { total, released: 0, totalAverage: 0, averageSampleCount: 0 }
  );

  const pending = Math.max(summary.total - summary.released, 0);

  return {
    total: summary.total,
    released: summary.released,
    pending,
    averageScore:
      summary.averageSampleCount > 0
        ? Number((summary.totalAverage / summary.averageSampleCount).toFixed(1))
        : null,
  };
}

export function useAssignmentResultsSummary(subjectId, assignmentId, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [QUERY_KEY, subjectId, assignmentId],
    queryFn: () => fetchAssignmentSummary(subjectId, assignmentId),
    enabled: Boolean(subjectId && assignmentId && enabled),
    staleTime: 60_000,
    retry: 1,
  });
}

export default useAssignmentResultsSummary;
