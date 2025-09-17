'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import RubricBreakdown from '../../../../components/student/results/RubricBreakdown';
import CanvasRubricTable from '../../../../components/student/results/CanvasRubricTable';
import ExaminerFeedback from '../../../../components/student/results/ExaminerFeedback';
import ResultsEmptyState from '../../../../components/student/results/ResultsEmptyState';
import { studentResultsService } from '../../../../services/studentResultsService';
import { useAuthStore } from '../../../../store/authStore';
import useAuth from '../../../../hooks/useAuth';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  User, 
  Award, 
  BookOpen,
  Download,
  Share,
  Eye,
  BarChart3
} from 'lucide-react';
import { exportResultsService } from '../../../../services/exportResultsService';
import { format } from 'date-fns';

/**
 * Student Result Details Page
 * 
 * Displays detailed results for a specific assignment including rubric breakdown and examiner feedback
 */
export default function StudentResultDetails() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const auth = useAuth();
  const assignmentId = params.assignmentId;
  
  const [assignment, setAssignment] = useState(null);
  const [rubricData, setRubricData] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [rubricScale, setRubricScale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load assignment result data
  const loadAssignmentData = async () => {
    try {
      if (!user?.id || !assignmentId) return;
      // Guard: only authenticated students can view
      if (!auth.isAuthenticated || auth.role !== 'STUDENT') {
        setError("You don't have access to this result.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);

      // Load assignment result summary
      const assignmentResponse = await studentResultsService.getAssignmentResult(user.id, assignmentId);
      if (assignmentResponse.success) {
        setAssignment(assignmentResponse.data);
      } else {
        throw new Error(assignmentResponse.message || 'Failed to load assignment result');
      }

      // Load rubric breakdown
      try {
        const rubricResponse = await studentResultsService.getRubricBreakdown(user.id, assignmentId);
        if (rubricResponse.success) {
          setRubricData(rubricResponse.data);
        }
      } catch (rubricError) {
        console.warn('Could not load rubric breakdown:', rubricError);
      }

      // Load rubric scale (levels per criterion) for Canvas grid
      try {
        const scaleResponse = await studentResultsService.getAssignmentRubricScale(user.id, assignmentId);
        if (scaleResponse.success) {
          setRubricScale(scaleResponse.data);
        }
      } catch (scaleError) {
        console.warn('Could not load rubric scale:', scaleError);
      }

      // Load examiner feedback
      try {
        const feedbackResponse = await studentResultsService.getExaminerFeedback(user.id, assignmentId);
        if (feedbackResponse.success) {
          setFeedbackData(feedbackResponse.data);
        }
      } catch (feedbackError) {
        console.warn('Could not load examiner feedback:', feedbackError);
      }

    } catch (err) {
      console.error('Error loading assignment data:', err);
      const msg = err?.message || 'Failed to load assignment data';
      // Map some common API reason codes to user-facing copy (kept simple here; service returns message)
      if (/not released/i.test(msg)) setError("Results for this assignment haven't been released yet.");
      else if (/not found/i.test(msg)) setError("We couldn't find this result.");
      else if (/access|forbidden|permission/i.test(msg)) setError("You don't have access to this result.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignmentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, assignmentId]);

  // Helper functions
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy \'at\' h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getGradeBadgeColor = (grade, percentage) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (percentage >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Loading state
  if (loading) {
    return <ResultsEmptyState type="loading" />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
              Error Loading Result
            </h3>
            <p className="text-red-800 dark:text-red-200 text-sm mb-4">
              {error}
            </p>
            <div className="flex gap-2">
              <Button onClick={loadAssignmentData} variant="outline" size="sm">
                Try Again
              </Button>
              <Button onClick={() => router.push('/student/results')} variant="outline" size="sm">
                Back to Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state
  if (!assignment) {
    return <ResultsEmptyState type="no-results" message="Assignment result not found." />;
  }

  const { assignment: assignmentInfo, result, summary } = assignment;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <nav className="text-sm text-gray-600 dark:text-gray-400">
            <span 
              onClick={() => router.push('/student/results')}
              className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            >
              My Results
            </span>
            <span className="mx-2">›</span>
            <span>{assignmentInfo.assignmentName}</span>
          </nav>
        </div>
      </div>

      {/* Assignment Header */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-medium">
                  {assignmentInfo.courseCode}
                </Badge>
                <Badge 
                  variant={assignmentInfo.assessmentType === 'GROUP' ? 'default' : 
                          assignmentInfo.assessmentType === 'MIXED' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {assignmentInfo.assessmentType === 'GROUP' && <Users className="w-3 h-3 mr-1" />}
                  {assignmentInfo.assessmentType === 'INDIVIDUAL' && <User className="w-3 h-3 mr-1" />}
                  {assignmentInfo.assessmentType === 'MIXED' && <BookOpen className="w-3 h-3 mr-1" />}
                  {assignmentInfo.assessmentType}
                </Badge>
              </div>
              <CardTitle className="text-xl md:text-2xl text-gray-900 dark:text-white mb-2">
                {assignmentInfo.assignmentName}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                {assignmentInfo.courseName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {assignmentInfo.semester}
              </p>
            </div>
            
            {/* Grade Display */}
            <div className="text-right">
              <Badge 
                className={`text-2xl font-bold px-4 py-2 ${getGradeBadgeColor(result.finalGrade, result.percentage)}`}
              >
                {result.finalGrade}
              </Badge>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-1">
                {result.percentage}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {result.totalPoints}/{result.maxPoints} points
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(result.percentage)}`}
                style={{ width: `${result.percentage}%` }}
              />
            </div>
          </div>

          {/* Assessment Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-600 dark:text-gray-400">Assessed On</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(result.assessedOn)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-600 dark:text-gray-400">Released On</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(result.releasedOn)}
                </p>
              </div>
            </div>
            
            {result.examinerCount && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Examiners</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {result.examinerCount} examiner{result.examinerCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
            
            {result.aggregationMethod && (
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Aggregation</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {result.aggregationMethod}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Group Information */}
          {result.entity?.type === 'GROUP' && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Group Assessment: {result.entity.groupName}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This result represents your group's collective performance
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* No summary stat cards; show rubric in Canvas-like table below */}

      {/* Detailed Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rubric" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Rubric Breakdown
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Examiner Feedback
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="rubric" className="mt-6">
          {rubricData ? (
            <CanvasRubricTable 
              rubricBreakdown={rubricData.rubricBreakdown}
              rubricScale={rubricScale}
              showExaminerDetails={true}
            />
          ) : (
            <ResultsEmptyState 
              type="no-results"
              message="No detailed rubric breakdown available for this assessment."
            />
          )}
        </TabsContent>
        
        <TabsContent value="feedback" className="mt-6">
          {feedbackData ? (
            <ExaminerFeedback feedbackData={feedbackData} />
          ) : (
            <ResultsEmptyState 
              type="no-results"
              message="No examiner feedback available for this assessment."
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => exportResultsService.exportResultToPDF({ studentId: user?.id, assignmentId })}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" className="flex-1">
              <Share className="w-4 h-4 mr-2" />
              Share Results
            </Button>
            <Button 
              onClick={() => router.push('/student/results')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
