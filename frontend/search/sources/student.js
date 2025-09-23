import { registerSearchSources } from '../registry';
import { studentBookingServiceReal as studentBookingService } from '@/services/studentBookingReal';
import { studentResultsService } from '@/services/studentResultsService';

const QUICK_LINKS = [
  {
    id: 'student-dashboard',
    title: 'Dashboard',
    subtitle: 'Assignments, bookings, and announcements',
    href: '/student',
    keywords: 'dashboard overview home',
  },
  {
    id: 'student-bookings',
    title: 'My Bookings',
    subtitle: 'Manage upcoming assessment sessions',
    href: '/student/booking',
    keywords: 'bookings sessions schedule calendar',
  },
  {
    id: 'student-results',
    title: 'My Results',
    subtitle: 'View released marks and feedback',
    href: '/student/results',
    keywords: 'results marks feedback rubric',
  },
  {
    id: 'student-groups',
    title: 'Groups',
    subtitle: 'Team membership and collaboration',
    href: '/student/groups',
    keywords: 'groups teams collaboration members',
  },
  {
    id: 'student-support',
    title: 'Support Hub',
    subtitle: 'Guides, FAQs, and live help',
    href: '/student/support',
    keywords: 'support help faq guidance',
  },
  {
    id: 'student-help-centre',
    title: 'Help Centre',
    subtitle: 'Assessment policies and contact links',
    href: '/student/help',
    keywords: 'help documentation policies contact',
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

  return bookings.map((booking) => {
    const session = booking.session || {};
    const start = session.start;
    const end = session.end;
    const sessionId = session.sessionId ?? session.id ?? booking.bookingId;
    const timeLabel = [formatDate(start), formatTime(start), formatTime(end)].filter(Boolean);
    const venue = session.venue?.name || session.venue?.room || null;

    return {
      id: `student-booking-${sessionId}`,
      title: booking.assignmentName || 'Booked session',
      subtitle: [
        timeLabel[0] ? `${timeLabel[0]} • ${timeLabel[1] || ''}`.trim() : null,
        venue,
        booking.courseCode,
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
        'booking',
      ]
        .filter(Boolean)
        .join(' '),
    };
  });
};

const availableAssignmentsLoader = async (ctx) => {
  const assignments = await loadStudentAssignments(ctx, { status: 'bookable' });
  if (!assignments.length) return [];

  return assignments
    .slice(0, 20)
    .map((assignment) => {
      const availability = assignment.availability || {};
      const nextWindow = assignment.nextAvailableDate || assignment.startDate;
      const capacity = availability.availableSessions ?? availability.availableSlots;

      return {
        id: `student-available-${assignment.assignmentId}`,
        title: assignment.assignmentName || 'Available assignment',
        subtitle: [
          assignment.courseCode,
          capacity != null ? `${capacity} sessions available` : null,
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
          'book',
          'availability',
        ]
          .filter(Boolean)
          .join(' '),
      };
    });
};

const resultsLoader = async (ctx) => {
  const results = await loadStudentResults(ctx);
  if (!results.length) return [];

  return results.slice(0, 30).map((result) => {
    const releasedAt = result.releasedAt || result.updatedAt || result.completedAt;

    return {
      id: `student-result-${result.assignmentId}`,
      title: result.assignmentName || 'Assessment result',
      subtitle: [
        result.courseCode,
        releasedAt ? `Released ${formatDate(releasedAt)}` : null,
        result.overallGrade ? `Grade: ${result.overallGrade}` : null,
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
        'result',
        'feedback',
      ]
        .filter(Boolean)
        .join(' '),
    };
  });
};

const studentSources = [
  {
    id: 'student.quick-links',
    label: 'Quick Links',
    priority: 100,
    defaultLimit: QUICK_LINKS.length,
    queryLimit: QUICK_LINKS.length,
    alwaysVisible: true,
    loader: async () => QUICK_LINKS,
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
