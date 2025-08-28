"use client";
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { examinerTimeslotService } from '@/services/examinerTimeslotService';
import { useAuthStore } from '@/store/authStore';
import useScheduleFilterStore from '@/store/scheduleFilterStore';

export default function DaySchedule() {
  const { user } = useAuthStore();
  const { selectedCourse, searchText, assessmentType } = useScheduleFilterStore();
  const debugUser = user || { id: 'debug-examiner-123', role: 'EXAMINER' };
  const todayStr = new Date().toISOString().split('T')[0];

  const { data, isLoading, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['examinerDay', debugUser?.id, todayStr],
    queryFn: () => examinerTimeslotService.getExaminerSchedule(debugUser?.id, { date: todayStr }),
    enabled: !!debugUser?.id,
    refetchInterval: 30000,
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

  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return '';
    const diff = Math.floor((Date.now() - dataUpdatedAt)/1000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff/60), s = diff%60; return `${m}m ${s}s ago`;
  }, [dataUpdatedAt]);

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
        <div className="space-y-2">
          {slots.map(slot => (
            <div key={slot.slotId} className="p-3 border rounded-lg dark:border-gray-700 flex items-start justify-between">
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-200">{slot.assignmentName}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{slot.courseCode} • {slot.venue?.name} {slot.venue?.room}</div>
              </div>
              <div className="text-right text-sm text-gray-800 dark:text-gray-200">
                {new Date(slot.start).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})} – {new Date(slot.end).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
