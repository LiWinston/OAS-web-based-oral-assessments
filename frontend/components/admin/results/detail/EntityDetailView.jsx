"use client";

import { useState } from 'react';
import { useEntityDetail, useSetOverride, useClearOverride } from '@/hooks/admin/useAdminResults';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReleaseDialog from '../dialogs/ReleaseDialog';
import ReviewDialog from '../dialogs/ReviewDialog';
import WithdrawDialog from '../dialogs/WithdrawDialog';
import ScheduleDialog from '../dialogs/ScheduleDialog';
import RubricReadOnly from './RubricReadOnly';
import SubmissionsList from './SubmissionsList';
import CommentsPanel from './CommentsPanel';

export default function EntityDetailView({ assignmentId, sessionId, entityKind, entityId }) {
  const [open, setOpen] = useState({ release: false, review: false, withdraw: false, schedule: false });
  const { data, isLoading, error } = useEntityDetail(assignmentId, sessionId, entityKind, entityId);

  const setOverride = useSetOverride();
  const clearOverride = useClearOverride();

  if (isLoading) return <div>Loading...</div>;
  if (error || !data) return <div>Error loading details</div>;

  const { entity, assignment, session, submissions, aggregated, releaseStatus } = data;

  const handleOverride = async () => {
    const v = Number(prompt('Enter override final score (%)')); // Simple input for Phase 2
    if (!Number.isFinite(v)) return;
    await setOverride.mutateAsync({ assignmentId, sessionId, entityKind, entityId, valuePct1dp: v, reason: 'Manual override' });
  };

  const handleClearOverride = async () => {
    await clearOverride.mutateAsync({ assignmentId, sessionId, entityKind, entityId });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">
              {entity?.student ? entity.student.name : entity?.group?.name}
            </h2>
            <p className="text-gray-600">
              {entityKind === 'GROUP' ? `Group (${entity?.group?.memberCount ?? '?'} members)` : 'Individual'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Session #{session?.id} • {session?.start ? new Date(session.start).toLocaleString() : ''} • {session?.venue?.name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {(aggregated?.effectiveFinalScorePct1dp ?? aggregated?.finalScorePct1dp ?? 0).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-500">Final Score</p>
            {aggregated?.override && (
              <p className="text-xs text-orange-600 mt-1">Overridden</p>
            )}
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => setOpen((s) => ({ ...s, release: true }))} disabled={releaseStatus === 'RELEASED'}>Release Now</Button>
        <Button variant="outline" onClick={() => setOpen((s) => ({ ...s, schedule: true }))}>Schedule</Button>
        <Button variant="outline" onClick={() => setOpen((s) => ({ ...s, review: true }))}>Review</Button>
        <Button variant="outline" onClick={() => setOpen((s) => ({ ...s, withdraw: true }))}>Withdraw</Button>
        {!aggregated?.override ? (
          <Button variant="outline" onClick={handleOverride}>Override</Button>
        ) : (
          <Button variant="outline" onClick={handleClearOverride}>Clear Override</Button>
        )}
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="rubric">Rubric</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <SubmissionsList submissions={submissions} aggregated={aggregated} />
        </TabsContent>
        <TabsContent value="rubric">
          <RubricReadOnly submissions={submissions} assignment={assignment} />
        </TabsContent>
        <TabsContent value="comments">
          <CommentsPanel submissions={submissions} />
        </TabsContent>
        <TabsContent value="history">
          <Card className="p-6 text-sm text-gray-600 dark:text-gray-300">History coming soon.</Card>
        </TabsContent>
      </Tabs>

      {open.release && (
        <ReleaseDialog assignmentId={assignmentId} entities={[entity.key]} onClose={() => setOpen((s) => ({ ...s, release: false }))} />
      )}
      {open.review && (
        <ReviewDialog assignmentId={assignmentId} entities={[entity.key]} onClose={() => setOpen((s) => ({ ...s, review: false }))} />
      )}
      {open.withdraw && (
        <WithdrawDialog assignmentId={assignmentId} entities={[entity.key]} onClose={() => setOpen((s) => ({ ...s, withdraw: false }))} />
      )}
      {open.schedule && (
        <ScheduleDialog assignmentId={assignmentId} onClose={() => setOpen((s) => ({ ...s, schedule: false }))} />
      )}
    </div>
  );
}

