'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';

const getAssignedNames = (session) => {
  if (!session?.assignedExaminers || session.assignedExaminers.length === 0) return 'No examiners assigned';
  return session.assignedExaminers.map((examiner) => examiner.name).join(', ');
};

const getParticipants = (session) => {
  const students = (session?.enrolledStudents || []).map((student) => student.name);
  const groups = (session?.enrolledGroups || []).map((group) => group.name || group.groupName);
  const combined = [...students, ...groups];
  if (combined.length === 0) return 'No booking yet';
  return combined.join(', ');
};

export default function SchedulingDetailDrawer({ session, open, onOpenChange }) {
  const assignedCount = session?.assignedExaminers?.length || 0;
  const required = session?.requiredExaminers || 0;
  const gap = Math.max(required - assignedCount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border border-gray-200 bg-white px-6 py-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {session?.venueName || 'Session detail'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            {session?.date} · {session?.startTime} – {session?.endTime}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InsightCard title="Staffing" icon="fa-user-check">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {assignedCount}/{required}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {gap > 0 ? `${gap} more examiner${gap === 1 ? '' : 's'} needed` : 'Fully covered'}
            </div>
          </InsightCard>
          <InsightCard title="Bookings" icon="fa-people-arrows">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {session?.bookedCount ?? 0}/{session?.capacity ?? 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {getParticipants(session)}
            </div>
          </InsightCard>
        </div>

        <section className="mt-6 space-y-4 text-sm">
          <DetailRow icon="fa-location-dot" label="Venue">
            {session?.venueName} <span className="text-xs text-gray-400">({session?.venueId || 'N/A'})</span>
          </DetailRow>
          <DetailRow icon="fa-user-group" label="Assigned examiners">{getAssignedNames(session)}</DetailRow>
          <DetailRow icon="fa-clock" label="Duration">
            {session?.startTime} – {session?.endTime}
          </DetailRow>
          <DetailRow icon="fa-bullhorn" label="Visibility">
            <div className="flex flex-wrap gap-2">
              <VisibilityBadge active={session?.publishedToExaminer} label="Examiners" />
              <VisibilityBadge active={session?.publishedToStudent} label="Students" />
            </div>
          </DetailRow>
        </section>

        {session?.notes && (
          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <i className="fas fa-lightbulb" /> Recommendations
            </div>
            <p className="mt-2 leading-relaxed">{session.notes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InsightCard({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
        <i className={`fas ${icon} text-gray-400`} />
        {title}
      </div>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

function DetailRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-transparent px-3 py-2 hover:border-gray-200 dark:hover:border-gray-700">
      <span className="mt-1 text-gray-400 dark:text-gray-500">
        <i className={`fas ${icon}`} />
      </span>
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">{label}</div>
        <div className="text-sm text-gray-700 dark:text-gray-200">{children}</div>
      </div>
    </div>
  );
}

function VisibilityBadge({ active, label }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
        <i className="fas fa-eye" /> {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      <i className="fas fa-eye-slash" /> {label}
    </span>
  );
}

