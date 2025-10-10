'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import formatVenue from '@/utils/formatVenue';

function formatDateLabel(startDate) {
  if (!startDate) return 'Date to be confirmed';
  return startDate.toLocaleDateString('en-AU', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: startDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

function formatTimeRange(startDate, endDate) {
  if (!startDate) return 'TBC';
  const startLabel = startDate.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (!endDate) return startLabel;

  const endLabel = endDate.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${startLabel} - ${endLabel}`;
}

function resolveParticipants(session) {
  if (session.participantsLabel) return session.participantsLabel;
  if (Array.isArray(session.participants) && session.participants.length > 0) {
    return session.participants.join(', ');
  }
  if (Array.isArray(session.enrolledStudents) && session.enrolledStudents.length > 0) {
    const [first] = session.enrolledStudents;
    if (session.enrolledStudents.length === 1) {
      return first?.name || first?.studentNumber || 'Student booked';
    }
    return `${session.enrolledStudents.length} students booked`;
  }
  if (Array.isArray(session.enrolledGroups) && session.enrolledGroups.length > 0) {
    const [first] = session.enrolledGroups;
    if (session.enrolledGroups.length === 1) {
      return first?.name || `Group ${first?.id ?? ''}`.trim();
    }
    return `${session.enrolledGroups.length} groups booked`;
  }
  if (session.bookingCount > 0) {
    return `${session.bookingCount} booking${session.bookingCount === 1 ? '' : 's'}`;
  }
  return 'No participants yet';
}

function formatAssessors(session) {
  const required = session.requiredExaminers;
  const current = session.currentExaminers;
  if (typeof required === 'number' || typeof current === 'number') {
    const reqLabel = typeof required === 'number' ? required : '—';
    const curLabel = typeof current === 'number' ? current : 0;
    return `${curLabel} of ${reqLabel} examiners allocated`;
  }
  return null;
}

function statusBadges(session) {
  const items = [];
  if (session.timelineStatus) {
    items.push({
      label: session.timelineStatus.replace(/_/g, ' ').toLowerCase(),
      variant: session.timelineStatus === 'COMPLETED' ? 'secondary' : 'outline',
    });
  }
  if (session.markingStatus) {
    const isSubmitted = session.markingStatus === 'SUBMITTED';
    items.push({
      label: session.markingStatus.replace(/_/g, ' ').toLowerCase(),
      variant: isSubmitted ? 'default' : 'outline',
    });
  }
  return items;
}

export default function SessionDetailsDialog({
  session,
  open,
  onOpenChange,
  renderFooter,
}) {
  const normalisedSession = useMemo(() => {
    if (!session) return null;
    const startDate =
      session.startDate instanceof Date
        ? session.startDate
        : session.start
        ? new Date(session.start)
        : null;
    const endDate =
      session.endDate instanceof Date
        ? session.endDate
        : session.end
        ? new Date(session.end)
        : null;

    return {
      ...session,
      startDate,
      endDate,
      venueLabel: session.venueLabel ?? formatVenue(session.venue) ?? 'Venue to be confirmed',
      participantsText: resolveParticipants(session),
      assessorSummary: formatAssessors(session),
      statusItems: statusBadges(session),
      isBooked: typeof session.isBooked === 'boolean'
        ? session.isBooked
        : Boolean(session.bookingCount),
    };
  }, [session]);

  if (!normalisedSession) {
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    );
  }

  const { startDate, endDate } = normalisedSession;
  const closeDialog = () => onOpenChange?.(false);

  const footerContent = renderFooter
    ? renderFooter({ session: normalisedSession, close: closeDialog })
    : (
      <Button variant="outline" onClick={closeDialog}>
        Close
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-3">
            <span>{normalisedSession.assignmentName || 'Assessment session'}</span>
            <div className="flex flex-wrap gap-2">
              {normalisedSession.isBooked ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700">
                  <i className="fas fa-user-check mr-1" />
                  Booked
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800">
                  <i className="fas fa-user-clock mr-1" />
                  Awaiting students
                </Badge>
              )}
              {normalisedSession.statusItems.map((item, idx) => (
                <Badge
                  key={`${item.label}-${idx}`}
                  variant={item.variant}
                  className="capitalize"
                >
                  {item.label}
                </Badge>
              ))}
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            {normalisedSession.courseName
              ? `${normalisedSession.courseName} (${normalisedSession.courseCode ?? '—'})`
              : normalisedSession.courseCode}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <section className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
                <i className="fas fa-calendar-day" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Date & time
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDateLabel(startDate)}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {formatTimeRange(startDate, endDate)}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-200">
                <i className="fas fa-map-marker-alt" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Venue
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {normalisedSession.venueLabel || 'Venue to be confirmed'}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200">
                <i className="fas fa-users" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Participants
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {normalisedSession.participantsText}
                </p>
              </div>
            </div>
          </section>

          {normalisedSession.assessorSummary && (
            <section className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-200">
                  <i className="fas fa-user-tie" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Examiner coverage
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {normalisedSession.assessorSummary}
                  </p>
                </div>
              </div>
            </section>
          )}

          {normalisedSession.cannotWithdrawReason && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <i className="fas fa-info-circle mr-2" />
              {normalisedSession.cannotWithdrawReason}
            </p>
          )}
        </div>

        <DialogFooter className="mt-6">
          {footerContent}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
