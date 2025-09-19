"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWithdrawResults } from '@/hooks/admin/useAdminResults';

export default function WithdrawDialog({ assignmentId, entities = [], onClose, onDone }) {
  const [reason, setReason] = useState('');
  const withdraw = useWithdrawResults();

  const handleWithdraw = async () => {
    try {
      await withdraw.mutateAsync({ assignmentId, entities, reason: reason || 'Withdrawn by admin' });
      onDone?.();
      onClose?.();
    } catch (e) {
      // handled by hook
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw Released Results</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">This will unrelease results for {entities.length} selected entities.</p>
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter a reason" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={handleWithdraw} disabled={withdraw.isPending}>
            {withdraw.isPending ? 'Withdrawing...' : 'Withdraw Results'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

