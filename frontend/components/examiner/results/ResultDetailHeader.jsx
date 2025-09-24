'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

function StatusChip({ assessmentStatus, releaseStatus }) {
  const status = assessmentStatus === 'REOPENED' ? 'Reopened' : (releaseStatus === 'RELEASED' ? 'Released' : (assessmentStatus === 'SUBMITTED' ? 'Submitted' : 'Draft'));
  
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
  const colorClasses = status === 'Reopened'
    ? 'bg-purple-100 text-purple-800 border border-purple-200'
    : status === 'Released'
      ? 'bg-green-100 text-green-800 border border-green-200'
      : status === 'Submitted'
        ? 'bg-blue-100 text-blue-800 border border-blue-200'
        : 'bg-amber-100 text-amber-800 border border-amber-200';
  
  return <div className={`${baseClasses} ${colorClasses}`}>{status}</div>;
}

function fmtSubmittedTime(submittedAt) {
  const s = new Date(submittedAt);
  const date = s.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const time = s.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

export default function ResultDetailHeader({ detail, versions = [], currentVersion = 'latest' }) {
  // Hooks must be called unconditionally
  const router = useRouter();
  const search = useSearchParams();
  if (!detail) return null;
  const { assignment, session, assessmentStatus, releaseStatus, submittedAt } = detail;
  const time = fmtSubmittedTime(submittedAt);

  const onJump = (v) => {
    const params = new URLSearchParams(search?.toString() || '');
    params.set('version', String(v));
    router.replace(`?${params.toString()}`);
  };

  return (
    <Card className="dashboard-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{assignment?.courseCode ? `${assignment.courseCode} · ${assignment.courseName} · ${assignment?.name}` : assignment?.name}</h1>
              <StatusChip assessmentStatus={assessmentStatus} releaseStatus={releaseStatus} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{String(assignment?.type || '').toUpperCase()} • {assignment?.rubricMeta?.totalPoints || 100} pts</div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-500">Date</div>
                <div className="font-medium">{time.date}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Submitted Time</div>
                <div className="font-medium">{time.time}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Location</div>
                <div className="font-medium">{session?.venue?.room || 'TBD'}</div>
              </div>
            </div>

            {session?.coExaminers?.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">Co‑Examiners</div>
                <div className="flex flex-wrap gap-2">
                  {session.coExaminers.map((e) => (
                    <Badge key={e.examinerId} variant="secondary"><i className="fas fa-user-tie mr-1 text-xs" />{e.name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-right space-y-2">
            {assessmentStatus === 'REOPENED' && (
              <div>
                <div className="mb-2 text-sm text-purple-700 dark:text-purple-300">This assessment was reopened for edits.</div>
                <Link href={`/examiner/assessment/${session?.id}`}>
                  <Button><i className="fas fa-pen-to-square mr-2" />Resume in Marking UI</Button>
                </Link>
              </div>
            )}
            {versions?.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => onJump('latest')}
                  className={`px-3 py-1 rounded-full border text-xs ${String(currentVersion) === 'latest' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
                >Latest</button>
                {versions.map((v) => (
                  <button
                    key={v.version}
                    onClick={() => onJump(v.version)}
                    className={`px-3 py-1 rounded-full border text-xs ${String(currentVersion) === String(v.version) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
                  >Rev {v.version}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
