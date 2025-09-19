"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useReleaseResults } from '@/hooks/admin/useAdminResults';

export default function ReleaseDialog({ assignmentId, entities = [], onClose, onDone }) {
  const [notify, setNotify] = useState(true);
  const release = useReleaseResults();

  const handleRelease = async () => {
    try {
      await release.mutateAsync({ assignmentId, entities, notify });
      onDone?.();
      onClose?.();
    } catch (e) {
      // error handled by hook
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release Assessment Results</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">You are about to release results for {entities.length} selected entities.</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Notify students by email
          </label>
          <p className="text-xs text-gray-500">Only the notify option is sent to the backend. Other options are UI-only.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleRelease} disabled={release.isPending}>
            {release.isPending ? 'Releasing...' : 'Release Results'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

