'use client';

import { Fragment, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.jsx';
import StatusPill from '@/components/admin/schedule/StatusPill.jsx';

const columns = [
  { key: 'startTime', label: 'Start', sortable: true },
  { key: 'endTime', label: 'End', sortable: true },
  { key: 'venueName', label: 'Venue', sortable: true },
  { key: 'requiredExaminers', label: 'Req. Examiners', sortable: true },
  { key: 'assigned', label: 'Assigned', sortable: true },
  { key: 'booking', label: 'Booking', sortable: true },
  { key: 'publish', label: 'Published', sortable: false },
  { key: 'status', label: 'Staffing', sortable: true },
  { key: 'actions', label: '', sortable: false },
];

const compareValues = (a, b, direction) => {
  if (a === b) return 0;
  if (a === undefined || a === null) return direction === 'asc' ? 1 : -1;
  if (b === undefined || b === null) return direction === 'asc' ? -1 : 1;
  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' ? a - b : b - a;
  }
  return direction === 'asc'
    ? String(a).localeCompare(String(b))
    : String(b).localeCompare(String(a));
};

const getSortValue = (session, key) => {
  switch (key) {
    case 'assigned':
      return session.assignedExaminers?.length || 0;
    case 'booking':
      return session.bookedCount ?? 0;
    case 'status':
      return session.staffingStatus || '';
    default:
      return session[key];
  }
};

const groupByVenue = (sessions) => {
  return sessions.reduce((acc, session) => {
    const key = session.venueName || 'Unassigned venue';
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {});
};

export default function SchedulingSessionsTable({ sessions, viewMode = 'table', onRowSelect, initialSort }) {
  const [sortState, setSortState] = useState(() => initialSort || { column: 'startTime', direction: 'asc' });

  const sortedSessions = useMemo(() => {
    if (!Array.isArray(sessions) || sessions.length === 0) return [];
    const { column, direction } = sortState;
    if (!column) return sessions;
    return [...sessions].sort((a, b) => {
      const aValue = getSortValue(a, column);
      const bValue = getSortValue(b, column);
      return compareValues(aValue, bValue, direction);
    });
  }, [sessions, sortState]);

  const groupedSessions = useMemo(() => {
    if (viewMode !== 'grouped') return null;
    const grouped = groupByVenue(sortedSessions);
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [sortedSessions, viewMode]);

  const toggleSort = (columnKey) => {
    setSortState((prev) => {
      if (prev.column === columnKey) {
        const nextDirection = prev.direction === 'asc' ? 'desc' : 'asc';
        return { column: columnKey, direction: nextDirection };
      }
      return { column: columnKey, direction: 'asc' };
    });
  };

  const renderPublishBadge = (session) => {
    const items = [];
    if (session.publishedToExaminer) {
      items.push(<span key="examiner" className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">Examiners</span>);
    }
    if (session.publishedToStudent) {
      items.push(<span key="student" className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-300">Students</span>);
    }
    if (items.length === 0) {
      items.push(<span key="none" className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-gray-700/60 dark:text-gray-300">Hidden</span>);
    }
    return <div className="flex flex-wrap gap-1">{items}</div>;
  };

  const renderRow = (session) => {
    const assignedCount = session.assignedExaminers?.length || 0;
    const statusPillTimeslot = {
      requiredExaminers: session.requiredExaminers,
      assignedExaminers: session.assignedExaminers,
    };
    const bookingLabel = `${session.bookedCount || 0}/${session.capacity ?? 0}`;

    return (
      <TableRow key={session.id} className="cursor-pointer" onClick={() => onRowSelect?.(session)}>
        <TableCell className="font-medium text-gray-700 dark:text-gray-100">{session.startTime}</TableCell>
        <TableCell>{session.endTime}</TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium text-gray-700 dark:text-gray-100">{session.venueName || '—'}</span>
            <span className="text-[11px] text-gray-400">ID {session.venueId || '—'}</span>
          </div>
        </TableCell>
        <TableCell>{session.requiredExaminers ?? '—'}</TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span>{assignedCount}</span>
            {assignedCount > 0 && (
              <span className="text-[11px] text-gray-500">{session.assignedExaminers.map((examiner) => examiner.name).join(', ')}</span>
            )}
          </div>
        </TableCell>
        <TableCell>{bookingLabel}</TableCell>
        <TableCell>{renderPublishBadge(session)}</TableCell>
        <TableCell>
          <StatusPill timeSlot={statusPillTimeslot} />
        </TableCell>
        <TableCell>
          <button
            type="button"
            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={(event) => {
              event.stopPropagation();
              onRowSelect?.(session);
            }}
          >
            View
          </button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Sessions</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {sessions?.length || 0} sessions
        </div>
      </div>
      {sortedSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
          No sessions found for the selected filters.
        </div>
      ) : (
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  {column.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort(column.key)}
                    >
                      {column.label}
                      {sortState.column === column.key && (
                        <i className={`fas fa-chevron-${sortState.direction === 'asc' ? 'up' : 'down'} text-[10px]`} />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewMode === 'grouped' && groupedSessions
              ? groupedSessions.map(([venueName, venueSessions]) => (
                  <Fragment key={venueName}>
                    <TableRow className="bg-gray-50 text-xs uppercase tracking-[0.2em] text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                      <TableCell colSpan={columns.length}>
                        <div className="flex items-center justify-between">
                          <span>{venueName}</span>
                          <span>{venueSessions.length} session{venueSessions.length === 1 ? '' : 's'}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {venueSessions.map((session) => renderRow(session))}
                  </Fragment>
                ))
              : sortedSessions.map((session) => renderRow(session))}
          </TableBody>
          <TableCaption>{viewMode === 'grouped' ? 'Grouped by venue' : 'Sorted by your selected column'}.</TableCaption>
        </Table>
      )}
    </div>
  );
}
