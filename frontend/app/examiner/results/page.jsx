'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useAuth from '../../../hooks/useAuth';
import ResultsFilters from '../../../components/examiner/results/ResultsFilters';
import ResultsTable from '../../../components/examiner/results/ResultsTable';
import { useExaminerResultsQuery } from '../../../hooks/examiner/results/useExaminerResultsQuery';

export default function ExaminerResultsPage() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const preselectedAssignmentId = searchParams.get('assignmentId') || undefined;

  const [filters, setFilters] = useState(() => ({
    status: 'all',
    ...(preselectedAssignmentId ? { assignmentId: preselectedAssignmentId } : {}),
  }));
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const queryParams = useMemo(() => {
    const p = {};
    if (filters?.status && filters.status !== 'all') p.status = filters.status;
    if (filters?.q) p.q = filters.q;
    if (filters?.from) p.from = filters.from;
    if (filters?.to) p.to = filters.to;
    if (filters?.assignmentId) p.assignmentId = filters.assignmentId;
    p.page = page;
    p.pageSize = pageSize;
    p.sort = 'sessionStart';
    p.order = 'desc';
    return p;
  }, [filters, page]);

  const { data, isLoading, error } = useExaminerResultsQuery(userId, queryParams);
  
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/examiner" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dashboard</a>
          </li>
          <li className="flex items-center">
            <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Results</span>
          </li>
        </ol>
      </nav>

      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">My Marking History</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">Review your submitted assessments, and released results. View rubric breakdowns.</p>
      </div>

      <ResultsFilters value={filters} onChange={(v) => { setFilters(v); setPage(1); }} />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <ResultsTable items={data?.items || []} />
          <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Page {page} of {totalPages}</span> • <span className="font-medium">{total}</span> total results
            </div>
            <div className="flex gap-2">
              <button 
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                         bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300" 
                disabled={page <= 1} 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <i className="fas fa-chevron-left mr-1"></i>Previous
              </button>
              <button 
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                         bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300" 
                disabled={page >= totalPages} 
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next<i className="fas fa-chevron-right ml-1"></i>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
