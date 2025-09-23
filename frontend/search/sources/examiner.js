import { registerSearchSources } from '../registry';
import { examinerTimeslotService } from '@/services/examinerTimeslotService';

const QUICK_LINKS = [
  {
    id: 'examiner-dashboard',
    title: 'Dashboard',
    subtitle: 'Overview of today’s workload',
    href: '/examiner',
    keywords: 'dashboard overview',
  },
  {
    id: 'examiner-schedule',
    title: 'Schedule',
    subtitle: 'Manage upcoming and past sessions',
    href: '/examiner/schedule',
    keywords: 'schedule calendar sessions availability',
  },
  {
    id: 'examiner-marking',
    title: 'Marking Workspace',
    subtitle: 'Jump to assessment sessions ready to mark',
    href: '/examiner/assessment',
    keywords: 'marking assessment rubric grading',
  },
  {
    id: 'examiner-comments',
    title: 'Comment Templates',
    subtitle: 'Manage quick comments and reusable feedback',
    href: '/examiner/comments',
    keywords: 'comments feedback templates phrases',
  },
  {
    id: 'examiner-support',
    title: 'Support Centre',
    subtitle: 'Guides, FAQs, and contact channels',
    href: '/examiner/support',
    keywords: 'support help documentation',
  },
];

const formatDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const formatTime = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const loadScheduleAssignments = async (ctx) => {
  if (ctx.cache.examinerScheduleAssignments) {
    return ctx.cache.examinerScheduleAssignments;
  }

  const examinerId = ctx.user?.id;
  if (!examinerId) {
    ctx.cache.examinerScheduleAssignments = [];
    return [];
  }

  try {
    const response = await examinerTimeslotService.getExaminerSchedule(examinerId);
    const assignments = ensureArray(response?.data?.assignments || response?.data);
    ctx.cache.examinerScheduleAssignments = assignments;
    return assignments;
  } catch (error) {
    ctx.cache.examinerScheduleAssignments = [];
    return [];
  }
};

const loadAvailableAssignments = async (ctx) => {
  if (ctx.cache.examinerAvailableAssignments) {
    return ctx.cache.examinerAvailableAssignments;
  }

  const examinerId = ctx.user?.id;
  if (!examinerId) {
    ctx.cache.examinerAvailableAssignments = [];
    return [];
  }

  try {
    const response = await examinerTimeslotService.getAvailableAssignments(examinerId, {
      pageSize: 100,
    });
    const assignments = ensureArray(response?.data?.data);
    ctx.cache.examinerAvailableAssignments = assignments;
    return assignments;
  } catch (error) {
    ctx.cache.examinerAvailableAssignments = [];
    return [];
  }
};

const buildSessionItems = (assignments) => {
  return assignments.flatMap((assignment) => {
    const sessions = ensureArray(assignment.sessions || assignment.slots);
    return sessions.map((session) => ({ assignment, session }));
  });
};

const upcomingSessionsLoader = async (ctx) => {
  const assignments = await loadScheduleAssignments(ctx);
  if (!assignments.length) return [];

  const now = Date.now();
  const sessions = buildSessionItems(assignments)
    .filter(({ session }) => {
      const start = session?.start ? new Date(session.start).getTime() : null;
      return start && start >= now;
    })
    .sort((a, b) => new Date(a.session.start) - new Date(b.session.start))
    .slice(0, 12);

  return sessions.map(({ assignment, session }) => {
    const sessionId = session.sessionId ?? session.slotId ?? session.id;
    const uniqueId = sessionId || `${assignment.assignmentId || 'assignment'}-${session.start || 'session'}`;
    const start = formatTime(session.start);
    const end = formatTime(session.end);
    const dateLabel = formatDate(session.start);
    const venue = session.venue?.name || session.venue?.room || '';

    const subtitleParts = [dateLabel, start && end ? `${start} – ${end}` : start, venue]
      .filter(Boolean)
      .join(' • ');

    return {
      id: `examiner-session-${uniqueId}`,
      title: assignment.assignmentName || 'Scheduled session',
      subtitle: subtitleParts || 'Upcoming session',
      href: '/examiner/schedule',
      keywords: [
        assignment.assignmentName,
        assignment.courseName,
        assignment.courseCode,
        sessionId,
        venue,
      ]
        .filter(Boolean)
        .join(' '),
    };
  });
};

