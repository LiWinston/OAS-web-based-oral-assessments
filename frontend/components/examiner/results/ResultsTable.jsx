'use client';

import React, { Fragment } from 'react';
import Link from 'next/link';
import { Badge } from '../../ui/badge';

const precedence = (a) => (a === 'REOPENED' ? 4 : a === 'RELEASED' ? 3 : a === 'SUBMITTED' ? 2 : 1);

function StatusChip({ assessmentStatus, releaseStatus }) {
  const status = assessmentStatus === 'REOPENED' ? 'Reopened' : (releaseStatus === 'RELEASED' ? 'Released' : (assessmentStatus === 'SUBMITTED' ? 'Submitted' : 'Draft'));
  const style = status === 'Reopened'
    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border-purple-200 dark:border-purple-800'
    : status === 'Released'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800'
      : status === 'Submitted'
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-800'
        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200 dark:border-amber-800';
  return <Badge className={style} variant="outline">{status}</Badge>;
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
  console.log('ResultsTable received items:', items);
  console.log('ResultsTable items length:', items?.length);
  
  if (!items?.length) {
    console.log('ResultsTable: No items, showing empty message');
    return (
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">No results found.</div>
    );
  }

  // Debug the grouping logic
  items.forEach((item, index) => {
    console.log(`Item ${index}:`, {
      assessmentId: item.assessmentId,
      assignmentId: item.assignment?.id,
      sessionId: item.session?.id,
      assignmentName: item.assignment?.name,
      groupKey: `${item.assignment?.id}-${item.session?.id}`
    });
  });

  const groups = groupBy(items, (it) => `${it.assignment?.id}-${it.session?.id}`);
  console.log('ResultsTable groups:', groups);

  try {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                <th className="p-3">Assignment</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Session</th>
                <th className="p-3 text-center">Your Mark</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
            {groups.map(({ key, group }) => (
              <Fragment key={key}>
                <tr key={`hdr-${key}`} className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                  <td colSpan={5} className="p-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between">
                      <div className="font-medium">
                        {group[0].assignment?.courseCode ? `${group[0].assignment.courseCode} · ${group[0].assignment.courseName} · ${group[0].assignment?.name}` : group[0].assignment?.name}
                      </div>
                      <div className="text-xs text-gray-500">{fmtDateTime(group[0].session?.start)} → {fmtDateTime(group[0].session?.end)}</div>
                    </div>
                  </td>
                </tr>
                {group.map((it) => (
                  <tr key={it.assessmentId} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                  <td className="p-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      <Link href={`/examiner/results/${it.assessmentId}`} className="hover:underline">{it.assignment?.name}</Link>
                    </div>
                  <div className="text-xs text-gray-500">{it.assignment?.courseCode ? `${it.assignment.courseCode} • ${it.assignment.courseName}` : String(it.assignment?.type || '').toUpperCase()}</div>
                  </td>
                  <td className="p-3 text-sm text-gray-800 dark:text-gray-200">
                    {it.entity?.kind === 'GROUP' ? (
                      <div>
                        <div className="font-medium">{it.entity.group?.groupName || `Group #${it.entity.group?.groupId}`}</div>
                        <div className="text-xs text-gray-500">Members: {it.entity.group?.memberCount || '-'}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">{it.entity.student?.name}</div>
                        <div className="text-xs text-gray-500">ID: {it.entity.student?.studentId}</div>
                      </div>
                    )}
                  </td>
                <td className="p-3 text-sm text-gray-800 dark:text-gray-200">
                  <div>{fmtDateTime(it.session?.start)} → {fmtDateTime(it.session?.end)}</div>
                  {it.session?.venue?.room && (
                    <div className="text-xs text-gray-500">{it.session.venue.room}</div>
                  )}
                </td>
                  <td className="p-3 text-center font-semibold text-blue-700 dark:text-blue-300">{it.examinerScorePct1dp != null ? `${it.examinerScorePct1dp.toFixed ? it.examinerScorePct1dp.toFixed(1) : it.examinerScorePct1dp}%` : '-'}</td>
                  <td className="p-3"><StatusChip assessmentStatus={it.assessmentStatus} releaseStatus={it.releaseStatus} /></td>
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
          <Link key={it.assessmentId} href={`/examiner/results/${it.assessmentId}`} className="block p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{it.assignment?.name}</div>
                <div className="text-xs text-gray-500">{it.assignment?.courseCode ? `${it.assignment.courseCode} • ${it.assignment.courseName}` : String(it.assignment?.type || '').toUpperCase()}</div>
              </div>
              <StatusChip assessmentStatus={it.assessmentStatus} releaseStatus={it.releaseStatus} />
            </div>
            <div className="mt-2 text-sm text-gray-800 dark:text-gray-200">
              {it.entity?.kind === 'GROUP' ? it.entity.group?.groupName : it.entity.student?.name}
            </div>
            <div className="mt-1 text-xs text-gray-500">{fmtDateTime(it.session?.start)} → {fmtDateTime(it.session?.end)}</div>
            <div className="mt-2 text-sm font-semibold text-blue-700 dark:text-blue-300">{it.examinerScorePct1dp != null ? `${it.examinerScorePct1dp.toFixed ? it.examinerScorePct1dp.toFixed(1) : it.examinerScorePct1dp}%` : '-'}</div>
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
