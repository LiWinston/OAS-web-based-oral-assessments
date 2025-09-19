"use client";

import { useMemo, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useConsolidatedResults } from '@/hooks/admin/useAdminResults';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ResultsFilterBar from './ResultsFilterBar';
import StatusChip from '../shared/StatusChip';
import DivergenceIndicator from '../shared/DivergenceIndicator';
import { eqEntityKey, keyToId } from '../shared/keyUtils';
import ReleaseDialog from '../dialogs/ReleaseDialog';
import WithdrawDialog from '../dialogs/WithdrawDialog';
import ReviewDialog from '../dialogs/ReviewDialog';
import ScheduleDialog from '../dialogs/ScheduleDialog';

function computeRowStatus(row) {
  // precedence: REOPENED > RELEASED > SUBMITTED > DRAFT
  const statuses = (row.assessments || []).map(a => a.assessmentStatus);
  const hasReopened = statuses.includes('REOPENED');
  if (hasReopened) return 'REOPENED';
  if (row.releaseStatus === 'RELEASED') return 'RELEASED';
  const hasSubmitted = statuses.includes('SUBMITTED');
  if (hasSubmitted) return 'SUBMITTED';
  return 'DRAFT';
}

export default function ResultsConsolidatedList({ assignmentId: propAssignmentId }) {
  const params = useParams();
  const router = useRouter();
  const assignmentId = propAssignmentId ?? params?.assignmentId;

  const [filters, setFilters] = useState({});
  const [selection, setSelection] = useState([]); // array of EntityKey
  const [dialogs, setDialogs] = useState({ release: false, withdraw: false, review: false, schedule: false });

  const { data, isLoading } = useConsolidatedResults(assignmentId, filters);
  const items = data?.items || [];

  const toggleSelected = useCallback((key) => {
    setSelection((prev) => {
      const exists = prev.some((k) => eqEntityKey(k, key));
      if (exists) return prev.filter((k) => !eqEntityKey(k, key));
      return [...prev, key];
    });
  }, []);

  const allOnPageSelected = useMemo(() => {
    if (!items.length) return false;
    return items.every((row) => selection.some((k) => eqEntityKey(k, row.entity.key)));
  }, [items, selection]);

  const toggleSelectAll = useCallback(() => {
    if (allOnPageSelected) {
      // remove current page items
      setSelection((prev) => prev.filter((k) => !items.some((row) => eqEntityKey(k, row.entity.key))));
    } else {
      // add all page items
      const toAdd = items.map((row) => row.entity.key);
      setSelection((prev) => {
        const merged = [...prev];
        toAdd.forEach((k) => { if (!merged.some((ek) => eqEntityKey(ek, k))) merged.push(k); });
        return merged;
      });
    }
  }, [allOnPageSelected, items]);

  const navigateToDetail = (row) => {
    const key = row.entity.key;
    router.push(`/admin/courses/${params.courseId}/assignments/${assignmentId}/results/${key.sessionId}/${key.kind}/${key.entityId}`);
  };

  return (
    <div className="space-y-4">
      <ResultsFilterBar currentFilters={filters} onFiltersChange={setFilters} />

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Select page</span>
          </div>
          <div className="flex items-center gap-2">
            <Button disabled={selection.length === 0} onClick={() => setDialogs((d) => ({ ...d, release: true }))}>Release</Button>
            <Button variant="outline" onClick={() => setDialogs((d) => ({ ...d, schedule: true }))}>Schedule</Button>
            <Button variant="outline" disabled={selection.length === 0} onClick={() => setDialogs((d) => ({ ...d, review: true }))}>Review</Button>
            <Button variant="outline" disabled={selection.length === 0} onClick={() => setDialogs((d) => ({ ...d, withdraw: true }))}>Withdraw</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="text-left">
                <th className="p-3 w-10"></th>
                <th className="p-3">Entity</th>
                <th className="p-3">Session</th>
                <th className="p-3">Status</th>
                <th className="p-3">Divergence</th>
                <th className="p-3 text-right">Final</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500">Loading...</td></tr>
              )}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500">No results</td></tr>
              )}
              {items.map((row) => {
                const key = row.entity.key;
                const checked = selection.some((k) => eqEntityKey(k, key));
                const entityLabel = key.kind === 'GROUP' ? (row.entity.group?.name || `Group ${key.entityId}`) : (row.entity.student?.name || `Student ${key.entityId}`);
                const sessionLabel = new Date(row.session.start).toLocaleString();
                const status = computeRowStatus(row);
                return (
                  <tr key={keyToId(key)} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/20">
                    <td className="p-3">
                      <input type="checkbox" checked={checked} onChange={() => toggleSelected(key)} />
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{entityLabel}</div>
                      <div className="text-xs text-gray-500">{key.kind}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-gray-700 dark:text-gray-300">{sessionLabel}</div>
                      {row.session.venue?.name && (
                        <div className="text-xs text-gray-500">{row.session.venue.name}</div>
                      )}
                    </td>
                    <td className="p-3"><StatusChip status={status} /></td>
                    <td className="p-3"><DivergenceIndicator assessments={row.assessments} /></td>
                    <td className="p-3 text-right font-semibold text-blue-600 dark:text-blue-400">{(row.aggregated?.finalScorePct1dp ?? 0).toFixed(1)}%</td>
                    <td className="p-3 text-right">
                      <Button variant="outline" onClick={() => navigateToDetail(row)}>View</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialogs */}
      {dialogs.release && (
        <ReleaseDialog
          assignmentId={assignmentId}
          entities={selection}
          onClose={() => setDialogs((d) => ({ ...d, release: false }))}
          onDone={() => setSelection([])}
        />
      )}
      {dialogs.withdraw && (
        <WithdrawDialog
          assignmentId={assignmentId}
          entities={selection}
          onClose={() => setDialogs((d) => ({ ...d, withdraw: false }))}
          onDone={() => setSelection([])}
        />
      )}
      {dialogs.review && (
        <ReviewDialog
          assignmentId={assignmentId}
          entities={selection}
          onClose={() => setDialogs((d) => ({ ...d, review: false }))}
          onDone={() => setSelection([])}
        />
      )}
      {dialogs.schedule && (
        <ScheduleDialog
          assignmentId={assignmentId}
          onClose={() => setDialogs((d) => ({ ...d, schedule: false }))}
        />
      )}
    </div>
  );
}

