"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ReleaseDialog({ open, onOpenChange, onConfirm, isSubmitting, hasSubmittedExaminers }) {
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    if (open) {
      setNotify(true);
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm?.({ notify });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release assessment to students</DialogTitle>
          <DialogDescription>
            Students will see the final score and released feedback immediately after release. You can re-open examiner markings later if adjustments are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {!hasSubmittedExaminers && (
            <div className="p-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-sm">
              <i className="fas fa-triangle-exclamation mr-2" />
              At least one examiner must submit their marking before you can release results.
            </div>
          )}
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Email the student/team that their results are available
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting || !hasSubmittedExaminers}>
            {isSubmitting && <i className="fas fa-spinner fa-spin mr-2" />}
            Release now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
