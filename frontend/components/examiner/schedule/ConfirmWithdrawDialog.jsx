"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function formatRange(slot) {
  if (!slot) return '';
  try {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    const d = start.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', weekday: 'short' });
    const s = start.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
    const e = end.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
    return `${d} • ${s} – ${e}`;
  } catch {
    return `Slot #${slot.slotId}`;
  }
}

export default function ConfirmWithdrawDialog({ open, onOpenChange, slot, canWithdraw = true, blockingReason = null, onConfirm }) {
  const reasonText = (() => {
    if (!blockingReason) return null;
    if (blockingReason === 'STUDENT_BOOKED') return 'Students have already booked this timeslot.';
    if (blockingReason === 'SESSION_STARTED') return 'This session has already started.';
    return null;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-amber-700 dark:text-amber-300">Withdraw from Time Slot?</DialogTitle>
          <DialogDescription>
            You are about to withdraw from this assignment timeslot. Withdrawal is allowed only when no students are booked and before the session starts. This may affect staffing for the assessment.
          </DialogDescription>
        </DialogHeader>
        {slot && (
          <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            <div className="font-medium">{slot.assignmentName}</div>
            <div className="opacity-80">{formatRange(slot)}</div>
          </div>
        )}
        {!canWithdraw && (
          <div className="mt-3 text-sm text-red-700 dark:text-red-300">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            {reasonText || 'Withdrawal is not permitted for this timeslot.'}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!canWithdraw} onClick={() => { onConfirm?.(slot); onOpenChange(false); }}>
            Withdraw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

