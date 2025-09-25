import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { examinerTimeslotService } from "../services/examinerTimeslotService";
import { useNotification } from "./useNotification";
import { useExaminerAuth } from "./useExaminerAuth";

/**
 * Custom hook for session assignment operations (backward-compatible naming)
 * Handles assignment, withdrawal, and conflict detection
 */
export function useTimeslotAssignment() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const { examinerId, requireAuth } = useExaminerAuth();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // Check for time conflicts between sessions
  const hasConflict = useCallback((sessionA, sessionB) => {
    const aStart = new Date(sessionA.start).getTime();
    const aEnd = new Date(sessionA.end).getTime();
    const bStart = new Date(sessionB.start).getTime();
    const bEnd = new Date(sessionB.end).getTime();
    return aStart < bEnd && bStart < aEnd;
  }, []);

  // Validate session selection based on allocation limits
  const validateSelection = useCallback(
    (session, currentSessions, maxSessions) => {
      const currentAllocation = currentSessions.reduce(
        (sum, s) => sum + (s.sessionCount ?? 1),
        0
      );
      const incoming = session.sessionCount ?? 1;

      if (currentAllocation + incoming > maxSessions) {
        return {
          valid: false,
          reason: `Maximum allocation of ${maxSessions} sessions exceeded`,
        };
      }

      const conflict = currentSessions.find((s) => hasConflict(s, session));
      if (conflict) {
        return {
          valid: false,
          reason: "Session conflicts with another selected session",
        };
      }

      return { valid: true };
    },
    [hasConflict]
  );

  // Assign examiner to selected sessions (kept legacy name exported below)
  const assignToSessions = useCallback(
    async (assignmentId, selectedSessions) => {
      try {
        requireAuth("assign sessions");
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitResult(null);

        const sessionIds = selectedSessions.map(
          (session) => session.sessionId ?? session.slotId
        );

        const result = await examinerTimeslotService.assignExaminerToSessions(
          assignmentId,
          { examinerId, sessionIds }
        );

        setSubmitResult(result);

        if (result.success) {
          if (result.data.partial) {
            showNotification(
              "warning",
              `Partial success: ${result.data.assignedSessions.length} assigned, ${result.data.failedSessions.length} failed.`
            );
          } else {
            showNotification(
              "success",
              `Assigned ${result.data.assignedSessions.length} timeslot(s) successfully`
            );
          }

          // Redirect after success
          setTimeout(() => {
            router.push("/examiner/schedule");
          }, 2000);

          return result;
        } else {
          const errorMsg = result.message || "Failed to submit selections";
          setSubmitError(errorMsg);
          showNotification("error", errorMsg);
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error("Assignment error:", error);
        const errorMsg =
          error.message || "Failed to submit selections. Please try again.";
        setSubmitError(errorMsg);
        showNotification("error", errorMsg);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [examinerId, requireAuth, showNotification, router]
  );

  // Withdraw from a session
  const withdrawFromSession = useCallback(
    async (sessionInput, onSuccess) => {
      try {
        requireAuth("withdraw from session");
        setIsSubmitting(true);
        // Support legacy signature (sessionId) and new signature (session object)
        const sessionId =
          typeof sessionInput === "object"
            ? sessionInput?.sessionId ?? sessionInput?.slotId
            : sessionInput;
        const assignmentId =
          typeof sessionInput === "object"
            ? sessionInput?.assignmentId
            : undefined;

        const result = await examinerTimeslotService.withdrawFromSession(
          sessionId,
          {
            examinerId,
            assignmentId,
          }
        );

        if (result.success) {
          // Invalidate schedule and selection caches so availability updates immediately
          queryClient.invalidateQueries({ queryKey: ["examinerSchedule"] });
          queryClient.invalidateQueries({ queryKey: ["examinerDay"] });
          queryClient.invalidateQueries({ queryKey: ["examinerWeek"] });
          queryClient.invalidateQueries({ queryKey: ["availableSessions"] });
          queryClient.invalidateQueries({ queryKey: ["availableTimeslots"] });
          onSuccess?.();
          return result;
        } else {
          // Handle specific withdrawal failure reasons
          let errorMsg = result.message || "Failed to withdraw from session";

          if (result.reason === "STUDENT_BOOKED") {
            errorMsg =
              "Cannot withdraw: Students are already booked for this session";
          } else if (result.reason === "SESSION_STARTED") {
            errorMsg = "Cannot withdraw: Session has already started";
          }

          showNotification("error", errorMsg);
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error("Withdrawal error:", error);
        const errorMsg = error.message || "Failed to withdraw from session";
        showNotification("error", errorMsg);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [examinerId, requireAuth, showNotification, queryClient]
  );

  // Check if withdrawal is allowed for a slot
  const canWithdraw = useCallback((session) => {
    if (!session) return false;

    // Based on API contract: can only withdraw when bookingCount === 0
    return (session.bookingCount ?? 0) === 0;
  }, []);

  // Get withdrawal blocking reason
  const getWithdrawalReason = useCallback((session) => {
    if (!session) return "Timeslot information unavailable";

    if ((session.bookingCount ?? 0) > 0) {
      return "STUDENT_BOOKED";
    }

    // Additional checks could be added here for SESSION_STARTED if needed
    return null;
  }, []);

  return {
    isSubmitting,
    submitError,
    submitResult,
    hasConflict,
    validateSelection,
    assignToSessions,
    withdrawFromSession,
    canWithdraw,
    getWithdrawalReason,
    clearErrors: () => {
      setSubmitError(null);
      setSubmitResult(null);
    },
    // Legacy names for existing imports
    assignToTimeslots: assignToSessions,
    withdrawFromTimeslot: withdrawFromSession,
  };
}
