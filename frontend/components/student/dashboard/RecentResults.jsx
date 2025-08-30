"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { studentResultsService } from "../../../services/studentResultsService";
import { useAuthStore } from "../../../store/authStore";
import { format } from 'date-fns';

/**
 * RecentResults Component
 *
 * Displays recent assessment results with grades, dates,
 * and links to detailed feedback.
 */
export function RecentResults() {
  const { user } = useAuthStore();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load recent results
  useEffect(() => {
    const loadResults = async () => {
      try {
        if (!user?.id) return;
        
        const response = await studentResultsService.getStudentResults(user.id, {
          status: 'released',
          pageSize: 3,
          sort: 'date_desc'
        });

        if (response.success) {
          // Transform data to match component format
          const transformedResults = response.data.data.map(assignment => ({
            id: assignment.assignmentId,
            title: assignment.assignmentName,
            course: assignment.courseCode,
            type: assignment.assessmentType,
            date: format(new Date(assignment.result.assessedOn), 'MMMM dd, yyyy'),
            score: assignment.result.totalPoints,
            maxScore: assignment.result.maxPoints,
            grade: assignment.result.finalGrade,
            feedback: `${assignment.result.examinerCount} examiner${assignment.result.examinerCount !== 1 ? 's' : ''} assessed • Results ${assignment.result.aggregationMethod}d`,
            examiner: assignment.courseName
          }));
          setResults(transformedResults);
        }
      } catch (error) {
        console.error('Error loading recent results:', error);
        // Keep empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [user?.id]);

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A":
      case "A+":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "B+":
      case "B":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "C+":
      case "C":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "D":
      case "F":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return "text-green-600 dark:text-green-400";
    if (percentage >= 80) return "text-blue-600 dark:text-blue-400";
    if (percentage >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-chart-bar text-green-600 dark:text-green-400 mr-2"></i>
            Recent Results
          </CardTitle>
          <Link
            href="/student/results"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading recent results...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-chart-bar text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Results Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Your assessment results will appear here once they are released.
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((result) => (
                <li key={result.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.title}
                      </h4>
                      <div className="mt-1 flex items-center flex-wrap gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          <i className="fas fa-calendar-day mr-1"></i>
                          {result.date}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          <i className="fas fa-book mr-1"></i>
                          {result.course} - {result.type}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          <i className="fas fa-university mr-1"></i>
                          {result.examiner}
                        </span>
                      </div>

                      {/* Feedback preview */}
                      {result.feedback && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {result.feedback}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Score and grade */}
                    <div className="flex-shrink-0 flex items-center ml-4">
                      <div className="text-right mr-3">
                        <span
                          className={`text-2xl font-bold ${getScoreColor(
                            result.score,
                            result.maxScore
                          )}`}
                        >
                          {result.score}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            /{result.maxScore}
                          </span>
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round((result.score / result.maxScore) * 100)}%
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(
                          result.grade
                        )}`}
                      >
                        {result.grade}
                      </span>
                    </div>
                  </div>

                  {/* Action link */}
                  <div className="mt-2">
                    <Link
                      href={`/student/results/${result.id}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Detailed Feedback
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            {/* More button */}
            <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/student/results"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View all assessment results
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
