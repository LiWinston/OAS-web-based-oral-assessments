'use client';

import { useParams } from 'next/navigation';
import ResultsConsolidatedList from '@/components/admin/results/list/ResultsConsolidatedList';

export default function AdminResultsListPage() {
  const { assignmentId } = useParams();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Consolidated Results</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Assignment {assignmentId}</p>
      </div>
      <ResultsConsolidatedList assignmentId={assignmentId} />
    </div>
  );
}
