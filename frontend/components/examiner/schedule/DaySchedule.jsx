"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { examinerTimeslotService } from "@/services/examinerTimeslotService";
import { useExaminerAuth } from "@/hooks/useExaminerAuth";
import { useTimeslotAssignment } from "@/hooks/useTimeslotAssignment";
import useScheduleFilterStore from "@/store/scheduleFilterStore";
import { Button } from "@/components/ui/button";
import OperationResultDialog from "@/components/examiner/schedule/OperationResultDialog";
import ConfirmWithdrawDialog from "@/components/examiner/schedule/ConfirmWithdrawDialog";
import { formatVenue } from "@/utils/formatVenue";
import { toLocalDateKey } from "@/utils/dateUtils";

export default function DaySchedule() {
  const { examinerId, isValidExaminer } = useExaminerAuth();
  const { selectedCourse, searchText, assessmentType } = useScheduleFilterStore();
  const { withdrawFromSession, isSubmitting, canWithdraw } = useTimeslotAssignment();
  const [resultOpen, setResultOpen] = useState(false);
  const [resultProps, setResultProps] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSession, setPendingSession] = useState(null);

  const today = new Date();
  const todayKey = toLocalDateKey(today);

  const {
    data,
    isLoading,
    error,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["examinerDay", examinerId, todayKey],
    queryFn: () =>
      examinerTimeslotService.getExaminerSchedule(examinerId, { date: todayKey }),
    enabled: isValidExaminer,
    refetchInterval: 90 * 1000,
    staleTime: 30 * 1000,
  });

  const sessions = useMemo(() => {
    const assignments = data?.data?.assignments || [];
    const flattened = assignments.flatMap((assignment) => {
      const sessionList = assignment.sessions || [];
      return sessionList.map((session) => ({
        ...session,
        assignmentId: assignment.assignmentId,
        assignmentName: assignment.assignmentName,
        courseCode: assignment.courseCode,
        courseName: assignment.courseName,
        assessmentType:
          (session.requiredExaminers ?? session.coverage?.required ?? 1) === 1
            ? "INDIVIDUAL"
            : "GROUP",
      }));
    });

    const filtered = flattened.filter((session) => {
      const sameDay = toLocalDateKey(new Date(session.start)) === todayKey;
      if (!sameDay) return false;
      if (selectedCourse && session.courseCode !== selectedCourse) return false;
      if (
        assessmentType &&
        assessmentType !== "ALL" &&
        session.assessmentType !== assessmentType
      )
        return false;
      if (searchText && searchText.trim()) {
        const query = searchText.trim().toLowerCase();
        const matches =
          session.assignmentName?.toLowerCase().includes(query) ||
          session.courseName?.toLowerCase().includes(query) ||
          session.courseCode?.toLowerCase().includes(query) ||
          session.participants?.some((p) => p.toLowerCase().includes(query));
        if (!matches) return false;
      }
      return true;
    });

    return filtered.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [data, selectedCourse, assessmentType, searchText, todayKey]);

  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return "";
    const diff = Math.floor((Date.now() - dataUpdatedAt) / 1000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}s ago`;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}m ${seconds}s ago`;
  }, [dataUpdatedAt]);

  const now = new Date();
  const upcomingSessions = sessions.filter(
    (session) => new Date(session.start) > now
  );
  const pastSessions = sessions.filter((session) => new Date(session.start) <= now);

  const handleWithdrawRequest = (session) => {
    setPendingSession(session);
    setConfirmOpen(true);
  };

  const handleWithdraw = async (session) => {
    try {
      const result = await withdrawFromSession(session, () => {
        refetch();
      });
      if (result?.success) {
        const start = session.start ? new Date(session.start) : null;
        const end = session.end ? new Date(session.end) : null;
        const detail =
          start && end
            ? `${start.toLocaleDateString("en-AU", {
                month: "short",
                day: "numeric",
              })} ${start.toLocaleTimeString("en-AU", {
                hour: "numeric",
                minute: "2-digit",
              })} – ${end.toLocaleTimeString("en-AU", {
                hour: "numeric",
                minute: "2-digit",
              })}`
            : `Session #${session.sessionId}`;
        setResultProps({
          status: "success",
          title: "Withdrawn from Session",
          message: "Your schedule has been updated.",
          details: [detail],
          autoDismiss: true,
          autoDismissMs: 1300,
        });
        setResultOpen(true);
      }
    } catch (withdrawError) {
      setResultProps({
        status: "error",
        title: "Withdraw Failed",
        message:
          withdrawError?.message || "Unable to withdraw from this session.",
        autoDismiss: false,
        primaryActionLabel: "Close",
      });
      setResultOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-card p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Loading today…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card p-6 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
        </div>
        <div className="text-sm text-red-600 dark:text-red-400">
          Failed to load today’s sessions
        </div>
        <button
          onClick={() => refetch()}
          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-card p-4">
      <OperationResultDialog
        open={resultOpen}
        onOpenChange={setResultOpen}
        {...resultProps}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          <i className="fas fa-calendar-day text-blue-600 dark:text-blue-400 mr-2"></i>
          Today —
          {" "}
          {today.toLocaleDateString("en-AU", {
            month: "short",
            day: "numeric",
            weekday: "long",
          })}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Updated {lastUpdated}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-calendar-check text-gray-400 dark:text-gray-500 text-2xl"></i>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            No sessions scheduled for today
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {upcomingSessions.length > 0 && (
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <i className="fas fa-arrow-right text-green-600 mr-2"></i>
              Upcoming Sessions ({upcomingSessions.length})
            </h3>
          )}

          {upcomingSessions.map((session) => {
            const sessionStart = new Date(session.start);
            const sessionEnd = new Date(session.end);
            const booked = session.bookingCount ?? 0;
            return (
              <div
                key={session.sessionId}
                className="p-4 border rounded-lg dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {session.assignmentName}
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        <i className="fas fa-check mr-1"></i>
                        Assigned
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <div className="flex items-center mb-1">
                        <i className="fas fa-book mr-2"></i>
                        <strong>{session.courseCode}</strong> – {session.courseName}
                      </div>
                      <div className="flex items-center mb-1">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        {formatVenue(session.venue)}
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-clock mr-2"></i>
                        {sessionStart.toLocaleTimeString("en-AU", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {" "}–{" "}
                        {sessionEnd.toLocaleTimeString("en-AU", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div
                      className={`text-xs ${
                        booked > 0
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      <i
                        className={`fas ${
                          booked > 0 ? "fa-users" : "fa-user-slash"
                        } mr-1`}
                      ></i>
                      {booked} student{booked !== 1 ? "s" : ""} booked
                    </div>

                    {session.participants?.length > 0 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        <i className="fas fa-users mr-1"></i>
                        {session.participants.join(", ")}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant={canWithdraw(session) ? "destructive" : "outline"}
                    onClick={() => handleWithdrawRequest(session)}
                    disabled={!canWithdraw(session) || isSubmitting}
                    className="ml-4"
                    title={
                      !canWithdraw(session)
                        ? "Cannot withdraw: Students are already booked"
                        : "Click to withdraw from this session"
                    }
                  >
                    {isSubmitting ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-times mr-2"></i>
                    )}
                    Withdraw
                  </Button>
                </div>
              </div>
            );
          })}

          {pastSessions.length > 0 && (
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <i className="fas fa-history text-gray-600 mr-2"></i>
              Past Sessions ({pastSessions.length})
            </h3>
          )}

          {pastSessions.map((session) => {
            const sessionStart = new Date(session.start);
            const sessionEnd = new Date(session.end);
            return (
              <div
                key={session.sessionId}
                className="p-4 border rounded-lg dark:border-gray-700 opacity-75 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {session.assignmentName}
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        <i className="fas fa-check-circle mr-1"></i>
                        Completed
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <div className="flex items-center mb-1">
                        <i className="fas fa-book mr-2"></i>
                        <strong>{session.courseCode}</strong> – {session.courseName}
                      </div>
                      <div className="flex items-center mb-1">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        {formatVenue(session.venue)}
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-clock mr-2"></i>
                        {sessionStart.toLocaleTimeString("en-AU", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {" "}–{" "}
                        {sessionEnd.toLocaleTimeString("en-AU", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {session.participants?.length > 0 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        <i className="fas fa-users mr-1"></i>
                        {session.participants.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmWithdrawDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        slot={pendingSession}
        canWithdraw={pendingSession ? canWithdraw(pendingSession) : false}
        onConfirm={handleWithdraw}
      />
    </div>
  );
}
