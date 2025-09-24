'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import useAuth from '../../../../hooks/useAuth';
import ResultDetailHeader from '../../../../components/examiner/results/ResultDetailHeader';
import ResultTabs from '../../../../components/examiner/results/ResultTabs';
import { useExaminerResultDetailQuery } from '../../../../hooks/examiner/results/useExaminerResultDetailQuery';
import { useAssessmentVersionsQuery } from '../../../../hooks/examiner/results/useAssessmentVersionsQuery';

export default function ExaminerResultDetailPage() {
  const { userId } = useAuth();
  const { assessmentId } = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const versionParam = search?.get('version') || 'latest';

  const { data: detail, isLoading, error } = useExaminerResultDetailQuery(userId, assessmentId, { version: versionParam });
  const { data: versions } = useAssessmentVersionsQuery(userId, assessmentId);

  console.log('ExaminerResultDetailPage - assessmentId:', assessmentId);
  console.log('ExaminerResultDetailPage - userId:', userId);
  console.log('ExaminerResultDetailPage - detail:', detail);
  console.log('ExaminerResultDetailPage - isLoading:', isLoading);
  console.log('ExaminerResultDetailPage - error:', error);

  if (isLoading || !detail) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        {error && (
          <div className="mt-4 text-red-600 text-sm">
            Error: {error.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/examiner" className="text-gray-500 dark:text-gray-400 hover:text-blue-600">Dashboard</a>
          </li>
          <li className="flex items-center">
            <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
            <a href="/examiner/results" className="text-gray-500 dark:text-gray-400 hover:text-blue-600">Results</a>
          </li>
          <li className="flex items-center">
            <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Detail</span>
          </li>
        </ol>
      </nav>

      <ResultDetailHeader detail={detail} versions={versions?.versions || []} currentVersion={versionParam} />

      <ResultTabs detail={detail} versions={versions} />
    </div>
  );
}
