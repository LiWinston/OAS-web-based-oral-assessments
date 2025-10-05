"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useAuth from "../../../../hooks/useAuth";
import { useNotification } from "../../../../hooks/useNotification";
import examinerSessionService from "../../../../services/examinerSessionService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { useSessionMetaStore } from "../../../../store/sessionMetaStore";

export default function AssignmentSessionsList() {
  const router = useRouter();
  const params = useParams();
  const { user, userId } = useAuth();
  const { showNotification } = useNotification();

  const assignmentId = params.assignmentId;

  const [assignmentSessions, setAssignmentSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Load sessions for this assignment
  useEffect(() => {
    const exId = userId || user?.id;
    if (!assignmentId || !exId) return;

    (async () => {
      setLoadingSessions(true);
      try {
        // Call examiner schedule API with assignmentId filter
        console.log(
          `📅 Calling /api/examiners/${exId}/schedule with payload:`,
          { assignmentId: Number(assignmentId) }
        );
        const response = await examinerSessionService.getExaminerSchedule(
          exId,
          {
            assignmentId: Number(assignmentId),
          }
        );

        if (response?.success && response?.data) {
          // Process schedule data to extract sessions for this assignment
          const scheduleData = response.data;
          const assignments = scheduleData.assignments || [];

          // Find the assignment and extract its sessions
          const assignment = assignments.find(
            (a) => a.assignmentId === Number(assignmentId)
          );
          const sessions = assignment?.sessions || [];

          // Transform sessions to match the expected format
          const transformedSessions = sessions.map((session) => ({
            id: session.sessionId,
            sessionId: session.sessionId,
            // UX: 不再将 venue.id 作为主标题，避免“2334”这类困惑
            date: session.start ? session.start.split("T")[0] : null,
            startTime: session.start ? session.start.split("T")[1] : null,
            endTime: session.end ? session.end.split("T")[1] : null,
            start: session.start,
            end: session.end,
            venueName: session.venue?.venueName || "No venue",
            venue: session.venue,
            requiredExaminers: session.requiredExaminers || 0,
            currentExaminers: session.currentExaminers || 0,
            capacity: session.capacity ?? null,
            bookedCount: session.bookingCount || 0,
            remainingCapacity: (session.capacity ?? 0) - (session.bookingCount || 0),
            isBooked: session.isBooked || (session.bookingCount || 0) > 0,
            canWithdraw: session.canWithdraw || false,
            cannotWithdrawReason: session.cannotWithdrawReason,
            status: (session.bookingCount || 0) > 0 ? "booked" : (session.isBooked ? "booked" : "available"),
            assignedExaminers: session.assignedExaminers || [],
          }));

          // 仅显示“已被学生预约”的场次，避免误解“available”含义
          const filteredSessions = transformedSessions.filter((s) => (s.bookedCount || 0) > 0);
          setAssignmentSessions(filteredSessions);
        } else {
          setAssignmentSessions([]);
          if (!response?.success) {
            showNotification(
              "error",
              response?.message || "Failed to load timeslots"
            );
          }
        }
      } catch (e) {
        console.error("Error loading timeslots:", e);
        showNotification("error", "Error loading timeslots");
        setAssignmentSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    })();
  }, [assignmentId, user, userId, showNotification]);

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "booked":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800";
      case "available":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800";
      case "active":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800";
      case "scheduled":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800";
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

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-AU", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "No time";
    // Handle both "09:00:00" and "09:00" formats
    if (timeString.includes(":")) {
      return timeString.substring(0, 5); // Return "09:00"
    }
    return timeString;
  };

  const handleViewAssessments = (session) => {
    // Persist session meta for marking header usage
    try {
      const setSessionMeta = useSessionMetaStore.getState().setSessionMeta;
      setSessionMeta(assignmentId, session.id, {
        start: session.start,
        end: session.end,
        venue: session.venueName ? { venueName: session.venueName } : session.venue,
        coExaminers: session.assignedExaminers || [],
      });
    } catch (_) { /* non-blocking */ }
    router.push(`/examiner/assessment/${assignmentId}/${session.id}`);
  };

  if (loadingSessions) {
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
          onClick={() => router.push("/examiner/assessment")}
          className="flex items-center gap-2"
        >
          <i className="fas fa-arrow-left"></i>
          Back to Assignments
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Assignment Timeslots
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Assignment ID: {assignmentId}
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {assignmentSessions.length} timeslot(s)
        </div>
      </div>

      {/* Sessions List */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>
            <i className="fas fa-calendar-week text-blue-600 mr-2"></i>
            Booked Timeslots
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Click on a Timeslot to view and manage assessments
          </p>
        </CardHeader>
        <CardContent>
          {assignmentSessions.length > 0 ? (
            <div className="space-y-3">
              {assignmentSessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                            {session.venueName && session.venueName !== 'No venue'
                              ? session.venueName
                              : `Session ${session.sessionId}`}
                          </h3>
                          {/* Subtitle: Day + Time range */}
                          {session.date && session.startTime && session.endTime && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              {formatDate(session.date)} • {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            </p>
                          )}
                        </div>
                        {session.status && (
                          <Badge
                            variant="outline"
                            className={getStatusBadgeVariant(session.status)}
                          >
                            {session.status?.toUpperCase()}
                          </Badge>
                        )}
                        {session.bookedCount > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                          >
                            Booked • {session.bookedCount}
                          </Badge>
                        )}
                      </div>

                      {/* First row: Session ID, Date, Time */}
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center">
                          <i className="fas fa-hashtag text-purple-600 mr-2"></i>
                          Session ID: {session.sessionId}
                        </div>
                        {session.date && (
                          <div className="flex items-center">
                            <i className="fas fa-calendar text-blue-600 mr-2"></i>
                            {formatDate(session.date)}
                          </div>
                        )}
                        {session.startTime && (
                          <div className="flex items-center">
                            <i className="fas fa-clock text-green-600 mr-2"></i>
                            {formatTime(session.startTime)} -{" "}
                            {formatTime(session.endTime)}
                          </div>
                        )}
                      </div>

                      {/* Second row: Venue, Booked, Remaining, Co-examiners */}
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        {session.venueName && (
                          <div className="flex items-center">
                            <i className="fas fa-map-marker-alt text-orange-600 mr-2"></i>
                            {session.venueName}
                          </div>
                        )}
                        {session.bookedCount !== undefined && (
                          <div className="flex items-center">
                            <i className="fas fa-user-check text-green-600 mr-2"></i>
                            {session.capacity && session.capacity > 0
                              ? <>Booked: {session.bookedCount}/{session.capacity}</>
                              : <>Booked: {session.bookedCount}</>}
                          </div>
                        )}
                        {session.capacity && session.capacity > 0 && session.remainingCapacity !== undefined && (
                          <div className="flex items-center">
                            <i className="fas fa-users-slash text-amber-600 mr-2"></i>
                            Remaining: {Math.max(0, session.remainingCapacity)}
                          </div>
                        )}
                        {Array.isArray(session.assignedExaminers) && session.assignedExaminers.length > 0 && (
                          <div className="flex items-center">
                            <i className="fas fa-user-friends text-indigo-600 mr-2"></i>
                            {session.assignedExaminers.slice(0, 2).map((ex) => ex.name).filter(Boolean).join(', ')}
                            {session.assignedExaminers.length > 2 && (
                              <span className="ml-1">+{session.assignedExaminers.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleViewAssessments(session)}
                      variant="default"
                    >
                      <i className="fas fa-clipboard-list mr-2"></i>
                      View Assessments
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-calendar-times text-gray-400 dark:text-gray-500 text-3xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                No Booked Timeslots
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                There are no booked timeslots for this assignment yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
