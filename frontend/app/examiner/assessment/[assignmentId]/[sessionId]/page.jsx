"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import useAuth from "../../../../../hooks/useAuth";
import { useNotification } from "../../../../../hooks/useNotification";
import examinerSessionService from "../../../../../services/examinerSessionService";
import examinerAssessmentService from "../../../../../services/examinerAssessmentService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";

export default function SessionAssessmentsList() {
  const router = useRouter();
  const params = useParams();
  const { user, userId } = useAuth();
  const { showNotification } = useNotification();

  const assignmentId = params.assignmentId;
  const sessionId = params.sessionId;

  const [sessionDetails, setSessionDetails] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  // Memoize examiner ID to prevent unnecessary re-renders
  const examinerId = useMemo(() => userId || user?.id, [userId, user?.id]);

  // Load session details and assessments for this session
  useEffect(() => {
    if (!sessionId || !examinerId) return;

    // Add a flag to prevent multiple simultaneous calls
    let isCancelled = false;

    (async () => {
      if (isCancelled) return;

      setLoadingSession(true);
      setLoadingAssessments(true);
      try {
        // Call detailed session API
        const detailedResponse =
          await examinerSessionService.getSessionDetailed(
            sessionId,
            examinerId
          );

        if (isCancelled) return;

        if (detailedResponse?.success && detailedResponse?.data) {
          // Process detailed session data to extract assessments
          const sessionData = detailedResponse.data;

          // Update session details from the detailed response
          setSessionDetails({
            totalCount:
              (sessionData.students?.length || 0) +
              (sessionData.groups?.length || 0),
            students: sessionData.students || [],
            groups: sessionData.groups || [],
          });

          // Combine students and groups into assessments list
          const assessmentsList = [];

          // Add individual students as assessments
          if (sessionData.students && Array.isArray(sessionData.students)) {
            sessionData.students.forEach((student) => {
              // Extract assessment status if available
              const assessmentStatus = student.assessmentStatus || {};

              assessmentsList.push({
                type: "individual",
                subjectId: student.userId,
                subjectName: student.studentName || `Student ${student.userId}`,
                studentNumber: student.studentNumber,
                email: student.email,
                submissionId: assessmentStatus.submissionId || null,
                status: assessmentStatus.status?.toLowerCase() || "unmarked",
                totalScore: assessmentStatus.totalScore,
                overallFeedback: assessmentStatus.overallFeedback,
                submittedAt: assessmentStatus.submittedAt,
                updatedAt: assessmentStatus.updatedAt,
                sessionId: sessionId,
                assignmentId: assignmentId,
                bookedTime: student.bookedTime,
              });
            });
          }

          // Add groups as assessments
          if (sessionData.groups && Array.isArray(sessionData.groups)) {
            sessionData.groups.forEach((group) => {
              // Extract assessment status if available
              const assessmentStatus = group.assessmentStatus || {};

              const assessment = {
                type: "group",
                subjectId: group.groupId,
                subjectName: group.groupName || `Group ${group.groupId}`,
                canvasGroupId: group.canvasGroupId,
                members: group.members || [],
                submissionId: assessmentStatus.submissionId || null,
                status: assessmentStatus.status?.toLowerCase() || "unmarked",
                totalScore: assessmentStatus.totalScore,
                overallFeedback: assessmentStatus.overallFeedback,
                submittedAt: assessmentStatus.submittedAt,
                updatedAt: assessmentStatus.updatedAt,
                sessionId: sessionId,
                assignmentId: assignmentId,
                bookedTime: group.bookedTime,
              };

              assessmentsList.push(assessment);
            });
          }

          // If no assessments found from detailed API, try fallback
          if (assessmentsList.length === 0) {
            // Continue to fallback logic
          } else {
            setAssessments(assessmentsList);
            return; // Data retrieved successfully; return immediately
          }
        }

        // If detailed session API returns empty data, there are no enrolled students/groups
        // This is a valid scenario - the session exists but has no participants yet
        setAssessments([]);
      } catch (e) {
        console.error("Error loading timeslot details and assessments:", e);
        showNotification(
          "error",
          "Error loading timeslot details and assessments"
        );
        setAssessments([]);
        setSessionDetails(null);
      } finally {
        if (!isCancelled) {
          setLoadingSession(false);
          setLoadingAssessments(false);
        }
      }
    })();

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [sessionId, assignmentId, examinerId, showNotification]);

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800";
      case "draft":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800";
      case "unmarked":
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleString("en-AU", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStartAssessment = async (assessment) => {
    // Both Continue Assessment and Start Assessment use the same logic:
    // Navigate to assessment page with submissionId (null for new assessments)
    const submissionId = assessment.submissionId || "new";
    router.push(
      `/examiner/assessment/${assignmentId}/${sessionId}/${submissionId}?subjectType=${assessment.type}&subjectId=${assessment.subjectId}`
    );
  };

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/examiner/assessment/${assignmentId}`)}
          className="flex items-center gap-2"
        >
          <i className="fas fa-arrow-left"></i>
          Back to Sessions
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Timeslot Assessments
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Assignment ID: {assignmentId} | Timeslot ID: {sessionId}
          </p>
        </div>
      </div>

      {/* Session Details */}
      {sessionDetails && (
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>
              <i className="fas fa-info-circle text-blue-600 mr-2"></i>
              Timeslot Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Total Count:
                </span>
                <p className="text-gray-600 dark:text-gray-400">
                  {sessionDetails.totalCount || 0}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Students:
                </span>
                <p className="text-gray-600 dark:text-gray-400">
                  {sessionDetails.students?.length || 0}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Groups:
                </span>
                <p className="text-gray-600 dark:text-gray-400">
                  {sessionDetails.groups?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessments List */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>
            <i className="fas fa-clipboard-list text-blue-600 mr-2"></i>
            Available Assessments
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Click on an assessment to start or continue marking
          </p>
        </CardHeader>
        <CardContent>
          {loadingAssessments ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : assessments.length > 0 ? (
            <div className="space-y-3">
              {assessments.map((assessment, index) => (
                <div
                  key={`${assessment.type}-${assessment.subjectId}-${index}`}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                          {assessment.subjectName}
                          {assessment.assignmentName &&
                            ` - ${assessment.assignmentName}`}
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                        >
                          {assessment.type.toUpperCase()}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getStatusBadgeVariant(assessment.status)}
                        >
                          {assessment.status?.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <i className="fas fa-hashtag text-purple-600 mr-2"></i>
                          {assessment.type === "group" ? "Group" : "Student"}{" "}
                          ID: {assessment.subjectId}
                        </div>
                        {assessment.studentNumber && (
                          <div className="flex items-center">
                            <i className="fas fa-id-card text-blue-600 mr-2"></i>
                            {assessment.studentNumber}
                          </div>
                        )}
                        {assessment.email && (
                          <div className="flex items-center">
                            <i className="fas fa-envelope text-green-600 mr-2"></i>
                            {assessment.email}
                          </div>
                        )}
                        {assessment.totalScore !== undefined &&
                          assessment.totalScore !== null && (
                            <div className="flex items-center">
                              <i className="fas fa-star text-yellow-500 mr-2"></i>
                              Score: {assessment.totalScore}/
                              {assessment.maxScore || 100}
                            </div>
                          )}
                        {assessment.submittedAt && (
                          <div className="flex items-center">
                            <i className="fas fa-calendar text-purple-600 mr-2"></i>
                            Submitted: {formatDateTime(assessment.submittedAt)}
                          </div>
                        )}
                        {assessment.members &&
                          assessment.members.length > 0 && (
                            <div className="flex items-center">
                              <i className="fas fa-users text-orange-600 mr-2"></i>
                              {assessment.members.length} member(s)
                            </div>
                          )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleStartAssessment(assessment)}
                      variant="default"
                      disabled={false}
                    >
                      <i className="fas fa-play mr-2"></i>
                      {assessment.submissionId && assessment.status === "draft"
                        ? "Continue Assessment"
                        : "Start Assessment"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-clipboard text-gray-400 dark:text-gray-500 text-3xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                No Assessments Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                There are no assessments available for this timeslot yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
