"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ReviewDialog({ open, examiner, onOpenChange, onConfirm, isSubmitting }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for reopening this marking.');
      return;
    }
    setError(null);
    onConfirm?.({ reason: reason.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request rework from {examiner?.name}</DialogTitle>
          <DialogDescription>
            The examiner will receive an email with your reason and regain edit access to this assessment. The assessment will be unreleased until the examiner resubmits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for review</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="form-control w-full"
              placeholder="Describe what needs clarification or adjustment."
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting && <i className="fas fa-spinner fa-spin mr-2" />}
            Send review request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
