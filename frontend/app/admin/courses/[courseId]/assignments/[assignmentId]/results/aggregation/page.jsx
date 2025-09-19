'use client';

import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useAggregation } from '@/hooks/admin/useAdminResults';

export default function AdminAggregationPage() {
  const { assignmentId } = useParams();
  const { data, isLoading } = useAggregation(assignmentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Aggregation Method</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Assignment {assignmentId}</p>
      </div>
      <Card className="p-6">
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div>
            <p className="text-gray-700 dark:text-gray-300">Current method: <span className="font-semibold">{data?.method || 'average'}</span></p>
            <p className="text-xs text-gray-500 mt-2">Phase 2/3 will add controls to update this.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

