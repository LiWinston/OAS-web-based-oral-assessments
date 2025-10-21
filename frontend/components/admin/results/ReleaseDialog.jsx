"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const RELEASE_MODE_OPTIONS = [
  {
    value: 'FULL',
    title: 'Full release',
    description: 'Share rubric comments, per-criterion feedback, scores, and overall feedback.'
  },
  {
    value: 'SCORES_ONLY',
    title: 'Scores only',
    description: 'Share scores and overall feedback now; keep rubric comments hidden.'
  }
];

export default function ReleaseDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  hasSubmittedExaminers,
  releaseMode,
  onReleaseModeChange,
}) {
  const [notify, setNotify] = useState(true);
  const selectedMode = (releaseMode || '').toString().toUpperCase();
  const safeMode = selectedMode === 'SCORES_ONLY' ? 'SCORES_ONLY' : 'FULL';

  const options = useMemo(() => RELEASE_MODE_OPTIONS, []);

  useEffect(() => {
    if (open) {
      setNotify(true);
      if (typeof onReleaseModeChange === 'function' && !releaseMode) {
        onReleaseModeChange('FULL');
      }
    }
  }, [open, onReleaseModeChange, releaseMode]);

  const handleConfirm = () => {
    onConfirm?.({ notify, releaseMode: safeMode });
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
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Release content</span>
            <div className="space-y-2">
              {options.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                    safeMode === option.value
                      ? 'border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="release-mode"
                    value={option.value}
                    checked={safeMode === option.value}
                    onChange={(event) => {
                      if (event.target.checked) {
                        onReleaseModeChange?.(option.value);
                      }
                    }}
                    className="mt-1"
                  />
                  <span className="flex flex-col">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{option.title}</span>
                    <span className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
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
