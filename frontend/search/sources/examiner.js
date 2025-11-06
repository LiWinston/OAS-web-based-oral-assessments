import { registerSearchSources } from '../registry';
import { examinerTimeslotService } from '@/services/examinerTimeslotService';
import {
  getRecents,
  getFavourites,
  getFavouritesSet,
} from '@/search/persistence';

const QUICK_LINKS = [
  {
    id: 'examiner-dashboard',
    title: 'Dashboard',
    subtitle: 'Overview of today’s workload',
    href: '/examiner',
    keywords: 'dashboard overview 仪表盘 概览 今日 今日任务',
  },
  {
    id: 'examiner-schedule',
    title: 'Schedule',
    subtitle: 'Manage upcoming and past sessions',
    href: '/examiner/schedule',
    keywords: 'schedule calendar sessions availability 排班 日程 日历 时段 认领 报名',
  },
  {
    id: 'examiner-marking',
    title: 'Marking Workspace',
    subtitle: 'Jump to assessment sessions ready to mark',
    href: '/examiner/assessment',
    keywords: 'marking assessment rubric grading 评分 打分 批改 评审 评分表',
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

const FAVOURITES_SECTION_ID = 'examiner.favourites';
const RECENTS_SECTION_ID = 'examiner.recents';

const resolveUserId = (user) => user?.id ?? user?.userId ?? user?.examinerId;

const ensureFavouritesCache = async (ctx) => {
  if (ctx.cache.favourites) {
    return ctx.cache.favourites;
  }
  const userId = resolveUserId(ctx.user);
  const favourites = getFavourites(ctx.role, userId);
  ctx.cache.favourites = favourites;
  ctx.cache.favouritesSet = new Set(favourites.map((item) => item.id));
  return favourites;
};

const getFavouriteSet = async (ctx) => {
  if (ctx.cache.favouritesSet) {
    return ctx.cache.favouritesSet;
  }
  await ensureFavouritesCache(ctx);
  return ctx.cache.favouritesSet ?? new Set();
};

const markFavouriteMeta = (items, favouritesSet) =>
  items.map((item) => ({
    ...item,
    allowFavourite: true,
    isFavourite: favouritesSet.has(item.id),
  }));

const loadRecentsSectionItems = (ctx) => {
  const userId = resolveUserId(ctx.user);
  const recents = getRecents(ctx.role, userId);
  const favouritesSet = ctx.cache.favouritesSet
    ? ctx.cache.favouritesSet
    : (() => {
        const set = getFavouritesSet(ctx.role, userId);
        ctx.cache.favouritesSet = set;
        return set;
      })();
  return recents.map((item) => ({
    ...item,
    allowFavourite: true,
    isFavourite: favouritesSet.has(item.id),
  }));
};

const loadFavouritesSectionItems = async (ctx) => {
  const favourites = await ensureFavouritesCache(ctx);
  return favourites.map((item) => ({
    ...item,
    allowFavourite: true,
    isFavourite: true,
  }));
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const formatCountdown = (iso) => {
  if (!iso) return '';
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return '';
  const diff = start.getTime() - Date.now();
  if (diff <= 0) {
    return 'Starting now';
  }
  if (diff < HOUR) {
    const minutes = Math.max(1, Math.round(diff / MINUTE));
    return `Starts in ${minutes} min`;
  }
  const hours = diff / HOUR;
  if (hours < 24) {
    return `Starts in ${hours.toFixed(1)} h`;
  }
  const days = Math.round(hours / 24);
  return `Starts in ${days} day${days === 1 ? '' : 's'}`;
};

const describeStudentLoad = (session) => {
  const count = session.bookingCount ?? session.participants?.length;
  const capacity = session.capacity ?? session.studentCapacity?.capacity ?? session.studentCapacity?.total;
  if (typeof count !== 'number') {
    return null;
  }
  if (typeof capacity === 'number' && capacity > 0) {
    return `${count}/${capacity} students booked`;
  }
  if (count === 0) {
    return 'No students booked yet';
  }
  return `${count} students booked`;
};

const describeExaminerCoverage = (session) => {
  const required = session.requiredExaminers ?? session.coverage?.required;
  const assigned = session.currentExaminers ?? session.coverage?.assigned;
  if (typeof required !== 'number' || typeof assigned !== 'number') {
    return null;
  }
  const remaining = Math.max(required - assigned, 0);
  if (remaining === 0) {
    return 'Fully staffed';
  }
  return `${remaining} examiner slot${remaining === 1 ? '' : 's'} open`;
};

const toUpper = (value) => (typeof value === 'string' ? value.toUpperCase() : '');

const describeMarkingStatus = (session) => {
  const status = toUpper(session.status || session.markingStatus || session.assessmentStatus);
  if (!status) return 'Ready to mark';
  if (status === 'DRAFT') return 'Draft in progress';
  if (status === 'SUBMITTED') return 'Submitted — review now';
  if (status === 'REOPENED') return 'Reopened — needs attention';
  return status.charAt(0) + status.slice(1).toLowerCase();
};

const describeUrgency = (assignment) => {
  const urgency = toUpper(assignment.urgency);
  if (!urgency) return null;
  if (urgency.includes('HIGH')) return 'High urgency';
  if (urgency.includes('MEDIUM')) return 'Medium urgency';
  if (urgency.includes('LOW')) return 'Low urgency';
  return urgency;
};

const formatSignupDeadline = (assignment) => {
  const raw = assignment.signupDeadline || assignment.deadline;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return 'Signup closed';
  if (diff < HOUR) {
    const minutes = Math.max(1, Math.round(diff / MINUTE));
    return `Signup closes in ${minutes} min`;
  }
  const hours = diff / HOUR;
  if (hours < 24) {
    return `Signup closes in ${hours.toFixed(1)} h`;
  }
  const days = Math.round(hours / 24);
  return `Signup closes in ${days} day${days === 1 ? '' : 's'}`;
};

const formatAssessmentType = (type) => {
  if (!type) return null;
  const upper = type.toString().toUpperCase();
  if (upper === 'INDIVIDUAL') return 'Individual session';
  if (upper === 'GROUP') return 'Group session';
  if (upper === 'MIX' || upper === 'MIXED') return 'Mixed session';
  return `${upper.charAt(0)}${upper.slice(1).toLowerCase()} session`;
};

const loadScheduleAssignments = async (ctx) => {
  if (ctx.cache.examinerScheduleAssignments) {
    return ctx.cache.examinerScheduleAssignments;
  }

  // Skip loading on Results and Assessment pages to avoid unnecessary API calls
  if (typeof window !== 'undefined' && 
      (window.location?.pathname?.includes('/results') || 
       window.location?.pathname?.includes('/examiner/assessment'))) {
    console.log('🚫 Skipping schedule assignments load on Results/Assessment page');
    ctx.cache.examinerScheduleAssignments = [];
    return [];
  }

  const examinerId = ctx.user?.id;
  if (!examinerId) {
    ctx.cache.examinerScheduleAssignments = [];
    return [];
  }

  try {
    console.log('📅 Loading schedule assignments for search');
    const response = await examinerTimeslotService.getExaminerSchedule(examinerId);
    const assignments = ensureArray(response?.data?.assignments || response?.data);
    ctx.cache.examinerScheduleAssignments = assignments;
    return assignments;
  } catch (error) {
    console.error('❌ Error loading schedule assignments for search:', error);
    ctx.cache.examinerScheduleAssignments = [];
    return [];
  }
};

const loadAvailableAssignments = async (ctx) => {
  if (ctx.cache.examinerAvailableAssignments) {
    return ctx.cache.examinerAvailableAssignments;
  }

  // Skip loading on Results and Assessment pages to avoid unnecessary API calls
  if (typeof window !== 'undefined' && 
      (window.location?.pathname?.includes('/results') || 
       window.location?.pathname?.includes('/examiner/assessment'))) {
    console.log('🚫 Skipping available assignments load on Results/Assessment page');
    ctx.cache.examinerAvailableAssignments = [];
    return [];
  }

  const examinerId = ctx.user?.id;
  if (!examinerId) {
    ctx.cache.examinerAvailableAssignments = [];
    return [];
  }

  try {
    console.log('📋 Loading available assignments for search');
    const response = await examinerTimeslotService.getAvailableAssignments(examinerId, {
      pageSize: 100,
    });
    const assignments = ensureArray(response?.data?.data);
    ctx.cache.examinerAvailableAssignments = assignments;
    return assignments;
  } catch (error) {
    console.error('❌ Error loading available assignments for search:', error);
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

  const favouritesSet = await getFavouriteSet(ctx);

  const items = sessions.map(({ assignment, session }) => {
    const sessionId = session.sessionId ?? session.slotId ?? session.id;
    const uniqueId = sessionId || `${assignment.assignmentId || 'assignment'}-${session.start || 'session'}`;
    const start = formatTime(session.start);
    const end = formatTime(session.end);
    const dateLabel = formatDate(session.start);
    const venue = session.venue?.name || session.venue?.room || '';
    const countdown = formatCountdown(session.start);
    const studentLoad = describeStudentLoad(session);
    const coverage = describeExaminerCoverage(session);
    const typeLabel = formatAssessmentType(session.assessmentType);

    const subtitleParts = [
      dateLabel,
      start && end ? `${start} – ${end}` : start,
      typeLabel,
      studentLoad,
      coverage,
      countdown,
      venue,
    ]
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
        typeLabel,
        studentLoad,
        coverage,
        countdown,
        '排班', '日程', '时段', '会场', '场次', '日历',
      ]
        .filter(Boolean)
        .join(' '),
    };
  });

  return markFavouriteMeta(items, favouritesSet);
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

  const favouritesSet = await getFavouriteSet(ctx);

  const items = sessions.map(({ assignment, session }) => {
    const sessionId = session.sessionId ?? session.slotId ?? session.id;
    const uniqueId = sessionId || `${assignment.assignmentId || 'assignment'}-${session.start || 'session'}`;
    const dateLabel = formatDate(session.start);
    const summary = [assignment.assignmentName, assignment.courseCode]
      .filter(Boolean)
      .join(' • ');
    const statusLabel = describeMarkingStatus(session);
    const studentLoad = describeStudentLoad(session);
    const typeLabel = formatAssessmentType(session.assessmentType);

    return {
      id: `examiner-marking-${uniqueId}`,
      title: `Mark ${summary || 'assessment'}`,
      subtitle: [
        dateLabel,
        formatTime(session.start),
        statusLabel,
        typeLabel,
        studentLoad,
      ]
        .filter(Boolean)
        .join(' • '),
      href: sessionId ? `/examiner/assessment/${sessionId}` : '/examiner/assessment',
      keywords: [
        'mark',
        'assessment',
        assignment.assignmentName,
        assignment.courseName,
        assignment.courseCode,
        sessionId,
        statusLabel,
        studentLoad,
        typeLabel,
        '评分', '打分', '批改', '评审',
      ]
        .filter(Boolean)
        .join(' '),
    };
  });

  return markFavouriteMeta(items, favouritesSet);
};

const assignmentOpportunitiesLoader = async (ctx) => {
  const assignments = await loadAvailableAssignments(ctx);
  if (!assignments.length) return [];

  const favouritesSet = await getFavouriteSet(ctx);

  const items = assignments
    .filter((assignment) => {
      const remaining = assignment.examinerInfo?.remainingCapacity;
      return typeof remaining === 'number' ? remaining > 0 : true;
    })
    .slice(0, 20)
    .map((assignment) => {
      const remaining = assignment.examinerInfo?.remainingCapacity;
      const urgency = describeUrgency(assignment);
      const signupCountdown = formatSignupDeadline(assignment);
      const startCountdown = formatCountdown(assignment.earliestTimeslot);
      const subtitleParts = [
        assignment.courseCode,
        remaining != null ? `${remaining} slots remaining` : null,
        urgency,
        signupCountdown,
        startCountdown,
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
          urgency,
          signupCountdown,
          startCountdown,
          remaining != null ? `${remaining} slots remaining` : null,
          '认领', '报名', '自选', '排班', '时段',
        ]
          .filter(Boolean)
          .join(' '),
      };
    });

  return markFavouriteMeta(items, favouritesSet);
};

const examinerSources = [
  {
    id: FAVOURITES_SECTION_ID,
    label: 'Favourites',
    priority: 120,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: async (ctx) => loadFavouritesSectionItems(ctx),
  },
  {
    id: RECENTS_SECTION_ID,
    label: 'Recently Used',
    priority: 110,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: async (ctx) => loadRecentsSectionItems(ctx),
  },
  {
    id: 'examiner.quick-links',
    label: 'Quick Links',
    priority: 100,
    defaultLimit: QUICK_LINKS.length,
    queryLimit: QUICK_LINKS.length,
    alwaysVisible: true,
    loader: async (ctx) => {
      const favouritesSet = await getFavouriteSet(ctx);
      return markFavouriteMeta(QUICK_LINKS, favouritesSet);
    },
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
