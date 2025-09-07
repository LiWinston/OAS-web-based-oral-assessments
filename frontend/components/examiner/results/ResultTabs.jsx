'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { Card, CardContent } from '../../ui/card';
import RubricSnapshot from './RubricSnapshot';
import VersionsTimeline from './VersionsTimeline';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResultTabs({ detail, versions }) {
  if (!detail) return null;
  const { entities, assignment, rubricFrozen } = detail;
  const groupEntity = entities?.find((e) => e.kind === 'GROUP');
  const individualEntities = (entities || []).filter((e) => e.kind === 'INDIVIDUAL');
  const router = useRouter();
  const search = useSearchParams();
  const handleSelectVersion = (v) => {
    const params = new URLSearchParams(search?.toString() || '');
    params.set('version', String(v));
    router.replace(`?${params.toString()}`);
  };

  return (
    <Tabs defaultValue="summary" className="space-y-4">
      <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
        <TabsTrigger value="summary"><i className="fas fa-list-check mr-2" />Summary</TabsTrigger>
        <TabsTrigger value="rubric"><i className="fas fa-table mr-2" />Rubric</TabsTrigger>
        <TabsTrigger value="notes"><i className="fas fa-note-sticky mr-2" />Notes</TabsTrigger>
        <TabsTrigger value="versions"><i className="fas fa-code-branch mr-2" />Versions</TabsTrigger>
      </TabsList>

      <TabsContent value="summary">
        <Card className="dashboard-card"><CardContent className="p-4">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <div className="text-gray-600 dark:text-gray-400">Assignment</div>
              <div className="font-medium">{assignment?.courseCode ? `${assignment.courseCode} · ${assignment.courseName} · ${assignment?.name}` : assignment?.name}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-600 dark:text-gray-400">Type</div>
              <div className="font-medium capitalize">{assignment?.type}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-600 dark:text-gray-400">Total Points</div>
              <div className="font-medium">{assignment?.rubricMeta?.totalPoints || 100}</div>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700" />
            {groupEntity && (
              <div className="flex justify-between">
                <div className="text-gray-600 dark:text-gray-400">Group Score</div>
                <div className="font-semibold text-blue-700 dark:text-blue-300">{groupEntity?.computed?.examinerScorePct1dp != null ? `${groupEntity.computed.examinerScorePct1dp}%` : '-'}</div>
              </div>
            )}
            {individualEntities?.length > 0 && (
              <div className="space-y-2">
                {individualEntities.map((e, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div className="text-gray-600 dark:text-gray-400">{e.studentName || `Student ${e.studentId}`}</div>
                    <div className="font-semibold text-blue-700 dark:text-blue-300">{e?.computed?.examinerScorePct1dp != null ? `${e.computed.examinerScorePct1dp}%` : '-'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="rubric">
        <div className="space-y-6">
          {groupEntity && (
            <RubricSnapshot title="Group Assessment" rubricFrozen={rubricFrozen} items={groupEntity.items} />
          )}
          {individualEntities.map((e, idx) => (
            <RubricSnapshot key={e.studentId || idx} title={`Individual — ${e.studentName || e.studentId || ''}`} rubricFrozen={rubricFrozen} items={e.items} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="notes">
        <Card className="dashboard-card"><CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entities?.map((e, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-sm font-semibold">{e.kind === 'GROUP' ? 'Group' : `Student ${e.studentName || e.studentId}`}</div>
                {e?.overallFeedback && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Overall Feedback</div>
                    <div className="p-3 rounded bg-gray-50 dark:bg-gray-900/50 text-sm whitespace-pre-wrap">{e.overallFeedback}</div>
                  </div>
                )}
                {e?.notes && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Private Notes</div>
                    <div className="p-3 rounded bg-gray-50 dark:bg-gray-900/50 text-sm whitespace-pre-wrap">{e.notes}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="versions">
        <Card className="dashboard-card"><CardContent className="p-4">
          <VersionsTimeline versions={versions?.versions || []} onSelectVersion={handleSelectVersion} />
        </CardContent></Card>
      </TabsContent>
    </Tabs>
  );
}
