import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { examinerTimeslotService } from '../services/examinerTimeslotService';
import { useNotification } from './useNotification';
import { useExaminerAuth } from './useExaminerAuth';

/**
 * Custom hook for timeslot assignment operations
 * Handles assignment, withdrawal, and conflict detection
 */
export function useTimeslotAssignment() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const { examinerId, requireAuth } = useExaminerAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // Check for time conflicts between slots
  const hasConflict = useCallback((slotA, slotB) => {
    const aStart = new Date(slotA.start).getTime();
    const aEnd = new Date(slotA.end).getTime();
    const bStart = new Date(slotB.start).getTime();
    const bEnd = new Date(slotB.end).getTime();
    return aStart < bEnd && bStart < aEnd;
  }, []);

  // Validate slot selection based on allocation limits
  const validateSelection = useCallback((slot, currentSlots, maxSessions) => {
    const currentAllocation = currentSlots.reduce((sum, s) => sum + s.sessionCount, 0);
    
    if (currentAllocation + slot.sessionCount > maxSessions) {
      return { valid: false, reason: `Maximum allocation of ${maxSessions} sessions exceeded` };
    }

    const conflict = currentSlots.find((s) => hasConflict(s, slot));
    if (conflict) {
      return { valid: false, reason: 'Time slot conflicts with another selected slot' };
    }

    return { valid: true };
  }, [hasConflict]);

  // Assign examiner to selected timeslots
  const assignToTimeslots = useCallback(async (assignmentId, selectedSlots) => {
    try {
      requireAuth('assign timeslots');
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitResult(null);

      const slotAssignments = selectedSlots.map(slot => ({
        slotId: slot.slotId
      }));

      const result = await examinerTimeslotService.assignExaminerToTimeslots(
        assignmentId,
        { examinerId, slotAssignments }
      );

      setSubmitResult(result);

      if (result.success) {
        if (result.data.partial) {
          showNotification('warning', 
            `Partial success: ${result.data.assignedSlots.length} assigned, ${result.data.failedSlots.length} failed.`
          );
        } else {
          showNotification('success', 
            `Assigned ${result.data.assignedSlots.length} time slot(s) successfully`
          );
        }
        
        // Redirect after success
        setTimeout(() => {
          router.push("/examiner/schedule");
        }, 2000);
        
        return result;
      } else {
        const errorMsg = result.message || 'Failed to submit selections';
        setSubmitError(errorMsg);
        showNotification('error', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Assignment error:', error);
      const errorMsg = error.message || 'Failed to submit selections. Please try again.';
      setSubmitError(errorMsg);
      showNotification('error', errorMsg);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [examinerId, requireAuth, showNotification, router]);

  // Withdraw from a timeslot
  const withdrawFromTimeslot = useCallback(async (slotId, onSuccess) => {
    try {
      requireAuth('withdraw from timeslot');
      setIsSubmitting(true);

      const result = await examinerTimeslotService.withdrawFromTimeslot(slotId, {
        examinerId
      });

      if (result.success) {
        showNotification('success', 'Successfully withdrawn from timeslot');
        onSuccess?.();
        return result;
      } else {
        // Handle specific withdrawal failure reasons
        let errorMsg = result.message || 'Failed to withdraw from timeslot';
        
        if (result.reason === 'STUDENT_BOOKED') {
          errorMsg = 'Cannot withdraw: Students are already booked for this session';
        } else if (result.reason === 'SESSION_STARTED') {
          errorMsg = 'Cannot withdraw: Session has already started';
        }

        showNotification('error', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      const errorMsg = error.message || 'Failed to withdraw from timeslot';
      showNotification('error', errorMsg);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [examinerId, requireAuth, showNotification]);

  // Check if withdrawal is allowed for a slot
  const canWithdraw = useCallback((slot) => {
    if (!slot) return false;
    
    // Based on API contract: can only withdraw when bookingCount === 0
    return slot.bookingCount === 0;
  }, []);

  // Get withdrawal blocking reason
  const getWithdrawalReason = useCallback((slot) => {
    if (!slot) return 'Slot information unavailable';
    
    if (slot.bookingCount > 0) {
      return 'STUDENT_BOOKED';
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
    assignToTimeslots,
    withdrawFromTimeslot,
    canWithdraw,
    getWithdrawalReason,
    clearErrors: () => {
      setSubmitError(null);
      setSubmitResult(null);
    }
  };
}