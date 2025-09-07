'use client';

import { useState, useMemo } from 'react';
import useAuth from '../../../hooks/useAuth';
import ResultsFilters from '../../../components/examiner/results/ResultsFilters';
import ResultsTable from '../../../components/examiner/results/ResultsTable';
import { useExaminerResultsQuery } from '../../../hooks/examiner/results/useExaminerResultsQuery';

export default function ExaminerResultsPage() {
  const { userId } = useAuth();
  const [filters, setFilters] = useState({ status: 'all' });
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

  const { data, isLoading } = useExaminerResultsQuery(userId, queryParams);
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/examiner" className="text-gray-500 dark:text-gray-400 hover:text-blue-600">Dashboard</a>
          </li>
          <li className="flex items-center">
            <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Results</span>
          </li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Marking History</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">Review your submitted assessments, drafts, and released results. View rubric breakdowns and versions.</p>

      <ResultsFilters value={filters} onChange={(v) => { setFilters(v); setPage(1); }} />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <ResultsTable items={data?.items || []} />
          <div className="flex justify-between items-center mt-4">
            <div className="text-xs text-gray-500">Page {page} of {totalPages} • {total} total</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded border text-sm disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              <button className="px-3 py-1 rounded border text-sm disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
