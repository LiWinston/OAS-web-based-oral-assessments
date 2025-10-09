import { registerSearchSources } from '../registry';
import { studentBookingServiceReal as studentBookingService } from '@/services/studentBookingReal';
import { studentResultsService } from '@/services/studentResultsService';
import {
  getRecents,
  getFavourites,
  getFavouritesSet,
} from '@/search/persistence';

const QUICK_LINKS = [
  {
    id: 'student-dashboard',
    title: 'Dashboard',
    subtitle: 'Assignments, bookings, and announcements',
    href: '/student',
    keywords: 'dashboard overview home 仪表盘 概览 首页 公告',
  },
  {
    id: 'student-bookings',
    title: 'My Bookings',
    subtitle: 'Manage upcoming assessment sessions',
    href: '/student/booking',
    keywords: 'bookings sessions schedule calendar 预约 预订 报名 日程 日历 排班',
  },
  {
    id: 'student-results',
    title: 'My Results',
    subtitle: 'View released marks and feedback',
    href: '/student/results',
    keywords: 'results marks feedback rubric 成绩 分数 反馈 评分',
  },
  {
    id: 'student-groups',
    title: 'Groups',
    subtitle: 'Team membership and collaboration',
    href: '/student/groups',
    keywords: 'groups teams collaboration members 小组 团队 分组 组员',
  },
  {
    id: 'student-support',
    title: 'Support Hub',
    subtitle: 'Guides, FAQs, and live help',
    href: '/student/support',
    keywords: 'support help faq guidance 帮助 支持 常见问题 指南',
  },
  {
    id: 'student-help-centre',
    title: 'Help Centre',
    subtitle: 'Assessment policies and contact links',
    href: '/student/help',
    keywords: 'help documentation policies contact 帮助 文档 政策 联系',
  },
];

const resolveStudentId = (user = {}) =>
  user.id ?? user.userId ?? user.studentId ?? null;

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

const FAVOURITES_SECTION_ID = 'student.favourites';
const RECENTS_SECTION_ID = 'student.recents';

