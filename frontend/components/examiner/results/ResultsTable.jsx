'use client';

import React, { Fragment } from 'react';
import Link from 'next/link';
import { Badge } from '../../ui/badge';

const precedence = (a) => (a === 'REOPENED' ? 4 : a === 'RELEASED' ? 3 : a === 'SUBMITTED' ? 2 : 1);

function StatusChip({ assessmentStatus, releaseStatus }) {
  const status = assessmentStatus === 'REOPENED' ? 'Reopened' : (releaseStatus === 'RELEASED' ? 'Released' : (assessmentStatus === 'SUBMITTED' ? 'Submitted' : 'Draft'));
  
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
  const colorClasses = status === 'Reopened'
    ? 'bg-purple-100 text-purple-800 border border-purple-200'
    : status === 'Released'
      ? 'bg-green-100 text-green-800 border border-green-200'
      : status === 'Submitted'
        ? 'bg-blue-100 text-blue-800 border border-blue-200'
        : 'bg-amber-100 text-amber-800 border border-amber-200';
  
  return <div className={`${baseClasses} ${colorClasses}`}>{status}</div>;
}

function fmtDateTime(s) {
  const d = new Date(s);
  return `${d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`;
}

function groupBy(items, fnKey) {
  const map = new Map();
  for (const it of items || []) {
    const k = fnKey(it);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  }
  return Array.from(map.entries()).map(([key, group]) => ({ key, group }));
}

export default function ResultsTable({ items = [] }) {
  if (!items?.length) {
    return (
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">No results found.</div>
    );
  }

  const groups = groupBy(items, (it) => `${it.assignment?.id}-${it.session?.id}`);

  try {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-600">
                <th className="p-4 font-semibold">Assignment</th>
                <th className="p-4 font-semibold">Entity</th>
                <th className="p-4 font-semibold">Submit Time</th>
                <th className="p-4 font-semibold text-center">Your Mark</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
            {groups.map(({ key, group }) => (
              <Fragment key={key}>
                {group.map((it) => (
                  <tr key={it.assessmentId} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors duration-150">
                  <td className="p-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      <Link href={`/examiner/results/${it.assessmentId}`} className="hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{it.assignment?.name}</Link>
                    </div>
                  <div className="text-xs text-gray-500 mt-1">{it.assignment?.courseCode ? `${it.assignment.courseCode} • ${it.assignment.courseName}` : String(it.assignment?.type || '').toUpperCase()}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-800 dark:text-gray-200">
                    {it.entity?.kind === 'GROUP' ? (
                      <div>
                        <div className="font-medium">{it.entity.group?.groupName || `Group #${it.entity.group?.groupId}`}</div>
                        <div className="text-xs text-gray-500 mt-1">Members: {it.entity.group?.memberCount || '-'}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">{it.entity.student?.name}</div>
                        <div className="text-xs text-gray-500 mt-1">ID: {it.entity.student?.studentId}</div>
                      </div>
                    )}
                  </td>
                <td className="p-4 text-sm text-gray-800 dark:text-gray-200">
                  <div className="font-medium">{fmtDateTime(it.submittedAt)}</div>
                  <div className="text-xs text-gray-500 mt-1">Submitted</div>
                </td>
                  <td className="p-4 text-center">
                    <div className="font-bold text-lg text-blue-700 dark:text-blue-300">
                      {it.examinerScorePct1dp != null ? `${it.examinerScorePct1dp.toFixed ? it.examinerScorePct1dp.toFixed(2) : it.examinerScorePct1dp}` : '-'}
                    </div>
                  </td>
                  <td className="p-4"><StatusChip assessmentStatus={it.assessmentStatus} releaseStatus={it.releaseStatus} /></td>
                </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards on mobile */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {items.map((it) => (
          <Link key={it.assessmentId} href={`/examiner/results/${it.assessmentId}`} className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">{it.assignment?.name}</div>
                <div className="text-xs text-gray-500 mt-1">{it.assignment?.courseCode ? `${it.assignment.courseCode} • ${it.assignment.courseName}` : String(it.assignment?.type || '').toUpperCase()}</div>
              </div>
              <StatusChip assessmentStatus={it.assessmentStatus} releaseStatus={it.releaseStatus} />
            </div>
            <div className="text-sm text-gray-800 dark:text-gray-200 mb-2">
              <span className="font-medium">
                {it.entity?.kind === 'GROUP' ? it.entity.group?.groupName : it.entity.student?.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-500">Submit Time</div>
                <div className="text-sm font-medium">{fmtDateTime(it.submittedAt)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Your Mark</div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {it.examinerScorePct1dp != null ? `${it.examinerScorePct1dp.toFixed ? it.examinerScorePct1dp.toFixed(2) : it.examinerScorePct1dp}` : '-'}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
    );
  } catch (error) {
    console.error('ResultsTable rendering error:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Rendering Error</h3>
        <p className="text-red-600 text-sm mt-1">
          Failed to render results table: {error.message}
        </p>
        <details className="mt-2">
          <summary className="text-red-600 cursor-pointer text-sm">Raw Data</summary>
          <pre className="text-xs bg-red-100 p-2 mt-1 rounded overflow-auto">
            {JSON.stringify(items, null, 2)}
          </pre>
        </details>
      </div>
    );
  }
}
