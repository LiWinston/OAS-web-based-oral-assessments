"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAssessmentList } from "@/hooks/admin/useAdminResults.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function StatusChip({ releaseStatus }) {
  const label = releaseStatus === 'RELEASED' ? 'Released' : 'Not Released';
  const cls = releaseStatus === 'RELEASED'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-amber-100 text-amber-800 border-amber-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${cls}`}>{label}</span>;
}

function fmtPct(v) { return typeof v === 'number' ? `${v.toFixed(1)}%` : '—'; }

export default function AdminResultsListPage() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const { courseId, assignmentId } = params;

  // subjectId maps to courseId in our routes
  const subjectId = courseId;

  const pageNum = Number(search.get('page') || 1);
  const q = search.get('q') || '';
  const sessionId = search.get('sessionId') || undefined;

  const { data, isLoading } = useAssessmentList(subjectId, assignmentId, { pageNum, pageSize: 20, q, sessionId });

  const items = data?.items || [];
  const total = data?.total || 0;
  const pageSize = data?.pageSize || 20;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const onSearch = (e) => {
    const val = e.target.value;
    const sp = new URLSearchParams(search);
    if (val) sp.set('q', val); else sp.delete('q');
    sp.set('page', '1');
    router.replace(`?${sp.toString()}`);
  };

  const onPage = (next) => {
    const sp = new URLSearchParams(search);
    sp.set('page', String(Math.min(pageCount, Math.max(1, next))));
    router.replace(`?${sp.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <Link href={`/admin/courses/${courseId}/assignments/${assignmentId}`}>Assignment Overview</Link>
        <i className="fas fa-chevron-right text-xs" />
        <span>Results &amp; Marking</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Results &amp; Marking</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">View assessments and release results</p>
        </div>
        <div className="w-64">
          <input
            type="search"
            className="form-control w-full"
            placeholder="Search student/group..."
            defaultValue={q}
            onChange={onSearch}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <TableRow>
              <TableHead>Student/Group</TableHead>
              <TableHead>Session</TableHead>
              <TableHead className="text-right">Average</TableHead>
              <TableHead className="text-right">Final</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={6} className="py-6 text-center text-sm text-gray-500">Loading…</TableCell></TableRow>
            )}
            {!isLoading && items.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-6 text-center text-sm text-gray-500">No assessments found</TableCell></TableRow>
            )}
            {!isLoading && items.map((row) => {
              const key = row.assessment?.key;
              const display = row.assessment?.student?.name || row.assessment?.group?.name || key?.submissionId;
              const start = row.session?.start ? new Date(row.session.start) : null;
              const sessionStr = start ? `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—';
              return (
                <TableRow key={key?.submissionId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <TableCell className="font-medium">{display}</TableCell>
                  <TableCell>{sessionStr}</TableCell>
                  <TableCell className="text-right">{fmtPct(row.computed?.averageScorePct1dp)}</TableCell>
                  <TableCell className="text-right">{fmtPct(row.computed?.effectiveFinalScorePct1dp)}</TableCell>
                  <TableCell><StatusChip releaseStatus={row.releaseStatus} /></TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/courses/${courseId}/assignments/${assignmentId}/results/${key?.submissionId}`}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow hover:shadow-lg"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button className="btn btn-secondary" onClick={() => onPage(pageNum - 1)} disabled={pageNum <= 1}>
          <i className="fas fa-arrow-left mr-2" /> Previous
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-400">Page {pageNum} of {pageCount}</div>
        <button className="btn btn-secondary" onClick={() => onPage(pageNum + 1)} disabled={pageNum >= pageCount}>
          Next <i className="fas fa-arrow-right ml-2" />
        </button>
      </div>
    </div>
  );
}

