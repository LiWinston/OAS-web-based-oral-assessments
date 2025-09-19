'use client';

import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useSchedule } from '@/hooks/admin/useAdminResults';

export default function AdminResultsSchedulePage() {
  const { assignmentId } = useParams();
  const { data, isLoading } = useSchedule(assignmentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Results Publication Schedule</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Assignment {assignmentId}</p>
      </div>
      <Card className="p-6">
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="text-gray-700 dark:text-gray-300 space-y-2">
            <div>Status: <span className="font-semibold">{data?.status || 'DISABLED'}</span></div>
            <div>At: <span className="font-semibold">{data?.at || '-'}</span></div>
            <div>Notify: <span className="font-semibold">{data?.notify ? 'yes' : 'no'}</span></div>
            <p className="text-xs text-gray-500 mt-2">Phase 2 will add editing UI.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

