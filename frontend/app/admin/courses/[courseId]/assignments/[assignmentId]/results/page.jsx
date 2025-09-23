"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useMemo, useCallback, useEffect, useState } from "react";
import { useAssessmentList } from "@/hooks/admin/useAdminResults.js";
import ResultsFilterBar from "@/components/admin/results/ResultsFilterBar.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { courseService } from "@/services/courseService";
import { assignmentService } from "@/services/assignmentService";

const MOCK_MODE = (process.env.NEXT_PUBLIC_USE_MOCK_API ?? 'true') !== 'false';

const FALLBACK_COURSE = {
  courseCode: 'OAS101',
  courseName: 'Oral Assessment Sandbox',
  academicYear: '2025',
  semester: '1',
};

const FALLBACK_ASSIGNMENTS = {
  101: { name: 'Oral Exam 1', type: 'mixed' },
  102: { name: 'Technical Viva', type: 'individual' },
  103: { name: 'Team Demo', type: 'group' },
};

const fmtPct = (value) => (value === null || value === undefined ? '—' : `${Number(value).toFixed(1)}%`);

const ReleaseChip = ({ releaseStatus }) => {
  const released = releaseStatus === 'RELEASED';
  const icon = released ? 'fa-paper-plane' : 'fa-clock';
  const classes = released
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${classes}`}>
      <i className={`fas ${icon}`} />
      {released ? 'Released' : 'Not released'}
    </span>
  );
};

export default function AdminResultsListPage() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const { courseId, assignmentId } = params;
  const subjectId = courseId;

  const pageNum = Number(search.get('page') || 1);
  const q = search.get('q') || '';
  const status = search.get('status') || 'all';

  const listParams = useMemo(() => ({
    pageNum,
    pageSize: 10,
    status,
  }), [pageNum, status]);

  const { data, isLoading } = useAssessmentList(subjectId, assignmentId, listParams);

  const items = data?.items || [];
  const total = data?.total || 0;
  const pageSize = data?.pageSize || 10;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const filteredItems = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((row) => {
      const name = (row.assessment?.student?.name || row.assessment?.group?.name || '').toLowerCase();
      const sessionWindow = (() => {
        const start = row.session?.start ? new Date(row.session.start) : null;
        const end = row.session?.end ? new Date(row.session.end) : null;
        if (start && end) {
          const dateLabel = start.toLocaleDateString('en-AU', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          const startLabel = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const endLabel = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `${dateLabel} ${startLabel} – ${endLabel}`.toLowerCase();
        }
        if (start) {
          const dateLabel = start.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
          const startLabel = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `${dateLabel} ${startLabel}`.toLowerCase();
        }
        return '';
      })();
      return name.includes(needle) || sessionWindow.includes(needle);
    });
  }, [items, q]);

  const [course, setCourse] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (MOCK_MODE) {
      setCourse(FALLBACK_COURSE);
      const fallback = FALLBACK_ASSIGNMENTS[Number(assignmentId)] || { name: `Assignment ${assignmentId}`, type: 'individual' };
      setAssignment(fallback);
      setMetaLoading(false);
      return () => { active = false; };
    }
    setMetaLoading(true);
    Promise.all([
      courseService.getCourse(courseId).catch(() => null),
      assignmentService.getAssignmentById(assignmentId).catch(() => null),
    ]).then(([courseResp, assignmentResp]) => {
      if (!active) return;
      if (courseResp?.success) setCourse(courseResp.data);
      else if (courseResp) setCourse(courseResp);

      if (assignmentResp?.success !== undefined) setAssignment(assignmentResp?.data);
      else setAssignment(assignmentResp);
    }).finally(() => {
      if (active) setMetaLoading(false);
    });
    return () => { active = false; };
  }, [courseId, assignmentId]);

  const updateQuery = useCallback((next) => {
    const sp = new URLSearchParams(search);
    if ('q' in next) {
      const val = next.q?.trim();
      if (val) sp.set('q', val); else sp.delete('q');
    }
    if ('status' in next) {
      const val = next.status && next.status !== 'all' ? next.status : null;
      if (val) sp.set('status', val); else sp.delete('status');
    }
    sp.set('page', '1');
    router.replace(`?${sp.toString()}`);
  }, [search, router]);

  const onPage = (next) => {
    const safe = Math.min(pageCount, Math.max(1, next));
    const sp = new URLSearchParams(search);
    sp.set('page', String(safe));
    router.replace(`?${sp.toString()}`);
  };

  const courseLabel = metaLoading
    ? 'Loading course…'
    : `${course?.courseCode || ''} ${course?.courseName || ''}`.trim() || `Course ${courseId}`;
  const assignmentLabel = metaLoading
    ? 'Loading assignment…'
    : assignment?.name || `Assignment ${assignmentId}`;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-3">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300" aria-label="Breadcrumb">
          <Link href="/admin" className="font-semibold text-blue-600">OAS</Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link href="/admin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dashboard</Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link href="/admin/courses" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Courses</Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link
            href={`/admin/courses/${courseId}/assignments`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {course?.courseName || `Course ${courseId}`}
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <span className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{assignmentLabel}</span>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <span className="font-semibold text-blue-600">Results &amp; Marking</span>
        </nav>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <i className="fas fa-clipboard-check mr-3" /> Results &amp; Marking
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm">
              <span className="flex items-center gap-2">
                <i className="fas fa-book" />
                {courseLabel}
              </span>
              <span className="flex items-center gap-2">
                <i className="fas fa-id-badge" />
                Course ID: {courseId}
              </span>
              {(course?.academicYear || course?.semester) && (
                <span className="flex items-center gap-2">
                  <i className="fas fa-calendar" />
                  {course?.academicYear || 'Academic Year'}{course?.semester ? ` • Semester ${course.semester}` : ''}
                </span>
              )}
              <span className="flex items-center gap-2">
                <i className="fas fa-tasks" />
                {assignmentLabel}
              </span>
              <span className="flex items-center gap-2">
                <i className="fas fa-hashtag" />
                Assignment ID: {assignmentId}
              </span>
            </div>
          </div>
          {assignment?.type && (
            <span className="px-4 py-1.5 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wide">
              {assignment.type}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-200">
        <i className="fas fa-circle-info mr-2" /> Release is available once at least one examiner has submitted their marking.
      </div>

      <ResultsFilterBar value={{ q, status }} onChange={updateQuery} />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <TableRow>
              <TableHead>Student / Group</TableHead>
              <TableHead>Session</TableHead>
              <TableHead className="text-right">Average</TableHead>
              <TableHead className="text-right">Final</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <i className="fas fa-spinner fa-spin text-2xl text-gray-400" />
                    <span className="text-sm text-gray-500">Loading assessments…</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <i className="fas fa-file-excel text-3xl text-gray-300" />
                    <span className="text-sm text-gray-500">No assessments found</span>
                    {(q || (status && status !== 'all')) && (
                      <span className="text-xs text-gray-400">Try adjusting your filters</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filteredItems.map((row) => {
              const key = row.assessment?.key;
              const display = row.assessment?.student?.name || row.assessment?.group?.name || key?.submissionId;
              const start = row.session?.start ? new Date(row.session.start) : null;
              const end = row.session?.end ? new Date(row.session.end) : null;
              let sessionStr = '—';
              if (start && end) {
                const dateLabel = start.toLocaleDateString('en-AU', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
                const startLabel = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endLabel = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                sessionStr = `${dateLabel} ${startLabel} – ${endLabel}`;
              } else if (start) {
                const dateLabel = start.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
                const startLabel = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                sessionStr = `${dateLabel} ${startLabel}`;
              }
              const manual = row.computed?.manualOverride;
              return (
                <TableRow key={key?.submissionId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {row.assessment?.group ? (
                        <i className="fas fa-users text-gray-400" />
                      ) : (
                        <i className="fas fa-user text-gray-400" />
                      )}
                      <span className="font-medium">{display}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{sessionStr}</TableCell>
                  <TableCell className="text-right font-medium">{fmtPct(row.computed?.averageScorePct1dp)}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">{fmtPct(row.computed?.effectiveFinalScorePct1dp)}</span>
                    {manual && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[11px] rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                        Overridden
                      </span>
                    )}
                  </TableCell>
                  <TableCell><ReleaseChip releaseStatus={row.releaseStatus} /></TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/courses/${courseId}/assignments/${assignmentId}/results/${key?.submissionId}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow hover:shadow-lg transition-all hover:scale-105"
                    >
                      <i className="fas fa-eye" />
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onPage(pageNum - 1)}
            disabled={pageNum <= 1}
          >
            <i className="fas fa-chevron-left" />
            Previous
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page <span className="font-semibold text-gray-800 dark:text-gray-200">{pageNum}</span> of <span className="font-semibold text-gray-800 dark:text-gray-200">{pageCount}</span>
            </span>
            <span className="text-xs text-gray-500">({total} total)</span>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onPage(pageNum + 1)}
            disabled={pageNum >= pageCount}
          >
            Next
            <i className="fas fa-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}
