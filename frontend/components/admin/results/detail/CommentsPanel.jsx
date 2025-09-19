"use client";

import { Card } from '@/components/ui/card';

export default function CommentsPanel({ submissions = [] }) {
  return (
    <div className="space-y-4">
      {submissions.map((s) => (
        <Card className="p-4" key={s.examinerId}>
          <div className="font-medium mb-2">{s.examinerName || `Examiner ${s.examinerId}`}</div>
          <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
            {(s.items || []).flatMap((it) => it.comments || []).length === 0 ? (
              <li className="text-gray-500">No comments</li>
            ) : (
              (s.items || []).flatMap((it) => it.comments || []).map((c, idx) => (
                <li key={idx}>{c.text}</li>
              ))
            )}
          </ul>
          {s.overallFeedback && (
            <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Overall:</span> {s.overallFeedback}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

