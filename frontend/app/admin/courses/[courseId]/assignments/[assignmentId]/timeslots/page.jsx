'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import CalendarMonth from '@/components/admin/schedule/CalendarMonth.jsx';
import BatchCreateSessionsModal from '@/components/admin/schedule/BatchCreateSessionsModal.jsx';
import SingleSessionModal from '@/components/admin/schedule/SingleSessionModal.jsx';
import ExaminerLimitsStep from '@/components/admin/schedule/ExaminerLimitsStep.jsx';
// removed useScheduleRelease
import { courseAdminSessionService } from '@/services/courseAdminSessionService.js';
import { confirm, showSuccess, showError } from '@/lib/notifications.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';

/**
 * AssignmentTimeSlotsPage - Refactored timeslot management
 * Uses server state via hooks (per Section 9.2) - no local-only operations
 * 
 * CalendarMonth: consumes useCalendar, not hard-coded month/today
 * List & Cards: fetch by selected date; batch operations wired to server
 * Add/Edit modal: injects sessionLength/gapTime from useSessionConfig
 */

// Legacy MOCK_EXAMINERS removed; live API provides examiners

export default function AssignmentTimeSlotsPage() {
  const params = useParams();
  const { courseId, assignmentId } = params;
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [singleMode, setSingleMode] = useState('create');
  const [editingSession, setEditingSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showLimits, setShowLimits] = useState(false);
  const [openExaminerForSessionId, setOpenExaminerForSessionId] = useState(null);
  const [openBookedForSessionId, setOpenBookedForSessionId] = useState(null);
  const [availableExaminers, setAvailableExaminers] = useState([]);
  const [publishMap, setPublishMap] = useState({}); // { [sessionId]: { examiners: bool, students: bool } }
  const [assignmentPublish, setAssignmentPublish] = useState({ examiners: false, students: false, loaded: false });

  // Fetch/refresh sessions for the selected date
  const refreshSessions = useCallback(async () => {
    if (!selectedDate) return;
    setIsLoadingSlots(true);
    try {
      const res = await courseAdminSessionService.getSessions(assignmentId, { date: selectedDate });
      const list = Array.isArray(res?.data) ? res.data : [];
      setSessions(list);
      // Load publish status for each session (best-effort)
      const entries = await Promise.all(
        list.map(async (s) => {
          try {
            const st = await courseAdminSessionService.getSessionPublishStatus(s.id);
            return [s.id, st?.data || { examiners: false, students: false }];
          } catch {
            return [s.id, { examiners: false, students: false }];
          }
        })
      );
      setPublishMap(Object.fromEntries(entries));
    } catch (e) {
      setSessions([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [assignmentId, selectedDate]);

  // fetch sessions on date change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await refreshSessions();
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSessions]);

  // Initialize selected date on client to avoid SSR/client timezone differences
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      // Use local date string in YYYY-MM-DD
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [selectedDate]);

  // Load assignment-level publish status once on entry
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await courseAdminSessionService.getAssignmentPublishStatus(assignmentId);
        if (!cancelled) setAssignmentPublish({ ...(res?.data || { examiners: false, students: false }), loaded: true });
      } catch {
        if (!cancelled) setAssignmentPublish((prev) => ({ ...prev, loaded: true }));
      }
    })();
    return () => { cancelled = true; };
  }, [assignmentId]);

  // Ensure publish status is fetched on first load (or when list changes)
  // (placed after sessionsForSelectedDate is defined to avoid temporal dead zone)

  // schedule-level release hook removed

  // Filter slots for selected date
  const sessionsForSelectedDate = selectedDate 
    ? sessions.filter(s => s.date === selectedDate)
    : [];

  // Assignment-level publish status drives header; per-session map only updates after toggles

  const examinerLookup = useMemo(() => {
    const map = new Map();
    for (const ex of availableExaminers) map.set(ex.id, ex);
    return map;
  }, [availableExaminers]);

  // Selection handlers removed; cleaned up legacy modal helpers

  // Session creation handlers (API)
  const identity = (s) => `${s.date}|${s.startTime}|${s.endTime}|${s.venueId ?? ''}`;
  const mergeUnique = (prev, incoming) => {
    const seen = new Set(prev.map(identity));
    const merged = [...prev];
    for (const s of incoming) {
      const key = identity(s);
      if (!seen.has(key)) {
        merged.push(s);
        seen.add(key);
      }
    }
    return merged;
  };
  const handleAddBatchSessions = async (generator) => {
    if (!generator || !generator.date || !generator.startTime) return;
    try {
      const res = await courseAdminSessionService.generateSessions(assignmentId, generator);
      const created = res?.data || [];
      // Always refresh from server so list shows IDs and latest state
      await refreshSessions();
    } catch (e) {
      showError('Failed to create sessions');
    }
  };
  const handleAddSingleSession = async (session) => {
    if (!session) return;
    try {
      const res = await courseAdminSessionService.createSessionsBatch(assignmentId, { sessions: [session] });
      const created = res?.data || [];
      // Refresh to reflect backend-created session IDs and details
      await refreshSessions();
    } catch (e) {
      showError('Failed to create session');
    }
  };

  const handleDeleteTimeSlot = async (id) => {
    const confirmed = await confirm('Delete this session?');
    if (confirmed) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'calendar'] });
    }
  };

  // Duplicate/edit handlers for sessions
  const handleDuplicateSession = (session) => {
    setSingleMode('create');
    setEditingSession({ ...session, id: undefined });
    setShowSingleModal(true);
  };

  const handleEditSession = (session) => {
    setSingleMode('edit');
    setEditingSession(session);
    setShowSingleModal(true);
  };

  const handleUpdateSingleSession = async (session) => {
    if (!session?.id) return;
    try {
      await courseAdminSessionService.updateSession(assignmentId, session.id, session);
      await refreshSessions();
      showSuccess('Session updated');
    } catch (e) {
      showError('Failed to update session');
    }
  };

  // Examiners dropdown logic
  const ensureExaminersLoaded = async () => {
    if (availableExaminers.length) return;
    try {
      const res = await courseAdminSessionService.getAvailableExaminers(assignmentId);
      setAvailableExaminers(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      // ignore
    }
  };
  const toggleExaminers = async (sessionId) => {
    if (openExaminerForSessionId === sessionId) {
      setOpenExaminerForSessionId(null);
      return;
    }
    await ensureExaminersLoaded();
    setOpenExaminerForSessionId(sessionId);
    setOpenBookedForSessionId(null);
  };
  const toggleBooked = (sessionId) => {
    setOpenBookedForSessionId(openBookedForSessionId === sessionId ? null : sessionId);
    setOpenExaminerForSessionId(null);
  };

  const updateSessionLocal = (sessionId, updater) => {
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? updater(s) : s)));
  };
  const handleTogglePublishExaminers = async (session, nextValue) => {
    try {
      await courseAdminSessionService.setSessionPublishToExaminers(session.id, nextValue);
      setPublishMap((prev) => ({ ...prev, [session.id]: { ...(prev[session.id] || {}), examiners: nextValue } }));
      showSuccess(nextValue ? 'Released to examiners' : 'Withdrawn from examiners');
    } catch (e) {
      showError('Failed to update examiner release');
    }
  };
  const handleTogglePublishStudents = async (session, nextValue) => {
    try {
      await courseAdminSessionService.setSessionPublishToStudents(session.id, nextValue);
      setPublishMap((prev) => ({ ...prev, [session.id]: { ...(prev[session.id] || {}), students: nextValue } }));
      showSuccess(nextValue ? 'Released to students' : 'Withdrawn from students');
    } catch (e) {
      showError('Failed to update student release');
    }
  };
  const handleAssignExaminer = async (session, examinerId) => {
    if (!session?.id || !examinerId) return;
    try {
      await courseAdminSessionService.assignSessionExaminers(session.id, [Number(examinerId)]);
      // Update local state: append to assignedExaminers if not already present
      updateSessionLocal(session.id, (s) => {
        const exists = (s.assignedExaminers || []).some((e) => (e.id || e.examinerId) === Number(examinerId));
        if (exists) return s;
        const ex = examinerLookup.get(Number(examinerId));
        const entry = ex ? { id: ex.id, name: ex.name } : { id: Number(examinerId) };
        return { ...s, assignedExaminers: [ ...(s.assignedExaminers || []), entry ] };
      });
      showSuccess('Examiner assigned');
    } catch (e) {
      showError('Failed to assign examiner');
    }
  };
  const handleRemoveExaminer = async (session, examinerId) => {
    if (!session?.id || !examinerId) return;
    try {
      await courseAdminSessionService.unassignSessionExaminer(session.id, Number(examinerId));
      updateSessionLocal(session.id, (s) => ({
        ...s,
        assignedExaminers: (s.assignedExaminers || []).filter((e) => (e.id || e.examinerId) !== Number(examinerId)),
      }));
      showSuccess('Examiner removed');
    } catch (e) {
      showError('Failed to remove examiner');
    }
  };

  // Removed legacy examiner notifications and bulk operations (unused)

  // Two-button release now handled inline in header buttons

  return (
    <div className="oas-schedule space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <span className="breadcrumb-link cursor-pointer">OAS Dashboard</span>
        <i className="fas fa-chevron-right text-xs"></i>
        <span className="breadcrumb-link cursor-pointer">Assignments</span>
        <i className="fas fa-chevron-right text-xs"></i>
        <span className="breadcrumb-link cursor-pointer">Assignment {assignmentId}</span>
        <i className="fas fa-chevron-right text-xs"></i>
        <span>Time Slot Management</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Time Slot Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage assessment time slots and examiner assignments for Assignment {assignmentId}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className={`px-3 py-2 rounded-lg text-sm font-medium ${assignmentPublish.examiners ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            onClick={async () => {
              const next = !assignmentPublish.examiners;
              try {
                await Promise.all(sessionsForSelectedDate.map((s) => courseAdminSessionService.setSessionPublishToExaminers(s.id, next)));
                const st = await courseAdminSessionService.getAssignmentPublishStatus(assignmentId);
                setAssignmentPublish({ ...(st?.data || { examiners: next, students: assignmentPublish.students }), loaded: true });
                showSuccess(next ? 'Released all to examiners' : 'Withdrew examiner release (all)');
              } catch {
                showError('Failed to update examiner release');
              }
            }}
            disabled={!assignmentPublish.loaded}
            title="Toggle release to examiners for all sessions on this date"
          >
            {assignmentPublish.examiners ? 'Withdraw Release to Examiners' : 'Release to Examiners'}
          </button>
          <button
            className={`px-3 py-2 rounded-lg text-sm font-medium ${assignmentPublish.students ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
            onClick={async () => {
              const next = !assignmentPublish.students;
              try {
                await Promise.all(sessionsForSelectedDate.map((s) => courseAdminSessionService.setSessionPublishToStudents(s.id, next)));
                const st = await courseAdminSessionService.getAssignmentPublishStatus(assignmentId);
                setAssignmentPublish({ ...(st?.data || { students: next, examiners: assignmentPublish.examiners }), loaded: true });
                showSuccess(next ? 'Released all to students' : 'Withdrew student release (all)');
              } catch {
                showError('Failed to update student release');
              }
            }}
            disabled={!assignmentPublish.loaded}
            title="Toggle release to students for all sessions on this date"
          >
            {assignmentPublish.students ? 'Withdraw Release to Students' : 'Release to Students'}
          </button>
        </div>
      </div>

      {/* Assignment Info + Actions */}
      <div className="dashboard-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 rounded-lg flex items-center justify-center">
              <i className="fas fa-shield-alt text-blue-600 dark:text-blue-400"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Assignment {assignmentId}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Course {courseId} - Oral Assessment</p>
            </div>
          </div>
          <div>
            <button
              onClick={() => setShowLimits(true)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white"
            >
              <i className="fas fa-user-cog mr-2" /> Set Examiner Limits
            </button>
          </div>
        </div>
      </div>

      {/* Calendar + List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Calendar (uses useCalendar, not hard-coded) */}
        <CalendarMonth
          assignmentId={assignmentId}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Right - Time Slots List */}
        <div className="dashboard-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
              <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2" />
              {selectedDate ? `Sessions - ${selectedDate}` : 'Sessions - Select a date'}
            </h2>
            {selectedDate && (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowBatchModal(true)} className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  <i className="fas fa-layer-group mr-1" /> Batch Create Sessions
                </button>
                <button onClick={() => setShowSingleModal(true)} className="px-3 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                  <i className="fas fa-plus mr-1" /> Create Session
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoadingSlots && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Empty States */}
          {!isLoadingSlots && !selectedDate && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fas fa-calendar-day text-xl" />
              </div>
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">No Date Selected</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">Select a date from the calendar to view and manage sessions for that day.</p>
            </div>
          )}

          {!isLoadingSlots && selectedDate && sessionsForSelectedDate.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fas fa-calendar-plus text-xl" />
              </div>
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">No Sessions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">There are no sessions scheduled for this date yet.</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowBatchModal(true)} className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  <i className="fas fa-layer-group mr-1" /> Batch Create Sessions
                </button>
                <button onClick={() => setShowSingleModal(true)} className="px-3 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                  <i className="fas fa-plus mr-1" /> Create Session
                </button>
              </div>
            </div>
          )}

          {/* Sessions Content */}
          {!isLoadingSlots && selectedDate && sessionsForSelectedDate.length > 0 && (
            <div className="space-y-4">
              {sessionsForSelectedDate.map((s, idx) => (
                <div key={`${s.id ?? `${s.date}-${s.startTime}-${s.endTime}-${s.venueId ?? ''}`}-${idx}`} className="time-slot-item relative">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-base font-medium text-gray-800 dark:text-gray-200">{s.startTime} - {s.endTime}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5"><i className="fas fa-map-marker-alt mr-1.5" /> {s.venue || s.venueName || (s.venueId != null ? `Venue #${s.venueId}` : 'Venue')}</div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <button
                        className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        onClick={() => toggleExaminers(s.id)}
                      >
                        {(s.assignedExaminers?.length || 0)}/{s.requiredExaminers || 1} examiners
                      </button>
                      <button
                        className="text-xs text-gray-600 dark:text-gray-300 hover:underline"
                        onClick={() => toggleBooked(s.id)}
                      >
                        {(s.bookedCount || 0)}/{s.capacity || 1} booked
                      </button>
                      <button className="action-btn text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:text-indigo-300 dark:bg-indigo-900 dark:bg-opacity-20 dark:hover:bg-opacity-30" onClick={() => handleEditSession(s)} title="Edit session">
                        <i className="fas fa-pen" />
                      </button>
                      <button className="action-btn text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:bg-blue-900 dark:bg-opacity-20 dark:hover:bg-opacity-30" onClick={() => handleDuplicateSession(s)} title="Duplicate session">
                        <i className="fas fa-copy" />
                      </button>
                      <button className="action-btn text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:bg-red-900 dark:bg-opacity-20 dark:hover:bg-opacity-30" onClick={() => handleDeleteTimeSlot(s.id)}>
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-600 dark:text-gray-300">
                    <button
                      className={`px-2 py-0.5 rounded ${publishMap[s.id]?.examiners ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800'}`}
                      onClick={() => handleTogglePublishExaminers(s, !publishMap[s.id]?.examiners)}
                      title={publishMap[s.id]?.examiners ? 'Withdraw examiner release' : 'Release to examiners'}
                    >
                      <i className="fas fa-user-tie mr-1"/> {publishMap[s.id]?.examiners ? 'Examiners: On' : 'Examiners: Off'}
                    </button>
                    <button
                      className={`px-2 py-0.5 rounded ${publishMap[s.id]?.students ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800'}`}
                      onClick={() => handleTogglePublishStudents(s, !publishMap[s.id]?.students)}
                      title={publishMap[s.id]?.students ? 'Withdraw student release' : 'Release to students'}
                    >
                      <i className="fas fa-user-graduate mr-1"/> {publishMap[s.id]?.students ? 'Students: On' : 'Students: Off'}
                    </button>
                  </div>

                  {openExaminerForSessionId === s.id && (
                    <div className="absolute right-3 z-20 mt-1 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Assign examiners</div>
                        <button className="text-gray-400 hover:text-gray-600" onClick={() => setOpenExaminerForSessionId(null)} aria-label="Close"><i className="fas fa-times" /></button>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Currently assigned</div>
                        <div className="flex flex-wrap gap-2">
                          {(s.assignedExaminers && s.assignedExaminers.length > 0) ? (
                            s.assignedExaminers.map((ex) => (
                              <span key={ex.id || ex.examinerId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                                {ex.name || examinerLookup.get(ex.id || ex.examinerId)?.name || `#${ex.id || ex.examinerId}`}
                                <button className="text-red-500 hover:text-red-700 ml-1" onClick={() => handleRemoveExaminer(s, ex.id || ex.examinerId)} title="Remove"><i className="fas fa-times" /></button>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">No examiners assigned</span>
                          )}
                        </div>
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Add examiner</div>
                          <Select onValueChange={(val) => handleAssignExaminer(s, val)}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Select examiner" /></SelectTrigger>
                            <SelectContent>
                              {availableExaminers.map((ex) => (
                                <SelectItem key={ex.id} value={String(ex.id)}>{ex.name} {ex.currentAssignments != null ? `(${ex.currentAssignments}/${ex.maxSessions || '∞'})` : ''}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {openBookedForSessionId === s.id && (
                    <div className="absolute right-3 z-20 mt-1 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Booked groups</div>
                        <button className="text-gray-400 hover:text-gray-600" onClick={() => setOpenBookedForSessionId(null)} aria-label="Close"><i className="fas fa-times" /></button>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{s.bookedCount || 0} of {s.capacity || 1} booked.</div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Detailed list not available yet.</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Batch Create & Single Session Modals */}
      <BatchCreateSessionsModal assignmentId={assignmentId} isOpen={showBatchModal} onClose={() => setShowBatchModal(false)} onGenerate={handleAddBatchSessions} defaultDate={selectedDate || undefined} />
      <SingleSessionModal
        assignmentId={assignmentId}
        isOpen={showSingleModal}
        onClose={() => setShowSingleModal(false)}
        onCreate={handleAddSingleSession}
        onUpdate={handleUpdateSingleSession}
        defaultDate={selectedDate || undefined}
        mode={singleMode}
        initialSession={editingSession}
      />

      {/* Examiner Limits Modal */}
      {showLimits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowLimits(false)} />
          <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Examiner Session Limits</h3>
              <button onClick={() => setShowLimits(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close">
                <i className="fas fa-times" />
              </button>
            </div>
            <ExaminerLimitsStep
              assignmentId={assignmentId}
              totalSessions={sessionsForSelectedDate.length || sessions.length}
              onPrevious={() => setShowLimits(false)}
              onComplete={() => setShowLimits(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
