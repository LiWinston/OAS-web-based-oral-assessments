'use client';

import { useParams } from 'next/navigation';
import EntityDetailView from '@/components/admin/results/detail/EntityDetailView';

export default function AdminResultsDetailPage() {
  const { assignmentId, sessionId, kind, entityId } = useParams();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Result Detail</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Assignment {assignmentId}</p>
      </div>
      <EntityDetailView assignmentId={assignmentId} sessionId={sessionId} entityKind={kind} entityId={entityId} />
    </div>
  );
}