const markingSessionsLoader = async (ctx) => {
  const assignments = await loadScheduleAssignments(ctx);
  if (!assignments.length) return [];

  const now = Date.now();
  const sessions = buildSessionItems(assignments)
    .filter(({ session }) => {
      const start = session?.start ? new Date(session.start).getTime() : null;
      if (!start) return false;
      const hasStudents = (session.bookingCount ?? session.participants?.length ?? 0) > 0;
      return hasStudents && start <= now;
    })
    .sort((a, b) => new Date(b.session.start) - new Date(a.session.start))
    .slice(0, 12);

  return sessions.map(({ assignment, session }) => {
    const sessionId = session.sessionId ?? session.slotId ?? session.id;
    const uniqueId = sessionId || `${assignment.assignmentId || 'assignment'}-${session.start || 'session'}`;
    const dateLabel = formatDate(session.start);
    const summary = [assignment.assignmentName, assignment.courseCode]
      .filter(Boolean)
      .join(' • ');

    return {
      id: `examiner-marking-${uniqueId}`,
      title: `Mark ${summary || 'assessment'}`,
      subtitle: `${dateLabel} • ${formatTime(session.start)} session ready for marking`,
      href: sessionId ? `/examiner/assessment/${sessionId}` : '/examiner/assessment',
      keywords: [
        'mark',
        'assessment',
        assignment.assignmentName,
        assignment.courseName,
        assignment.courseCode,
        sessionId,
      ]
        .filter(Boolean)
        .join(' '),
    };
  });
};

const assignmentOpportunitiesLoader = async (ctx) => {
  const assignments = await loadAvailableAssignments(ctx);
  if (!assignments.length) return [];

  return assignments
    .filter((assignment) => {
      const remaining = assignment.examinerInfo?.remainingCapacity;
      return typeof remaining === 'number' ? remaining > 0 : true;
    })
    .slice(0, 20)
    .map((assignment) => {
      const remaining = assignment.examinerInfo?.remainingCapacity;
      const subtitleParts = [
        assignment.courseCode,
        remaining != null ? `${remaining} slots remaining` : null,
        assignment.earliestTimeslot ? `From ${formatDate(assignment.earliestTimeslot)}` : null,
      ].filter(Boolean);

      return {
        id: `examiner-opportunity-${assignment.assignmentId}`,
        title: assignment.assignmentName || 'Assignment needing coverage',
        subtitle: subtitleParts.join(' • '),
        href: assignment.assignmentId
          ? `/examiner/schedule/select?assignmentId=${assignment.assignmentId}`
          : '/examiner/schedule/select',
        keywords: [
          assignment.assignmentName,
          assignment.courseName,
          assignment.courseCode,
          assignment.assignmentId,
          'self assign',
          'schedule',
        ]
          .filter(Boolean)
          .join(' '),
      };
    });
};

const examinerSources = [
  {
    id: 'examiner.quick-links',
    label: 'Quick Links',
    priority: 100,
    defaultLimit: QUICK_LINKS.length,
    queryLimit: QUICK_LINKS.length,
    alwaysVisible: true,
    loader: async () => QUICK_LINKS,
  },
  {
    id: 'examiner.upcoming-sessions',
    label: 'Upcoming Sessions',
    priority: 90,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: upcomingSessionsLoader,
  },
  {
    id: 'examiner.marking-sessions',
    label: 'Sessions Ready to Mark',
    priority: 80,
    defaultLimit: 5,
    queryLimit: Infinity,
    loader: markingSessionsLoader,
  },
  {
    id: 'examiner.assignment-opportunities',
    label: 'Assignments Needing Coverage',
    priority: 70,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: assignmentOpportunitiesLoader,
  },
];

registerSearchSources('EXAMINER', examinerSources);

export default examinerSources;