const ensureFavouritesCache = async (ctx) => {
  if (ctx.cache.favourites) {
    return ctx.cache.favourites;
  }
  const studentId = resolveStudentId(ctx.user);
  const favourites = getFavourites(ctx.role, studentId);
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
  const studentId = resolveStudentId(ctx.user);
  const recents = getRecents(ctx.role, studentId);
  const favouritesSet = ctx.cache.favouritesSet
    ? ctx.cache.favouritesSet
    : (() => {
        const set = getFavouritesSet(ctx.role, studentId);
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
    return 'Happening now';
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

const describeLockout = (booking, session) => {
  if (!booking?.lockoutEnabled) return null;
  const hours = booking.lockoutWindowHours ?? booking.lockoutWindow ?? session?.lockoutWindowHours;
  if (typeof hours !== 'number' || hours <= 0) return 'Lockout window enabled';
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `Lockout ${minutes} min before start`;
  }
  if (hours < 24) {
    return `Lockout ${hours} h before start`;
  }
  const days = Math.round(hours / 24);
  return `Lockout ${days} day${days === 1 ? '' : 's'} before`;
};

const describeReschedule = (booking) => {
  if (booking?.reschedulingEnabled === false) {
    return 'No rescheduling';
  }
  if (booking?.reschedulingEnabled === true) {
    return 'Rescheduling available';
  }
  return null;
};

const describeCapacity = (availability) => {
  const slots = availability?.availableSessions ?? availability?.availableSlots;
  if (typeof slots !== 'number') return null;
  if (slots === 0) return 'Fully booked';
  if (slots <= 3) return `⚠ Only ${slots} slot${slots === 1 ? '' : 's'} left`;
  return `${slots} sessions available`;
};

const describeBookingDeadline = (availability) => {
  const raw = availability?.bookingDeadline;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return 'Booking closes today';
  if (diff < HOUR) {
    const minutes = Math.max(1, Math.round(diff / MINUTE));
    return `Book within ${minutes} min`;
  }
  const hours = diff / HOUR;
  if (hours < 24) {
    return `Book within ${hours.toFixed(1)} h`;
  }
  const days = Math.round(hours / 24);
  return `Book within ${days} day${days === 1 ? '' : 's'}`;
};

const describeGrade = (result) => {
  if (result.overallGrade) {
    return `Grade: ${result.overallGrade}`;
  }
  if (typeof result.examinerScorePct1dp === 'number') {
    return `Score: ${result.examinerScorePct1dp}%`;
  }
  return null;
};

const loadStudentAssignments = async (ctx, { status = 'open' } = {}) => {
  if (!ctx.cache.studentAssignments) {
    ctx.cache.studentAssignments = new Map();
  }

  if (ctx.cache.studentAssignments.has(status)) {
    return ctx.cache.studentAssignments.get(status);
  }

  const studentId = resolveStudentId(ctx.user);
  if (!studentId) {
    ctx.cache.studentAssignments.set(status, []);
    return [];
  }

  try {
    const response = await studentBookingService.getStudentAssignments(studentId, {
      status,
      pageSize: 100,
      sort: 'date_asc',
    });
    const assignments = ensureArray(response?.data?.data);
    ctx.cache.studentAssignments.set(status, assignments);
    return assignments;
  } catch (error) {
    ctx.cache.studentAssignments.set(status, []);
    return [];
  }
};

const loadStudentBookings = async (ctx) => {
  if (ctx.cache.studentBookings) {
    return ctx.cache.studentBookings;
  }

  const studentId = resolveStudentId(ctx.user);
  if (!studentId) {
    ctx.cache.studentBookings = [];
    return [];
  }

  try {
    const response = await studentBookingService.getMyBookings(studentId, {
      pageSize: 50,
    });
    const bookings = ensureArray(response?.data?.data);
    ctx.cache.studentBookings = bookings;
    return bookings;
  } catch (error) {
    ctx.cache.studentBookings = [];
    return [];
  }
};

const loadStudentResults = async (ctx) => {
  if (ctx.cache.studentResults) {
    return ctx.cache.studentResults;
  }

  const studentId = resolveStudentId(ctx.user);
  if (!studentId) {
    ctx.cache.studentResults = [];
    return [];
  }

  try {
    const response = await studentResultsService.getStudentResults(studentId, {
      status: 'released',
      pageNum: 0,
      pageSize: 50,
      sort: 'date_desc',
    });
    const results = ensureArray(response?.data?.data);
    ctx.cache.studentResults = results;
    return results;
  } catch (error) {
    ctx.cache.studentResults = [];
    return [];
  }
};

const upcomingBookingsLoader = async (ctx) => {
  const bookings = await loadStudentBookings(ctx);
  if (!bookings.length) return [];

  const favouritesSet = await getFavouriteSet(ctx);

  const items = bookings.map((booking) => {
    const session = booking.session || {};
    const start = session.start;
    const end = session.end;
    const sessionId = session.sessionId ?? session.id ?? booking.bookingId;
    const timeLabel = [formatDate(start), formatTime(start), formatTime(end)].filter(Boolean);
    const venue = session.venue?.name || session.venue?.room || null;
    const countdown = formatCountdown(start);
    const lockout = describeLockout(booking, session);
    const reschedule = describeReschedule(booking);
    const deadline = describeBookingDeadline({ bookingDeadline: booking.bookingDeadline });

    return {
      id: `student-booking-${sessionId}`,
      title: booking.assignmentName || 'Booked session',
      subtitle: [
        timeLabel[0] ? `${timeLabel[0]} • ${timeLabel[1] || ''}`.trim() : null,
        countdown,
        venue,
        booking.courseCode,
        lockout,
        reschedule,
        deadline,
      ]
        .filter(Boolean)
        .join(' • '),
      href: '/student/booking',
      keywords: [
        booking.assignmentName,
        booking.courseName,
        booking.courseCode,
        sessionId,
        venue,
        'booking', '预约', '预订', '报名',
        countdown,
        lockout,
        reschedule,
        deadline,
      ]
        .filter(Boolean)
        .join(' '),
    };
  });

  return markFavouriteMeta(items, favouritesSet);
};

const availableAssignmentsLoader = async (ctx) => {
  const assignments = await loadStudentAssignments(ctx, { status: 'bookable' });
  if (!assignments.length) return [];

  const favouritesSet = await getFavouriteSet(ctx);

  const items = assignments
    .slice(0, 20)
    .map((assignment) => {
      const availability = assignment.availability || {};
      const nextWindow = assignment.nextAvailableDate || assignment.startDate;
      const capacityLabel = describeCapacity(availability);
      const deadlineLabel = describeBookingDeadline(availability);
      const reschedule = availability.reschedulingEnabled
        ? 'Rescheduling allowed'
        : availability.reschedulingEnabled === false
        ? 'No rescheduling'
        : null;
      const countdown = formatCountdown(nextWindow);

      return {
        id: `student-available-${assignment.assignmentId}`,
        title: assignment.assignmentName || 'Available assignment',
        subtitle: [
          assignment.courseCode,
          capacityLabel,
          deadlineLabel,
          reschedule,
          countdown,
          nextWindow ? `Next: ${formatDate(nextWindow)}` : null,
        ]
          .filter(Boolean)
          .join(' • '),
        href: assignment.assignmentId
          ? `/student/booking?assignmentId=${assignment.assignmentId}`
          : '/student/booking',
        keywords: [
          assignment.assignmentName,
          assignment.courseName,
          assignment.courseCode,
          assignment.assignmentId,
          'book', '预约', '预订', '报名',
          'availability',
          capacityLabel,
          deadlineLabel,
          reschedule,
          countdown,
        ]
          .filter(Boolean)
          .join(' '),
      };
    });

  return markFavouriteMeta(items, favouritesSet);
};

const resultsLoader = async (ctx) => {
  const results = await loadStudentResults(ctx);
  if (!results.length) return [];

  const favouritesSet = await getFavouriteSet(ctx);

  const items = results.slice(0, 30).map((result) => {
    const releasedAt = result.releasedAt || result.updatedAt || result.completedAt;
    const gradeLabel = describeGrade(result);
    const statusLabel = result.releaseStatus ? result.releaseStatus.replace(/_/g, ' ') : null;

    return {
      id: `student-result-${result.assignmentId}`,
      title: result.assignmentName || 'Assessment result',
      subtitle: [
        result.courseCode,
        releasedAt ? `Released ${formatDate(releasedAt)}` : null,
        gradeLabel,
        statusLabel,
      ]
        .filter(Boolean)
        .join(' • '),
      href: result.assignmentId
        ? `/student/results/${result.assignmentId}`
        : '/student/results',
      keywords: [
        result.assignmentName,
        result.courseName,
        result.courseCode,
        result.assignmentId,
        'result', '成绩', '分数',
        'feedback', '反馈',
        gradeLabel,
        statusLabel,
      ]
        .filter(Boolean)
        .join(' '),
    };
  });

  return markFavouriteMeta(items, favouritesSet);
};

const studentSources = [
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
    id: 'student.quick-links',
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
    id: 'student.upcoming-bookings',
    label: 'Upcoming Bookings',
    priority: 90,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: upcomingBookingsLoader,
  },
  {
    id: 'student.available-assignments',
    label: 'Available to Book',
    priority: 80,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: availableAssignmentsLoader,
  },
  {
    id: 'student.released-results',
    label: 'Recently Released Results',
    priority: 70,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: resultsLoader,
  },
];

registerSearchSources('STUDENT', studentSources);

export default studentSources;
