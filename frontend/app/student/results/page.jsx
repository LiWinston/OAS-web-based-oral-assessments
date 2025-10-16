'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import ResultsEmptyState from '../../../components/student/results/ResultsEmptyState';
import { studentResultsService } from '../../../services/studentResultsService';
import { useAuthStore } from '../../../store/authStore';

const RESULT_PAGE_SIZE = 50;

export default function StudentResultsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchResults = useCallback(async () => {
    const auth = useAuthStore.getState();
    if (!auth?.isAuthenticated || auth.user?.role !== 'STUDENT') {
      setError('You must be signed in as a student to view results.');
      setLoading(false);
      return;
    }

    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await studentResultsService.getStudentResults(user.id, {
        status: 'released',
        semester: semesterFilter,
        pageNum: 0,
        pageSize: RESULT_PAGE_SIZE,
        sort: 'date_desc',
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to load results');
      }

      const dto = response.data;
      setResults(Array.isArray(dto?.data) ? dto.data : []);
    } catch (err) {
      console.error('Failed to load student results', err);
      setError(err?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [semesterFilter, user?.id]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const availableSemesters = useMemo(() => {
    const unique = new Set();
    results.forEach((item) => {
      if (item?.semester) unique.add(item.semester);
    });
    return ['all', ...Array.from(unique)];
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!searchTerm) return results;
    const query = searchTerm.toLowerCase();
    return results.filter((item) => {
      return (
        item.assignmentName?.toLowerCase().includes(query) ||
        item.courseCode?.toLowerCase().includes(query) ||
        item.courseName?.toLowerCase().includes(query)
      );
    });
  }, [results, searchTerm]);

  const handleOpenAssignment = (assignmentId) => {
    router.push(`/student/results/${assignmentId}`);
  };

  const handleRetry = () => {
    fetchResults();
  };

  const renderResults = () => {
    if (loading) return <ResultsEmptyState type="loading" />;
    if (error) {
      return (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-6">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleRetry}>
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (!filteredResults.length) {
      return <ResultsEmptyState type="no-results" />;
    }

    return (
      <div className="space-y-3">
        {filteredResults.map((result) => {
          const releasedAt = result.releasedAt
            ? format(new Date(result.releasedAt), 'MMMM dd, yyyy')
            : null;

          return (
            <button
              key={result.assignmentId}
              type="button"
              onClick={() => handleOpenAssignment(result.assignmentId)}
              className="w-full text-left"
            >
              <Card className="transition-colors hover:border-blue-400 focus-visible:border-blue-500">
                <CardContent className="p-5 space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {result.courseCode} · {result.semester}
                    </span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {result.assignmentName}
                    </span>
                    {result.courseName && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {result.courseName}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {result.finalScore?.grade || '--'}
                    </span>
                    <span>
                      {typeof result.finalScore?.percentage === 'number'
                        ? `${result.finalScore.percentage.toFixed(1)}%`
                        : '--'}
                    </span>
                    {releasedAt && <span>Released on {releasedAt}</span>}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/student" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">My Results</span>
            </li>
          </ol>
        </nav>

        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Released Results</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
            Review final marks and feedback across your assessments once they have been released by the course team.
          </p>
        </div>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search assessments
                </label>
                <Input
                  placeholder="Search by assignment or course"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="w-full md:w-56">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Semester filter
                </label>
                <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSemesters.map((semester) => (
                      <SelectItem key={semester} value={semester}>
                        {semester === 'all' ? 'All semesters' : semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredResults.length} released assessment{filteredResults.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>

        {renderResults()}
      </div>
    </div>
  );
}
