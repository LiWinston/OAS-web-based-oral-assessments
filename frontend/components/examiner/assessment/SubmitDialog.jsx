'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';

export default function SubmitDialog({
  open,
  setOpen,
  validation,
  assignment,
  onConfirm,
}) {
  const disabled = (validation?.totalMissing || 0) > 0;
  const weightBasis = assignment?.rubric?.weightBasis || 'percentage';
  const groupWeight = Number(assignment?.weights?.group ?? assignment?.groupWeight ?? 0) || 0;
  const individualWeight = Number(assignment?.weights?.individual ?? assignment?.individualWeight ?? 0) || 0;
  const criteria = assignment?.rubric?.criteria || [];
  const hasGroup = criteria.some((c) => {
    const a = (c.appliesTo || 'BOTH').toUpperCase();
    return a === 'GROUP' || a === 'BOTH';
  });
  const hasIndividual = criteria.some((c) => {
    const a = (c.appliesTo || 'BOTH').toUpperCase();
    return a === 'INDIVIDUAL' || a === 'BOTH';
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Assessment?</DialogTitle>
          <DialogDescription>
            Once submitted, you cannot edit this assessment unless a Course Admin reopens it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {hasGroup && hasIndividual && (
            <p>
              Final scores will be computed with Group {weightBasis === 'points' ? `${groupWeight} pts` : `${groupWeight}%`} and Individual {weightBasis === 'points' ? `${individualWeight} pts` : `${individualWeight}%`} weighting.
            </p>
          )}
          <p>Please confirm you have completed the rubric selections and feedback.</p>
        </div>
        {disabled && (
          <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            <i className="fas fa-exclamation-triangle mr-2" />
            {validation.groupMissing > 0 && (
              <div>Group criteria incomplete: {validation.groupMissing} remaining.</div>
            )}
            {validation.perStudentMissing?.some((s) => s.missing > 0) && (
              <div className="mt-1">
                Individual criteria incomplete:
                {validation.perStudentMissing
                  .filter((s) => s.missing > 0)
                  .slice(0, 3)
                  .map((s) => (
                    <div key={s.studentId}>- {s.name}: {s.missing}/{s.required} remaining</div>
                  ))}
                {validation.perStudentMissing.filter((s) => s.missing > 0).length > 3 && <div>...and more</div>}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={disabled} onClick={() => { setOpen(false); onConfirm(); }}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
