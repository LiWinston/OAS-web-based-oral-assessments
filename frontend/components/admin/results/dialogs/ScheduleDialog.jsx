"use client";

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useSchedule, useSetSchedule } from '@/hooks/admin/useAdminResults';

function toIsoWithTz(localDateTime) {
  if (!localDateTime) return null;
  // localDateTime in format 'YYYY-MM-DDTHH:mm'
  const d = new Date(localDateTime);
  // If Date() fails to parse reliably across browsers, fall back to manual parse
  if (Number.isNaN(d.getTime())) {
    const [date, time] = localDateTime.split('T');
    const [y, m, day] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const dt = new Date(y, (m - 1), day, hh, mm);
    return dt.toISOString();
  }
  return d.toISOString();
}

export default function ScheduleDialog({ assignmentId, onClose }) {
  const { data } = useSchedule(assignmentId);
  const setSchedule = useSetSchedule();
  const [status, setStatus] = useState('DISABLED');
  const [atLocal, setAtLocal] = useState('');
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    if (!data) return;
    setStatus(data.status || 'DISABLED');
    if (data.at) {
      const d = new Date(data.at);
      // Convert to local datetime-local string
      const pad = (n) => String(n).padStart(2, '0');
      const value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setAtLocal(value);
    } else {
      setAtLocal('');
    }
    setNotify(!!data.notify);
  }, [data]);

  const canSubmit = useMemo(() => {
    if (status === 'SCHEDULED') return !!atLocal;
    return true;
  }, [status, atLocal]);

  const handleSave = async () => {
    const iso = status === 'SCHEDULED' ? toIsoWithTz(atLocal) : null;
    try {
      await setSchedule.mutateAsync({ assignmentId, schedule: { status, at: iso, notify } });
      onClose?.();
    } catch (e) {
      // handled in hook
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Results Publication</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">Status</label>
            <div className="min-w-[200px]">
              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {status === 'SCHEDULED' && (
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Publish at</label>
              <Input type="datetime-local" value={atLocal} onChange={(e) => setAtLocal(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">Time is saved with your timezone.</p>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Notify students by email
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSubmit || setSchedule.isPending}>
            {setSchedule.isPending ? 'Saving...' : 'Save Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
