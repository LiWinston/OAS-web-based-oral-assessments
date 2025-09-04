"use client";
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { examinerTimeslotService } from '@/services/examinerTimeslotService';
import { useExaminerAuth } from '@/hooks/useExaminerAuth';
import { useTimeslotAssignment } from '@/hooks/useTimeslotAssignment';
import useScheduleFilterStore from '@/store/scheduleFilterStore';
import { Button } from '@/components/ui/button';
import OperationResultDialog from '@/components/examiner/schedule/OperationResultDialog';
import ConfirmWithdrawDialog from '@/components/examiner/schedule/ConfirmWithdrawDialog';
import { formatVenue } from '@/utils/formatVenue';
import { toLocalDateKey } from '@/utils/dateUtils';

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0,0,0,0);
  return d;
}

export default function WeekSchedule() {
  const { examinerId, isValidExaminer } = useExaminerAuth();
  const { selectedCourse, searchText, assessmentType } = useScheduleFilterStore();
  const { withdrawFromTimeslot, isSubmitting, canWithdraw } = useTimeslotAssignment();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState(null);
  const [anchor, setAnchor] = useState(new Date());

  const weekStart = startOfWeek(anchor);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);

  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['examinerWeek', examinerId, weekStart.toDateString()],
    queryFn: () => examinerTimeslotService.getExaminerSchedule(examinerId, {
      dateFrom: toLocalDateKey(weekStart),
      dateTo: toLocalDateKey(weekEnd)
    }),
    enabled: isValidExaminer,
    refetchInterval: 2 * 60 * 1000, // Reduced to 2 minutes from 30 seconds
    staleTime: 60 * 1000 // 1 minute stale time
  });

  const slotsRaw = useMemo(() => data?.data?.assignments?.flatMap(a => a.slots.map(s => ({
    ...s,
    assignmentId: a.assignmentId,
    assignmentName: a.assignmentName,
    courseCode: a.courseCode,
    courseName: a.courseName,
    assessmentType: (s.requiredExaminers === 1) ? 'INDIVIDUAL' : 'GROUP'
  }))) || [], [data]);

  const slots = useMemo(() => {
    let f = slotsRaw;
    if (selectedCourse) f = f.filter(s => s.courseCode === selectedCourse);
    if (assessmentType && assessmentType !== 'ALL') f = f.filter(s => s.assessmentType === assessmentType);
    if (searchText && searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      f = f.filter(s => s.assignmentName.toLowerCase().includes(q) || s.courseName.toLowerCase().includes(q) || s.courseCode.toLowerCase().includes(q) || (s.participants && s.participants.some(p => p.toLowerCase().includes(q))));
    }
    return f.sort((a,b) => new Date(a.start) - new Date(b.start));
  }, [slotsRaw, selectedCourse, assessmentType, searchText]);

  const days = [...Array(7)].map((_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    const key = toLocalDateKey(d);
    const list = slots.filter(s => toLocalDateKey(new Date(s.start)) === key);
    return { date: d, key, list };
  });

  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return '';
    const diff = Math.floor((Date.now() - dataUpdatedAt)/1000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff/60), s = diff%60; return `${m}m ${s}s ago`;
  }, [dataUpdatedAt]);

  const changeWeek = (delta) => {
    const d = new Date(anchor); d.setDate(d.getDate() + delta*7); setAnchor(d);
  };

  const doWithdraw = async (slot) => {
    try {
      const res = await withdrawFromTimeslot(slot, () => { refetch(); });
      if (res?.success) {
        const start = slot.start ? new Date(slot.start) : null;
        const end = slot.end ? new Date(slot.end) : null;
        const detail = start && end
          ? `${start.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} ${start.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit'})} – ${end.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit'})}`
          : `Slot #${slot.slotId}`;
        setDialogProps({ status: 'success', title: 'Withdrawn from Time Slot', message: 'Your schedule has been updated.', details: [detail], autoDismiss: true, autoDismissMs: 1300 });
        setDialogOpen(true);
      }
    } catch (error) {
      setDialogProps({ status: 'error', title: 'Withdraw Failed', message: error?.message || 'Unable to withdraw from this timeslot.', autoDismiss: false, primaryActionLabel: 'Close' });
      setDialogOpen(true);
    }
  };
  const handleWithdraw = (slot) => { setPendingSlot(slot); setConfirmOpen(true); };

  if (isLoading) {
    return (
      <div className="dashboard-card p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Loading week…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="dashboard-card p-6 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
        </div>
        <div className="text-sm text-red-600 dark:text-red-400">Failed to load week</div>
        <button onClick={() => refetch()} className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="dashboard-card p-4">
      <OperationResultDialog open={dialogOpen} onOpenChange={setDialogOpen} {...dialogProps} />
      <ConfirmWithdrawDialog open={confirmOpen} onOpenChange={setConfirmOpen} slot={pendingSlot} canWithdraw={pendingSlot ? canWithdraw(pendingSlot) : false} onConfirm={doWithdraw} />
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          <i className="fas fa-calendar-week text-blue-600 dark:text-blue-400 mr-2"></i>
          Week of {weekStart.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <button onClick={() => changeWeek(-1)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><i className="fas fa-chevron-left"/></button>
          <span>Updated {lastUpdated}</span>
          <button onClick={() => changeWeek(1)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><i className="fas fa-chevron-right"/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map(({ date, key, list }) => (
          <div key={key} className="p-3 border rounded-lg dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-800 dark:text-gray-200">
                {date.toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
              {list.length > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">{list.length}</span>
              )}
            </div>
            {list.length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">No sessions</div>
            ) : (
              <div className="space-y-2">
                {list.map(slot => (
                  <div
                    key={slot.slotId}
                    className={`p-2 rounded border dark:border-gray-700 ${new Date(slot.start) <= new Date() ? 'opacity-75 bg-gray-50 dark:bg-gray-800/50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{slot.courseCode} — {slot.assignmentName}</div>
                      {new Date(slot.start) > new Date() && (
                        <Button
                          size="sm"
                          variant={canWithdraw(slot) ? "destructive" : "outline"}
                          onClick={() => handleWithdraw(slot)}
                          disabled={!canWithdraw(slot) || isSubmitting}
                          className="ml-2 px-2 py-1 text-xs"
                          title={
                            !canWithdraw(slot) 
                              ? 'Cannot withdraw: Students are already booked'
                              : 'Click to withdraw from this timeslot'
                          }
                        >
                          {isSubmitting ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-times"></i>
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(slot.start).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})} – {new Date(slot.end).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})}
                      {' · '} {formatVenue(slot.venue)}
                    </div>
                    {typeof slot.bookingCount !== 'undefined' && (
                      <div className={`text-xs mt-1 ${slot.bookingCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                        <i className={`fas ${slot.bookingCount > 0 ? 'fa-users' : 'fa-user-slash'} mr-1`}></i>
                        {slot.bookingCount} student{slot.bookingCount !== 1 ? 's' : ''} booked
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
