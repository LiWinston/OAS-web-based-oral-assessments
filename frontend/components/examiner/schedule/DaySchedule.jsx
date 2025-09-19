"use client";
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { examinerTimeslotService } from '@/services/examinerTimeslotService';
import { useExaminerAuth } from '@/hooks/useExaminerAuth';
import { useTimeslotAssignment } from '@/hooks/useTimeslotAssignment';
import useScheduleFilterStore from '@/store/scheduleFilterStore';
import { Button } from '@/components/ui/button';
import OperationResultDialog from '@/components/examiner/schedule/OperationResultDialog';
import { formatVenue } from '@/utils/formatVenue';
import ConfirmWithdrawDialog from '@/components/examiner/schedule/ConfirmWithdrawDialog';
import { toLocalDateKey } from '@/utils/dateUtils';

export default function DaySchedule() {
  const { examinerId, isValidExaminer } = useExaminerAuth();
  const { selectedCourse, searchText, assessmentType } = useScheduleFilterStore();
  const { withdrawFromTimeslot, isSubmitting, canWithdraw } = useTimeslotAssignment();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogProps, setDialogProps] = React.useState({});
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingSlot, setPendingSlot] = React.useState(null);
  const todayStr = toLocalDateKey(new Date());

  const { data, isLoading, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['examinerDay', examinerId, todayStr],
    queryFn: () => examinerTimeslotService.getExaminerSchedule(examinerId, { date: todayStr }),
    enabled: isValidExaminer,
    refetchInterval: 90 * 1000, // Reduced to 90 seconds from 30 seconds - day view needs more frequent updates
    staleTime: 30 * 1000, // 30 seconds stale time
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
    // Ensure only today's slots are shown (guard if backend returns extra)
    f = f.filter(s => toLocalDateKey(new Date(s.start)) === todayStr);
    if (selectedCourse) f = f.filter(s => s.courseCode === selectedCourse);
    if (assessmentType && assessmentType !== 'ALL') f = f.filter(s => s.assessmentType === assessmentType);
    if (searchText && searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      f = f.filter(s => s.assignmentName.toLowerCase().includes(q) || s.courseName.toLowerCase().includes(q) || s.courseCode.toLowerCase().includes(q) || (s.participants && s.participants.some(p => p.toLowerCase().includes(q))));
    }
    return f.sort((a,b) => new Date(a.start) - new Date(b.start));
  }, [slotsRaw, selectedCourse, assessmentType, searchText]);

  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return '';
    const diff = Math.floor((Date.now() - dataUpdatedAt)/1000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff/60), s = diff%60; return `${m}m ${s}s ago`;
  }, [dataUpdatedAt]);

  const doWithdraw = async (slot) => {
    try {
      const res = await withdrawFromTimeslot(slot, () => { refetch(); });
      if (res?.success) {
        const start = slot.start ? new Date(slot.start) : null;
        const end = slot.end ? new Date(slot.end) : null;
        const detail = start && end
          ? `${start.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} ${start.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit'})} – ${end.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit'})}`
          : `Slot #${slot.slotId}`;
        setDialogProps({ status: 'success', title: 'Withdrawn from Session', message: 'Your schedule has been updated.', details: [detail], autoDismiss: true, autoDismissMs: 1300 });
        setDialogOpen(true);
      }
    } catch (error) {
      setDialogProps({ status: 'error', title: 'Withdraw Failed', message: error?.message || 'Unable to withdraw from this session.', autoDismiss: false, primaryActionLabel: 'Close' });
      setDialogOpen(true);
    }
  };
  const handleWithdraw = (slot) => { setPendingSlot(slot); setConfirmOpen(true); };

  if (isLoading) {
    return (
      <div className="dashboard-card p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Loading today…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="dashboard-card p-6 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
        </div>
        <div className="text-sm text-red-600 dark:text-red-400">Failed to load today</div>
        <button onClick={() => refetch()} className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="dashboard-card p-4">
      <OperationResultDialog open={dialogOpen} onOpenChange={setDialogOpen} {...dialogProps} />
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          <i className="fas fa-calendar-day text-blue-600 dark:text-blue-400 mr-2"></i>
          Today — {new Date().toLocaleDateString('en-AU', { month: 'short', day: 'numeric', weekday: 'long' })}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Updated {lastUpdated}</div>
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-calendar-check text-gray-400 dark:text-gray-500 text-2xl"></i>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">No sessions scheduled for today</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Slots */}
          {slots.filter(s => new Date(s.start) > new Date()).length > 0 && (
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <i className="fas fa-arrow-right text-green-600 mr-2"></i>
              Upcoming Slots ({slots.filter(s => new Date(s.start) > new Date()).length})
            </h3>
          )}
          {slots.filter(s => new Date(s.start) > new Date()).map(slot => (
              <div key={slot.slotId} className={`p-4 border rounded-lg dark:border-gray-700`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{slot.assignmentName}</div>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        <i className="fas fa-check mr-1"></i>
                        Assigned
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <div className="flex items-center mb-1">
                        <i className="fas fa-book mr-2"></i>
                        <strong>{slot.courseCode}</strong> - {slot.courseName}
                      </div>
                    <div className="flex items-center mb-1">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      {formatVenue(slot.venue)}
                    </div>
                      <div className="flex items-center">
                        <i className="fas fa-clock mr-2"></i>
                        {new Date(slot.start).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})} – {new Date(slot.end).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})}
                      </div>
                    </div>

                    {typeof slot.bookingCount !== 'undefined' && (
                      <div className={`text-xs ${slot.bookingCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                        <i className={`fas ${slot.bookingCount > 0 ? 'fa-users' : 'fa-user-slash'} mr-1`}></i>
                        {slot.bookingCount} student{slot.bookingCount !== 1 ? 's' : ''} booked
                      </div>
                    )}

                    {slot.participants && slot.participants.length > 0 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        <i className="fas fa-users mr-1"></i>
                        {slot.participants.join(', ')}
                      </div>
                    )}
                  </div>

                  {true && (
                    <Button
                      size="sm"
                      variant={canWithdraw(slot) ? "destructive" : "outline"}
                      onClick={() => handleWithdraw(slot)}
                      disabled={!canWithdraw(slot) || isSubmitting}
                      className="ml-4"
                      title={
                        !canWithdraw(slot) 
                          ? 'Cannot withdraw: Students are already booked'
                          : 'Click to withdraw from this session'
                      }
                    >
                      {isSubmitting ? (
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                      ) : (
                        <i className="fas fa-times mr-2"></i>
                      )}
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
          ))}

          {/* Past Sessions */}
          {slots.filter(s => new Date(s.start) <= new Date()).length > 0 && (
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <i className="fas fa-history text-gray-600 mr-2"></i>
              Past Sessions ({slots.filter(s => new Date(s.start) <= new Date()).length})
            </h3>
          )}
          {slots.filter(s => new Date(s.start) <= new Date()).map(slot => (
            <div key={slot.slotId} className={`p-4 border rounded-lg dark:border-gray-700 opacity-75 bg-gray-50 dark:bg-gray-800/50`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{slot.assignmentName}</div>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      <i className="fas fa-check-circle mr-1"></i>
                      Completed
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <div className="flex items-center mb-1">
                      <i className="fas fa-book mr-2"></i>
                      <strong>{slot.courseCode}</strong> - {slot.courseName}
                    </div>
                    <div className="flex items-center mb-1">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      {formatVenue(slot.venue)}
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-clock mr-2"></i>
                      {new Date(slot.start).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})} – {new Date(slot.end).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmWithdrawDialog open={confirmOpen} onOpenChange={setConfirmOpen} slot={pendingSlot} canWithdraw={pendingSlot ? canWithdraw(pendingSlot) : false} onConfirm={doWithdraw} />
    </div>
  );
}
