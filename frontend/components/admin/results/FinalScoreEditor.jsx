"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function FinalScoreEditor({ open, onOpenChange, initialValue, onSubmit, isSubmitting }) {
  const [value, setValue] = useState(initialValue ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue ?? '');
      setReason('');
      setError(null);
    }
  }, [open, initialValue]);

  const handleSubmit = () => {
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric < 0 || numeric > 100) {
      setError('Final score must be a percentage between 0 and 100.');
      return;
    }
    setError(null);
    onSubmit?.({ finalScorePct1dp: Number(numeric.toFixed(1)), reason: reason?.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Final Score</DialogTitle>
          <DialogDescription>
            Override the calculated average when moderation is required. Students will see the overridden score and optional reason if communicated separately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Final score (%)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="form-control w-full"
              placeholder="e.g. 78.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="form-control w-full"
              placeholder="Moderation board decision, alignment with rubric intent, etc."
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <i className="fas fa-spinner fa-spin mr-2" />}
            Save final score
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
