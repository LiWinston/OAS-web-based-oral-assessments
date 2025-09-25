"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../../hooks/useAuth";
import { useNotification } from "../../../hooks/useNotification";
import examinerSessionService from "../../../services/examinerSessionService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

export default function ExaminerAssignmentsList() {
  const router = useRouter();
  const { user, userId } = useAuth();
  const { showNotification } = useNotification();

  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  useEffect(() => {
    const exId = userId || user?.id;
    if (!exId) return;
    (async () => {
      setLoadingAssignments(true);
      try {
        // Call the assignments API to get available assignments
        const response = await examinerSessionService.getAssignmentsList(exId);

        if (response?.success && response?.data) {
          setAvailableAssignments(response.data);
        } else {
          setAvailableAssignments([]);
          if (!response?.success) {
            showNotification(
              "error",
              response?.message || "Failed to load assignments"
            );
          }
        }
      } catch (e) {
        console.error("Error loading assignments:", e);
        showNotification("error", "Error loading assignments");
        setAvailableAssignments([]);
      } finally {
        setLoadingAssignments(false);
      }
    })();
  }, [user, userId, showNotification]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-AU", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "released":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800";
      case "published":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800";
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800";
      case "draft":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  if (loadingAssignments) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Assessment Assignments
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Select an assignment to view available timeslots
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {availableAssignments.length} assignment(s)
        </div>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>
            <i className="fas fa-clipboard-list text-blue-600 mr-2"></i>
            Available Assignments
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            These are your assigned assessments. Click to view timeslots for
            each assignment.
          </p>
        </CardHeader>
        <CardContent>
          {availableAssignments.length > 0 ? (
            <div className="space-y-3">
              {availableAssignments.map((assignment) => {
                return (
                  <div
                    key={assignment.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                            {assignment.name || `Assignment ${assignment.id}`}
                          </h3>
                          {assignment.status && (
                            <Badge
                              variant="outline"
                              className={getStatusBadgeVariant(
                                assignment.status
                              )}
                            >
                              {assignment.status?.toUpperCase()}
                            </Badge>
                          )}
                          {assignment.type && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                            >
                              {assignment.type?.toUpperCase()}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <i className="fas fa-hashtag text-purple-600 mr-2"></i>
                            Assignment ID: {assignment.id}
                          </div>
                          {assignment.subjectCode && (
                            <div className="flex items-center">
                              <i className="fas fa-book text-indigo-600 mr-2"></i>
                              {assignment.subjectCode}
                            </div>
                          )}
                          {assignment.subjectName && (
                            <div className="flex items-center">
                              <i className="fas fa-graduation-cap text-green-600 mr-2"></i>
                              {assignment.subjectName}
                            </div>
                          )}
                          {assignment.startDate && (
                            <div className="flex items-center">
                              <i className="fas fa-calendar-alt text-blue-600 mr-2"></i>
                              Start: {formatDateTime(assignment.startDate)}
                            </div>
                          )}
                          {assignment.endDate && (
                            <div className="flex items-center">
                              <i className="fas fa-calendar-check text-green-600 mr-2"></i>
                              End: {formatDateTime(assignment.endDate)}
                            </div>
                          )}
                          {assignment.weight && (
                            <div className="flex items-center">
                              <i className="fas fa-percent text-orange-600 mr-2"></i>
                              Weight: {assignment.weight}%
                            </div>
                          )}
                          {assignment.progress !== undefined && (
                            <div className="flex items-center">
                              <i className="fas fa-chart-line text-purple-600 mr-2"></i>
                              Progress: {assignment.progress}%
                            </div>
                          )}
                          {assignment.description && (
                            <div className="flex items-center col-span-full">
                              <i className="fas fa-info-circle text-gray-500 mr-2"></i>
                              {assignment.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() =>
                          router.push(`/examiner/assessment/${assignment.id}`)
                        }
                        variant="default"
                      >
                        <i className="fas fa-calendar-week mr-2"></i>
                        View Timeslots
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-clipboard-times text-gray-400 dark:text-gray-500 text-3xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                No Assignments Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You don't have any assignments assigned yet.
              </p>
              <Button onClick={() => router.push("/examiner/schedule")}>
                Go to Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
