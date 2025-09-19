"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReviewEntity } from '@/hooks/admin/useAdminResults';

// Minimal review dialog: applies review to each selected entity sequentially
export default function ReviewDialog({ assignmentId, entities = [], onClose, onDone }) {
  const [reason, setReason] = useState('Please review for moderation.');
  const reviewMutation = useReviewEntity();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReview = async () => {
    try {
      setIsProcessing(true);
      for (const key of entities) {
        await reviewMutation.mutateAsync({
          assignmentId,
          sessionId: key.sessionId,
          entityKind: key.kind,
          entityId: key.entityId,
          request: { target: 'EXAMINERS', examiners: [], reason },
        });
      }
      onDone?.();
      onClose?.();
    } catch (e) {
      // handled in hook toasts
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">Send selected entities for examiner re-review. This reopens submissions where applicable.</p>
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleReview} disabled={isProcessing || reviewMutation.isPending}>
            {isProcessing || reviewMutation.isPending ? 'Sending...' : 'Send Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

