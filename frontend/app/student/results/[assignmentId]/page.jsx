'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import ResultsEmptyState from '../../../../components/student/results/ResultsEmptyState';
import ReadOnlyRubricSection from '../../../../components/student/results/ReadOnlyRubricSection';
import { studentResultsService } from '../../../../services/studentResultsService';
import { useAuthStore } from '../../../../store/authStore';

const formatDateTime = (value, pattern = "MMMM dd, yyyy 'at' h:mm a") => {
  if (!value) return null;
  try {
    return format(new Date(value), pattern);
  } catch (err) {
    console.error('Failed to format date', err);
    return null;
  }
};

const formatNumber = (value) => {
  if (typeof value !== 'number') return '--';
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
};

const formatPercentage = (value) => {
  if (typeof value !== 'number') return '--';
  return `${value.toFixed(1)}%`;
};

const resolveWeightBasis = (rubric) => {
  const basis = rubric?.definition?.meta?.weightBasis;
  return typeof basis === 'string' && basis.toLowerCase() === 'percentage' ? 'percentage' : 'points';
};

const sectionKey = (section) => (section?.sectionType || '').toLowerCase();

export default function StudentResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const assignmentId = params.assignmentId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  const loadDetail = useCallback(async () => {
    const auth = useAuthStore.getState();
    if (!auth?.isAuthenticated || auth.user?.role !== 'STUDENT') {
      setError("You don't have access to this result.");
      setLoading(false);
      return;
    }

    if (!user?.id || !assignmentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await studentResultsService.getAssignmentResult(user.id, assignmentId);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to load result');
      }
      setDetail(response.data);
    } catch (err) {
      console.error('Failed to load assignment result', err);
      const message = err?.message || 'Failed to load result';
      if (/not released/i.test(message)) {
        setError("Results for this assignment haven't been released yet.");
      } else if (/forbidden|access|unauthorised|unauthorized/i.test(message)) {
        setError("You don't have access to this result.");
      } else if (/not found/i.test(message)) {
        setError('Result not found.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [assignmentId, user?.id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const assignment = detail?.assignment;
  const finalScore = detail?.finalScore;
  const release = detail?.release;
  const session = detail?.session;
  const rubric = detail?.rubric;
  const feedback = detail?.feedback;
  const weightBasis = resolveWeightBasis(rubric);

  const sections = useMemo(() => (
    Array.isArray(rubric?.sections) ? rubric.sections : []
  ), [rubric?.sections]);

  const groupSection = useMemo(
    () => sections.find((section) => sectionKey(section) === 'group'),
    [sections],
  );

  const individualSection = useMemo(
    () => sections.find((section) => sectionKey(section) === 'individual'),
    [sections],
  );

  const hasGroup = Boolean(groupSection);
  const hasIndividual = Boolean(individualSection);
  const defaultTab = hasGroup ? 'group' : hasIndividual ? 'individual' : undefined;

  const sectionSummaries = useMemo(() => (
    sections.map((section) => ({
      key: sectionKey(section),
      label: section.displayName || (section.sectionType === 'INDIVIDUAL' ? 'Individual' : 'Group'),
      weightShare: section.weightShare,
    }))
  ), [sections]);

  const releasedOn = formatDateTime(release?.releasedAt || assignment?.resultsReleasedAt);
  const scoreLabel = weightBasis === 'percentage' ? 'Percentage' : 'Points';
  const finalScoreValue = weightBasis === 'percentage'
    ? formatPercentage(finalScore?.percentage)
    : formatNumber(finalScore?.percentage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <Button variant="outline" onClick={() => router.push('/student/results')} className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Results
          </Button>
          <ResultsEmptyState type="loading" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <Button variant="outline" onClick={() => router.push('/student/results')} className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Results
          </Button>
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={loadDetail}>Try again</Button>
                <Button size="sm" variant="outline" onClick={() => router.push('/student/results')}>
                  Back to results
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <Button variant="outline" onClick={() => router.push('/student/results')} className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Results
          </Button>
          <ResultsEmptyState type="no-results" message="Result data is unavailable." />
        </div>
      </div>
    );
  }

  const renderSectionSummary = (section) => {
    if (!section) return null;
    const summary = sectionSummaries.find((entry) => entry.key === sectionKey(section));
    if (!summary) return null;

    return (
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {typeof summary.weightShare === 'number' && (
            <span className="font-medium text-gray-700 dark:text-gray-200">
              Weight share · {summary.weightShare}%
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <Button variant="outline" onClick={() => router.push('/student/results')} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Results
        </Button>

        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/student" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs" />
              <Link href="/student/results" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                My Results
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">{assignment?.assignmentName}</span>
            </li>
          </ol>
        </nav>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {assignment?.assignmentName}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {assignment?.courseCode} · {assignment?.courseName} · {assignment?.semester}
            </p>
            {releasedOn && (
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Released on {releasedOn}
              </p>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-100 dark:bg-gray-900/40 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Grade</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{finalScore?.grade || '--'}</p>
            </div>
            <div className="rounded-lg bg-gray-100 dark:bg-gray-900/40 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{scoreLabel}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{finalScoreValue}</p>
            </div>
          </CardContent>
        </Card>

        {session?.sessionId && (
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-medium text-gray-900 dark:text-gray-100">{session.sessionLabel}</p>
              <p>{formatDateTime(session.startsAt)}</p>
              {session.endsAt && <p>Ends {format(new Date(session.endsAt), 'h:mm a')}</p>}
            </CardContent>
          </Card>
        )}

        {defaultTab && (
          <Card className="border-gray-200 dark:border-gray-700">
            <Tabs defaultValue={defaultTab} className="flex flex-col">
              <div className="border-b px-6 py-4">
                <TabsList className="flex w-full gap-2">
                  {hasGroup && <TabsTrigger value="group">Group Rubric</TabsTrigger>}
                  {hasIndividual && <TabsTrigger value="individual">Individual Rubric</TabsTrigger>}
                </TabsList>
              </div>

              <div className="p-6 space-y-6">
                {hasGroup && (
                  <TabsContent value="group" className="mt-0 space-y-4">
                    {renderSectionSummary(groupSection)}
                    <ReadOnlyRubricSection section={groupSection} definition={rubric.definition} weightBasis={weightBasis} />
                  </TabsContent>
                )}

                {hasIndividual && (
                  <TabsContent value="individual" className="mt-0 space-y-4">
                    {renderSectionSummary(individualSection)}
                    <ReadOnlyRubricSection section={individualSection} definition={rubric.definition} weightBasis={weightBasis} />
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </Card>
        )}

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Overall Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">
              {feedback?.overallCommentsCombined || 'No feedback provided.'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
