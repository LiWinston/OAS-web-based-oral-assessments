"use client";

import { Card } from '@/components/ui/card';
import StatusChip from '../shared/StatusChip';

export default function SubmissionsList({ submissions = [], aggregated }) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Aggregation: <span className="font-medium">{aggregated?.method || 'average'}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Computed final: <span className="font-semibold">{(aggregated?.finalScorePct1dp ?? 0).toFixed(1)}%</span>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr className="text-left">
            <th className="p-2">Examiner</th>
            <th className="p-2">Status</th>
            <th className="p-2">Submitted</th>
            <th className="p-2 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.examinerId} className="border-t border-gray-100 dark:border-gray-800">
              <td className="p-2">{s.examinerName || `Examiner ${s.examinerId}`}</td>
              <td className="p-2"><StatusChip status={s.assessmentStatus} /></td>
              <td className="p-2">{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '-'}</td>
              <td className="p-2 text-right">{s.computed?.examinerScorePct1dp != null ? `${s.computed.examinerScorePct1dp.toFixed ? s.computed.examinerScorePct1dp.toFixed(1) : s.computed.examinerScorePct1dp}%` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

